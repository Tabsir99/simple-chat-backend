import { injectable } from "inversify";
import { IConnectedUser, IConnectionEventHandler } from "../../common/websockets/websocket";
import { Socket, DefaultEventsMap } from "socket.io";


@injectable()
export default class NotificationWebSocketHandler implements IConnectionEventHandler {

    constructor(
        // @inject(TYPES.NotificationService) private notificationService: NotificationService
    ) {}

    async handle(socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>, connectedUsers: Map<string, IConnectedUser>): Promise<void> {
        
    }
    
}
