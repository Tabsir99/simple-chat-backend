// User routes

import { Router } from "express";
import authMiddleware from "../../common/middlewares/authMiddleware";
import { validateReqQuery } from "../../common/middlewares/validateReqmiddleware";
import { userQuerySchema } from "../../common/models/validation";
import * as userControllers from "./user.controller";
const userRoute = Router();

userRoute.use(authMiddleware);
userRoute.get("/users/me", userControllers.getOwnProfile);
userRoute.put("/users/me", userControllers.updateUser);
userRoute.get("/users/:userId", userControllers.getUserInfo);
userRoute.get(
  "/users",
  validateReqQuery(userQuerySchema),
  userControllers.queryUsersProfile
);

export default userRoute;
