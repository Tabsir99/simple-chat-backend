import { Socket } from "socket.io";
import { TYPES } from "../../inversify/types";
import { inject, injectable } from "inversify";
// import FriendService from "./friend.services";
import { IConnectedUser } from "../../common/websockets/websocket";
import redisClient from "../../common/config/redisConfig";

@injectable()
export default class FriendWebSocketHandler {

    constructor(
        // @inject(TYPES.FriendService) private friendService: FriendService
    ) {}

    async handle(socket: Socket, _: Map<string, IConnectedUser>): Promise<void> {
        const userId = socket.userId as string;

        // Retrieve friend list from Redis
        // const friendListJson = await redisClient.get(`friends:${userId}`) || "";
        // const friendList = JSON.parse(friendListJson);

        

        // Emit friend list to client
        // socket.emit("friends", friendList);
    }
}
