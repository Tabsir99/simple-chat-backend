import { Container } from "inversify";
import { TYPES } from "./types";
import UserService from "../modules/users/user.services";
import { UserRepository } from "../modules/users/user.repository";
import UserControllers from "../modules/users/user.controller";
import { IUserRepository, IUserService } from "../modules/users/user.service.interface";
import { IAuthRepository, IAuthService } from "../modules/authentication/auth.service.interface";
import AuthService from "../modules/authentication/auth.services";
import AuthRepository from "../modules/authentication/auth.repository";
import AuthController from "../modules/authentication/auth.controller";
import { EmailService, IEmailService } from "../common/config/nodemailerConfig";
import { ConfigService, IConfigService } from "../common/config/env";
import { CookieManager, ICookieManager } from "../common/utils/cookieManager";
import FriendshipRepository from "../modules/friendship/frnd.repository";
import FriendshipService from "../modules/friendship/frnd.services";
import FriendshipController from "../modules/friendship/frnd.controller";
import ChatControllers from "../modules/chats/chat.controller";
import ChatServices from "../modules/chats/chat.services";
import ChatRepository from "../modules/chats/chat.repository";
import { IConnectionEventHandler, WebSocketManager } from "../common/websockets/websocket";
import ChatWebSocketHandler from "../modules/chats/chat.websocket";
import UserWebsocketHandler from "../modules/users/users.websocket";
import MessageWebSocketHandler from "../modules/messages/message.websocket";
import NotificationWebSocketHandler from "../modules/notification/notification.websocket";
import MessageControllers from "../modules/messages/message.controller";
import { MessageService } from "../modules/messages/message.services";
import { MessageRepository } from "../modules/messages/message.repository";
import { EventManager } from "../common/config/eventService";
import { MediaService } from "../modules/media/media.services";
import { MediaController } from "../modules/media/media.controller";




const container = new Container();


container.bind<IEmailService>(TYPES.EmailService).to(EmailService)
container.bind<IConfigService>(TYPES.ConfigService).to(ConfigService)
container.bind<ICookieManager>(TYPES.CookieManager).to(CookieManager)

container.bind<IUserService>(TYPES.UserService).to(UserService);
container.bind<IUserRepository>(TYPES.UserRepository).to(UserRepository);
container.bind<UserControllers>(TYPES.UserController).to(UserControllers);

container.bind<IAuthService>(TYPES.AuthService).to(AuthService)
container.bind<AuthRepository>(TYPES.AuthRepository).to(AuthRepository)
container.bind<AuthController>(TYPES.AuthController).to(AuthController)

container.bind<FriendshipRepository>(TYPES.FriendshipRepository).to(FriendshipRepository)
container.bind<FriendshipService>(TYPES.FriendshipService).to(FriendshipService)
container.bind<FriendshipController>(TYPES.FriendshipController).to(FriendshipController)

container.bind<ChatControllers>(TYPES.ChatController).to(ChatControllers)
container.bind<ChatServices>(TYPES.ChatService).to(ChatServices)
container.bind<ChatRepository>(TYPES.ChatRepository).to(ChatRepository)

container.bind<MessageControllers>(TYPES.MessageController).to(MessageControllers)
container.bind<MessageService>(TYPES.MessageService).to(MessageService)
container.bind<MessageRepository>(TYPES.MessageRepository).to(MessageRepository)

container.bind<MediaService>(TYPES.MediaService).to(MediaService)
container.bind<MediaController>(TYPES.MediaController).to(MediaController)



container.bind<WebSocketManager>(TYPES.WebSocketManager).to(WebSocketManager).inSingletonScope()
container.bind<IConnectionEventHandler>(TYPES.ChatWebSocketHandler).to(ChatWebSocketHandler)
container.bind<IConnectionEventHandler>(TYPES.UserWebSocketHandler).to(UserWebsocketHandler)
container.bind<IConnectionEventHandler>(TYPES.MessageWebSocketHandler).to(MessageWebSocketHandler)
container.bind<IConnectionEventHandler>(TYPES.NotificationWebSocketHandler).to(NotificationWebSocketHandler)


container.bind<EventManager>(TYPES.EventManager).to(EventManager).inSingletonScope()

export default container;