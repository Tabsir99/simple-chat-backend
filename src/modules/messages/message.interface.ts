import { AttachmentType, MessageType, CallSession } from "@prisma/client";

export interface Reaction {
  emoji: string;
  users: string[];
}

export interface IMessage {
  messageId: string;
  content: string | null;
  createdAt: Date;
  sender: {
    userId: string;
    username: string;
    profilePicture: string;
  };
  attachment: AttachmentType | null;
  type: MessageType;
  parentMessage: IMessage | null;
  reactions: Reaction[];
  isEdited: boolean;
  isDeleted: boolean;
  callSession: CallSession | null;
}
