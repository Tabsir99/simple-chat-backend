import { Socket } from "socket.io";
import { TYPES } from "../../inversify/types";
import { inject, injectable } from "inversify";
import UserService from "./user.services";
import { IConnectedUser, IConnectionEventHandler } from "../../common/websockets/websocket";
import FriendshipService from "../friendship/frnd.services";

@injectable()
export default class UserWebSocketHandler implements IConnectionEventHandler {
  constructor(
    @inject(TYPES.UserService) private userService: UserService,
    @inject(TYPES.FriendshipService)
    private friendshipService: FriendshipService
  ) {}

  async handle(
    socket: Socket,
    connectedUsers: Map<string, IConnectedUser>
  ): Promise<void> {
    const friendsIdList = await this.friendshipService.getFriendList(
      socket.userId as string
    );
    this.userService.setUserStatus(socket.userId as string, "online")

    if (friendsIdList) {
      friendsIdList.forEach((friendId) => {
        const friendSocketId = connectedUsers.get(friendId)?.socketId as string;
        if (connectedUsers.has(friendId)) {
          console.log("Yes it works,", friendSocketId);
          socket
            .to(friendSocketId)
            .emit("friend:status", {
              friendId: socket.userId,
              status: "online",
            });
        }
      });
    }
    // console.log(friendIdList)
  }

  onDisconnect(userId: string, socket: Socket): void {
      socket.emit("user:status","offline")
      this.userService.setUserStatus(userId, "offline")
  }
}
