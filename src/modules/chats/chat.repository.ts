import { injectable } from "inversify";
import prisma from "../../common/config/db";
import { randomUUID } from "crypto";
import { ChatRoomHead } from "./chats.interfaces";

@injectable()
export default class ChatRepository {
  findChatsByUserId = async (userId: string) => {
    const res = await prisma.$queryRaw<ChatRoomHead[]>`
          WITH LastMessages AS (
          SELECT DISTINCT ON (m."chatRoomId")
              m."chatRoomId",
              m."content" AS "messageContent",
              m."createdAt" AS "createdAt",
              u."userId" AS "senderUserId",
              u."username" AS "senderUsername",
              atch."fileType" AS "fileType"
          FROM "Message" m
          LEFT JOIN "User" u ON m."senderId" = u."userId"
          LEFT JOIN "Attachment" atch ON m."messageId" = atch."messageId"
          JOIN "ChatRoomMember" crm ON m."chatRoomId" = crm."chatRoomId" AND crm."userId" = ${userId}::uuid
          WHERE (crm."removedAt" IS NULL OR m."createdAt" < crm."removedAt")
          ORDER BY m."chatRoomId", m."createdAt" DESC
      ),
      OppositeMembers AS (
          SELECT DISTINCT ON (crm."chatRoomId")
              crm."chatRoomId",
              u."userId" AS "oppositeUserId",
              u."username" AS "oppositeUsername",
              u."userStatus" AS "oppositeUserStatus",
              u."profilePicture" AS "oppositeProfilePicture"
          FROM "ChatRoomMember" crm
          JOIN "User" u ON crm."userId" = u."userId"
          WHERE crm."userId" != ${userId}::uuid
      )
      SELECT 
          cr."chatRoomId",
          cr."isGroup",
          cr."roomName",
          cr."roomImage",
          cr."createdBy",
          cr."lastActivity",
          cr."blockedUserId",
          lm."messageContent",
          lm."senderUserId",
          lm."senderUsername",
          lm."fileType",
          om."oppositeUserId",
          om."oppositeUsername",
          om."oppositeUserStatus",
          om."oppositeProfilePicture",
          crm."unreadCount",
          crm."removedAt",
          crm."chatClearedAt"
      FROM "ChatRoom" cr
      JOIN "ChatRoomMember" crm ON cr."chatRoomId" = crm."chatRoomId"
      LEFT JOIN LastMessages lm ON cr."chatRoomId" = lm."chatRoomId"
      LEFT JOIN OppositeMembers om ON cr."chatRoomId" = om."chatRoomId"
      WHERE crm."userId" = ${userId}::uuid
      ORDER BY cr."lastActivity" DESC;
    `;

    return res;
  };

  findUserChatroomStatus = async (userId: string) => {
    const status = await prisma.chatRoomMember.findMany({
      where: {
        userId: userId,
      },
      select: {
        chatRoomId: true,
        unreadCount: true,
        removedAt: true,
      },
    });

    return status;
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
          createdBy: isGroup
            ? isUser1Creator
              ? users[0].userId
              : users[1].userId
            : null,
          roomName: `${users[0].username},${users[1].username}`,
          ChatRoomMember: {
            createMany: {
              data: [
                {
                  userId: users[0].userId,
                  userRole: isUser1Creator ? "admin" : "member",
                },
                {
                  userId: users[1].userId,
                  userRole: isUser1Creator ? "member" : "admin",
                },
              ],
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
          content: isUser1Creator
            ? `${
                users[0].username
              } created the group. Time: ${new Date().toDateString()}`
            : `${
                users[1].username
              } created the group. Time: ${new Date().toDateString()}`,
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

  getChatRoomMembers = async (chatRoomId: string) => {
    return await prisma.chatRoom.findUnique({
      where: {
        chatRoomId: chatRoomId,
      },
      select: {
        createdBy: true,
        ChatRoomMember: {
          select: {
            removedAt: true,
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
                fileName: true,
                fileSize: true,
              },
            },
          },
        },
      },
    });
  };

  getChatRoomListByUserId = async (userId: string) => {
    const res = await prisma.$queryRaw<{ chatRoomId: string }[]>`
    SELECT cr."chatRoomId"
    FROM "ChatRoomMember" crm
    JOIN "ChatRoom" cr ON crm."chatRoomId" = cr."chatRoomId"
    WHERE crm."userId" = ${userId}::uuid
    AND (crm."removedAt" IS NULL OR crm."joinedAt" > crm."removedAt")
    `;
    return res;
  };

  updateGroupMemberRole = async (
    chatRoomId: string,
    userId: string,
    userRole: "admin" | "member"
  ) => {
    return await prisma.chatRoomMember.update({
      where: {
        chatRoomId_userId: {
          chatRoomId: chatRoomId,
          userId: userId,
        },
        userRole: {
          not: userRole,
        },
      },
      data: {
        userRole: userRole,
      },
      select: {
        userRole: true,
      },
    });
  };

  updateGroupMember = async (
    chatRoomId: string,
    userId: string,
    nickname: string
  ) => {
    return await prisma.chatRoomMember.update({
      where: {
        chatRoomId_userId: {
          chatRoomId: chatRoomId,
          userId: userId,
        },
      },
      data: {
        nickName: nickname,
      },
      select: {
        nickName: true,
      },
    });
  };

  findChatRoom = async (userId: string, chatRoomId: string) => {
    return await prisma.chatRoomMember.findUnique({
      where: {
        chatRoomId_userId: {
          chatRoomId: chatRoomId,
          userId: userId,
        },
      },
      select: {
        chatClearedAt: true,
        joinedAt: true,
        removedAt: true,
      },
    });
  };

  deleteGroupMember = async (
    chatRoomId: string,
    userId: string,
    currentUserId: string
  ) => {
    const result = await prisma.$transaction(async (tx) => {
     const res = await prisma.chatRoomMember.findMany({
        where: {
          chatRoomId: chatRoomId,
          OR: [{ userId: userId }, { userId: currentUserId }],
        },
        select: {
          userRole: true,
          user: {
            select: { username: true, userId: true },
          },
        },
        take: 2,
  
      });

      const sortedRes = res.sort((a, b) => 
        a.user.userId === currentUserId ? -1 : 1
      );
      if (sortedRes[0]?.userRole !== "admin") {
        return false;
      }
     const message = await prisma.message.create({
        data: {
          content: `${sortedRes[0].user.username} removed ${sortedRes[1].user.username} from the group.`,
          type: "system",
          chatRoomId: chatRoomId,
        },
        select: {
          content: true,
          createdAt: true,
          messageId: true,
        }
      });
      await prisma.chatRoomMember.update({
        where: {
          chatRoomId_userId: {
            chatRoomId: chatRoomId,
            userId: userId,
          },
          removedAt: null,
        },
        data: {
          removedAt: new Date(),
        },
      });

      return message
    })
    return result
  };

  clearChat = async (chatRoomId: string, userId: string) => {
    return await prisma.chatRoomMember.update({
      where: {
        chatRoomId_userId: {
          chatRoomId: chatRoomId,
          userId: userId,
        },
      },
      data: {
        chatClearedAt: new Date(),
        unreadCount: 0,
      },
      select: {
        chatClearedAt: true,
      },
    });
  };
}
