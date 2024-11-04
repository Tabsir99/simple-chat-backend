import { injectable } from "inversify";
import prisma from "../../common/config/db";
import { randomUUID } from "crypto";
import { ChatRoomHead } from "./chats.interfaces";
import { Prisma } from "@prisma/client";

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
    const res = await prisma.chatRoomMember.findMany({
      where: {
        userId: userId,
        removedAt: null,
      },
      select: {
        chatRoomId: true
      }
    })
    return res;
  };

  updateGroupMemberRole = async (
    chatRoomId: string,
    userId: string,
    userRole: "admin" | "member",
    username: string,
    currentUsername: string
  ) => {
    const uuid = randomUUID();
    const res = await prisma.chatRoomMember.update({
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
        chatRoom: {
          update: {
            Messages: {
              create: {
                content: `${currentUsername} has ${
                  userRole === "admin" ? "promoted" : "removed"
                } ${username} ${
                  userRole === "admin" ? "to admin" : "from admin role"
                } `,
                messageId: uuid,
                type: "system",
                status: "delivered",
              },
            },
          },
        },
      },
      select: {
        userRole: true,
      },
    });
    return {
      messageId: uuid,
      content: `${currentUsername} has ${
        userRole === "admin" ? "promoted" : "removed"
      } ${username} ${userRole === "admin" ? "to admin" : "from admin role"} `,
      createdAt: new Date(),
    };
  };

  updateGroupMember = async (
    chatRoomId: string,
    userId: string,
    username: string,
    nickname: string,
    currentUserName: string
  ) => {
    const uuid = randomUUID();
    await prisma.chatRoomMember.update({
      where: {
        chatRoomId_userId: {
          chatRoomId: chatRoomId,
          userId: userId,
        },
      },
      data: {
        nickName: nickname,
        chatRoom: {
          update: {
            Messages: {
              create: {
                content: `${currentUserName} changed ${username} nickname to '${nickname}'`,
                messageId: uuid,
                type: "system",
                status: "delivered",
              },
            },
          },
        },
      },
      select: {
        nickName: true,
      },
    });

    return {
      messageId: uuid,
      content: `${currentUserName} changed ${username} nickname to '${nickname}'`,
      createdAt: new Date(),
    };
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
    currentUserId: string,
    username: string,
    currentUsername: string
  ) => {
    const result = await prisma.$transaction(async (tx) => {
      const message = await tx.message.create({
        data: {
          content: `${currentUsername} removed ${username} from the group.`,
          type: "system",
          chatRoomId: chatRoomId,
        },
        select: {
          content: true,
          createdAt: true,
          messageId: true,
        },
      });
      await tx.chatRoomMember.update({
        where: {
          chatRoomId_userId: {
            chatRoomId: chatRoomId,
            userId: userId,
          },
        },
        data: {
          removedAt: new Date(),
        },
      });

      return message;
    });
    return result;
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

  addGroupMember = async (
    data: { chatRoomId: string; users: { userId: string; username: string }[] },
    currentUsername: string
  ) => {
    let messageContent = "";
    if (data.users.length === 1) {
      messageContent = `${currentUsername} added ${data.users[0].username} to the group`;
    } else if (data.users.length === 2) {
      messageContent = `${currentUsername} added ${data.users[0].username} and ${data.users[1].username} to the group`;
    } else {
      messageContent = `${currentUsername} added ${data.users[0].username}, ${
        data.users[1].username
      } and ${data.users.length - 2} other person${
        data.users.length - 2 > 1 ? "s" : ""
      } to the group`;
    }

    const values = data.users.map(
      (user) => Prisma.sql`(${data.chatRoomId}::uuid, ${user.userId}::uuid)`
    );

    const uuid = randomUUID()
    const res = await prisma.$executeRaw`
    WITH inserted_members AS (
      INSERT INTO "ChatRoomMember" ("chatRoomId", "userId")
      VALUES ${Prisma.join(values)}
      ON CONFLICT ("chatRoomId", "userId") 
      DO UPDATE SET
        "joinedAt" = CURRENT_TIMESTAMP(3),
        "removedAt" = NULL,
        "unreadCount" = 0,
        "userRole" = 'member'
      RETURNING "userId"
    ),
    inserted_message AS (
      INSERT INTO "Message" ("messageId", "chatRoomId", "content", "type")
      VALUES (
        ${uuid}::uuid, 
        ${data.chatRoomId}::uuid,
        ${messageContent},
        'system'
      )
      RETURNING "messageId"
    )
    UPDATE "ChatRoom"
    SET "lastMessageId" = (SELECT "messageId" FROM inserted_message)
    WHERE "chatRoomId" = ${data.chatRoomId}::uuid
  `;

    return {messageId: uuid, content: messageContent, createdAt: new Date()};
  };

  findUserPermission = async (userId: string, chatRoomId: string) => {
    return await prisma.chatRoomMember.findFirst({
      where: {
        chatRoomId: chatRoomId,
        userId: userId,
      },
      select: {
        userRole: true,
        joinedAt: true,
        chatClearedAt: true,
        removedAt: true,
        user: {
          select: { username: true },
        },
      },
    });
  };
}
