import { Request, Response } from "express";
import AuthService from "../services/authServices";
import { formatErrorResponse } from "../utils/responseFormatter";
import config from "../config/env";

class AuthController {
  async sendVerificationEmail(req: Request, res: Response) {
    const { email } = req.body;

    const response = await AuthService.sendVerificationEmail(email);

    if (response.status === "success") {
      return res.json(response);
    } else {
      return res.json(response);
    }
  }

  async loginWithEmail(req: Request, res: Response) {
    const { token } = req.query;

    if (!token || typeof token !== "string")
      return res.status(400).json(
        formatErrorResponse({
          message: "Invalid or missing token",
          statusCode: 400,
        })
      );
    const response = await AuthService.emailLogIn(token);

    if ("data" in response) {
      res.cookie("accessToken", response.data?.accessToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: config.env === "production",
        maxAge: 3600 * 1000,
        domain: `.${config.hostname}`,
      });
      res.cookie("refreshToken", response.data?.refreshToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: config.env === "production",
        maxAge: 3600 * 1000 * 24 * 30,
        domain: `.${config.hostname}`,
        path: "/"
      });
      return res.redirect(config.baseUrlFrontend + "/chats");
    } else {
      return res.status(403).json(response);
    }
  }

  redirectToGoogleAuth(_: Request, res: Response) {
    console.log("recived");
    const redirectUri = encodeURIComponent(
      `${config.baseUrl}/api/auth/google/callback`
    );
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${config.googleClientId}&redirect_uri=${redirectUri}&scope=email profile&response_type=code`;
    res.redirect(googleAuthUrl);
  }

  async handleGoogleAuthCallback(req: Request, res: Response) {
    const { code } = req.query;

    if (typeof code !== "string") {
      return res.status(400).json({ error: "Invalid authorization code" });
    }

    try {
      const response = await AuthService.googleLogIn(code);

      if ("data" in response) {
        return res
          .cookie("accessToken", response.data?.accessToken, {
            httpOnly: true,
            sameSite: "lax",
            secure: config.env === "production",
            maxAge: 3600 * 1000,
            domain: `.${config.hostname}`,
          })
          .cookie("refreshToken", response.data?.refreshToken, {
            httpOnly: true,
            sameSite: "lax",
            secure: config.env === "production",
            maxAge: 3600 * 1000 * 24 * 30,
            domain: `.${config.hostname}`,
            path: "/"
          })
          .redirect(`${config.baseUrlFrontend}/chats`);
      }
    } catch (err) {
      console.error("Authentication failed:");
      return res.status(401).json({ error: err || "Authentication failed" });
    }
  }

  
}

const authController = new AuthController();
export default authController;
