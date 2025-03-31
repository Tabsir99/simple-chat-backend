import { MessageError } from "../../common/errors/messageErrors";
import * as chatService from "../chats/chat.services";
import * as messageRepository from "./message.repository";
import * as mediaService from "../media/media.services";
import { IMessage } from "./message.interface";
import { getFileType } from "../media/media.services";

export const getMessagesByChatId = async (
  chatId: string,
  userId: string,
  cursor?: { messageId: string; createdAt: string }
) => {
  const chatRoomMemberInfo = await chatService.validateMember(userId, chatId);
  if (!chatRoomMemberInfo) {
    throw MessageError.memberAccessDenied();
  }

  const rawMessages = await messageRepository.findMessagesByChatId(
    chatId,
    chatRoomMemberInfo,
    cursor && {
      createdAt: new Date(cursor.createdAt),
      messageId: cursor.messageId,
    }
  );

  const messages = mapMessages(rawMessages);

  return messages;
};

const mapMessages = (
  messages: Awaited<ReturnType<typeof messageRepository.findMessagesByChatId>>
) => {
  return messages.map((message) => {
    return {
      ...message,
    };
  });
};

export const createMessageInChat = async (
  chatId: string,
  messageData: {
    messageId: string;
    sender: IMessage["sender"];
    content?: string;
    parentMessage?: IMessage["parentMessage"];
    fileInfo?: {
      fileName: string;
      fileSize: number;
      fileType: string;
      isVoice: boolean;
    };
  },
  status: "delivered" | "sent",
  notReadBy?: string[]
) => {
  let signedUrlPromise: Promise<string> | undefined;

  if (messageData.fileInfo) {
    const path = `chatRoom/${chatId}/${messageData.messageId}.${messageData.fileInfo.fileName}`;
    signedUrlPromise = mediaService.getReadSignedUrl(path, {
      expiresIn: 60 * 60 * 1000,
      fileName: messageData.fileInfo.fileName,
      contentType: messageData.fileInfo.fileType,
    });
  }
  const createMessagePromise = messageRepository.createMessage(
    chatId,
    messageData,
    status,
    messageData.fileInfo &&
      getFileType(messageData.fileInfo.fileType, messageData.fileInfo.isVoice),
    notReadBy
  );

  return Promise.all([createMessagePromise, signedUrlPromise]);
};

export const getChatRoomMembers = async (chatId: string) => {
  return await messageRepository.getChatroomMembers(chatId);
};

export const updateMessage = async (
  messageId: string,
  editedContent?: string
) => {
  if (editedContent) {
    return await messageRepository.updateMessage(messageId, editedContent);
  } else {
    return await messageRepository.deleteMessage(messageId);
  }
};

export const addReactionToMessage = async (
  messageId: string,
  reaction: string,
  userId: string
) => {
  try {
    return await messageRepository.toggleReaction(messageId, reaction, userId);
  } catch (error) {
    console.error(error instanceof Error && error.message);
    return false;
  }
};

export const searchMessages = async (
  chatRoomId: string,
  query: string,
  userId: string
) => {
  try {
    const isMemberValid = await chatService.validateMember(userId, chatRoomId);
    const queryResult = await messageRepository.queryMessages(
      chatRoomId,
      createFlexibleQuery(query),
      isMemberValid
    );

    return queryResult;
  } catch (error) {
    console.error(error);
    throw new Error("Error occured");
  }
};

const createFlexibleQuery = (query: string): string => {
  const tokens = query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.replace(/[&|!():*]/g, "\\$&"));

  if (tokens.length === 0) return "";

  if (tokens.length === 1) {
    return `${tokens[0]}:*`;
  }

  const lastIndex = tokens.length - 1;
  tokens[lastIndex] = `${tokens[lastIndex]}:*`;
  return tokens
    .map((token, i) => (i === lastIndex ? token : `${token}`))
    .join(" & ");
};

export const updateMessageRead = async (
  chatRoomId: string,
  userId: string[],
  messageId: string
) => {
  return await messageRepository.updateMessageRead(
    chatRoomId,
    userId,
    messageId
  );
};
