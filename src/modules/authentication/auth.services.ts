import { IUserService } from "../users/user.service.interface";
import { IEmailService } from "../../common/config/nodemailerConfig";
import { IConfigService } from "../../common/config/env";
import {
  ErrorResponse,
  IResponseFormatter,
  SuccessResponse,
} from "../../common/utils/responseFormatter";
import { randomBytes } from "crypto";
import { JWTVerifyResult, SignJWT, createRemoteJWKSet, jwtVerify } from "jose";
import {
  IAuthService,
  AccessTokenData,
  IAuthRepository,
} from "./auth.service.interface";

export default class AuthService implements IAuthService {
  constructor(
    private userService: IUserService,
    private emailService: IEmailService,
    private configService: IConfigService,
    private responseFormatter: IResponseFormatter,
    private authRepository: IAuthRepository
  ) {}

  private async generateAccessToken(
    userData: any,
    duration: string,
    secret: string
  ): Promise<string> {
    return new SignJWT({ ...userData })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(duration)
      .sign(new TextEncoder().encode(secret));
  }

  private generateRefreshToken(): string {
    return randomBytes(64).toString("hex");
  }

  private async handleUserLogin(
    email: string,
    username?: string
  ): Promise<SuccessResponse<AccessTokenData> | ErrorResponse> {
    let userData = await this.userService.getUserId(email);

    if (!userData) {
      userData = await this.userService.createUser(
        email,
        username || this.userService.generateUsernameFromEmail(email)
      );

    }

    const accessToken = await this.generateAccessToken(
      userData.userId,
      "1h",
      this.configService.get("jwtSecretAccess")
    );
    const refreshToken = this.generateRefreshToken();
    await this.authRepository.saveToken(
      `refreshToken:${refreshToken}`,
      userData.userId as string,
      7*24*3600
    );

    return this.responseFormatter.formatSuccessResponse({
      message: "Token created",
      data: { accessToken, refreshToken },
    });
  }

  public async sendVerificationEmail(
    email: string
  ): Promise<SuccessResponse<{}> | ErrorResponse> {
    const token = await this.generateAccessToken(
      { email },
      "15m",
      this.configService.get("jwtSecretMagicLink")
    );

    const magicLink = `${this.configService.get(
      "baseUrl"
    )}/api/auth/login?token=${token}`;
    await this.authRepository.saveToken(`linkToken:${token}`, email, 15*60);

    // log

    try {
      await this.emailService.sendVerificationEmail(email, magicLink);
      return this.responseFormatter.formatSuccessResponse({
        message: "Email sent successfully",
        data: {},
      });
    } catch (error) {
      console.error("Error occurred", error);
      return this.responseFormatter.formatErrorResponse({
        message: "Failed to send email",
        statusCode: 500,
      });
    }
  }

  public async emailLogIn(
    token: string
  ): Promise<SuccessResponse<AccessTokenData> | ErrorResponse> {
    try {
      const tokenExists = await this.authRepository.getToken(
        `linkToken:${token}`
      );

      if (!tokenExists) {
        return this.responseFormatter.formatErrorResponse({
          message: "Invalid or Expired Link",
          statusCode: 401,
        });
      }

      const decoded: JWTVerifyResult<{ email: string }> = await jwtVerify(
        token,
        new TextEncoder().encode(this.configService.get("jwtSecretMagicLink"))
      );

      await this.authRepository.deleteToken(`linkToken:${token}`);
      return this.handleUserLogin(decoded.payload.email);
    } catch (err) {
      return this.responseFormatter.formatErrorResponse({
        message: "Invalid or Expired link",
        statusCode: 401,
      });
    }
  }

  public async googleLogIn(
    code: string
  ): Promise<SuccessResponse<AccessTokenData> | ErrorResponse> {
    try {
      const token = await this.exchangeCodeForToken(code);
      const payload = await this.verifyGoogleToken(token.id_token);
      return this.handleUserLogin(payload.email);
    } catch (error) {
      return this.responseFormatter.formatErrorResponse({
        message: "Google authentication failed",
        statusCode: 401,
      });
    }
  }

  private async exchangeCodeForToken(code: string): Promise<any> {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: this.configService.get("googleClientId"),
        client_secret: this.configService.get("googleClientSecret"),
        redirect_uri: `${this.configService.get(
          "baseUrl"
        )}/api/auth/google/callback`,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      throw new Error(
        "Failed to exchange authorization code for tokens: " + errorData.error
      );
    }

    return tokenResponse.json();
  }

  private async verifyGoogleToken(
    idToken: string
  ): Promise<{ email: string; name: string; picture: string }> {
    const jwkUrl = "https://www.googleapis.com/oauth2/v3/certs";
    const JWKS = createRemoteJWKSet(new URL(jwkUrl));

    const payload: JWTVerifyResult<{
      email: string;
      name: string;
      picture: string;
    }> = await jwtVerify(idToken, JWKS, {
      issuer: "https://accounts.google.com",
      audience: this.configService.get("googleClientId"),
    });

    return payload.payload;
  }

  public verifyOrRefreshToken = async (
    accessToken: string,
    refreshToken: string
  ): Promise<string | boolean> => {
    if (!accessToken && refreshToken) {
      const isValid = await this.authRepository.getToken(
        `refreshToken:${refreshToken}`
      );
      if (!isValid) {
        throw new Error("Invalid Refresh Token")
      }


      const newAccessToken = await this.generateAccessToken(
        isValid,
        "1h",
        this.configService.get("jwtSecretAccess")
      );
      return newAccessToken;
    }
    try {
      await jwtVerify(
        accessToken,
        new TextEncoder().encode(this.configService.get("jwtSecretAccess"))

      );

      return true
    } catch (error) {
       throw new Error("Invalid AccessToken");
    }
  };
}