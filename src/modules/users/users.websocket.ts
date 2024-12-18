import { Socket } from "socket.io";
import { TYPES } from "../../inversify/types";
import { inject, injectable } from "inversify";
import UserService from "./user.services";
import {
  IConnectedUser,
  IConnectionEventHandler,
  WebsocketHandlerParams,
} from "../../common/websockets/websocket";
import { EventManager } from "../../common/config/eventService";
import { IFriendshipService } from "../friendship/frnd.interface";

@injectable()
export default class UserWebSocketHandler implements IConnectionEventHandler {
  constructor(
    @inject(TYPES.UserService) private userService: UserService,
    @inject(TYPES.FriendshipService)
    private friendshipService: IFriendshipService,
  ) {}

  async handle({
    io,
    socket,
    connectedUsers,
  }: WebsocketHandlerParams): Promise<void> {
    const friendsIdList = await this.friendshipService.getFriendIdList(
      socket.userId as string
    );
    this.userService.setUserStatus(socket.userId as string, "online");

    if (friendsIdList) {
      friendsIdList.forEach((friendId) => {
        const friendSocketId = connectedUsers.get(friendId)?.socketId as string;
        if (connectedUsers.has(friendId)) {
          socket.to(friendSocketId).emit("userEvent", {
            event: "user:status",
            data: { friendId: socket.userId, status: "online" },
          });
        }
      });
    }

    socket.on(
      "activity:reset",
      async (ev: { type: "friends" | "chats"; userId: string }) => {
        if (ev.type === "friends") {
          await this.userService.updateRecentActivities(
            ev.userId,
            "reset-friends"
          );
        }
        if (ev.type === "chats") {
          await this.userService.updateRecentActivities(
            ev.userId,
            "reset-chats"
          );
        }
      }
    );
  }

  async onDisconnect(
    userId: string,
    socket: Socket,
    connectedUsers: Map<string, IConnectedUser>
  ): Promise<void> {
    const friendsIdList = await this.friendshipService.getFriendIdList(userId);

    if (friendsIdList) {
      friendsIdList.forEach((friendId) => {
        const friendSocketId = connectedUsers.get(friendId)?.socketId as string;
        if (connectedUsers.has(friendId)) {
          socket.to(friendSocketId).emit("userEvent", {
            event: "user:status",
            data: { friendId: socket.userId, status: "offline" },
          });
        }
      });
    }
    this.userService.setUserStatus(userId, "offline");
  }
}
