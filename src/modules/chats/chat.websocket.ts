import { DefaultEventsMap, Socket } from "socket.io";
import { TYPES } from "../../inversify/types";
import { inject, injectable } from "inversify";
import {
  IConnectionEventHandler,
  WebsocketHandlerParams,
} from "../../common/websockets/websocket";
import { MediaService } from "../media/media.services";

import { randomUUID } from "crypto";
import { CallData, IChatServices } from "./chats.interfaces";

export type TypingEventData = {
  chatRoomId: string;
  username: string;
  profilePicture: string;
  isStarting: boolean;
  userId: string;
};

@injectable()
export default class ChatWebSocketHandler implements IConnectionEventHandler {
  private activeCalls: Map<string, CallData> = new Map();

  constructor(
    @inject(TYPES.ChatService) private chatService: IChatServices,
    @inject(TYPES.MediaService) private mediaService: MediaService
  ) {}

  async onConnect(userId: string, socket: Socket): Promise<void> {
    const chatRoomList = await this.chatService.getChatRoomList(userId);
    chatRoomList.forEach((chatRoom) => socket.join(chatRoom));
  }

  async handle({
    io,
    socket,
    connectedUsers,
  }: WebsocketHandlerParams): Promise<void> {
    socket.on("user:typing", (ev: TypingEventData) => {
      if (socket.rooms.has(ev.chatRoomId)) {
        socket.to(ev.chatRoomId).emit("messageEvent", {
          event: "user:typing",
          data: ev,
        });
      }
    });

    socket.on(
      "call-offer",
      async ({
        isVideoCall,
        offer,
        to,
        caller,
        callId,
        recipientId,
      }: {
        offer: RTCSessionDescriptionInit;
        isVideoCall: boolean;
        to: string;
        callId: string;
        caller: { username: string; profilePicture: string };
        recipientId: string;
      }) => {
        if (!socket.rooms.has(to)) return;

        socket.to(to).emit("callEvent", {
          event: "call:incoming",
          data: {
            from: offer,
            isVideoCall,
            to,
            caller: {
              userId: socket.userId,
              username: caller.username,
              profilePicture: caller.profilePicture,
            },
            callId,
          },
        });

        const callData: CallData = {
          callId,
          callerId: socket.userId as string,
          chatRoomId: to,
          isVideoCall,
          messageId: randomUUID(),
          status: "initiating",
          participants: [
            {
              userId: socket.userId as string,
              joinedAt: new Date(),
              leftAt: null,
            },
          ],
        };

        this.activeCalls.set(callId, callData);
      }
    );

    socket.on(
      "decline-call",
      async ({
        callId,
        to,
        reason,
      }: {
        callId: string;
        to: string;
        reason: string;
      }) => {
        if (!socket.rooms.has(to)) return;

        socket.to(to).emit("callEvent", {
          event: "call:ended",
          data: {
            callId,
            reason,
          },
        });

        const callData = this.activeCalls.get(callId);
        if (callData) {
          const newCallData: CallData = {
            ...callData,
            status: "missed",
            startTime: new Date(),
            endTime: new Date(),
          };

          const newCallEvent = {
            event: "message:new",
            data: {
              chatRoomId: to,
              message: {
                messageId: newCallData.messageId,
                createdAt: new Date(),
                type: "call",
                callInformation: {
                  callerId: newCallData.callerId,
                  startTime: newCallData.startTime,
                  endTime: newCallData.endTime,
                  status: newCallData.status,
                  isVideoCall: newCallData.isVideoCall,
                },
              },
            },
          };

          socket.to(to).emit("messageEvent", newCallEvent);
          socket.emit("messageEvent", newCallEvent);
          await this.chatService.createCallMessage(newCallData);
        }
      }
    );

    socket.on(
      "call-answer",
      async ({
        answer,
        to,
        callId,
      }: {
        answer: RTCSessionDescriptionInit;
        to: string;
        callId: string;
      }) => {
        if (!socket.rooms.has(to)) return;

        socket.to(to).emit("callEvent", {
          event: "call:answered",
          data: {
            answer,
            callId,
          },
        });
      }
    );

    socket.on(
      "ice-candidate",
      ({
        candidate,
        chatRoomId,
      }: {
        chatRoomId: string;
        candidate: RTCIceCandidate;
      }) => {
        socket.to(chatRoomId).emit("callEvent", {
          event: "ice-candidate",
          data: {
            candidate,
          },
        });
      }
    );

    socket.on(
      "call-connected",
      ({ callId, to }: { to: string; callId: string }) => {
        const targetCall = this.activeCalls.get(callId);

        if (targetCall) {
          const updatedCall: CallData = {
            ...targetCall,
            startTime: new Date(),
            status: "ongoing",
            participants: [
              ...targetCall.participants,
              {
                userId: socket.userId as string,
                joinedAt: new Date(),
                leftAt: null,
              },
            ],
          };

          this.activeCalls.set(callId, updatedCall);
        }
      }
    );

    socket.on(
      "end-call",
      async ({ callId, to }: { to: string; callId: string }) => {
        if (!socket.rooms.has(to)) return;

        socket.to(to).emit("callEvent", {
          event: "call:ended",
          data: {
            callId,
          },
        });

        const callData = this.activeCalls.get(callId);
        this.activeCalls.delete(callId);
        if (callData) {
          const updatedCall: CallData = {
            ...callData,
            status: "ended",
            endTime: new Date(),
          };

          const newCallEvent = {
            event: "message:new",
            data: {
              chatRoomId: to,
              message: {
                messageId: updatedCall.messageId,
                createdAt: new Date(),
                type: "call",
                callInformation: {
                  callerId: updatedCall.callerId,
                  startTime: updatedCall.startTime,
                  endTime: updatedCall.endTime,
                  status: updatedCall.status,
                  isVideoCall: updatedCall.isVideoCall,
                },
              },
            },
          };

          socket.to(to).emit("messageEvent", newCallEvent);
          socket.emit("messageEvent", newCallEvent);
          await this.chatService.createCallMessage(updatedCall);
        }
      }
    );

    socket.on(
      "chatRoom:update",
      async ({ chatRoomId }: { chatRoomId: string }) => {
        if (!socket.rooms.has(chatRoomId)) return;

        const res = await this.chatService.updateChatRoomImage(
          chatRoomId,
          socket.userId as string
        );

        await this.mediaService.makeFilePublic(
          `avatars/chatRoom/${chatRoomId}`
        );
        socket.to(chatRoomId).emit("messageEvent", {
          event: "message:new",
          data: { ...res, type: "system" },
        });
        socket.to(chatRoomId).emit("chatEvent", {
          event: "chatRoom:update",
          data: {
            chatRoomId,
            roomImage: `https://storage.googleapis.com/simple-chat-cg.appspot.com/avatars/chatRoom/${chatRoomId}`,
          },
        });
      }
    );
  }
}
