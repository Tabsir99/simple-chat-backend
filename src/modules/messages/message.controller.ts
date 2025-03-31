import { NextFunction, Request, Response } from "express";
import { formatResponse } from "../../common/utils/responseFormatter";
import { MessageError } from "../../common/errors/messageErrors";
import * as messageService from "./message.services";

export const getMessagesByChatId = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const chatId = req.params.chatId as string;
    const userId = req.user.userId as string;

    const query = req.query as { messageId: string; createdAt: string } | undefined;

    const chats = await messageService.getMessagesByChatId(
      chatId,
      userId,
      query
    );

    return res.status(200).json(
      formatResponse({
        success: true,
        data: chats,
        message: "Message fetched",
      })
    );
  } catch (error) {
    if (error instanceof MessageError) {
      if (error.errorCode === "MEMBER_ACCESS_DENIED") {
        return res.status(403).json(
          formatResponse({
            success: false,
            message: "Member does not have access to this chatroom",
          })
        );
      }
    }
    return next(error);
  }
};


export const searchMessages = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { chatRoomId, query } = req.query as {
    chatRoomId: string;
    query: string;
  };

  try {
    const currentUserId = req.user.userId as string;
    const response = await messageService.searchMessages(
      chatRoomId,
      query,
      currentUserId
    );

    res.json(
      formatResponse({
        success: true,
        data: response,
      })
    );
  } catch (error) {
    return next(error);
  }
};
