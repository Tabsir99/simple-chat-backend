import { DefaultEventsMap, Socket } from "socket.io";
import { TYPES } from "../../inversify/types";
import { inject, injectable } from "inversify";
import ChatServices from "./chat.services";
import {
  IConnectedUser,
  IConnectionEventHandler,
  WebsocketHandlerParams,
} from "../../common/websockets/websocket";
import { EventManager } from "../../common/config/eventService";
import { Server } from "socket.io";

export type TypingEventData = {
  chatRoomId: string;
  username: string;
  profilePicture: string;
  isStarting: boolean;
  userId: string;
};

type MembershipUpdate = {
  userId: string;
  chatRoomId: string;
};

@injectable()
export default class ChatWebSocketHandler implements IConnectionEventHandler {
  constructor(@inject(TYPES.ChatService) private chatService: ChatServices) {}

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
        console.log("typing...");
      }
    });

    socket.on(
      "call-offer",
      ({
        isVideo,
        offer,
        to,
        caller,
        callId,
      }: {
        offer: RTCSessionDescriptionInit;
        isVideo: boolean;
        to: string;
        callId: string;
        caller: { username: string; profilePicture: string };
      }) => {
        if (!socket.rooms.has(to)) return;

        socket.to(to).emit("callEvent", {
          event: "call:incoming",
          data: {
            from: offer,
            isVideo,
            to,
            caller: {
              userId: socket.userId,
              username: caller.username,
              profilePicture: caller.profilePicture,
            },
            callId,
          },
        });
      }
    );

    socket.on(
      "decline-call",
      ({ callId, to }: { callId: string; to: string }) => {
        if (!socket.rooms.has(to)) return;

        socket.to(to).emit("callEvent", {
          event: "call:ended",
          data: {
            callId
          }
        });
      }
    );

    socket.on("call-answer",({answer,to}: {answer: RTCSessionDescriptionInit, to: string}) => {
      console.log(to)

      if(!socket.rooms.has(to)) return

      socket.to(to).emit("callEvent",{
        event: "call:answered",
        data: {
          answer
        }
      })

    })


    socket.on("ice-candidate",({candidate,chatRoomId}: {chatRoomId: string, candidate: RTCIceCandidate}) => {
      socket.to(chatRoomId).emit("callEvent",{
        event: "ice-candidate",
        data: {
          candidate
        }
      })
    })
  }
}
