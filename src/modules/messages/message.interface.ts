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
  fileType: $Enums.FileType | string
  messageId?: string
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

export interface IRawMessage extends Message {
  sender: User | null;
  parentMessage: ParentMessage | null;
  MessageReaction: MessageReaction[];
  Attachment: Attachment[];
}

export interface IMessage extends Message {
  MessageReaction: Reactions[];
  sender: User | null;
  parentMessage: ParentMessage | null;
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
