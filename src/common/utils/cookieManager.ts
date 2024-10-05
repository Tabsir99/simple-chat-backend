import { Response } from "express";
import { configService } from "../config/env";
import { injectable } from "inversify";

export interface ICookieManager {
  setAuthCookies(res: Response, options: { refreshToken: string, exp?: number }): void;
  clearAuthCookies(res: Response): void;
}

@injectable()
export class CookieManager {
  setAuthCookies(
    res: Response,
    {
      refreshToken,
      exp = 7 * 24 * 3600,
    }: { refreshToken: string; exp: number }
  ) {
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: configService.isProduction(),
      maxAge: exp * 1000,
      domain: `.${configService.get("hostname")}`,
      path: "/api/auth",
    });
  }

  clearAuthCookies(res: Response) {
    res.clearCookie("refreshToken", {
      httpOnly: true,
      sameSite: "lax",
      secure: configService.isProduction(),
      path: "/api/auth",
      domain: `.${configService.get("hostname")}`,
    });
  }
}

export const cookieManager = new CookieManager();
