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
      }
    });

    socket.on(
      "member:remove",
      async ({
        chatRoomId,
        userId,
      }: {
        chatRoomId: string;
        userId: string;
      }) => {
        if (!socket.userId || socket.rooms.has(socket.userId)) return;

        const res = await this.chatService.updateGroupMembership(
          chatRoomId,
          userId,
          socket.userId
        );
        console.log(res);
        if (!res) return;
        io?.to(chatRoomId).emit("chatEvent", {
          event: "member:remove",
          data: { chatRoomId: chatRoomId, userId: userId },
        });
        io?.to(chatRoomId).emit("messageEvent", {
          event: "message:new",
          data: {
            chatRoomId,
            message: {
              ...res,
              type: "system",
            },
          },
        });
      }
    );
  }
}
