import { inject, injectable } from "inversify";
import { TYPES } from "../../inversify/types";
import { Request, Response } from "express";
import { formatResponse } from "../../common/utils/responseFormatter";
import { WebSocketManager } from "../../common/websockets/websocket";
import { EventManager } from "../../common/config/eventService";
import { $Enums } from "@prisma/client";
import { IFriendshipService } from "./frnd.interface";

@injectable()
export default class FriendshipController {
  constructor(
    @inject(TYPES.FriendshipService)
    private friendshipService: IFriendshipService,
    @inject(TYPES.WebSocketManager) private webSocketManager: WebSocketManager,
    @inject(TYPES.EventManager) private eventManager: EventManager
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
    const { status }: {status: Omit<$Enums.FriendshipStatus,"pending">} = req.body;
    const friendId = req.params.userId as string
    const userId = req.user.userId as string

    const response = await this.friendshipService.handleFriendRequest(userId, friendId, status)
    if(response){
      if(status === "blocked"){
        this.webSocketManager.sendMessage({
          event: "userEvent",
          users: friendId,
          message: {
            event: "friend:blocked",
            data: {
              blockedUserId: friendId,
              chatRoomId: response.chatRoomId
            }
          }
        })
      }
      if(response.status === "accepted"){
        this.webSocketManager.sendMessage({
          event: "userEvent",
          users: friendId,
          message: {
            event: "friend:accepted",
            data: {}
          }
        })

        this.eventManager.emit<{
          chatRoomId: string;
          users: { username: string; userId: string }[];
        }>("chatRoom:create", {
          chatRoomId: response.chatRoomId as string,
          users: [{userId: userId,username: ""},{userId: friendId,username: ""}],
        });
      }
        return res.json(formatResponse({
          success: true,
          message: "Operation succesful",
          data: {
            status: response.status,
            chatRoomId: response.chatRoomId
          }
        }))
    }

    return res.status(401).json(formatResponse({
      success: false,
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
