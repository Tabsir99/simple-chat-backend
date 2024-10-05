// User routes

import { Router } from "express";
import authMiddleware from "../../common/middlewares/authMiddleware";
import container from "../../inversify/bindings";
import UserControllers from "./user.controller";
import { TYPES } from "../../inversify/types";
import { validateReqQuery } from "../../common/middlewares/validateReqmiddleware";
import { userQuerySchema } from "../../common/models/validation";

const userControllers = container.get<UserControllers>(TYPES.UserController)

const userRoute = Router()

userRoute.use(authMiddleware)
userRoute.get("/users/me", userControllers.getOwnProfile)
userRoute.get("/users/:userId", userControllers.getUserInfo)
userRoute.get("/users", validateReqQuery(userQuerySchema) , userControllers.queryUsersProfile)

export default userRoute