import { inject, injectable } from "inversify";
import { TYPES } from "../../inversify/types";
import ChatRepository from "./chat.repository";
import { getMimeType } from "../../common/utils/utils";
import { $Enums, ChatRole, FileType } from "@prisma/client";
import FriendshipService from "../friendship/frnd.services";
import { ChatRoomHead } from "./chats.interfaces";
import { ChatError } from "../../common/errors/chatErrors";

@injectable()
export default class ChatServices {
  constructor(
    @inject(TYPES.ChatRepository) private chatRepository: ChatRepository,
    @inject(TYPES.FriendshipService) private frndService: FriendshipService
  ) {}

  getChats = async (userId: string) => {
    try {
      const chats = await this.chatRepository.findChatsByUserId(userId);
      const refinedChats: ChatRoomHead[] = chats
        .map((room) => {
          const isChatCleared =
            room.chatClearedAt && room.chatClearedAt > room.lastActivity;

          return {
            ...room,
            unreadCount: room.removedAt || isChatCleared ? 0 : room.unreadCount,
            lastActivity: room.removedAt ? room.removedAt : room.lastActivity,
            messageContent: isChatCleared ? null : room.messageContent,
            fileType: isChatCleared
              ? null
              : getMimeType(room.fileType as FileType),
          };
        })
        .sort(
          (a, b) =>
            new Date(b.lastActivity).getTime() -
            new Date(a.lastActivity).getTime()
        );
      return refinedChats;
    } catch (error) {
      console.error(error);
      throw new Error("Failed to get all chats");
    }
  };

  createChatRoom = async (
    currentUserId: string,
    users: { userId: string; username: string }[],
    isGroup: boolean
  ) => {
    try {
      const newUsers = users.map((user) => {
        return {
          ...user,
          isCreator: user.userId === currentUserId,
        };
      });

      const result = await this.chatRepository.createChat(newUsers, isGroup);
      return result;
    } catch (error) {
      console.error(
        error instanceof Error
          ? error.message
          : "error occured from createChatRom"
      );
      throw new Error("Could not create a chatRoom");
    }
  };

  getChatRoomMembers = async (chatRoomId: string) => {
    const members = await this.chatRepository.getChatRoomMembers(chatRoomId);

    const modifiedMembers = members?.ChatRoomMember.filter(
      (m) => m.removedAt === null
    ).map((member) => {
      return {
        ...member.user,
        isCreator: member.user.userId === members.createdBy,
        nickName: member.nickName,
        isAdmin: member.userRole === "admin",
        removedAt: member.removedAt,
      };
    });

    return modifiedMembers;
  };

  getChatRoomMedia = async (chatRoomId: string) => {
    const media = await this.chatRepository.getChatRoomMedia(chatRoomId);
    const modifiedMedia = media?.Messages.map((msg) => {
      return {
        fileName: msg.Attachment[0].fileName,
        fileType: msg.Attachment[0].fileType,
        fileSize: msg.Attachment[0].fileSize,
      };
    });

    return modifiedMedia;
  };
  getChatRoomList = async (userId: string) => {
    const chatRoomList = await this.chatRepository.getChatRoomListByUserId(
      userId
    );
    return chatRoomList.map((chatRoom) => chatRoom.chatRoomId);
  };

  updateGroupMember = async (
    chatRoomId: string,
    userId: string,
    action: "promote" | "demote" | "nickname",
    currentUserId: string,
    username: string,
    nickname?: string
  ) => {
    let res: { messageId: string; content: string; createdAt: Date };

    const currentUser = await this.verifyUserPermission(
      currentUserId,
      chatRoomId
    );

    if (action === "nickname") {
      res = await this.chatRepository.updateGroupMember(
        chatRoomId,
        userId,
        currentUserId === userId ? "his" : `${username}'s`,
        nickname as string,
        currentUser.username
      );
      return res;
    }

    if (!currentUser.isAdmin) throw new Error("Not enough permission");

    res = await this.chatRepository.updateGroupMemberRole(
      chatRoomId,
      userId,
      action === "demote" ? "member" : "admin",
      username,
      currentUser.username
    );

    return res;
  };

  updateGroupMembership = async (
    chatRoomId: string,
    userId: string,
    currentUserId: string,
    username: string
  ) => {
    try {
      const currentUser = await this.verifyUserPermission(
        currentUserId,
        chatRoomId
      );
      if (!currentUser.isAdmin) {
        throw new Error("Not enough permission");
      }
      const res = await this.chatRepository.deleteGroupMember(
        chatRoomId,
        userId,
        currentUserId,
        username,
        currentUser.username
      );

      return res;
    } catch (error) {
      return false;
    }
  };

  validateMember = async (userId: string, chatRoomId: string) => {
    const res = await this.chatRepository.findChatRoom(userId, chatRoomId);
    if (!res || res.removedAt) throw ChatError.memberAccessDenied();
    return res;
  };

  clearChat = async (chatRoomId: string, userId: string) => {
    try {
      const res = await this.chatRepository.clearChat(chatRoomId, userId);
      return res;
    } catch (error) {
      return false;
    }
  };

  addMember = async (
    data: { chatRoomId: string; users: { userId: string; username: string }[] },
    currentUserId: string
  ) => {
    const currentUser = await this.verifyUserPermission(
      currentUserId,
      data.chatRoomId
    );
    const res = await this.chatRepository.addGroupMember(
      data,
      currentUser.username
    );
    return res;
  };

  verifyUserPermission = async (userId: string, chatRoomId: string) => {
    const res = await this.chatRepository.findUserPermission(
      userId,
      chatRoomId
    );
    if (!res) throw new Error("ChatRoomMember does not exists");

    if (res.removedAt) throw new Error("User is no longer in the chatroom");

    return {
      isAdmin: res.userRole === "admin" ? true : false,
      username: res.user.username,
    };
  };

  leaveGroup = async (userId: string, chatRoomId: string, username: string) => {
    const res = await this.chatRepository.deleteGroupMember(
      chatRoomId,
      userId,
      userId,
      username,
      username
    );
    return res;
  };
}
