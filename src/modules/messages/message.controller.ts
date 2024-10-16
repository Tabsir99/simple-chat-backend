import { Request, Response } from "express";
import { inject, injectable } from "inversify";
import { MessageService } from "./message.services";
import { TYPES } from "../../inversify/types";
import { formatResponse } from "../../common/utils/responseFormatter";



@injectable()
export default class MessageControllers {
  
  constructor (@inject(TYPES.MessageService) private messageService: MessageService) {}
    // Retrieve all messages in a specific chat
    getMessagesByChatId = async (req: Request, res: Response) => {
      const chatId = req.params.chatId as string
      const userId = req.user.userId as string

      if (chatId === 'null') {
        // console.log(req.params)
      }

      const chats = await this.messageService.getMessagesByChatId(chatId, userId)

      return res.status(200).json(formatResponse({
        success: true,
        data: chats,
        message: "Message fetched"
      }));
    };
  
    // Create a new message in a specific chat
    createMessageInChat = async (req: Request, res: Response) => {
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    };
  
    // Add a reaction to a specific message
    addReactionToMessage = async (req: Request, res: Response) => {
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    };
  
    // Update a specific message
    updateMessageById = async (req: Request, res: Response) => {
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    };
  
    // Delete a specific message
    deleteMessageById = async (req: Request, res: Response) => {
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    };
  
    // Delete a specific reaction from a message
    deleteReactionFromMessage = async (req: Request, res: Response) => {
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    };
  }
  