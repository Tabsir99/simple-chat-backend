
import { Socket } from "socket.io";
import { TYPES } from "../../inversify/types";
import { inject, injectable } from "inversify";
import ChatServices from "./chat.services";
import { IConnectedUser } from "../../common/websockets/websocket";



@injectable()
export default class ChatWebSocketHandler {

    constructor(
        @inject(TYPES.ChatService) private chatService: ChatServices
    ){}

    handle(socket: Socket, connectedUsers: Map<string, IConnectedUser>): void{

        socket
        connectedUsers
    }
}