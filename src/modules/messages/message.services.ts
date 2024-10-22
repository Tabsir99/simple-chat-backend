import { inject, injectable } from "inversify";
import { MessageRepository } from "./message.repository";
import { TYPES } from "../../inversify/types";
import { IMessage, IRawMessage } from "./message.interface";
import { $Enums, Prisma } from "@prisma/client";
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
    const [{ rawMessages, oppositeMember }, allRecipts] = await Promise.all([
      this.messageRepository.findMessagesByChatId(chatId, userId),
      this.messageRepository.findAllReciptsByChatId(chatId),
    ]);

    const messages = this.mapMessages(rawMessages, oppositeMember);

    return {
      messages,
      allRecipts: allRecipts.map((re) => ({
        lastReadMessageId: re.lastReadMessageId,
        reader: re.chatRoomMember.user,
      })),
    };
  }

  async createMessageInChat(
    chatId: string,
    messageData: IMessage,
    status: "delivered" | "sent",
    notReadBy?: string[]
  ) {
    return await this.messageRepository.createMessage(
      chatId,
      messageData,
      status,
      notReadBy
    );
  }

  async updateMessageRecipt(chatRoomId: string, userIds: string[]) {
    // console.log("ran create recipt")
    try {
      const result = await this.messageRepository.updateMessageRecipt(
        chatRoomId,
        userIds,
      );
      return result;
    } catch (error) {
      console.log(
        "Couldnt create recipt",
        error instanceof Error && error.message
      );
      return false;
    }
  }

  async getChatRoomMembers(chatId: string) {
    return await this.messageRepository.getChatroomMembers(chatId);
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

  private mapMessages(
    rawMessages: IRawMessage[],
    oppositeMember: {
      userStatus: $Enums.UserStatus;
      lastActive: Date;
    }
  ): IMessage[] {
    return rawMessages.map((rawMessage) => {
      let status: "delivered" | "failed" | "sent" | "seen" = rawMessage.status;
      if (status === "sent" && (oppositeMember.userStatus === "online" || rawMessage.createdAt < oppositeMember.lastActive)) {
        status = "delivered";
      }
      return {
        messageId: rawMessage.messageId,
        content: rawMessage.content,
        createdAt: rawMessage.createdAt,
        isEdited: false,
        isDeleted: rawMessage.isDeleted || false,
        type: rawMessage.type,
        MessageReaction: rawMessage.MessageReaction.reduce<Reactions>(
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

        status: status,
        sender: rawMessage.sender,
        parentMessage: rawMessage.parentMessage,
        Attachment: rawMessage.Attachment,
      };
    });
  }
}
