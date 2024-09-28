import {
  SuccessResponse,
  ErrorResponse,
} from "../../common/utils/responseFormatter";

export interface AccessTokenData {
  refreshToken: string;
}

export interface IAuthService {
  sendVerificationEmail(
    email: string
  ): Promise<SuccessResponse<{}> | ErrorResponse>;
  emailLogIn(
    token: string
  ): Promise<SuccessResponse<AccessTokenData> | ErrorResponse>;
  googleLogIn(
    code: string
  ): Promise<SuccessResponse<AccessTokenData> | ErrorResponse>;
  verifyOrRefreshToken(
    accessToken: string,
    refreshToken: string
  ): Promise<string | boolean>;
}

export interface IAuthRepository {
  saveToken(token: string, email: string, expirationTime: number): Promise<void>;
  getToken(token: string): Promise<string | null>;
  deleteToken(token: string): Promise<void>;
}
