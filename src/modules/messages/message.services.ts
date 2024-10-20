import { inject, injectable } from "inversify";
import { MessageRepository } from "./message.repository";
import { TYPES } from "../../inversify/types";
import { IMessage, IRawMessage } from "./message.interface";
import { Prisma } from "@prisma/client";
import { DefaultArgs } from "@prisma/client/runtime/library";

type Reactions = {
  emoji: string;
  users: string[];
}[];
@injectable()
export class MessageService {
  constructor(
    @inject(TYPES.MessageRepository)
    private messageRepository: MessageRepository
  ) {}

  async getMessagesByChatId(chatId: string, userId: string) {
    // Add business logic if needed, e.g., validation
    const rawMessages = await this.messageRepository.findMessagesByChatId(
      chatId
    );
    const messages = this.mapMessages(rawMessages, userId);

    return messages;
  }

  async createMessageInChat(chatId: string, messageData: IMessage, status: "delivered"|"sent"|"read") {
    return await this.messageRepository.createMessage(chatId, messageData, status);
  }

  async createMessageRecipt (chatRoomId: string, userId: string,status: "read" | "delivered" | "sent") {
    // console.log("ran create recipt")
    try {
      const result = await this.messageRepository.createMessageRecipt(chatRoomId, userId, status)
      // console.log(result)
      return result
    } catch (error) {
      console.log("Couldnt create recipt",error instanceof Error && error.message)
      return false
    }
  }

  async getChatRoomMembers (chatId: string, userId: string) {
    return await this.messageRepository.getChatroomMembers(chatId, userId)
  }

  async updateMessage(messageId: string, updateData: any) {
    // Validate if message exists or add other business logic
    return await this.messageRepository.updateMessage(messageId, updateData);
  }

  async deleteMessage(messageId: string) {
    // Add business logic, e.g., authorization, if needed
    return await this.messageRepository.deleteMessage(messageId);
  }

  async addReactionToMessage(messageId: string, reactionData: any) {
    return await this.messageRepository.addReaction(messageId, reactionData);
  }

  async deleteReaction(reactionId: string) {
    return await this.messageRepository.deleteReaction(reactionId);
  }

  private mapMessages(rawMessages: IRawMessage[], userId: string): IMessage[] {
    return rawMessages.map((rawMessage) => {

      return {
        messageId: rawMessage.messageId,
        content: rawMessage.content,
        status: rawMessage.status,
        time: rawMessage.createdAt.toISOString(),
        isEdited: false,
        isDeleted: rawMessage.isDeleted || false,
        reactions: rawMessage.MessageReaction.reduce<Reactions>(
          (acc, reaction) => {
            const existing = acc.find(
              (item) => item.emoji === reaction.reactionType
            );

            if (existing) {
              existing.users.push(reaction.userId);
            } else {
              acc.push({
                emoji: reaction.reactionType,
                users: [reaction.userId],
              });
            }

            return acc;
          },
          []
        ),
        sender: {
          senderName: rawMessage.sender.username,
          profilePicture: rawMessage.sender.profilePicture || "",
          senderId: rawMessage.sender.userId,
        },
        parentMessage: rawMessage.parentMessage
          ? {
              messageId: rawMessage.parentMessage?.messageId,
              content: rawMessage.parentMessage?.content,
              senderName: rawMessage.parentMessage?.sender.username,
            }
          : null,
        attachments: rawMessage.Attachment.map((at) => ({
          type: "document",
          url: at.fileUrl,
        })),
        readBy: rawMessage.MessageReceipt.filter(
          (val) => val.chatRoomMember.user.userId !== userId
        ).map((recipt) => {
          return {
            readerName: recipt.chatRoomMember.user.username,
            profilePicture: recipt.chatRoomMember.user.profilePicture || "",
            readerId: recipt.chatRoomMember.user.userId,
          };
        }),
      };
    });
  }
}
