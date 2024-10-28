import { inject, injectable } from "inversify";
import { MessageRepository } from "./message.repository";
import { TYPES } from "../../inversify/types";
import { Attachment, IMessage, IRawMessage } from "./message.interface";
import { $Enums, FileType } from "@prisma/client";
import {
  getExtensionFromMimeType,
  getFileTypeFromMimeType,
  getMimeType,
} from "../../common/utils/utils";
import { MediaService } from "../media/media.services";

type Reactions = {
  emoji: string;
  users: string[];
}[];
@injectable()
export class MessageService {
  constructor(
    @inject(TYPES.MessageRepository)
    private messageRepository: MessageRepository,
    @inject(TYPES.MediaService) private mediaService: MediaService
  ) {}

  async getMessagesByChatId(chatId: string, userId: string) {
    // Add business logic if needed, e.g., validation
    const [{ rawMessages, oppositeMember }, allRecipts] = await Promise.all([
      this.messageRepository.findMessagesByChatId(chatId, userId),
      this.messageRepository.findAllReciptsByChatId(chatId),
    ]);

    const { attachments, messages } = this.mapMessages(
      rawMessages,
      oppositeMember
    );

    return {
      messages,
      allReceipts: allRecipts.map((re) => ({
        lastReadMessageId: re.lastReadMessageId,
        reader: re.chatRoomMember.user,
      })),
      attachments,
    };
  }

  async createMessageInChat(
    chatId: string,
    messageData: IMessage,
    status: "delivered" | "sent",
    attachment?: Omit<Attachment, "filePath">,
    notReadBy?: string[]
  ) {
    let attachmentToSave;
    let signedUrlPromise: Promise<string> | undefined;

    if (attachment) {
      const path = `chatRoom/${chatId}/${
        messageData.messageId
      }.${getExtensionFromMimeType(attachment.fileType)}`;
      attachmentToSave = {
        fileName: attachment.fileName,
        filePath: path,
        fileSize: attachment.fileSize,
        fileType: getFileTypeFromMimeType(attachment.fileType),
      };
      signedUrlPromise = this.mediaService.getReadSignedUrl(
        path,
        {expiresIn: 60*60*1000,fileName: attachment.fileName,contentType: attachment.fileType}
      );
    }
    const createMessagePromise = this.messageRepository.createMessage(
      chatId,
      messageData,
      status,
      attachment && attachmentToSave,
      notReadBy
    );

    return Promise.all([createMessagePromise,signedUrlPromise])
  }

  async updateMessageRecipt(chatRoomId: string, userIds: string[]) {
    // console.log("ran create recipt")
    try {
      const result = await this.messageRepository.updateMessageRecipt(
        chatRoomId,
        userIds
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

  async addReactionToMessage(
    messageId: string,
    reactionType: string,
    userId: string
  ) {
    try {
      return await this.messageRepository.toggleReaction(
        messageId,
        reactionType,
        userId
      );
    } catch (error) {
      console.log(error instanceof Error && error.message);
      return false;
    }
  }

  private mapMessages(
    rawMessages: IRawMessage[],
    oppositeMember: {
      userStatus: $Enums.UserStatus;
      lastActive: Date;
    }
  ): { messages: IMessage[]; attachments: (Omit<Attachment,"filePath">&{fileUrl: string})[] } {
    const attachments: (Omit<Attachment,"filePath">&{fileUrl: string})[] = [];
    const messages = rawMessages.map((rawMessage) => {
      let status: "delivered" | "failed" | "sent" | "seen" = rawMessage.status;
      if (
        status === "sent" &&
        (oppositeMember.userStatus === "online" ||
          rawMessage.createdAt < oppositeMember.lastActive)
      ) {
        status = "delivered";
      }

      if (rawMessage.Attachment.length > 0) {
        attachments.push({
          fileName: rawMessage.Attachment[0].fileName,
          fileUrl: "",
          fileSize: rawMessage.Attachment[0].fileSize,
          fileType: getMimeType(rawMessage.Attachment[0].fileType as FileType),
          messageId: rawMessage.messageId,
          
        });
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
        // Attachment: rawMessage.Attachment && {
        //   ...rawMessage.Attachment[0],
        //   fileUrl: "",
        //   fileType: getMimeType(rawMessage.Attachment[0].fileType),
        // },
      };
    });

    return { messages, attachments };
  }
}
