import { NextFunction, Request, Response } from "express";
import AuthService from "./auth.services";
import { IConfigService } from "../../common/config/env";
import { ICookieManager } from "../../common/utils/cookieManager";
import { inject, injectable } from "inversify";
import { TYPES } from "../../inversify/types";
import { formatResponse } from "../../common/utils/responseFormatter";
import { AuthError } from "../../common/errors/authErrors";

@injectable()
export default class AuthController {
  constructor(
    @inject(TYPES.AuthService) private authService: AuthService,
    @inject(TYPES.ConfigService) private config: IConfigService,
    @inject(TYPES.CookieManager) private cookieManager: ICookieManager
  ) {}

  public redirectToGoogleAuth = (
    _: Request,
    res: Response,
  ): void => {
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
    res: Response,
    next: NextFunction
  ): Promise<Response> => {
    const { email } = req.body;

    const response = await this.authService.sendVerificationEmail(email);
    return res.json(response);
  };

  public loginWithEmail = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {
    const { token } = req.query;
    if (!token || typeof token !== "string") {
      return res.status(400).json(
        formatResponse({
          message: "Invalid or missing token",
          success: false,
        })
      );
    }

    try {
      const response = await this.authService.emailLogIn(token);

      if (response.refreshToken) {
        const { refreshToken } = response;
        this.cookieManager.setAuthCookies(res, { refreshToken });
        return res.redirect(this.config.get("baseUrlFrontend") + "/chats");
      } else {
        return res.status(403).json(
          formatResponse({
            success: false,
            message: "Refresh Token generation failed",
          })
        );
      }
    } catch (error) {
      console.error(error, " FROM LOGIN WITH EMAIL");
      if (error instanceof Error) {
        return res.json(
          formatResponse({ success: false, message: "Internal Error Occured" })
        );
      }
    }
    return next("error occured");
  };

  public handleGoogleAuthCallback = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {
    const { code } = req.query;
    if (typeof code !== "string") {
      return res.status(400).json({ error: "Invalid authorization code" });
    }
    try {
      const response = await this.authService.googleLogIn(code);

      if (response.refreshToken) {
        this.cookieManager.setAuthCookies(res, {
          refreshToken: response.refreshToken,
        });

        return res.redirect(`${this.config.get("baseUrlFrontend")}/chats`);
      }
    } catch (err) {
      console.error("Authentication failed:", err);
      return res
        .status(401)
        .json(
          formatResponse({ success: false, message: "Authentication failed" })
        );
    }
    return next("error occured");
  };

  public verifyOrRefresh = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const refreshToken: string = req.cookies["refreshToken"];

    try {
      const { newAccessToken, newRefreshToken } =
        await this.authService.verifyOrRefreshToken(refreshToken);

      this.cookieManager.setAuthCookies(res, {
        refreshToken: newRefreshToken,
      });

      return res.json({
        message: "New Token Issued",
        accessToken: newAccessToken,
      });
    } catch (error) {
      if (error instanceof AuthError) {
        if (error.errorCode === "TOKEN_NOT_FOUND") {
          return res.status(401).json({
            message: "Token Verification failed",
            error: error,
          });
        }
        if (error.errorCode === "TOKEN_EXPIRED") {
          return res.status(401).json(
            formatResponse({
              success: false,
              message: "Refresh token expired. Log in again",
            })
          );
        }
        if (error.errorCode === "INVALID_TOKEN") {
          return res.status(401).json(
            formatResponse({
              success: false,
              message: "Invalid Token",
            })
          );
        }
      }

      return next(error);
    }
  };

  public logout = async (req: Request, res: Response, next: NextFunction) => {
    const refreshToken: string = req.cookies["refreshToken"];

    // await this.authService.revokeRefreshToken(refreshToken);
    this.cookieManager.clearAuthCookies(res);

    res.status(200).json({
      message: "User logged out",
    });
  };
}
