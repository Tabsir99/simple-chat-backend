import { NextFunction, Request, Response } from "express";
import { formatResponse } from "../../common/utils/responseFormatter";
import { AuthError } from "../../common/errors/authErrors";
import config from "../../common/config/env";
import * as authService from "./auth.services";
import * as cookieManager from "../../common/utils/cookieManager";

export const redirectToGoogleAuth = (_: Request, res: Response): void => {
  const redirectUri = encodeURIComponent(
    `${config.baseUrl}/api/auth/google/callback`
  );
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${config.googleClientId}&redirect_uri=${redirectUri}&scope=email profile&response_type=code`;
  res.redirect(googleAuthUrl);
};

export const sendVerificationEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  const { email } = req.body;

  const response = await authService.sendVerificationEmail(email);
  return res.json(response);
};

export const loginWithEmail = async (
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
    const response = await authService.emailLogIn(token);

    if (response.refreshToken) {
      const { refreshToken } = response;
      cookieManager.setAuthCookies(res, { refreshToken, exp: 15 * 60 });
      return res.redirect(config.baseUrlFrontend + "/chats");
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

export const handleGoogleAuthCallback = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  const { code } = req.query;
  if (typeof code !== "string") {
    return res.status(400).json({ error: "Invalid authorization code" });
  }
  try {
    const response = await authService.googleLogIn(code);

    if (response.refreshToken) {
      cookieManager.setAuthCookies(res, {
        refreshToken: response.refreshToken,
        exp: 15 * 60,
      });

      return res.redirect(`${config.baseUrlFrontend}/chats`);
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

export const verifyOrRefresh = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const refreshToken: string = req.cookies["refreshToken"];
  console.log(refreshToken);

  try {
    const { newAccessToken, newRefreshToken } =
      await authService.verifyOrRefreshToken(refreshToken);

    cookieManager.setAuthCookies(res, {
      refreshToken: newRefreshToken,
      exp: 15 * 60,
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

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const refreshToken: string = req.cookies["refreshToken"];
  console.log(refreshToken);
  try {
    await authService.revokeRefreshToken(refreshToken);

    cookieManager.clearAuthCookies(res);

    res.status(200).json({
      message: "User logged out",
    });
  } catch (error) {
    next(error);
  }
};
