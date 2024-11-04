import { Request, Response } from "express";
import { IUserService } from "./user.service.interface";
import { injectable, inject } from "inversify";
import { TYPES } from "../../inversify/types";
import { ConfigService } from "../../common/config/env";
import { formatResponse } from "../../common/utils/responseFormatter";

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

    if(userId === nativeUserId){
      return res.json({ isOwnProfile: true })
    }

    const userInfo = await this.userService.getUserInfo(userId, nativeUserId);

    if (!userInfo) {
      return res.status(200).json({
        message: "No user found",
        userId: userId,
      });
    }

    if(userInfo.isCurrentUserBlocked){
      return res.status(403).json(formatResponse({
        success: false,
        message: "You do not have permission to interact with this user!"
      }))
    }
    return res.json(formatResponse({
      success: true,
      data: {userInfo, isOwnProfile: userId === nativeUserId},
      message: "User fetched"
    }));
  };

  queryUsersProfile = async (req: Request, res: Response) => {

    const query = req.query as {query: string, chatRoomId?: string};
    const userId = req.user.userId as string

    const results = await this.userService.queryByUsername(query, userId);
    if (!results) {
      return res.status(404).json({
        message: "No User found",
      });
    }

    return res.status(200).json(formatResponse({
      success: true,
      data: results
    }));
  };

  getOwnProfile = async (req: Request, res: Response) => {
    const userId = req.user.userId as string;
    const query = req.query

    try {
      const userInfo = await this.userService.getUserInfo(userId, userId, query);
      if (!userInfo) {
        return res.status(404).json({ message: "User not found" });
      }
      return res.json(formatResponse({
        success: true,
        data: { userInfo, isOwnProfile: true },
        message: "Own profile fetched"
      }));
    } catch (error) {
      // console.error("Error in getOwnProfile:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  };

  getRecentActivities = async (req: Request, res: Response) => {
    try {
      const userId = req.user.userId as string; // Assuming the user ID is available on the request object after authentication
      const recentActivities = await this.userService.getRecentActivities(userId);
      
      res.status(200).json(formatResponse({
        success: true,
        data: recentActivities,
      }));
    } catch (error) {
      res.status(500).json(formatResponse({
        success: false,
        message: "Failed to fetch recent activities",
      }));
    }
  };

  updateRecentActivities = async (req: Request, res: Response) => {

    const userId = req.user.userId as string
    const event: "reset-friends"|"reset-chats" = req.body.event


    const result = await this.userService.updateRecentActivities(userId, event)
    if(result){
      return res.json(formatResponse({
        success: true
      }))
    }
    return res.status(500).json(formatResponse({
      success: false
    }))
  }
}
