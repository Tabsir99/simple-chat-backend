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
        roomName: chat.roomName || chat.ChatRoomMember[0].user.username,
        roomImage: chat.roomImage || chat.ChatRoomMember[0].user.profilePicture,

        roomStatus: chat.isGroup
          ? "online"
          : chat.ChatRoomMember[0].user.userStatus,
        privateChatMemberId:
          !chat.isGroup && chat.ChatRoomMember[0].user.userId,

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
      console.log(
        error instanceof Error
          ? error.message
          : "error occured from createChatRom"
      );
      throw new Error("Could not create a chatRoom");
    }
  };

  getChatRoomDetails = async (chatRoomId: string, fetchAll: boolean) => {
    try {
      if (fetchAll) {
        const result = await this.chatRepository.getChatRoomDetails(chatRoomId);
        const formattedResult = {
          media: result?.Messages.flatMap((message) =>
            message.Attachment.map((attachment) => ({
              fileType: attachment.fileType,
              fileName: attachment.fileUrl,
            }))
          ),
          members: result?.ChatRoomMember.map((member) => {
            return {
              memberName: member.user.username,
              isAdmin: member.userRole === "admin",
              memberPicture: member.user.profilePicture,
              memberId: member.user.userId,
              memberStatus: member.user.userStatus,
              memberNickname: member.nickName,
              isCreator: result.createdBy === member.user.userId,
            };
          }),
        };
        return formattedResult;
      } else {
        const result = await this.chatRepository.getChatRoomMedia(chatRoomId);
        const formattedResult = result?.Messages.flatMap((message) =>
          message.Attachment.map((attachment) => ({
            fileType: attachment.fileType,
            fileName: attachment.fileUrl,
          }))
        );

        return formattedResult;
      }
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  getChatRoomList = async (userId: string) => {
    const chatRoomList = await this.chatRepository.getChatRoomListByUserId(userId)
    return chatRoomList.map(chatRoom => chatRoom.chatRoom.chatRoomId)
  }
}
