import { Request, Response } from "express";
import { injectable } from "inversify";



@injectable()
export default class MessageControllers {
  
    // Retrieve all messages in a specific chat
    getMessagesByChatId = async (req: Request, res: Response) => {
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
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
  