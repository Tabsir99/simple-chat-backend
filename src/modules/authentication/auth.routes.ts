import { Router } from "express";
import { validateRequestBody } from "../../common/middlewares/validateReqmiddleware";
import { logInSchema } from "../../common/models/validation";
import { refreshMiddleware } from "../../common/middlewares/authMiddleware";
import * as authController from "./auth.controller";

const authRoute = Router();

authRoute.post(
  "/auth/send-verification-email",
  validateRequestBody(logInSchema),
  authController.sendVerificationEmail
);
authRoute.get("/auth/login", authController.loginWithEmail);
authRoute.get("/auth/google", authController.redirectToGoogleAuth);
authRoute.get("/auth/google/callback", authController.handleGoogleAuthCallback);
authRoute.get("/auth/logout", authController.logout);
authRoute.post(
  "/auth/verify-refresh",
  refreshMiddleware,
  authController.verifyOrRefresh
);

export default authRoute;
