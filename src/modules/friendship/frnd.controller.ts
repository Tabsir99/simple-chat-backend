import { inject, injectable } from "inversify";
import { TYPES } from "../../inversify/types";
import FriendshipService from "./frnd.services";
import { Request, Response } from "express";
import { formatResponse } from "../../common/utils/responseFormatter";
import { WebSocketManager } from "../../common/websockets/websocket";

@injectable()
export default class FriendshipController {
  constructor(
    @inject(TYPES.FriendshipService)
    private friendshipService: FriendshipService,
    @inject(TYPES.WebSocketManager) private webSocketManager: WebSocketManager
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
 
    this.webSocketManager.sendMessage({
      event: "userEvent",
      message: {
        event: "friend:request",
        data: senderId
      },
      users: targetUserId
    })
    return res.json(formatResponse({
      success: true,
      data: {
        status: "pending"
      }
    }));
  };

  updateFriendship = async (req: Request, res: Response) => {
    const { status }: {status: "accepted" | "blocked" | ""} = req.body;
    const friendId = req.params.userId as string
    const userId = req.user.userId as string

    const response = await this.friendshipService.handleFriendRequest(userId, friendId, status)
    if(response.success){
      if(response.status === "accepted"){
        this.webSocketManager.sendMessage({
          event: "userEvent",
          users: friendId,
          message: {
            event: "friend:accepted",
            data: {}
          }
        })
      }
        return res.json(formatResponse({
          success: true,
          message: response.message,
          data: {
            status: response.status
          }
        }))
    }

    if(response.code === "P2025"){
      return res.status(404).json(formatResponse({
        success: false
      }))
    }
    return res.status(500).json(formatResponse({
      success: false,
      message: "Some error occured",

    }))
  };

  getFriendship = async (req: Request, res: Response) => {
    const userId = req.user.userId as string
    const result = await this.friendshipService.getFriendList(userId)

    res.json(formatResponse({
      success: true,
      data: result
    }))
  }
}
