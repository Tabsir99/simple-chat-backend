import { inject, injectable } from "inversify";
import { TYPES } from "../../inversify/types";
import ChatRepository from "./chat.repository";
import { getMimeType } from "../../common/utils/utils";
import { $Enums, ChatRole, FileType } from "@prisma/client";
import FriendshipService from "../friendship/frnd.services";
import { ChatRoomHead } from "./chats.interfaces";

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
            fileType: isChatCleared ? null : getMimeType(room.fileType as FileType),
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
    nickname?: string
  ) => {
    let res: { nickName: string | null; userRole: ChatRole | null } = {
      nickName: null,
      userRole: null,
    };
    if (action === "nickname") {
      res.nickName = (
        await this.chatRepository.updateGroupMember(
          chatRoomId,
          userId,
          nickname as string
        )
      ).nickName;
      return res;
    }
    res.userRole = (
      await this.chatRepository.updateGroupMemberRole(
        chatRoomId,
        userId,
        action === "demote" ? "member" : "admin"
      )
    ).userRole;

    return res;
  };

  updateGroupMembership = async (
    chatRoomId: string,
    userId: string,
    currentUserId: string
  ) => {
    try {
      const res = await this.chatRepository.deleteGroupMember(
        chatRoomId,
        userId,
        currentUserId
      );
      if (!res) {
        throw new Error("Not enough permission");
      }
      return res;
    } catch (error) {
      return false;
    }
  };

  validateMember = async (userId: string, chatRoomId: string) => {
    const res = await this.chatRepository.findChatRoom(userId, chatRoomId);

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
}
