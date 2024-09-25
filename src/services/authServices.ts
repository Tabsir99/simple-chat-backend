import transport from "../config/nodemailerConfig";
import verificationEmailTemplate from "../templates/verificationEmail";
import config from "../config/env";
import {
  formatErrorResponse,
  formatSuccessResponse,
} from "../utils/responseFormatter";
import userService from "./userServices";
import {
  ErrorResponse,
  SuccessResponse,
  UserInfo,
} from "../types/responseTypes";
import { generateUsernameFromEmail } from "../utils/utils";
import { SignJWT, jwtVerify, JWTVerifyResult, createRemoteJWKSet } from "jose";

interface AccessTokenData {
  accessToken: string;
  refreshToken: string;
}

class AuthServiceClass {
  async createToken(
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

  private async handleUserLogin(
    email: string,
    username?: string
  ): Promise<SuccessResponse<AccessTokenData> | ErrorResponse> {
    let userData = await userService.getUserInfo(email);

    if (!userData) {
      const createdUser = await userService.createUser(
        email,
        username || generateUsernameFromEmail(email)
      );
      userData = createdUser.rows[0];
    }

    const accessToken = await this.createToken(
      userData,
      "1h",
      config.jwtSecretAccess
    );
    const refreshToken = await this.createToken(
      userData,
      "30d",
      config.jwtSecretRefresh
    );

    return formatSuccessResponse({
      message: "Token created",
      data: { accessToken, refreshToken },
    });
  }

  async sendVerificationEmail(email: string) {
    const token = await new SignJWT({ email: email })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("15m")
      .sign(new TextEncoder().encode(config.jwtSecretMagicLink));

    const magicLink = `${config.baseUrl}/api/auth/login?token=${token}`;

    const mailOptions = {
      from: {
        name: "TabsirCG Support",
        address: config.nodemailerUser,
      },
      to: email,
      subject: "Verify Your Email",
      html: verificationEmailTemplate(
        magicLink,
        generateUsernameFromEmail(email)
      ),
    };

    try {
      await transport.sendMail(mailOptions);
      console.log("Email sent with token:", token);
      return formatSuccessResponse({
        message: "Email sent succesfully",
      });
    } catch (error) {
      console.log("Error occured", error);
      return formatErrorResponse({
        message: "Failed to send email",
      });
    }
  }

  async emailLogIn(
    token: string
  ): Promise<SuccessResponse<AccessTokenData> | ErrorResponse> {
    try {
      const decoded: JWTVerifyResult<{ email: string }> = await jwtVerify(
        token,
        new TextEncoder().encode(config.jwtSecretMagicLink)
      );
      const email = decoded.payload.email;

      return this.handleUserLogin(email);
    } catch (err) {
      return formatErrorResponse({
        message: "Invalid or Expired link",
        statusCode: 401,
      });
    }
  }

  async verifyToken(token: string, type: "access" | "refresh") {
    try {
      const secret =
        type === "access" ? config.jwtSecretAccess : config.jwtSecretRefresh;

      const payload: JWTVerifyResult<UserInfo> = await jwtVerify(
        token,
        new TextEncoder().encode(secret)
      );

      return {
        email: payload.payload.email,
        id: payload.payload.id,
        username: payload.payload.username,
        user_status: payload.payload.user_status,
      };
    } catch (error) {
      return false;
    }
  }

  async googleLogIn(code: string) {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: config.googleClientId,
        client_secret: config.googleClientSecret,
        redirect_uri: `${config.baseUrl}/api/auth/google/callback`,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      throw new Error(
        "Failed to exchange authorization code for tokens: " + errorData.error
      );
    }

    const token = await tokenResponse.json();
    const jwkurl = "https://www.googleapis.com/oauth2/v3/certs";
    const JWKS = createRemoteJWKSet(new URL(jwkurl));

    const payload: JWTVerifyResult<{
      email: string;
      name: string;
      picture: string;
    }> = await jwtVerify(token.id_token, JWKS, {
      issuer: "https://accounts.google.com",
      audience: config.googleClientId,
    });

    return this.handleUserLogin(payload.payload.email);
  }
}

const AuthService = new AuthServiceClass();

export default AuthService;
