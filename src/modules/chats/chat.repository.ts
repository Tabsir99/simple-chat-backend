import { injectable } from "inversify";
import prisma from "../../common/config/db";
import { randomUUID } from "crypto";

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
        createdBy: true,
        roomImage: true,

        ChatRoomMember: {
          where: {
            NOT: {
              userId: userId,
            },
            
          },
          select: {
            user: {
              select: {
                userStatus: true,
                username: true,
                userId: true,
                profilePicture: true
              },
            },
          },
          take: 1
        },
      },
      orderBy: { lastActivity: "desc" },
    });
  };

  findUnreadCountByUserId = async (userId: string) => {
    return await prisma.chatRoomMember.findMany({
      where: {
        userId: userId,
      },
      select: {
        chatRoomId: true,
        unreadCount: true,
      },
    });
  };

  createChat = async (
    users: {
      isCreator: boolean;
      userId: string;
      username: string;
    }[],
    isGroup: boolean
  ) => {
    return await prisma.$transaction(async (tx) => {
      const isUser1Creator = users[0].isCreator;

      const chatRoom = await tx.chatRoom.create({
        data: {
          isGroup: isGroup,
          createdBy: isGroup?(isUser1Creator ? users[0].userId : users[1].userId):null,
          roomName: `${users[0].username},${users[1].username}`,
          ChatRoomMember: {
            createMany: {
              data: [{ userId: users[0].userId }, { userId: users[0].userId }],
            },
          },
        },
      
        select: {
          chatRoomId: true,
          isGroup: true,
          roomName: true,
          createdBy: true,
          
        },
      });

      await tx.message.create({
        data: {
          content: "Welcome to the Chat!",
          type: "system",
          chatRoomId: chatRoom.chatRoomId,
          LastMessageFor: { connect: { chatRoomId: chatRoom.chatRoomId } },
          MessageReceipt: {
            createMany: {
              data: [
                { chatRoomId: chatRoom.chatRoomId, userId: users[0].userId },
                { chatRoomId: chatRoom.chatRoomId, userId: users[1].userId },
              ],
            },
          },
        },
      });

      return { chatRoom };
    });
  };

  getChatRoomDetails = async (chatRoomId: string) => {
    return await prisma.chatRoom.findUnique({
      where: {
        chatRoomId: chatRoomId,
      },
      select: {
        createdBy: true,
        ChatRoomMember: {
          select: {
            userRole: true,
            nickName: true,
            user: {
              select: {
                username: true,
                userId: true,
                profilePicture: true,
                userStatus: true,
              },
            },
          },
        },
        Messages: {
          select: {
            Attachment: {
              select: {
                fileType: true,
                fileUrl: true,
              },
            },
          },
        },
      },
    });
  };

  getChatRoomMedia = async (chatRoomId: string) => {
    return await prisma.chatRoom.findUnique({
      where: {
        chatRoomId: chatRoomId,
      },
      select: {
        Messages: {
          select: {
            Attachment: {
              select: {
                fileType: true,
                fileUrl: true,
              },
            },
          },
        },
      },
    });
  };

  getChatRoomListByUserId = async (userId: string) => {
    return await prisma.chatRoomMember.findMany({
      where: {
        userId: userId,
      },
      select: {
        chatRoom: {
          select: {
            chatRoomId: true,
          },
        },
      },
    });
  };
}
