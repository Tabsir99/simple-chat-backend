
import { SignJWT, jwtVerify } from "jose";

import { randomBytes } from "crypto";
import AuthService from "../auth.services";
import { IUserService } from "../../users/user.service.interface";
import { IEmailService } from "../../../common/config/nodemailerConfig";
import { IConfigService } from "../../../common/config/env";
import { IResponseFormatter } from "../../../common/utils/responseFormatter";
import { IAuthRepository } from "../auth.service.interface";

jest.mock('jose');
jest.mock('crypto',() => ({
  randomBytes: jest.fn()
}));

describe('AuthService', () => {
  let authService: AuthService;
  let mockUserService: jest.Mocked<IUserService>;
  let mockEmailService: jest.Mocked<IEmailService>;
  let mockConfigService: jest.Mocked<IConfigService>;
  let mockResponseFormatter: jest.Mocked<IResponseFormatter>;
  let mockAuthRepository: jest.Mocked<IAuthRepository>;

  beforeEach(() => {
    mockUserService = {
      getUserId: jest.fn(),
      createUser: jest.fn(),
      generateUsernameFromEmail: jest.fn(),
    } as any;
    mockEmailService = {
      sendVerificationEmail: jest.fn(),
    } as any;
    mockConfigService = {
      get: jest.fn(),
    } as any;
    mockResponseFormatter = {
      formatSuccessResponse: jest.fn(),
      formatErrorResponse: jest.fn(),
    } as any;
    mockAuthRepository = {
      saveToken: jest.fn(),
      getToken: jest.fn(),
      deleteToken: jest.fn(),
    } as any;

    authService = new AuthService(
      mockUserService,
      mockEmailService,
      mockConfigService,
      mockResponseFormatter,
      mockAuthRepository
    );
  });

  describe('sendVerificationEmail', () => {
    it('should send verification email successfully', async () => {
      const email = 'test@example.com';
      const token = 'mocked-token';
      const magicLink = 'http://example.com/api/auth/login?token=mocked-token';

      (SignJWT as jest.Mock).mockImplementation(() => ({
        setProtectedHeader: jest.fn().mockReturnThis(),
        setIssuedAt: jest.fn().mockReturnThis(),
        setExpirationTime: jest.fn().mockReturnThis(),
        sign: jest.fn().mockResolvedValue(token),
      }));

      mockConfigService.get.mockImplementation((key) => {
        if (key === 'jwtSecretMagicLink') return 'secret';
        if (key === 'baseUrl') return 'http://example.com';
        return '';
      });

      mockEmailService.sendVerificationEmail.mockResolvedValue(undefined);
      mockResponseFormatter.formatSuccessResponse.mockReturnValue({ success: true } as any);

      const result = await authService.sendVerificationEmail(email);

      expect(mockAuthRepository.saveToken).toHaveBeenCalledWith(`linkToken:${token}`, email, 15 * 60);
      expect(mockEmailService.sendVerificationEmail).toHaveBeenCalledWith(email, magicLink);
      expect(mockResponseFormatter.formatSuccessResponse).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });

    it('should handle email sending failure', async () => {
      const email = 'test@example.com';

      (SignJWT as jest.Mock).mockImplementation(() => ({
        setProtectedHeader: jest.fn().mockReturnThis(),
        setIssuedAt: jest.fn().mockReturnThis(),
        setExpirationTime: jest.fn().mockReturnThis(),
        sign: jest.fn().mockResolvedValue('mocked-token'),
      }));

      mockEmailService.sendVerificationEmail.mockRejectedValue(new Error('Email sending failed'));
      mockResponseFormatter.formatErrorResponse.mockReturnValue({ error: true } as any);

      const result = await authService.sendVerificationEmail(email);

      expect(mockResponseFormatter.formatErrorResponse).toHaveBeenCalledWith({
        message: 'Failed to send email',
        statusCode: 500,
      });
      expect(result).toEqual({ error: true });
    });
  });

  describe('emailLogIn', () => {
    it('should log in user successfully with valid token', async () => {
      const token = 'valid-token';
      const email = 'test@example.com';
      const userId = 'user-123';
      const mockRefreshToken = 'mocked-refresh-token';

      (randomBytes as jest.Mock).mockReturnValue({
        toString: jest.fn().mockReturnValue(mockRefreshToken)
      });

      mockAuthRepository.getToken.mockResolvedValue(email);
      (jwtVerify as jest.Mock).mockResolvedValue({ payload: { email } });
      mockUserService.getUserId.mockResolvedValue({ userId });
      mockResponseFormatter.formatSuccessResponse.mockReturnValue({ success: true } as any);

      const result = await authService.emailLogIn(token);

      expect(mockAuthRepository.getToken).toHaveBeenCalledWith(`linkToken:${token}`);
      expect(jwtVerify).toHaveBeenCalled();
      expect(mockAuthRepository.deleteToken).toHaveBeenCalledWith(`linkToken:${token}`);
      expect(mockUserService.getUserId).toHaveBeenCalledWith(email);
      expect(mockResponseFormatter.formatSuccessResponse).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });

    it('should handle invalid token', async () => {
      const token = 'invalid-token';

      mockAuthRepository.getToken.mockResolvedValue(null);
      mockResponseFormatter.formatErrorResponse.mockReturnValue({ error: true } as any);

      const result = await authService.emailLogIn(token);

      expect(mockResponseFormatter.formatErrorResponse).toHaveBeenCalledWith({
        message: 'Invalid or Expired Link',
        statusCode: 401,
      });
      expect(result).toEqual({ error: true });
    });
  });

  describe('verifyOrRefreshToken', () => {
    it('should verify a valid access token', async () => {
      const accessToken = 'valid-access-token';
      const refreshToken = 'valid-refresh-token';

      (jwtVerify as jest.Mock).mockResolvedValue(true);

      const result = await authService.verifyOrRefreshToken(accessToken, refreshToken);

      expect(jwtVerify).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should refresh token when access token is missing', async () => {
      const accessToken = '';
      const refreshToken = 'valid-refresh-token';
      const userId = 'user-123';

      mockAuthRepository.getToken.mockResolvedValue(userId);
      (SignJWT as jest.Mock).mockImplementation(() => ({
        setProtectedHeader: jest.fn().mockReturnThis(),
        setIssuedAt: jest.fn().mockReturnThis(),
        setExpirationTime: jest.fn().mockReturnThis(),
        sign: jest.fn().mockResolvedValue('new-access-token'),
      }));

      const result = await authService.verifyOrRefreshToken(accessToken, refreshToken);

      expect(mockAuthRepository.getToken).toHaveBeenCalledWith(`refreshToken:${refreshToken}`);
      expect(SignJWT).toHaveBeenCalled();
      expect(result).toBe('new-access-token');
    });

    it('should throw error for invalid access token', async () => {
      const accessToken = 'invalid-access-token';
      const refreshToken = 'valid-refresh-token';

      (jwtVerify as jest.Mock).mockRejectedValue(new Error('Invalid token'));

      await expect(authService.verifyOrRefreshToken(accessToken, refreshToken)).rejects.toThrow('Invalid AccessToken');
    });
  });
});