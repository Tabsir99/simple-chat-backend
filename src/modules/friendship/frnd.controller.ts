import { inject, injectable } from "inversify";
import { TYPES } from "../../inversify/types";
import FriendshipService from "./frnd.services";
import { Request, Response } from "express";
import { formatResponse } from "../../common/utils/responseFormatter";

@injectable()
export default class FriendshipController {
  constructor(
    @inject(TYPES.FriendshipService)
    private friendshipService: FriendshipService
  ) {}

  createFriendRequest = async (req: Request, res: Response) => {
    const targetUserId = req.body.targetUserId as string;
    const senderId = req.user.userId as string

    const isSuccessful = await this.friendshipService.createFriendRequest(
      senderId,
      targetUserId
    );

    if (!isSuccessful) {
      return res.status(400).json(formatResponse({
        success: false
      }));
    }
 
    return res.json(formatResponse({
      success: true,
      data: {
        status: "pending"
      }
    }));
  };

  updateFriendship = async (req: Request, res: Response) => {
    const { status } = req.body;
    const targetUserId = req.params.userId as string
    const userId = req.user.userId as string

    const response = await this.friendshipService.handleFriendRequest(userId, targetUserId, status)
    if(response.success){
        return res.json(formatResponse({
          success: true,
          message: response.message,
          data: {
            status: response.status
          }
        }))
    }
    return res.status(500).json(formatResponse({
      success: false,
      message: "Some error occured",

    }))
  };
}
