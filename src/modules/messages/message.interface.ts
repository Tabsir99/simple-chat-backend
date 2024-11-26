import { $Enums } from "@prisma/client";

interface User {
  username: string;
  profilePicture: string | null;
  userId: string;
}

interface MessageReaction {
  reactionType: string;
  userId: string;
}

export interface Attachment {
  filePath: string;
  fileName: string;
  fileSize: number;
  fileType: $Enums.FileType | string;
  messageId?: string;
}

interface ParentMessage {
  messageId: string;
  sender: {
    username: string;
  } | null;
  content: string;
}

export type Reactions = {
  emoji: string;
  users: string[];
};

export type CallInformation = {
  callerId: string;
  isVideoCall: boolean;
  startTime: Date | null;
  endTime: Date | null;
  status: $Enums.CallStatus;
};

export interface IRawMessage extends Message {
  sender: User | null;
  parentMessage: ParentMessage | null;
  MessageReaction: MessageReaction[];
  Attachment: Attachment[];
  CallSession: CallInformation[] | null;
}

export interface IMessage extends Message {
  MessageReaction: Reactions[];
  sender: User | null;
  parentMessage: ParentMessage | null;
  callInformation: CallInformation | null;
}

type Message = {
  messageId: string;
  content: string;
  createdAt: Date;
  isEdited?: boolean;
  isDeleted?: boolean;
  status: $Enums.MessageStatus;
  type: $Enums.MessageType;
};

export interface FilterMessageOption {
  joinedAt: Date;
  removedAt: Date | null;
  chatClearedAt: Date | null;
}

export interface MinifiedMessage {
  messageId: string;
  content: string;
  createdAt: Date;
}

type Cursor = { messageId: string; createdAt: string };
export interface IMessageService {
  getMessagesByChatId(
    chatId: string,
    userId: string,
    cursor: Cursor
  ): Promise<{
    messages: IMessage[];
    allReceipts?: {
      lastReadMessageId: string;
      reader: {
        userId: string;
        username: string;
        profilePicture: string;
      };
    }[];
    attachments: Omit<Attachment, "filePath">[];
  }>;

  createMessageInChat(
    chatId: string,
    messageData: {
      messageId: string;
      sender: IMessage["sender"];
      content?: string;
      parentMessage?: IMessage["parentMessage"];
    },
    status: $Enums.MessageStatus,
    attachment?: Omit<Attachment, "filePath">,
    notReadBy?: string[]
  ): Promise<[any, string | undefined]>;

  updateMessageRecipt(
    chatRoomId: string,
    userIds: string[]
  ): Promise<boolean | string>;

  getChatRoomMembers(chatId: string): Promise<
    {
      user: {
        userId: string;
      };
    }[]
  >;

  updateMessage(messageId: string, editedContent?: string): Promise<unknown>;

  addReactionToMessage(
    messageId: string,
    reactionType: string,
    userId: string
  ): Promise<boolean | number>;

  searchMessages(
    chatRoomId: string,
    query: string,
    userId: string
  ): Promise<unknown>;
}

export interface IMessageRepository {
  findMessagesByChatId(
    chatId: string,
    currentUserId: string,
    chatRoomMemberInfo: FilterMessageOption
  ): Promise<{
    rawMessages: IRawMessage[];
    oppositeMember?:
      | { userStatus: $Enums.UserStatus; lastActive: Date }
      | undefined;
  }>;

  findOlderMessages(
    chatId: string,
    chatRoomMemberInfo: FilterMessageOption,
    cursor: { messageId: string; createdAt: Date }
  ): Promise<IRawMessage[]>;

  findAllReciptsByChatId(chatId: string): Promise<
    {
      chatRoomMember: {
        user: {
          userId: string;
          profilePicture: string | null;
          username: string;
        };
      };
      lastReadMessageId: string;
    }[]
  >;

  createMessage(
    chatId: string,
    messageData: {
      messageId: string;
      sender: IMessage["sender"];
      content?: string;
      parentMessage?: IMessage["parentMessage"];
    },
    status: "delivered" | "sent" | "seen",
    attachment?: Attachment,
    notReadBy?: string[]
  ): Promise<
    [
      {
        createdAt: Date;
      },
      {
        lastActivity: Date;
      }
    ]
  >;

  getChatroomMembers(chatId: string): Promise<
    {
      user: {
        userId: string;
      };
    }[]
  >;

  updateMessageRecipt(chatRoomId: string, userIds: string[]): Promise<string>;

  updateMessage(
    messageId: string,
    newContent: string
  ): Promise<{
    content: string;
    isEdited: boolean;
  }>;

  deleteMessage(messageId: string): Promise<{
    content: string;
    isDeleted: boolean;
  }>;

  toggleReaction(
    messageId: string,
    reactionType: string,
    userId: string
  ): Promise<number>;

  queryMessages(
    chatRoomId: string,
    query: string,
    memberInfo: {
      joinedAt: Date;
      removedAt: Date | null;
      chatClearedAt: Date | null;
    }
  ): Promise<MinifiedMessage[]>;
}
