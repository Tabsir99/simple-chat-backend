import { NextFunction, Request, Response } from "express";
import { formatResponse } from "../../common/utils/responseFormatter";
import { ChatError } from "../../common/errors/chatErrors";
import * as chatService from "./chat.services";
import { eventManager } from "../../common/config/eventService";

export const getAllUserChats = async (req: Request, res: Response) => {
  try {
    const userId = req.user.userId as string;
    const userData = await chatService.getChats(userId);

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

export const getGroupMembers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const chatRoomId = req.params.chatId as string;
  const userId = req.user.userId as string;
  try {
    const result = await chatService.getChatRoomMembers(chatRoomId, userId);
    res.json(
      formatResponse({
        success: true,
        data: result,
      })
    );
  } catch (error) {
    next(error);
  }
};

export const createGroupChat = async (req: Request, res: Response) => {
  const currentUserId = req.user.userId as string;
  const { members: users, groupName } = req.body as {
    members: { userId: string; username: string }[];
    groupName: string;
  };

  if (users.length < 2 || !groupName.trim()) {
    return res.status(400).json(
      formatResponse({
        success: false,
        message:
          users.length < 2
            ? "At least 2 users are required to create a group"
            : "Group name is required",
      })
    );
  }

  try {
    const result = await chatService.createChatRoom(
      currentUserId,
      users,
      groupName
    );

    eventManager.emit<{
      chatRoomId: string;
      users: { username: string; userId: string }[];
      currentUserId: string;
    }>("chatRoom:create", {
      chatRoomId: result.chatRoom.chatRoomId,
      users: users,
      currentUserId,
    });

    return res.json(
      formatResponse({
        success: true,
        data: result,
      })
    );
  } catch (error) {
    return res.status(500).json(
      formatResponse({
        success: false,
      })
    );
  }
};

export const updateMember = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const currentUserId = req.user.userId as string;
    const { action, chatRoomId, userId, nickname, username } = req.body as {
      chatRoomId: string;
      userId: string;
      action: "promote" | "demote" | "nickname";
      username: string;
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

    const result = await chatService.updateGroupMember(
      chatRoomId,
      userId,
      action,
      currentUserId,
      username,
      nickname
    );

    if (action !== "nickname") {
      eventManager.emit("member:update", {
        type: "role",
        data: {
          currentUserId: currentUserId,
          targetUserId: userId,
          chatRoomId: chatRoomId,
          userRole: action === "promote" ? "admin" : "member",
        },
      });
      eventManager.emit("message:new", {
        chatRoomId: chatRoomId,
        currentUserId: currentUserId,
        message: result,
      });
    }

    if (action === "nickname") {
      eventManager.emit("member:update", {
        type: "nickname",
        data: {
          currentUserId: currentUserId,
          targetUserId: userId,
          chatRoomId: chatRoomId,
          nickname: nickname,
        },
      });
      eventManager.emit("message:new", {
        chatRoomId: chatRoomId,
        currentUserId: currentUserId,
        message: result,
      });
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
    return next(error);
  }
};

export const deleteChat = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const chatRoomId = req.params.chatId as string;
  const currentUserId = req.user.userId as string;

  const response = await chatService.clearChat(chatRoomId, currentUserId);
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

export const addMember = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = req.body as {
      chatRoomId: string;
      users: { userId: string; username: string }[];
    };
    const userId = req.user.userId as string;

    const message = await chatService.addMember(data, userId);

    eventManager.emit("member:add", {
      chatRoomId: data.chatRoomId,
      users: data.users.map((user) => user.userId),
      currentUserId: userId,
    });
    eventManager.emit("message:new", {
      chatRoomId: data.chatRoomId,
      currentUserId: userId,
      message,
    });

    return res.json(
      formatResponse({
        success: true,
        message: "Member added",
        data: message,
      })
    );
  } catch (error) {
    if (error instanceof ChatError) {
      console.error(error.errorCode, error.statusCode);
      if (error.errorCode === "MEMBER_ALREADY_EXISTS") {
        return res.status(400).json(
          formatResponse({
            success: false,
            message: error.message,
          })
        );
      }
    }
    return next(error);
  }
};

export const removeMember = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { chatId, memberId } = req.params as {
    chatId: string;
    memberId: string;
  };
  const { username } = req.query as { username: string };
  const currentUserId = req.user.userId as string;
  const result = await chatService.updateGroupMembership(
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
  eventManager.emit("member:remove", {
    chatRoomId: chatId,
    userId: memberId,
    currentUserId,
  });

  eventManager.emit("message:new", {
    chatRoomId: chatId,
    currentUserId: currentUserId,
    message: result,
  });
  return res.json(
    formatResponse({
      success: true,
      data: result,
    })
  );
};
