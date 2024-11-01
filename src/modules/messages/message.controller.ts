import { NextFunction, Request, Response } from "express";
import { inject, injectable } from "inversify";
import { MessageService } from "./message.services";
import { TYPES } from "../../inversify/types";
import { formatResponse } from "../../common/utils/responseFormatter";
import { MessageError } from "../../common/errors/messageErrors";



@injectable()
export default class MessageControllers {
  
  constructor (@inject(TYPES.MessageService) private messageService: MessageService) {}
    // Retrieve all messages in a specific chat
    getMessagesByChatId = async (req: Request, res: Response, next: NextFunction) => {
      try {
        const chatId = req.params.chatId as string
        const userId = req.user.userId as string
  
        const query = req.query as {messageId: string, createdAt: string}
  
        const chats = await this.messageService.getMessagesByChatId(chatId, userId, query)
  
        return res.status(200).json(formatResponse({
          success: true,
          data: chats,
          message: "Message fetched"
        }));
      } catch (error) {
        if(error instanceof MessageError){
          if(error.errorCode === "MEMBER_ACCESS_DENIED"){
            return res.status(403).json(formatResponse({
              success: false,
              message: "Member does not have access to this chatroom",
            }))
          }
        }
        return next(error)
      }
    };
  
    // Create a new message in a specific chat
    createMessageInChat = async (req: Request, res: Response) => {
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    };
  
   
  }
  