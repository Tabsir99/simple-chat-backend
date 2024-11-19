import { injectable } from "inversify";
import prisma from "../../common/config/db";
import { randomUUID } from "crypto";
import { CallData, ChatRoomHead } from "./chats.interfaces";
import { Prisma } from "@prisma/client";
import { ChatError } from "../../common/errors/chatErrors";

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
              atch."fileType" AS "fileType",
              c."callerId" AS "callerId",
              c."status" AS "callStatus"
          FROM "Message" m
          LEFT JOIN "User" u ON m."senderId" = u."userId"
          LEFT JOIN "Attachment" atch ON m."messageId" = atch."messageId"
          LEFT JOIN "CallSession" c ON m."messageId" = c."messageId"
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
          JOIN "ChatRoom" chat ON crm."chatRoomId" = chat."chatRoomId"
          WHERE crm."userId" != ${userId}::uuid
          AND chat."isGroup" = ${false}
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
          lm."callerId",
          lm."callStatus",
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
    groupName: string
  ) => {
    return await prisma.$transaction(async (tx) => {
      const defaultProfie = `https://storage.googleapis.com/simple-chat-cg.appspot.com/avatars/default/default6.svg`;
      const isUser1Creator = users[0].isCreator;

      const chatRoom = await tx.chatRoom.create({
        data: {
          isGroup: true,
          createdBy: isUser1Creator ? users[0].userId : users[1].userId,
          roomName: groupName || `${users[0].username},${users[1].username}`,
          roomImage: defaultProfie,
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
          roomImage: true,
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
        chatRoomId: true,
      },
    });
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
    const willLeaveGroup = userId === currentUserId;
    const messageContent = `${currentUsername} ${
      willLeaveGroup ? "left" : "removed"
    } ${willLeaveGroup ? "" : username + " from "}the group`;

    const result = await prisma.$transaction(async (tx) => {
      const message = await tx.message.create({
        data: {
          content: messageContent,
          type: "system",
          chatRoomId: chatRoomId,
        },
        select: {
          content: true,
          createdAt: true,
          messageId: true,
        },
      });

      const removalTime = new Date(message.createdAt.getTime() + 50);
      await tx.$executeRaw`
          UPDATE "ChatRoomMember"
          SET 
              "removedAt" = ${removalTime},
              "unreadCount" = 0,
              "nickName" = null,
              "userRole" = 'member'
          WHERE 
              "chatRoomId" = ${chatRoomId}::uuid
              AND "userId" = ${userId}::uuid
`;
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

    let chatRoomMemberValues: Prisma.Sql[] = [];
    let userIds: string[] = [];
    const uuid = randomUUID();

    for (let i = 0; i < data.users.length; i++) {
      chatRoomMemberValues.push(
        Prisma.sql`(${data.chatRoomId}::uuid, ${data.users[i].userId}::uuid)`
      );
      userIds.push(data.users[i].userId);
    }

    await prisma.$transaction(async (tx) => {
      const existingValidMembers = await tx.chatRoomMember.findMany({
        where: {
          chatRoomId: data.chatRoomId,
          userId: { in: userIds },
        },
        select: {
          removedAt: true,
        },
      });

      if (existingValidMembers.find((m) => m.removedAt === null)) {
        throw ChatError.memberAlreadyExists();
      }

      await tx.$executeRaw`
      WITH inserted_members AS (
      INSERT INTO "ChatRoomMember" ("chatRoomId", "userId")
      VALUES ${Prisma.join(chatRoomMemberValues)}
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
    ),
    message_receipt AS (
      INSERT INTO "MessageReceipt" ("userId","chatRoomId","lastReadMessageId")
      SELECT m."userId", ${data.chatRoomId}::uuid, msg."messageId"
      FROM inserted_members m
      CROSS JOIN inserted_message msg
      ON CONFLICT ("userId","chatRoomId")
      DO NOTHING
      RETURNING "userId"
    )
    UPDATE "ChatRoom"
    SET "lastMessageId" = (SELECT "messageId" FROM inserted_message)
    WHERE "chatRoomId" = ${data.chatRoomId}::uuid
  `;
    });

    return { messageId: uuid, content: messageContent, createdAt: new Date() };
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

  updateChat = async (
    chatRoomId: string,
    content: string,
    data?: string,
    url?: string
  ) => {
    return await prisma.$transaction(async (tx) => {
      const newMessage = await tx.message.create({
        data: {
          content: content,
          type: "system",
          chatRoomId: chatRoomId,
        },
        select: {
          messageId: true,
          createdAt: true,
          content: true,
        },
      });

      await tx.chatRoom.update({
        where: {
          chatRoomId: chatRoomId,
        },
        data: {
          ...(data && { roomName: data }),
          ...(url && { roomImage: url }),
          lastActivity: new Date(),
          lastMessageId: newMessage.messageId,
        },
      });

      return newMessage;
    });
  };

  createCallMessage = async (callData: CallData) => {
    return await prisma.message.create({
      data: {
        content: "",
        chatRoomId: callData.chatRoomId,
        type: "call",

        CallSession: {
          create: {
            chatRoomId: callData.chatRoomId,
            isVideoCall: callData.isVideoCall,
            status: callData.status as any,
            callerId: callData.callerId,
            startTime: callData.startTime!,
            endTime: callData.endTime!,
            callId: callData.callId,
            CallParticipant: {
              createMany: {
                data: callData.participants as any,
              },
            },
          },
        },
        LastMessageFor: { connect: { chatRoomId: callData.chatRoomId } },
      },
    });
  };
}
