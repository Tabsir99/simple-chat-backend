import { injectable } from "inversify";
import prisma from "../../common/config/db";

@injectable()
export default class ChatRepository {
  findChatsByUserId = async (userId: string) => {
    return await prisma.chatRoom.findMany({
      where: {
        ChatRoomMember: {
          some: {
            userId: userId,
          },
        },
      },
      select: {
        isGroup: true,
        chatRoomId: true,
        lastMessage: {
          select: {
            content: true,
            senderId: true,
            
          },
        },
        roomName: true,
        lastActivity: true,
        ChatRoomMember: {
          where: {
            userId: {
              not: userId,
            },
          },
          select: {
            user: {
              select: {
                userId: true,
                username: true,
                profilePicture: true,
                userStatus: true
              },
            },
          },
          take: 1,
        },
      },
    });
  };

  findUnreadCountByUserId = async (userId: string) => {

    return await prisma.chatRoomMember.findMany({
      where: {
        userId: userId
      },
      select: {
        chatRoomId: true,
        unreadCount: true
      }
    })
  }

  createChat = async (userId1: string, userId2: string) => {
    
    return await prisma.$transaction(async (prisma) => {
      const chatRoom = await prisma.chatRoom.create({
        data: {},
        select: {
          chatRoomId: true,
          
        },
      });
      const chatRoomMembers = await prisma.chatRoomMember.createMany({
        data: [
          {
            chatRoomId: chatRoom.chatRoomId,
            userId: userId1,
            userRole: "member",

          },
          {
            chatRoomId: chatRoom.chatRoomId,
            userId: userId2,
            userRole: "member",
          },
        ],
      });

      return { chatRoom, chatRoomMembers }
    });
  };
}
