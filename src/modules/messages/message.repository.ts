import { injectable } from "inversify";
import prisma from "../../common/config/db";
import {
  Attachment,
  FilterMessageOption,
  IMessage,
  IRawMessage,
} from "./message.interface";
import { $Enums } from "@prisma/client";
import { getFileTypeFromMimeType } from "../../common/utils/utils";
import { randomUUID } from "crypto";

@injectable()
export class MessageRepository {
  async findMessagesByChatId(
    chatId: string,
    currentUserId: string,
    chatRoomMemberInfo: FilterMessageOption
  ): Promise<{
    rawMessages: IRawMessage[];
    oppositeMember:
      | { userStatus: $Enums.UserStatus; lastActive: Date }
      | undefined;
  }> {
    const PoppositeMember = prisma.chatRoomMember.findFirst({
      where: {
        chatRoomId: chatId,
        userId: { not: currentUserId },
        chatRoom: { isGroup: false },
      },
      select: { user: { select: { userStatus: true, lastActive: true } } },
    });

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
      take: 50,
      select: {
        messageId: true,
        content: true,
        isDeleted: true,
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

        Attachment: {
          select: {
            filePath: true,
            fileName: true,
            fileSize: true,
            fileType: true,
          },
        },
      },
    });

    const [rawMessages, oppositeMember] = await Promise.all([
      PrawMessages,
      PoppositeMember,
    ]);
    return { rawMessages, oppositeMember: oppositeMember?.user };
  }

  // cursor will always be available for this method
  findOlderMessages = async (
    chatId: string,
    chatRoomMemberInfo: FilterMessageOption,
    cursor: { messageId: string; createdAt: Date }
  ): Promise<IRawMessage[]> => {
    return await prisma.message.findMany({
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
      orderBy: [{ createdAt: "desc" }, { messageId: "desc" }],
      cursor: {
        createdAt: cursor.createdAt,
        messageId: cursor.messageId,
      },
      skip: 1,
      take: 50,
      select: {
        messageId: true,
        content: true,
        isDeleted: true,
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

        Attachment: {
          select: {
            filePath: true,
            fileName: true,
            fileSize: true,
            fileType: true,
          },
        },
      },
    });
  };

  async findAllReciptsByChatId(chatId: string) {
    return await prisma.messageReceipt.findMany({
      where: {
        chatRoomId: chatId,
      },
      select: {
        chatRoomMember: {
          select: {
            user: {
              select: {
                userId: true,
                profilePicture: true,
                username: true,
              },
            },
          },
        },
        lastReadMessageId: true,
      },
    });
  }

  async createMessage(
    chatId: string,
    messageData:  {
      messageId: string;
      sender: IMessage["sender"];
      content?: string;
      parentMessage?: IMessage["parentMessage"];
    },
    status: "delivered" | "sent" | "seen",
    attachment?: Attachment,
    notReadBy?: string[]
  ) {
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

          ...(attachment && {
            Attachment: {
              create: {
                fileName: attachment.fileName,
                filePath: attachment.filePath,
                fileSize: attachment.fileSize,
                fileType: attachment.fileType as $Enums.FileType,
                chatRoomId: chatId,
              },
            },
          }),

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
          lastActivity: true
        }
      }),
    ]);
  }

  getChatroomMembers = async (chatId: string) => {
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

  updateMessageRecipt = async (chatRoomId: string, userIds: string[]) => {
    return await prisma.$transaction(async (tx) => {
      const lastMessage = await tx.message.findFirst({
        where: {
          chatRoomId: chatRoomId,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
        select: {
          messageId: true,
          chatRoom: { select: { isGroup: true } },
        },
      });

      if (lastMessage) {
        if (userIds.length === 1) {
          await tx.chatRoomMember.update({
            where: {
              chatRoomId_userId: {
                userId: userIds[0],
                chatRoomId: chatRoomId,
              },
            },
            data: {
              unreadCount: 0,
              MessageReceipt: {
                update: {
                  where: {
                    userId_chatRoomId: {
                      chatRoomId: chatRoomId,
                      userId: userIds[0],
                    },
                  },
                  data: { lastReadMessageId: lastMessage.messageId },
                },
              },
            },
          });
        } else {
          await tx.messageReceipt.updateMany({
            where: {
              chatRoomId: chatRoomId,
              userId: {
                in: userIds,
              },
            },
            data: {
              lastReadMessageId: lastMessage.messageId,
            },
          });
        }

        return lastMessage.messageId;
      } else {
        throw new Error("No message in the specified chatroom");
      }
    });
  };

  async updateMessage(messageId: string, updateData: any) {
    // return await prisma.message.update({
    //     where: { id: messageId },
    //     data: updateData,
    // });
  }


  async toggleReaction(
    messageId: string,
    reactionType: string,
    userId: string
  ) {
    return await prisma.$executeRaw`
    WITH upsert AS (
      INSERT INTO "MessageReaction" ("messageId","reactionType","userId")
      VALUES (${messageId}::uuid,${reactionType},${userId}::uuid)
      ON CONFLICT ("messageId","userId")
      DO UPDATE SET "reactionType" = ${reactionType}
      WHERE "MessageReaction"."messageId" = ${messageId}::uuid
      AND "MessageReaction"."userId" = ${userId}::uuid
      AND "MessageReaction"."reactionType" != ${reactionType}
      RETURNING 1
    )
    DELETE FROM "MessageReaction" AS mr
    WHERE mr."messageId" = ${messageId}::uuid
    AND mr."userId" = ${userId}::uuid
    AND mr."reactionType" = ${reactionType}
    AND NOT EXISTS (SELECT 1 FROM upsert)
    `;
  }
}
