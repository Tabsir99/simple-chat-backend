import { Response } from "express";
import config from "../config/env";

export function setAuthCookies(
  res: Response,
  { refreshToken, exp = 7 * 24 * 3600 }: { refreshToken: string; exp: number }
) {
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: config.env === "production",
    maxAge: exp * 1000,
    domain: `.${config.hostname}`,
    path: "/api/auth",
  });
}

export function clearAuthCookies(res: Response) {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    sameSite: "lax",
    secure: config.env === "production",
    path: "/api/auth",
    domain: `.${config.hostname}`,
  });
}
