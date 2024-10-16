import { injectable } from "inversify";
import prisma from "../../common/config/db";
import { IRawMessage } from "./message.interface";

@injectable()
export class MessageRepository {
  async findMessagesByChatId(chatId: string): Promise<IRawMessage[]> {
    return await prisma.message.findMany({
      where: {
        chatRoomId: chatId,
      },
      select: {
        messageId: true,
        content: true,
        isDeleted: true,
        createdAt: true,
        sender: {
          select: {
            username: true,
            profilePicture: true,
            userId: true
          }
        },

        parentMessage: {
          select: {
            messageId: true,
            content: true,
            sender: {
              select: {
                username: true
              }
            }
          }
        },

        MessageReaction: {
          select: {
            reactionType: true,
            userId: true
          }
        },

        Attachment: {
          select: {
            fileUrl: true,

          }
        }
        ,
        MessageReceipt: {
          select: {
            lastReadMessageId: true,
            chatRoomMember: {
              select: {
                user: {
                  select: {
                    userId: true,
                    username: true,
                    profilePicture: true
                  }
                }
              }
            }
          }
        }
      },

    });
  }

  async createMessage(chatId: string, messageData: any) {
    return await prisma.message.create({
      data: { chatId, ...messageData },
    });
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
