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

interface Attachment {
  fileUrl: string;
}

interface ParentMessage {
  messageId: string;
  sender: {
    username: string;
  };
  content: string;
}

export interface IRawMessage {
  messageId: string;
  content: string;
  isDeleted: boolean;
  createdAt: Date;
  sender: User;
  status: $Enums.MessageStatus;
  parentMessage: ParentMessage | null;
  MessageReaction: MessageReaction[];
  Attachment: Attachment[];
  MessageReceipt: {
    lastReadMessageId: string;
    chatRoomMember: {
      user: { userId: string; username: string; profilePicture: string | null };
    };
  }[];
}

export type Reactions = {
  emoji: string;
  users: string[];
};

export type PAttachment = {
  url: string;
  type: "image" | "video" | "document";
};

type Message = {
  messageId: string;
  content: string;
  time: string;
  isEdited?: boolean;
  isDeleted?: boolean;
};

export interface IMessage extends Message {
  reactions: Reactions[];
  sender: {
    senderName: string;
    profilePicture: string;
    senderId: string;
  };
  parentMessage?: {
    messageId?: string;
    content?: string;
    senderName?: string;
  } | null;

  readBy: Array<{
    readerName: string;
    profilePicture: string;
    readerId: string;
  }>;

  attachments?: PAttachment[];
  status?: "sending" | "sent" | "delivered" | "failed" | "read";
}
