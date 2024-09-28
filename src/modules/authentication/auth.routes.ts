import { Router } from "express";
import { validateRequestBody } from "../../common/middlewares/validateReqBody";
import { logInSchema } from "../../common/models/loginSchema";
import { authController } from "../../dependancyContainer/controllers";

const authRoute = Router();

authRoute.post("/send-verification-email", validateRequestBody(logInSchema), authController.sendVerificationEmail);
authRoute.get("/auth/login", authController.loginWithEmail);
authRoute.get("/auth/google", authController.redirectToGoogleAuth);
authRoute.get("/auth/google/callback", authController.handleGoogleAuthCallback);
authRoute.get("/auth/logout",authController.logout)
authRoute.post("/auth/verify-refresh", authController.verifyOrRefresh)

export default authRoute;