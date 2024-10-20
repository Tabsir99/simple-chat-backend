import { injectable } from "inversify";
import prisma from "../../common/config/db";
import { IMessage, IRawMessage } from "./message.interface";

@injectable()
export class MessageRepository {
  async findMessagesByChatId(chatId: string): Promise<IRawMessage[]> {
    return await prisma.message.findMany({
      where: {
        chatRoomId: chatId,
      },
      orderBy: {
        createdAt: "asc"
      },
      select: {
        messageId: true,
        content: true,
        isDeleted: true,
        createdAt: true,
        status: true,
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
        MessageReceipt: {
          select: {
            lastReadMessageId: true,
            chatRoomMember: {
              select: {
                user: {
                  select: {
                    userId: true,
                    username: true,
                    profilePicture: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async createMessage(chatId: string, messageData: IMessage,status: "delivered"|"sent"|"read") {
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
          senderId: messageData.sender.senderId,
          parentMessageId: messageData.parentMessage?.messageId,

          // Relations that message table is depended on
          // Attachment: {createMany: {data: messageData.attachments}},
          // MessageReceipt: {
          //   createMany: {
          //     data: messageData.readBy.map((recipt) => ({
          //       chatRoomId: chatId,
          //       userId: recipt.readerId,
          //     })),
          //   },
          // },
        },
        select: { createdAt: true },
      }),

      prisma.chatRoom.update({
        where: {
          chatRoomId: chatId
        },
        data: {
          lastActivity: new Date(),
          lastMessageId: messageData.messageId,
        }
      })
    ]);
  }

  getChatroomMembers = async (chatId: string, userId: string) => {
    return await prisma.chatRoomMember.findMany({
      where: {
        chatRoomId: chatId,
        NOT: { userId: userId },
      },
      select: {
        user: {
          select: {
            userId: true,
            profilePicture: true,
            username: true
          }
        }
      },
    });
  };

  createMessageRecipt = async (chatRoomId: string, userId: string, status: "read" | "delivered" | "sent") => {
    return await prisma.$transaction(async (tx) => {
      const messageId = await tx.message.findFirst({
        where: {
          chatRoomId: chatRoomId,
        },
        orderBy: {
          createdAt: "desc"
        },
        take: 1,
        select: {
          messageId: true,
          chatRoom: {select: {isGroup: true}},
        }
      })
      
      if(messageId){
       await tx.message.update({
          where: {
            messageId: messageId.messageId
          },
          data: {
            status: status,
          }
        })
      return await tx.messageReceipt.upsert({
        where: {
          userId_chatRoomId: {chatRoomId: chatRoomId, userId: userId}
        },
        create: {
            chatRoomId: chatRoomId,
            userId: userId,
            lastReadMessageId: messageId.messageId
        },
        update: {
          lastReadMessageId: messageId.messageId,
        },
        select: {
          lastReadMessageId: true
        }
      })}
      else{
        throw new Error("No message in the specified chatroom")
      }
    })
  }
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
