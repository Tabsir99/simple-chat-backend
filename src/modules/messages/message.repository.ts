import prisma from "../../common/config/db";
import { Prisma } from "@prisma/client";
import { IMessage } from "./message.interface";
import { ChatRoomMemberInfo } from "../chats/chat.interface";

export const findMessagesByChatId = async (
  chatId: string,
  chatRoomMemberInfo: ChatRoomMemberInfo,
  cursor?: { messageId: string; createdAt: Date }
) => {
  const PrawMessages = prisma.message.findMany({
    where: {
      chatRoomId: chatId,
      createdAt: {
        ...(chatRoomMemberInfo.removedAt &&
          chatRoomMemberInfo.removedAt > chatRoomMemberInfo.joinedAt && {
            lt: chatRoomMemberInfo.removedAt,
          }),
        ...(chatRoomMemberInfo.chatClearedAt && {
          gt: chatRoomMemberInfo.chatClearedAt,
        }),
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    ...(cursor && {
      cursor: {
        messageId: cursor.messageId,
        createdAt: cursor.createdAt,
      },
    }),
    take: 50,
    select: {
      messageId: true,
      content: true,
      isDeleted: true,
      isEdited: true,
      createdAt: true,
      status: true,
      type: true,
      sender: {
        select: {
          username: true,
          profilePicture: true,
          userId: true,
        },
      },

      parentMessage: {
        select: {
          messageId: true,
          content: true,
          sender: {
            select: {
              username: true,
            },
          },
        },
      },

      MessageReaction: {
        select: {
          reactionType: true,
          userId: true,
        },
      },

      CallSession: {
        select: {
          callerId: true,
          isVideoCall: true,
          startTime: true,
          endTime: true,
          status: true,
        },
      },
    },
  });

  return PrawMessages;
};

export const createMessage = async (
  chatId: string,
  messageData: {
    messageId: string;
    sender: IMessage["sender"];
    content?: string;
    parentMessage?: IMessage["parentMessage"];
  },
  status: "delivered" | "sent" | "seen",
  attachment?: IMessage["attachment"],
  notReadBy?: string[]
) => {
  return await prisma.$transaction([
    prisma.message.create({
      data: {
        messageId: messageData.messageId,
        content: messageData.content || "",
        isDeleted: false,
        isEdited: false,

        status: status,
        // Relations that message table depends on
        chatRoomId: chatId,
        senderId: messageData.sender?.userId,
        parentMessageId: messageData.parentMessage?.messageId,

        attachment,

        // Relations that message table is depended on
      },
      select: { createdAt: true },
    }),

    prisma.chatRoom.update({
      where: {
        chatRoomId: chatId,
      },
      data: {
        lastActivity: new Date(),
        lastMessageId: messageData.messageId,
        ChatRoomMember: {
          updateMany: {
            where: { userId: { in: notReadBy } },
            data: { unreadCount: { increment: 1 } },
          },
        },
      },
      select: {
        lastActivity: true,
      },
    }),
  ]);
};

export const getChatroomMembers = async (chatId: string) => {
  return await prisma.chatRoomMember.findMany({
    where: {
      chatRoomId: chatId,
    },
    select: {
      user: {
        select: {
          userId: true,
        },
      },
    },
  });
};

export const updateMessage = async (messageId: string, newContent: string) => {
  return await prisma.message.update({
    where: { messageId: messageId },
    data: {
      content: newContent,
      isEdited: true,
    },
  });
};
export const deleteMessage = async (messageId: string) => {
  return await prisma.message.update({
    where: { messageId: messageId },
    data: {
      content: "",
      isDeleted: true,
    },
  });
};

export const toggleReaction = async (
  messageId: string,
  reaction: string,
  userId: string
) => {
  return await prisma.$executeRaw`
    WITH upsert AS (
      INSERT INTO "MessageReaction" ("messageId","reactionType","userId")
      VALUES (${messageId}::uuid,${reaction},${userId}::uuid)
      ON CONFLICT ("messageId","userId")
      DO UPDATE SET "reactionType" = ${reaction}
      WHERE "MessageReaction"."messageId" = ${messageId}::uuid
      AND "MessageReaction"."userId" = ${userId}::uuid
      AND "MessageReaction"."reactionType" != ${reaction}
      RETURNING 1
    )
    DELETE FROM "MessageReaction" AS mr
    WHERE mr."messageId" = ${messageId}::uuid
    AND mr."userId" = ${userId}::uuid
    AND mr."reactionType" = ${reaction}
    AND NOT EXISTS (SELECT 1 FROM upsert)
    `;
};

export const queryMessages = async (
  chatRoomId: string,
  query: string,
  memberInfo: {
    joinedAt: Date;
    removedAt: Date | null;
    chatClearedAt: Date | null;
  }
) => {
  const res = await prisma.$queryRaw<IMessage[]>`
    SELECT m."messageId",m."content",m."createdAt",u."username",u."profilePicture",
    ts_rank_cd(m.search_vector, to_tsquery('english',${query})) AS rank
    FROM "Message" m
    INNER JOIN "User" u
    ON m."senderId" = u."userId"
    WHERE m."chatRoomId" = ${chatRoomId}::uuid
    ${
      memberInfo.chatClearedAt
        ? Prisma.sql`AND m."createdAt" > ${memberInfo.chatClearedAt}`
        : Prisma.sql``
    }
    ${
      memberInfo.removedAt
        ? Prisma.sql`AND m."createdAt" < ${memberInfo.removedAt}`
        : Prisma.sql``
    }
    AND m.search_vector @@ to_tsquery('english',${query})
    ORDER BY rank DESC
    `;

  return res;
};

export const updateMessageRead = async (
  chatRoomId: string,
  userId: string[],
  messageId: string
) => {
  return await prisma.chatRoomMember.updateMany({
    where: {
      chatRoomId: chatRoomId,
      userId: { in: userId },
    },
    data: { unreadCount: 0, lastReadMessageId: messageId },
  });
};
