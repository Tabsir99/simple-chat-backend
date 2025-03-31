import { MessageType } from "@prisma/client";

import { AttachmentType } from "@prisma/client";

export type CallData = {
  callId: string;
  callerId: string;
  chatRoomId: string;
  isVideoCall: boolean;
  messageId: string;
  status: "initiating" | "ongoing" | "ended" | "missed";
  participants: {
    userId: string;
    joinedAt: Date;
    leftAt: Date | null;
  }[];
  startTime?: Date;
  endTime?: Date;
};

export interface ChatRoomHead {
  chatRoomId: string;
  roomName: string;
  roomImage: string;
  isGroup: boolean;
  chatClearedAt: Date | null;
  joinedAt: Date;
  removedAt: Date | null;
  unreadCount: number;
  lastMessage: {
    content: string | null;
    createdAt: Date;
    senderId: string | null;
    senderUsername: string | null;
    attachment: AttachmentType | null;
    type: MessageType;
  } | null;
}


export interface ChatRoomMemberInfo {
  joinedAt: Date;
  removedAt: Date | null;
  chatClearedAt: Date | null;
}

