import { Request, Response } from "express";
import AuthService from "./auth.services";
import { ResponseFormatter } from "../../common/utils/responseFormatter";
import { ConfigService } from "../../common/config/env";
import { CookieManager } from "../../common/utils/cookieManager";

export default class AuthController {
  constructor(
    private authService: AuthService,
    private responseFormatter: ResponseFormatter,
    private config: ConfigService,
    private cookieManager: CookieManager
  ) {}

  public redirectToGoogleAuth = (_: Request, res: Response): void => {
    const redirectUri = encodeURIComponent(
      `${this.config.get("baseUrl")}/api/auth/google/callback`
    );
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${this.config.get(
      "googleClientId"
    )}&redirect_uri=${redirectUri}&scope=email profile&response_type=code`;
    res.redirect(googleAuthUrl);
  };

  public sendVerificationEmail = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    const { email } = req.body;
    const response = await this.authService.sendVerificationEmail(email);
    return res.json(response);
  };

  public loginWithEmail = async (
    req: Request,
    res: Response
  ): Promise<Response | void> => {
    const { token } = req.query;
    if (!token || typeof token !== "string") {
      return res.status(400).json(
        this.responseFormatter.formatErrorResponse({
          message: "Invalid or missing token",
          statusCode: 400,
        })
      );
    }

    const response = await this.authService.emailLogIn(token);

    if ("data" in response) {
      const { refreshToken } = response.data;
      this.cookieManager.setAuthCookies(res, { refreshToken });
      return res.redirect(this.config.get("baseUrlFrontend") + "/chats");
    } else {
      return res.status(403).json(response);
    }
  };

  public handleGoogleAuthCallback = async (
    req: Request,
    res: Response
  ): Promise<Response | void> => {
    const { code } = req.query;
    if (typeof code !== "string") {
      return res.status(400).json({ error: "Invalid authorization code" });
    }

    try {
      const response = await this.authService.googleLogIn(code);
      if ("data" in response) {
        this.cookieManager.setAuthCookies(res, {
          refreshToken: response.data.refreshToken,
        });
        return res.redirect(`${this.config.get("baseUrlFrontend")}/chats`);
      }
    } catch (err) {
      console.error("Authentication failed:", err);
      return res.status(401).json({ error: "Authentication failed" });
    }
    return res.status(500).json({ err: "Internal porblem" });
  };

  public verifyOrRefresh = async (req: Request, res: Response) => {
    const refreshToken: string = req.cookies["refreshToken"];

    try {
      const newAccessToken = await this.authService.verifyOrRefreshToken(
        refreshToken
      );

      return res.json({
        message: "New Token Issued",
        accessToken: newAccessToken,
      });
    } catch (error) {
      this.cookieManager.clearAuthCookies(res);
      return res.status(401).json({
        message: "Token Verification failed",
      });
    }
  };

  public logout = (_: Request, res: Response) => {
    this.cookieManager.clearAuthCookies(res);
    res.json({
      message: "User logged out",
    });
  };
}
