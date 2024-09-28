import { Response } from "express";
import { configService } from "../config/env";

export class CookieManager {
  setAuthCookies(
    res: Response,
    { refreshToken }: { refreshToken: string }
  ) {

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: configService.isProduction(),
      maxAge: 7 * 24 * 3600 * 1000,
      domain: `.${configService.get("hostname")}`,
      path: "/api/auth/verify-refresh"
    });
  }

  clearAuthCookies(res: Response) {
    res.clearCookie("refreshToken", {
      httpOnly: true,
      sameSite: "lax",
      secure: configService.isProduction(),
      path: "/api/auth/verify-refresh",
      domain: `.${configService.get("hostname")}`,
    });

     
  }

}

export const cookieManager = new CookieManager();
