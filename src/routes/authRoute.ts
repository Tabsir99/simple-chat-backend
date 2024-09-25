import { Router } from "express";
import authController from "../controllers/authController";
import { validateRequestBody } from "../middlewares/validateReqBody";
import { logInSchema } from "../models/loginSchema";

const route = Router();

route.post("/send-verification-email", validateRequestBody(logInSchema), authController.sendVerificationEmail);
route.get("/auth/login", authController.loginWithEmail);
route.get("/auth/google", authController.redirectToGoogleAuth);
route.get("/auth/google/callback", authController.handleGoogleAuthCallback);

export default route;