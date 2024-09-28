import AuthService from "../modules/authentication/auth.services";
import AuthRepository from "../modules/authentication/auth.repository";

import { UserRepository } from "../modules/users/user.repository";
import UserService from "../modules/users/user.services";
import { configService } from "../common/config/env";
import { emailService } from "../common/config/nodemailerConfig";
import { responseFormatter } from "../common/utils/responseFormatter";


const userRepository = new UserRepository()
export const userService = new UserService(userRepository)

const authRepository = new AuthRepository()
export const authService = new AuthService(userService, emailService, configService, responseFormatter, authRepository)