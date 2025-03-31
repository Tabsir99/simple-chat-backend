import { Request, Response } from "express";
import { UserStatus } from "@prisma/client";
import { formatResponse } from "../../common/utils/responseFormatter";
import * as userService from "./user.services";

export const getUserInfo = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const nativeUserId = req.user.userId as string;

  if (!userId) {
    return res.status(403).json({
      message: "Missing UserID",
    });
  }

  if (userId === nativeUserId) {
    return res.json({ isOwnProfile: true });
  }

  const userInfo = await userService.getUserInfo(userId);

  if (!userInfo) {
    return res.status(200).json({
      message: "No user found",
      userId: userId,
    });
  }

  return res.json(
    formatResponse({
      success: true,
      data: { userInfo, isOwnProfile: userId === nativeUserId },
      message: "User fetched",
    })
  );
};

export const queryUsersProfile = async (req: Request, res: Response) => {
  const query = req.query as { query: string; chatRoomId?: string };
  const userId = req.user.userId as string;

  const results = await userService.queryByUsername(query, userId);
  if (!results) {
    return res.status(404).json({
      message: "No User found",
    });
  }

  return res.status(200).json(
    formatResponse({
      success: true,
      data: results,
    })
  );
};

export const getOwnProfile = async (req: Request, res: Response) => {
  const userId = req.user.userId as string;
  const query = req.query;

  try {
    const userInfo = await userService.getUserInfo(userId, query);
    if (!userInfo) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.json(
      formatResponse({
        success: true,
        data: { userInfo, isOwnProfile: true },
        message: "Own profile fetched",
      })
    );
  } catch (error) {
    // console.error("Error in getOwnProfile:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.user;
    const userData = req.body as {
      username?: string;
      bio?: string;
      image?: { imageSize: number; imageName: string; imageType: string };
      status?: UserStatus;
    };

    const response = await userService.updateUser(userId as string, userData);
    return res.json(
      formatResponse({
        success: true,
        data: response,
      })
    );
  } catch (error) {
    console.error(error, "From controller");
    return res.status(401).json(
      formatResponse({
        success: false,
      })
    );
  }
};
