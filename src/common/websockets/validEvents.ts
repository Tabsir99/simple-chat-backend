import { Socket } from "socket.io";
import { IMessage } from "../../modules/messages/message.interface";
import { CallStatus } from "@prisma/client";
// Define events the **server** can emit to the **client**
export interface ServerToClientEvents {
  "message:read": (data: {
    chatRoomId: string;
    latestMessageId: string;
    readerId: string;
  }) => void;
  "call:offer": (data: {
    offer: RTCSessionDescriptionInit;
    isVideoCall: boolean;
    to: string;
    caller: { username: string; profilePicture: string };
    callId: string;
  }) => void;
  "call:reject": (data: { callId: string }) => void;
  "call:accept": (data: {
    callId: string;
    to: string;
    answer: RTCSessionDescriptionInit;
  }) => void;
  "call:connected": (data: { callId: string }) => void;
  "call:canceled": (data: { callId: string }) => void;
  "call:ended": (data: { callId: string }) => void;
  "call:answered": (data: {
    callId: string;
    answer: RTCSessionDescriptionInit;
  }) => void;
  "call:candidate": (data: {
    candidate: RTCIceCandidate;
    chatRoomId: string;
  }) => void;

  "message:new": (data: {
    chatRoomId: string;
    message: {
      messageId: string;
      createdAt: Date;
      type: IMessage["type"];
      senderId: string;
      callSession?: {
        callerId: string;
        startTime: Date;
        endTime: Date;
        status: CallStatus;
        isVideoCall: boolean;
      };
    };
    readBy: string[];
  }) => void;

  "message:reaction": (data: {
    chatRoomId: string;
    messageId: string;
    reaction: string;
  }) => void;

  "message:edit": (data: {
    chatRoomId: string;
    messageId: string;
    content: string;
  }) => void;

  "message:delete": (data: {
    chatRoomId: string;
    messageId: string;
  }) => void;

  "user:typing": (data: { chatRoomId: string; username: string }) => void;
}

// Define events the **client** can send to the **server**
export interface ClientToServerEvents {
  "chat:focus": (data: { chatRoomId: string; latestMessageId: string }) => void;
  "chat:unfocus": (data: { chatRoomId: string }) => void;

  "message:send": (data: {
    chatRoomId: string;
    message: {
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
    };
  }) => void;

  "message:delete": (data: { chatRoomId: string; messageId: string }) => void;

  "message:edit": (data: {
    chatRoomId: string;
    messageId: string;
    content?: string;
  }) => void;

  "message:reaction": (data: {
    chatRoomId: string;
    messageId: string;
    reaction: string;
  }) => void;

  "user:typing": (data: {
    chatRoomId: string;
    username: string;
    profilePicture: string;
    isStarting: boolean;
    userId: string;
  }) => void;

  "call:offer": (data: {
    offer: RTCSessionDescriptionInit;
    isVideoCall: boolean;
    to: string;
    caller: { username: string; profilePicture: string };
    callId: string;
  }) => void;

  "call:reject": (data: { callId: string; to: string }) => void;

  "call:accept": (data: {
    callId: string;
    to: string;
    answer: RTCSessionDescriptionInit;
  }) => void;

  "call:connected": (data: { callId: string }) => void;

  "call:end": (data: { callId: string; to: string }) => void;

  "call:cancel": (data: { callId: string; to: string }) => void;

  "call:candidate": (data: {
    candidate: RTCIceCandidate;
    chatRoomId: string;
  }) => void;
}

// Define the socket type with custom events
export type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;
