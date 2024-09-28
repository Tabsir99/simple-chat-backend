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
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${this.config.get("googleClientId")}&redirect_uri=${redirectUri}&scope=email profile&response_type=code`;
    res.redirect(googleAuthUrl);
  };

  public sendVerificationEmail = async (req: Request, res: Response): Promise<Response> => {
    const { email } = req.body;
    const response = await this.authService.sendVerificationEmail(email);
    return res.json(response);
  };

  public loginWithEmail = async (req: Request, res: Response): Promise<Response | void> => {
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
      const { accessToken, refreshToken } = response.data
      this.cookieManager.setAuthCookies(res, {accessToken, refreshToken});
      return res.redirect(this.config.get("baseUrlFrontend") + "/chats");
    } else {
      return res.status(403).json(response);
    }
  };

  public handleGoogleAuthCallback = async (req: Request, res: Response): Promise<Response | void> => {
    const { code } = req.query;
    if (typeof code !== "string") {
      return res.status(400).json({ error: "Invalid authorization code" });
    }

    try {
      const response = await this.authService.googleLogIn(code);
      if ("data" in response) {
        this.cookieManager.setAuthCookies(res, response.data);
        return res.redirect(`${this.config.get("baseUrlFrontend")}/chats`);
      }
    } catch (err) {
      console.error("Authentication failed:", err);
      return res.status(401).json({ error: "Authentication failed" });
    }
    return res.status(500).json({ err: "Internal porblem" })
  };

  public verifyOrRefresh = async (req: Request, res: Response) => {

    const accessToken: string = req.cookies["accessToken"]
    const refreshToken: string = req.cookies["refreshToken"]

    console.log(refreshToken)

    try {
    const newAccessToken = await this.authService.verifyOrRefreshToken(accessToken, refreshToken)
    if(typeof newAccessToken === "boolean"){
      return res.json({
        message: "Token verified"
      })
    }
    else{
      this.cookieManager.setAccessTokenCookie(res, newAccessToken)
      return res.json({
        message: "New Token Issued"
      })
    }
    
    } catch (error) {
      this.cookieManager.clearAuthCookies(res)
      return res.status(401).json({
        message: "Token Verification failed"
      })
    }

  }

  public logout = (_: Request, res: Response) => {

    this.cookieManager.clearAuthCookies(res)
    res.json({
      message: "User logged out"
    })
  }
}



























// import { Request, Response } from "express";
// import AuthService from "./auth.services";
// import { formatErrorResponse } from "../../common/utils/responseFormatter";
// import config from "../../common/config/env";

// export default class AuthController {
//   private clearTokens = (res: Response) => {
//     res.clearCookie("accessToken").clearCookie("refreshToken");
//   };
//   redirectToGoogleAuth = (_: Request, res: Response) => {
//     console.log("recived");
//     const redirectUri = encodeURIComponent(
//       `${config.baseUrl}/api/auth/google/callback`
//     );
//     const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${config.googleClientId}&redirect_uri=${redirectUri}&scope=email profile&response_type=code`;
//     res.redirect(googleAuthUrl);
//   };
//   sendVerificationEmail = async (req: Request, res: Response) => {
//     const { email } = req.body;

//     const response = await AuthService.sendVerificationEmail(email);

//     if (response.status === "success") {
//       return res.json(response);
//     } else {
//       return res.json(response);
//     }
//   };

//   loginWithEmail = async (req: Request, res: Response) => {
//     const { token } = req.query;

//     if (!token || typeof token !== "string")
//       return res.status(400).json(
//         formatErrorResponse({
//           message: "Invalid or missing token",
//           statusCode: 400,
//         })
//       );
//     const response = await AuthService.emailLogIn(token);

//     if ("data" in response) {
//       res.cookie("accessToken", response.data?.accessToken, {
//         httpOnly: true,
//         sameSite: "lax",
//         secure: config.env === "production",
//         maxAge: 3600 * 1000,
//         domain: `.${config.hostname}`,
//       });
//       res.cookie("refreshToken", response.data?.refreshToken, {
//         httpOnly: true,
//         sameSite: "lax",
//         secure: config.env === "production",
//         maxAge: 3600 * 1000 * 24 * 30,
//         domain: `.${config.hostname}`,
//         path: "/",
//       });
//       return res.redirect(config.baseUrlFrontend + "/chats");
//     } else {
//       return res.status(403).json(response);
//     }
//   };

//   handleGoogleAuthCallback = async (req: Request, res: Response) => {
//     const { code } = req.query;

//     if (typeof code !== "string") {
//       return res.status(400).json({ error: "Invalid authorization code" });
//     }

//     try {
//       const response = await AuthService.googleLogIn(code);

//       if ("data" in response) {
//         return res
//           .cookie("accessToken", response.data?.accessToken, {
//             httpOnly: true,
//             sameSite: "lax",
//             secure: config.env === "production",
//             maxAge: 3600 * 1000,
//             domain: `.${config.hostname}`,
//           })
//           .cookie("refreshToken", response.data?.refreshToken, {
//             httpOnly: true,
//             sameSite: "lax",
//             secure: config.env === "production",
//             maxAge: 3600 * 1000 * 24 * 30,
//             domain: `.${config.hostname}`,
//             path: "/",
//           })
//           .redirect(`${config.baseUrlFrontend}/chats`);
//       }
//     } catch (err) {
//       console.error("Authentication failed:");
//       return res.status(401).json({ error: err || "Authentication failed" });
//     }
//   };
// }