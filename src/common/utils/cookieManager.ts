import { Response } from "express";
import { configService } from "../config/env";

export class CookieManager {
  setAuthCookies(
    res: Response,
    { accessToken, refreshToken }: { accessToken: string; refreshToken: string }
  ) {
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: configService.isProduction(),
      maxAge: 3600 * 1000,
      domain: `.${configService.get("hostname")}`,
    });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: configService.isProduction(),
      maxAge: 7 * 24 * 3600 * 1000,
      domain: `.${configService.get("hostname")}`,
    });
  }

  clearAuthCookies(res: Response) {
    res.clearCookie("accessToken", {
      httpOnly: true,
      sameSite: "lax",
      secure: configService.isProduction(),
      domain: `.${configService.get("hostname")}`,
    });
    res.clearCookie("refreshToken", {
      httpOnly: true,
      sameSite: "lax",
      secure: configService.isProduction(),
      domain: `.${configService.get("hostname")}`,
    });

    
  }
  setAccessTokenCookie(res: Response, accessToken: string){
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: configService.isProduction(),
      maxAge: 3600 * 1000,
      domain: `.${configService.get("hostname")}`,
    });
  }
}

export const cookieManager = new CookieManager();
