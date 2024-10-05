import { Request, Response } from "express";
import { IUserService } from "./user.service.interface";
import { injectable, inject } from "inversify";
import { TYPES } from "../../inversify/types";
import { ConfigService } from "../../common/config/env";

@injectable()
export default class UserControllers {
  constructor(
    @inject(TYPES.UserService) private userService: IUserService,
    @inject(TYPES.ConfigService) private configService: ConfigService
  ) {}

  getUserInfo = async (req: Request, res: Response) => {
    const { userId } = req.params;
    const nativeUserId = req.user.userId as string


    if (!userId) {
      return res.status(403).json({
        message: "Missing UserID",
      });
    }

    console.log(userId === nativeUserId)
    if(userId === nativeUserId){
      return res.json({ isOwnProfile: true })
    }

    const userInfo = await this.userService.getUserInfo(userId, nativeUserId);
    // console.log(userInfo)

    if (!userInfo) {
      return res.status(200).json({
        message: "No user found",
        userId: userId,
      });
    }
    return res.json({userInfo, isOwnProfile: userId === nativeUserId});
  };

  queryUsersProfile = async (req: Request, res: Response) => {
    await new Promise((res) => setTimeout(res, 2000));

    const query = req.query?.query as string;
    const userId = req.user.userId as string

    const results = await this.userService.queryByUsername(query, userId);
    if (!results) {
      return res.status(404).json({
        message: "No User found",
      });
    }

    return res.status(200).json({
      data: results,
    });
  };

  getOwnProfile = async (req: Request, res: Response) => {
    const userId = req.user.userId as string;
    try {
      const userInfo = await this.userService.getUserInfo(userId, userId);
      if (!userInfo) {
        return res.status(404).json({ message: "User not found" });
      }
      return res.json({ userInfo, isOwnProfile: true });
    } catch (error) {
      console.error("Error in getOwnProfile:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  };
}
