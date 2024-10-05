import { Socket } from "socket.io";
import { TYPES } from "../../inversify/types";
import { inject, injectable } from "inversify";
// import MessageService from "./message.services";
import { IConnectedUser } from "../../common/websockets/websocket";
import redisClient from "../../common/config/redisConfig";

@injectable()
export default class MessageWebSocketHandler {

    constructor(
        // @inject(TYPES.MessageService) private messageService: MessageService
    ) {}

    async handle(socket: Socket, _: Map<string, IConnectedUser>): Promise<void> {
        const userId = socket.userId as string;

       
    }
}
