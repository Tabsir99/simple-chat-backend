import { injectable } from "inversify";
import prisma from "../../common/config/db";
import { IMessage, IRawMessage } from "./message.interface";
import { $Enums } from "@prisma/client";

@injectable()
export class MessageRepository {
  async findMessagesByChatId(
    chatId: string,
    currentUserId: string
  ): Promise<{
    rawMessages: IRawMessage[];
    oppositeMember: { userStatus: $Enums.UserStatus; lastActive: Date };
  }> {
    const PoppositeMember = prisma.chatRoomMember.findMany({
      where: {
        chatRoomId: chatId,
        userId: { not: currentUserId },
        chatRoom: { isGroup: false },
      },
      select: { user: { select: { userStatus: true, lastActive: true } } },
      take: 1,
    });

    const PrawMessages = prisma.message.findMany({
      where: {
        chatRoomId: chatId,
      },
      orderBy: {
        createdAt: "asc",
      },
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
            fileUrl: true,
          },
        },
      },
    });

    const [rawMessages, oppositeMember] = await Promise.all([
      PrawMessages,
      PoppositeMember,
    ]);

    return { rawMessages, oppositeMember: oppositeMember[0].user };
  }

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
    messageData: IMessage,
    status: "delivered" | "sent" | "seen",
    notReadBy?: string[]
  ) {
    return await prisma.$transaction([
      prisma.message.create({
        data: {
          messageId: messageData.messageId,
          content: messageData.content,
          isDeleted: messageData.isDeleted,
          isEdited: messageData.isEdited,

          status: status,
          // Relations that message table depends on
          chatRoomId: chatId,
          senderId: messageData.sender?.userId,
          parentMessageId: messageData.parentMessage?.messageId,

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

  async deleteMessage(messageId: string) {
    // return await prisma.message.delete({ });
  }

  async addReaction(messageId: string, reactionData: any) {
    return await prisma.messageReaction.create({
      data: { messageId, ...reactionData },
    });
  }

  async deleteReaction(reactionId: string) {
    // return await prisma.messageReaction.delete({ where: {createdAt: } });
  }
}
