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
  callerId: string
  isVideoCall: boolean
  startTime: Date | null
  endTime: Date | null
  status: $Enums.CallStatus
}

export interface IRawMessage extends Message {
  sender: User | null;
  parentMessage: ParentMessage | null;
  MessageReaction: MessageReaction[];
  Attachment: Attachment[];
  CallSession: CallInformation[] | null
}

export interface IMessage extends Message {
  MessageReaction: Reactions[];
  sender: User | null;
  parentMessage: ParentMessage | null;
  callInformation: CallInformation | null
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

export interface MinifiedMessage{
  messageId: string;
  content: string;
  createdAt: Date;
}