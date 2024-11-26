import { IUserService } from "../users/user.interface";
import { IEmailService } from "../../common/config/nodemailerConfig";
import { IConfigService } from "../../common/config/env";
import { createHash, randomBytes } from "crypto";
import { JWTVerifyResult, SignJWT, createRemoteJWKSet, jwtVerify } from "jose";
import { inject, injectable } from "inversify";
import { TYPES } from "../../inversify/types";
import AuthRepository from "./auth.repository";
import redisClient from "../../common/config/redisConfig";
import { AuthError } from "../../common/errors/authErrors";

@injectable()
export default class AuthService {
  constructor(
    @inject(TYPES.UserService) private userService: IUserService,
    @inject(TYPES.EmailService) private emailService: IEmailService,
    @inject(TYPES.ConfigService) private configService: IConfigService,
    @inject(TYPES.AuthRepository) private authRepository: AuthRepository
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
  private hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  private getExpiry(days: number): Date {
    const now = new Date();
    now.setDate(now.getDate() + days);
    return now;
  }
  private async handleUserLogin(
    email: string
  ): Promise<{ refreshToken: string }> {
    try {
      let userID = await this.userService.getUserId(email);

      if (!userID) {
        userID = await this.userService.createUser(
          email,
          this.userService.generateUsernameFromEmail(email)
        );
      }

      const refreshToken = this.generateRefreshToken();
      const hashedToken = this.hashToken(refreshToken);
      const expiresAt = this.getExpiry(14);

      await this.authRepository.saveToken(hashedToken, userID, expiresAt);

      return { refreshToken };
    } catch (error) {
      console.error(error, "FROM AUTH SERVICE HANDLE LOG IN");
      throw new Error("Error handling user login");
    }
  }

  public async sendVerificationEmail(email: string): Promise<any> {
    const token = await this.generateAccessToken(
      { email },
      "15m",
      this.configService.get("jwtSecretMagicLink")
    );

    const magicLink = `${this.configService.get(
      "baseUrl"
    )}/api/auth/login?token=${token}`;
    await redisClient.setex(`linkToken:${token}`, 15 * 60, email);

    try {
      await this.emailService.sendVerificationEmail(email, magicLink);
      return true;
    } catch (error) {
      console.error("Error occurred", error);
      throw new Error("Couldnt send verification email");
    }
  }

  public async emailLogIn(
    token: string
  ): Promise<{ refreshToken: string | null }> {
    try {
      const tokenExists = await redisClient.get(`linkToken:${token}`);
      if (!tokenExists) {
        return {
          refreshToken: null,
        };
      }

      const decoded: JWTVerifyResult<{ email: string }> = await jwtVerify(
        token,
        new TextEncoder().encode(this.configService.get("jwtSecretMagicLink"))
      );

      await redisClient.del(`linkToken:${token}`);
      const refreshToken = await this.handleUserLogin(decoded.payload.email);
      return refreshToken;
    } catch (err) {
      console.error(err, " FROM AUTH SERVICE EMAIL OGIN");
      return {
        refreshToken: null,
      };
    }
  }

  public async googleLogIn(
    code: string
  ): Promise<{ refreshToken: string | null }> {
    try {
      const token = await this.exchangeCodeForToken(code);
      const payload = await this.verifyGoogleToken(token.id_token);
      const result = await this.handleUserLogin(payload.email);
      return result;
    } catch (error) {
      return {
        refreshToken: null,
      };
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
    refreshToken: string
  ): Promise<{ newAccessToken: string; newRefreshToken: string }> => {
    try {
      const oldToken = await this.authRepository.getToken(
        this.hashToken(refreshToken)
      );

      if (!oldToken) {
        throw AuthError.tokenNotFound({ refreshToken });
      }
      if (oldToken.expiresAt < new Date() && oldToken.isValid) {
        throw AuthError.tokenExpired({
          oldTokenId: oldToken.tokenId,
        });
      }
      if (!oldToken.isValid) {
        if (oldToken.tokenFamily.isValid) {
          await this.authRepository.revokeFamily(oldToken.tokenFamily.familyId);
          throw AuthError.invalidToken({
            threat: true,
          });
        }
        throw AuthError.invalidToken({
          threat: false,
        });
      }

      const newAccessToken = await this.generateAccessToken(
        { userId: oldToken.userId },
        "30m",
        this.configService.get("jwtSecretAccess")
      );

      const newRefreshToken = this.generateRefreshToken();
      const newRefreshTokenHash = this.hashToken(newRefreshToken);

      await this.authRepository.rotateToken(
        {
          expiresAt: oldToken.expiresAt,
          familyId: oldToken.tokenFamily.familyId,
          tokenId: oldToken.tokenId,
        },
        newRefreshTokenHash,
        oldToken.userId
      );

      return { newAccessToken, newRefreshToken };
    } catch (error) {
      if (error instanceof AuthError) {
        if (error.errorCode === "TOKEN_EXPIRED") {
          await this.authRepository.revokeToken(
            error.details?.oldTokenId as string
          );
          throw error;
        }
      }
      throw AuthError.invalidToken({ expiredIn: error });
    }
  };

  revokeRefreshToken = async (oldToken: string) => {
    try {
      const res = await this.authRepository.getToken(this.hashToken(oldToken));
      if (res) {
        await this.authRepository.revokeFamily(res.tokenFamily.familyId);
      }
    } catch (error) {
      console.error(error)
      throw error
    }
  };
}
