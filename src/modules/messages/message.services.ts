import { inject, injectable } from "inversify";
import { MessageRepository } from "./message.repository";
import { TYPES } from "../../inversify/types";
import { IRawMessage } from "./message.interface";


type Reactions = {
  emoji: string;
  users: string[];
}[];
@injectable()
export class MessageService {

    constructor(
        @inject(TYPES.MessageRepository) private messageRepository: MessageRepository,
      ) {}

    async getMessagesByChatId(chatId: string, userId: string) {
        // Add business logic if needed, e.g., validation
        const rawMessages = await this.messageRepository.findMessagesByChatId(chatId)
        const messages = this.mapMessages(rawMessages, userId)

        return messages
    }

    async createMessageInChat(chatId: string, messageData: any) {
        // Add business logic, e.g., check if the chat exists
        return await this.messageRepository.createMessage(chatId, messageData);
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










    private mapMessages(rawMessages: IRawMessage[], userId: string) {
        return rawMessages.map((rawMessage) => {
          const type = rawMessage.sender.userId === userId ? 'outgoing' : 'incoming'; // Replace with your logic for 'incoming' or 'outgoing'
      
          return {
            messageId: rawMessage.messageId,
            content: rawMessage.content,
            time: rawMessage.createdAt,
            isEdited: false,
            isDeleted: rawMessage.isDeleted || false,
            type: type,
            reactions: rawMessage.MessageReaction.reduce<Reactions>((acc, reaction) => {
              const existing = acc.find((item) => item.emoji === reaction.reactionType);
              
              if (existing) {
                existing.users.push(reaction.userId);
              } else {
                acc.push({
                  emoji: reaction.reactionType,
                  users: [reaction.userId]
                });
              }
              
              return acc;
            }, [])
            ,
            senderName: rawMessage.sender.username,
            profilePicture: rawMessage.sender.profilePicture || "",
            parentMessage: rawMessage.parentMessage ? {
              messageId: rawMessage.parentMessage?.messageId,
              content: rawMessage.parentMessage?.content,
              senderName: rawMessage.parentMessage?.sender.username
            } : null,
            attachments: rawMessage.Attachment.map((attachment) => ({
              url: attachment.fileUrl
            })),
            readBy: rawMessage.MessageReceipt.filter(val => val.chatRoomMember.user.userId !== userId).map(recipt => {
              return {
                readerName: recipt.chatRoomMember.user.username,
                profilePicture: recipt.chatRoomMember.user.profilePicture,
                readerId: recipt.chatRoomMember.user.userId,
              }
            })
          };
        });
      }
      
      
}
