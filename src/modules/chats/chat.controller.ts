import { Request, Response } from "express";
import { inject, injectable } from "inversify";
import { TYPES } from "../../inversify/types";
import ChatServices from "./chat.services";
import { formatResponse } from "../../common/utils/responseFormatter";

@injectable()
export default class ChatControllers {
  constructor(@inject(TYPES.ChatService) private chatServices: ChatServices) {}

  getAllUserChats = async (req: Request, res: Response) => {
    try {
      const userId = req.user.userId as string;

      const userData = await this.chatServices.getChats(userId);

      // console.log(userData)
      await new Promise(res => setTimeout(res,3000))
      res.json(formatResponse({
        success: true,
        data: userData,
        message: "Chatroom data given"
      }));

    } catch (error) {
      console.log("Error occured");
      res.status(500).json({
        error: error
      });
    }
  };

  
  getChatById = async (req: Request, res: Response) => {

    

    return res.status(500).json(formatResponse({
      success: false,
      message: "Internal server error",
    }))
  }

  updateChat = async (req: Request, res: Response) => {
    return res.status(500).json(formatResponse({
      success: false,
      message: "Internal server error",
    }));
  }
  
  addChatMember = async (req: Request, res: Response) => {
    return res.status(500).json(formatResponse({
      success: false,
      message: "Internal server error",
    }));
  }
  
  addChatAdmin = async (req: Request, res: Response) => {
    return res.status(500).json(formatResponse({
      success: false,
      message: "Internal server error",
    }));
  }
  
  removeChatMember = async (req: Request, res: Response) => {
    return res.status(500).json(formatResponse({
      success: false,
      message: "Internal server error",
    }));
  }
  
  removeChatAdmin = async (req: Request, res: Response) => {
    return res.status(500).json(formatResponse({
      success: false,
      message: "Internal server error",
    }));
  }
}
