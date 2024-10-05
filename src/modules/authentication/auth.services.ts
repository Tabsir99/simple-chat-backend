import { IUserService } from "../users/user.service.interface";
import { IEmailService } from "../../common/config/nodemailerConfig";
import { IConfigService } from "../../common/config/env";
import { randomBytes } from "crypto";
import { JWTVerifyResult, SignJWT, createRemoteJWKSet, jwtVerify } from "jose";
import {
  IAuthService,
  AccessTokenData,
  IAuthRepository,
} from "./auth.service.interface";
import { inject, injectable } from "inversify";
import { TYPES } from "../../inversify/types";

@injectable()
export default class AuthService implements IAuthService {
  constructor(
    @inject(TYPES.UserService) private userService: IUserService,
    @inject(TYPES.EmailService) private emailService: IEmailService,
    @inject(TYPES.ConfigService) private configService: IConfigService,
    @inject(TYPES.AuthRepository) private authRepository: IAuthRepository
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
  ): Promise<{ refreshToken: string }> {
    try {
      let userID = await this.userService.getUserId(email);
  
      if (!userID) {
        userID = await this.userService.createUser(
          email,
          username || this.userService.generateUsernameFromEmail(email)
        );
      }
  
      const refreshToken = this.generateRefreshToken();
      await this.authRepository.saveToken(
        `refreshToken:${refreshToken}`,
        userID as string,
        7 * 24 * 3600
      );
  
      return { refreshToken }
    } catch (error) {
      console.log(error, "FROM AUTH SERVICE HANDLE LOG IN")
      throw new Error("Error handling user login")
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
    await this.authRepository.saveToken(`linkToken:${token}`, email, 15 * 60);

    try {
      await this.emailService.sendVerificationEmail(email, magicLink);
      return true
    } catch (error) {
      console.error("Error occurred", error);
      throw new Error("Couldnt send verification email")
    }
  }

  public async emailLogIn(token: string): Promise<{refreshToken: string | null}> {
    try {
      const tokenExists = await this.authRepository.getToken(
        `linkToken:${token}`
      );

      if (!tokenExists) {
        return {
          refreshToken: null
        }
      }

      const decoded: JWTVerifyResult<{ email: string }> = await jwtVerify(
        token,
        new TextEncoder().encode(this.configService.get("jwtSecretMagicLink"))
      );

      await this.authRepository.deleteToken(`linkToken:${token}`);
      const refreshToken = await this.handleUserLogin(decoded.payload.email);
      return refreshToken
    } catch (err) {
      console.log(err, " FROM AUTH SERVICE EMAIL OGIN")
      return {
        refreshToken: null
      }
    }
  }

  public async googleLogIn(code: string): Promise<{refreshToken: string | null}> {
    try {
      const token = await this.exchangeCodeForToken(code);
      const payload = await this.verifyGoogleToken(token.id_token);
      const result = await this.handleUserLogin(payload.email);
      return result
    } catch (error) {
      return {
        refreshToken: null
      }
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

    const isValid = await this.authRepository.getToken(
        `refreshToken:${refreshToken}`
      );

      // console.log("Verifyorrefresh service running, ",isValid)
      if (!isValid) {
        throw new Error("Invalid Refresh Token, from getToken");
      }
      const tokenValue = isValid[0][1] as string;
      const tokenTtl = isValid[1][1] as number;

      if (!tokenValue || !tokenTtl) {
        throw new Error(`"Invalid Refresh Token, from tokenTTl "\n ${tokenTtl}\n ${tokenValue}`);
      }

      const newAccessToken = await this.generateAccessToken(
        { userId: tokenValue },
        "30m",
        this.configService.get("jwtSecretAccess")
      );

      const newRefreshToken = this.generateRefreshToken();

      // console.log(`new refresh tokne generated, \nold:${refreshToken}\n new:${newRefreshToken}\n`)
      await this.authRepository.rotateToken(
        `refreshToken:${refreshToken}`,
        `refreshToken:${newRefreshToken}`,
        tokenValue,
        tokenTtl
      );

      return { newAccessToken, newRefreshToken };
    
  };

  deleteRefreshToken = async (token: string) => {
    try {
      await this.authRepository.deleteToken(`refreshToken:${token}`);
      return true;
    } catch (error) {
      console.log(error, 'FROM AUTH SERVICE DELETE REF TOKEN');
      return false;
    }
  };
}
