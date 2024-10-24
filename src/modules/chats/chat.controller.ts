import { Request, Response } from "express";
import { inject, injectable } from "inversify";
import { TYPES } from "../../inversify/types";
import ChatServices from "./chat.services";
import { formatResponse } from "../../common/utils/responseFormatter";
import { WebSocketManager } from "../../common/websockets/websocket";
import { EventManager } from "../../common/config/eventService";

@injectable()
export default class ChatControllers {
  constructor(
    @inject(TYPES.ChatService) private chatServices: ChatServices,
    @inject(TYPES.EventManager) private eventManager: EventManager
  ) {}

  getAllUserChats = async (req: Request, res: Response) => {
    try {
      const userId = req.user.userId as string;
      const userData = await this.chatServices.getChats(userId);

      res.json(
        formatResponse({
          success: true,
          data: userData,
          message: "Chatroom data given",
        })
      );
    } catch (error) {
      console.log("Error occured");
      res.status(500).json({
        error: error,
      });
    }
  };

  getChatById = async (req: Request, res: Response) => {
    const fetchAll = req.query.all === "true" ? true : false;
    const chatRoomId = req.params.chatId as string;

    const result = await this.chatServices.getChatRoomDetails(
      chatRoomId,
      fetchAll
    );

    if (!result) {
      return res.status(500).json(
        formatResponse({
          success: false,
          message: "Internal server error",
        })
      );
    }

    return res.json(
      formatResponse({
        success: true,
        data: result,
      })
    );
  };

  updateChat = async (req: Request, res: Response) => {
    return res.status(500).json(
      formatResponse({
        success: false,
        message: "Internal server error",
      })
    );
  };

  createGroupChat = async (req: Request, res: Response) => {
    const currentUserId = req.user.userId as string;
    const users = req.body as { userId: string; username: string }[];

    // return console.log(users)
    try {
      const result = await this.chatServices.createChatRoom(
        currentUserId,
        users,
        true
      );

      this.eventManager.emit<{
        chatRoomId: string;
        users: { username: string; userId: string }[];
      }>("chatRoom:create", {
        chatRoomId: result.chatRoom.chatRoomId,
        users: users,
      });
      
      res.json(
        formatResponse({
          success: true,
          data: result.chatRoom,
        })
      );
    } catch (error) {
      res.status(500).json(
        formatResponse({
          success: false,
        })
      );
    }
  };

  addChatMember = async (req: Request, res: Response) => {
    return res.status(500).json(
      formatResponse({
        success: false,
        message: "Internal server error",
      })
    );
  };

  addChatAdmin = async (req: Request, res: Response) => {
    return res.status(500).json(
      formatResponse({
        success: false,
        message: "Internal server error",
      })
    );
  };

  removeChatMember = async (req: Request, res: Response) => {
    return res.status(500).json(
      formatResponse({
        success: false,
        message: "Internal server error",
      })
    );
  };

  removeChatAdmin = async (req: Request, res: Response) => {
    return res.status(500).json(
      formatResponse({
        success: false,
        message: "Internal server error",
      })
    );
  };
}
