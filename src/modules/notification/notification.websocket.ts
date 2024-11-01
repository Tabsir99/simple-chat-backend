import { injectable } from "inversify";
import { IConnectedUser, IConnectionEventHandler, WebsocketHandlerParams } from "../../common/websockets/websocket";
import { Socket, DefaultEventsMap } from "socket.io";


@injectable()
export default class NotificationWebSocketHandler implements IConnectionEventHandler {

    constructor(
        // @inject(TYPES.NotificationService) private notificationService: NotificationService
    ) {}

    async handle({ io, socket, connectedUsers }: WebsocketHandlerParams): Promise<void> {
        
    }
    
}
