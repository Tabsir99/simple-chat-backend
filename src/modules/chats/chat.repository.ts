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
              },
            },
          },
        },
      },
      orderBy: {lastActivity: "desc"}
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
    return await prisma.$transaction(async (prisma) => {
      const isUser1Creator = users[0].isCreator;
      const chatRoom = await prisma.chatRoom.create({
        data: {
          isGroup: isGroup,
          createdBy: isUser1Creator ? users[0].userId : users[1].userId,
          roomName: `${users[0].username},${users[1].username}`,
        },
        select: {
          chatRoomId: true,
          isGroup: true,
          roomName: true,
          createdBy: true,
        },
      });
      const chatRoomMembers = await prisma.chatRoomMember.createMany({
        data: [
          {
            chatRoomId: chatRoom.chatRoomId,
            userId: users[0].userId,
            userRole: isUser1Creator ? "admin" : "member",
          },
          {
            chatRoomId: chatRoom.chatRoomId,
            userId: users[1].userId,
            userRole: isUser1Creator ? "member" : "admin",
          },
        ],
        // skipDuplicates: true
      });

      return { chatRoom, chatRoomMembers };
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
  }

  getChatRoomListByUserId = async (userId: string) => {
    return await prisma.chatRoomMember.findMany({
      where:{
        userId: userId
      },
      select: {
        chatRoom: {
          select: {
            chatRoomId: true
          }
        }
      }
    })
  }
}
