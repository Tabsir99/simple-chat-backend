import { DefaultEventsMap, Socket } from "socket.io";
import { TYPES } from "../../inversify/types";
import { inject, injectable } from "inversify";
import ChatServices from "./chat.services";
import { IConnectedUser, IConnectionEventHandler } from "../../common/websockets/websocket";
import { EventManager } from "../../common/config/eventService";

export type TypingEventData = {
  chatRoomId: string;
  username: string;
  profilePicture: string;
  isStarting: boolean;
  userId: string;
};

@injectable()
export default class ChatWebSocketHandler implements IConnectionEventHandler {
  constructor(
    @inject(TYPES.ChatService) private chatService: ChatServices,
  ) {
  }

  async onConnect(userId: string, socket: Socket): Promise<void> {
    const chatRoomList = await this.chatService.getChatRoomList(userId);
    chatRoomList.forEach((chatRoom) => socket.join(chatRoom));
  }
  async handle(socket: Socket, connectedUsers: Map<string, IConnectedUser>): Promise<void> {
    socket.on("user:typing", (ev: TypingEventData) => {
      if (socket.rooms.has(ev.chatRoomId)) {
        socket.to(ev.chatRoomId).emit("messageEvent", {
          event: "user:typing",
          data: ev,
        });
      }
    });
  }
}
