import { inject, injectable } from "inversify";
import { TYPES } from "../../inversify/types";
import ChatRepository from "./chat.repository";

@injectable()
export default class ChatServices {
  constructor(
    @inject(TYPES.ChatRepository) private chatRepository: ChatRepository
  ) {}

  getChats = async (userId: string) => {
    try {
      const chats = await this.chatRepository.findChatsByUserId(userId);
      const unreadCounts = await this.chatRepository.findUnreadCountByUserId(
        userId
      );

      const unreadCountMap = new Map(
        unreadCounts.map((item) => [item.chatRoomId, item.unreadCount])
      );

      const refinedChats = chats.map((chat) => ({
        chatRoomId: chat.chatRoomId,
        isGroup: chat.isGroup,
        roomName: chat.roomName
          ? chat.roomName
          : chat.ChatRoomMember[0].user.username || "Unknown",
        oppositeUser: {
          userId: chat.ChatRoomMember[0].user.userId,
          username: chat.ChatRoomMember[0].user.username,
          profilePicture: chat.ChatRoomMember[0].user.profilePicture,
          userStatus: chat.ChatRoomMember[0].user.userStatus,
        },
        unreadCount: unreadCountMap.get(chat.chatRoomId) || 0,
        lastMessage: chat.lastMessage?.content,
        lastMessageSenderId: chat.lastMessage?.senderId,
        lastActivity: chat.lastActivity,
      }));

      return refinedChats;
    } catch (error) {
      console.log(error);
      throw new Error("Failed to get all chats");
    }
  };

  createChatRoom = async (userId1: string, userId2: string) => {
    try {
      const result = await this.chatRepository.createChat(userId1, userId2);
      return result;
    } catch (error) {
      console.log(
        error instanceof Error
          ? error.message
          : "error occured from createChatRom"
      );
      throw new Error("Could not create a chatRoom");
    }
  };
}
