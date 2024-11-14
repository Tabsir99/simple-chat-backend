import { inject, injectable } from "inversify";
import { MessageRepository } from "./message.repository";
import { TYPES } from "../../inversify/types";
import {
  Attachment,
  FilterMessageOption,
  IMessage,
  IRawMessage,
} from "./message.interface";
import { $Enums, FileType } from "@prisma/client";
import {
  getExtensionFromMimeType,
  getFileTypeFromMimeType,
  getMimeType,
} from "../../common/utils/utils";
import { MediaService } from "../media/media.services";
import ChatServices from "../chats/chat.services";
import { MessageError } from "../../common/errors/messageErrors";

type Reactions = {
  emoji: string;
  users: string[];
}[];

@injectable()
export class MessageService {
  constructor(
    @inject(TYPES.MessageRepository)
    private messageRepository: MessageRepository,
    @inject(TYPES.MediaService) private mediaService: MediaService,
    @inject(TYPES.ChatService) private chatService: ChatServices
  ) {}

  async getMessagesByChatId(
    chatId: string,
    userId: string,
    cursor: { messageId: string; createdAt: string }
  ) {
    const chatRoomMemberInfo = await this.chatService.validateMember(
      userId,
      chatId
    );
    if (!chatRoomMemberInfo) {
      throw MessageError.memberAccessDenied();
    }

    if (!cursor.createdAt || !cursor.messageId) {
      return this.getInitMessages(chatId, userId, chatRoomMemberInfo);
    }

    return this.getOlderMessages(chatId, chatRoomMemberInfo, {
      createdAt: new Date(cursor.createdAt),
      messageId: cursor.messageId,
    });
  }

  private getInitMessages = async (
    chatId: string,
    userId: string,
    chatRoomMemberInfo: FilterMessageOption
  ) => {
    const [{ rawMessages, oppositeMember }, allRecipts] = await Promise.all([
      this.messageRepository.findMessagesByChatId(
        chatId,
        userId,
        chatRoomMemberInfo
      ),
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
  };

  private getOlderMessages = async (
    chatId: string,
    chatRoomMemberInfo: FilterMessageOption,
    cursor: { messageId: string; createdAt: Date }
  ) => {
    const res = await this.messageRepository.findOlderMessages(
      chatId,
      chatRoomMemberInfo,
      cursor
    );
    const { attachments, messages } = this.mapMessages(res || [], undefined);

    return { attachments, messages };
  };
  async createMessageInChat(
    chatId: string,
    messageData: {
      messageId: string;
      sender: IMessage["sender"];
      content?: string;
      parentMessage?: IMessage["parentMessage"];
    },
    status: "delivered" | "sent",
    attachment?: Omit<Attachment, "filePath">,
    notReadBy?: string[]
  ) {
    let attachmentToSave;
    let signedUrlPromise: Promise<string> | undefined;

    if (attachment) {
      const path = `chatRoom/${chatId}/${messageData.messageId}.${attachment.fileName}`;
      attachmentToSave = {
        fileName: attachment.fileName,
        filePath: path,
        fileSize: attachment.fileSize,
        fileType: getFileTypeFromMimeType(attachment.fileType),
      };
      signedUrlPromise = this.mediaService.getReadSignedUrl(path, {
        expiresIn: 60 * 60 * 1000,
        fileName: attachment.fileName,
        contentType: attachment.fileType,
      });
    }
    const createMessagePromise = this.messageRepository.createMessage(
      chatId,
      messageData,
      status,
      attachment && attachmentToSave,
      notReadBy
    );

    return Promise.all([createMessagePromise, signedUrlPromise]);
  }

  async updateMessageRecipt(chatRoomId: string, userIds: string[]) {
    try {
      const result = await this.messageRepository.updateMessageRecipt(
        chatRoomId,
        userIds
      );
      return result;
    } catch (error) {
      console.error(
        "Couldnt create recipt",
        error instanceof Error && error.message
      );
      return false;
    }
  }

  async getChatRoomMembers(chatId: string) {
    return await this.messageRepository.getChatroomMembers(chatId);
  }

  async updateMessage(messageId: string, editedContent?: string) {
    if (editedContent) {
      return await this.messageRepository.updateMessage(
        messageId,
        editedContent
      );
    } else {
      return await this.messageRepository.deleteMessage(messageId);
    }
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
      console.error(error instanceof Error && error.message);
      return false;
    }
  }

  private mapMessages(
    rawMessages: IRawMessage[],
    oppositeMember:
      | {
          userStatus: $Enums.UserStatus;
          lastActive: Date;
        }
      | undefined
  ): {
    messages: IMessage[];
    attachments: Omit<Attachment, "filePath">[];
  } {
    const attachments: Omit<Attachment, "filePath">[] = [];
    const messages = rawMessages.map((rawMessage) => {
      let status: "delivered" | "failed" | "sent" | "seen" = rawMessage.status;
      if (
        oppositeMember &&
        status === "sent" &&
        (oppositeMember.userStatus === "online" ||
          rawMessage.createdAt < oppositeMember.lastActive)
      ) {
        status = "delivered";
      }

      if (rawMessage.Attachment.length > 0) {
        attachments.push({
          fileName: rawMessage.Attachment[0].fileName,
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
      };
    });

    return { messages, attachments };
  }
}
