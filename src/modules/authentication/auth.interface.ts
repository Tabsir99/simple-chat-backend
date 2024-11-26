

export interface AccessTokenData {
  refreshToken: string;
}

export interface IAuthService {
  sendVerificationEmail(
    email: string
  ): Promise<any>;
  emailLogIn(
    token: string
  ): Promise<{refreshToken: string | null}>;
  googleLogIn(
    code: string
  ): Promise<{refreshToken: string | null}>;
  verifyOrRefreshToken(
    accessToken: string,
    refreshToken: string
  ): Promise<{newAccessToken: string, newRefreshToken: string} | boolean>;
}

export interface IAuthRepository {
  saveToken(token: string, email: string, expirationTime: number): Promise<void>;
  getToken(token: string): Promise<[error: Error | null, result: unknown][] | null | null>;
  deleteToken(token: string): Promise<void>;
  rotateToken(oldToken: string, newToken: string, value:string, ttl: number): Promise<void>;
}
