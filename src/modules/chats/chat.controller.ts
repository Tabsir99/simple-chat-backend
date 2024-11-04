import { NextFunction, Request, Response } from "express";
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
      console.error("Error occured", error instanceof Error && error.message);
      res.status(500).json({
        error: error,
      });
    }
  };

  getGroupMembers = async (req: Request, res: Response) => {
    const chatRoomId = req.params.chatId as string;
    const result = await this.chatServices.getChatRoomMembers(chatRoomId);
    res.json(
      formatResponse({
        success: true,
        data: result,
      })
    );
  };

  getGroupMedia = async (req: Request, res: Response) => {
    const chatRoomId = req.params.chatId as string;
    const result = await this.chatServices.getChatRoomMedia(chatRoomId);
    res.json(
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

  updateMember = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const currentUserId = req.user.userId as string;
      const { action, chatRoomId, userId, nickname,username } = req.body as {
        chatRoomId: string;
        userId: string;
        action: "promote" | "demote" | "nickname";
        username: string
        nickname?: string;
      };
      if (currentUserId === userId && action !== "nickname") {
        return res.status(400).json(
          formatResponse({
            success: false,
            message: "Can't promote or demote self",
          })
        );
      }

      const result = await this.chatServices.updateGroupMember(
        chatRoomId,
        userId,
        action,
        currentUserId,
        username,
        nickname
      );

      if (action !== "nickname") {
        this.eventManager.emit("member:update", {
          type: "role",
          data: {
            currentUserId: currentUserId,
            targetUserId: userId,
            chatRoomId: chatRoomId,
            userRole: action === "promote"?"admin":"member",
          },
        });
        this.eventManager.emit("message:new",{
          chatRoomId: chatRoomId,
          currentUserId: currentUserId,
          message: result
        })
      }

      if (action === "nickname") {
        this.eventManager.emit("member:update", {
          type: "nickname",
          data: {
            currentUserId: currentUserId,
            targetUserId: userId,
            chatRoomId: chatRoomId,
            nickname: nickname,
          },
        });
        this.eventManager.emit("message:new",{
          chatRoomId: chatRoomId,
          currentUserId: currentUserId,
          message: result
        })
      }
      if (result) {
        return res.json(
          formatResponse({
            success: true,
            message: `Member ${action}d`,
            data: result,
          })
        );
      }
    } catch (error) {
      return next("ye");
    }
  };

  deleteChat = async (req: Request, res: Response, next: NextFunction) => {
    const chatRoomId = req.params.chatId as string;
    const currentUserId = req.user.userId as string;

    const response = await this.chatServices.clearChat(
      chatRoomId,
      currentUserId
    );
    if (response) {
      return res.json(
        formatResponse({
          success: false,
          message: "Chat cleared",
          data: response,
        })
      );
    }
    return res.status(401).send("No authorized");
  };

  addMember = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body as { chatRoomId: string; users: {userId: string, username: string}[] };
      const userId = req.user.userId as string;

      const message = await this.chatServices.addMember(data, userId);

      this.eventManager.emit("member:add", {
        chatRoomId: data.chatRoomId,
        users: data.users.map(user => user.userId),
        currentUserId: userId,
      });
      this.eventManager.emit("message:new",{
        chatRoomId: data.chatRoomId,
        currentUserId: userId,
        message
      })

      return res.json(
        formatResponse({
          success: true,
          message: "Member added",
          data: message
        })
      );
    } catch (error) {
      console.log(error);
      return next("err");
    }
  };

  removeMember = async (req: Request, res: Response, next: NextFunction) => {
    const { chatId, memberId } = req.params as {
      chatId: string;
      memberId: string;
    };
    const {username} = req.query as {username: string}
    const currentUserId = req.user.userId as string;
    const result = await this.chatServices.updateGroupMembership(
      chatId,
      memberId,
      currentUserId,
      username
    );
    if (!result) {
      return res.status(401).json(
        formatResponse({
          success: false,
        })
      );
    }
    this.eventManager.emit("member:remove", {
      chatRoomId: chatId,
      userId: memberId,
      currentUserId,
    });

    this.eventManager.emit("message:new",{
      chatRoomId: chatId,
      currentUserId: currentUserId,
      message: result
    })
    return res.json(
      formatResponse({
        success: true,
        data: result,
      })
    );
  };
}
