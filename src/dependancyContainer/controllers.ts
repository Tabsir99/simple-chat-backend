import { authService } from "./services";
import { configService } from "../common/config/env";
import { responseFormatter } from "../common/utils/responseFormatter";
import AuthController from "../modules/authentication/auth.controller";
import { cookieManager } from "../common/utils/cookieManager";

export const authController = new AuthController(authService, responseFormatter, configService, cookieManager)