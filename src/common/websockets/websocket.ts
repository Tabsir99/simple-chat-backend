import { DefaultEventsMap, Socket, Server as SocketServer } from "socket.io";
import { Server as HttpServer } from "http";
import config from "../config/env";
import { Server } from "socket.io";
import { setUpNodeListeners } from "../config/eventService";
import chatConnectionHandler from "../../modules/chats/chat.websocket";
import messageConnectionHandler from "../../modules/messages/message.websocket";
import { setupMiddleware } from "./connectionMiddleware";
import { TypedSocket } from "./validEvents";

export interface IConnectedUser {
  userId: string | undefined;
  socketId: string;
  activeChatId: string | null;
}

export interface WebsocketHandlerParams {
  io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any> | null;
  socket: TypedSocket;
  connectedUsers: Map<string, IConnectedUser>;
}

export interface IWebSocketHandler {
  handle({ io, socket, connectedUsers }: WebsocketHandlerParams): Promise<void>;
}

// New interface for connection event handlers
export interface IConnectionEventHandler extends IWebSocketHandler {
  onConnect?(userId: string, socket: Socket): void;
  onDisconnect?(
    userId: string,
    socket: Socket,
    connectedUsers: Map<string, IConnectedUser>
  ): void;
}

export const connectedUsers = new Map<string, IConnectedUser>();

export const connectionEventHandlers: IConnectionEventHandler[] = [
  chatConnectionHandler,
  messageConnectionHandler,
];

export function initialize(httpServer: HttpServer): void {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: config.baseUrlFrontend,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });
  setupMiddleware(io);
  setupHandlers(io);
  setUpNodeListeners(io);
}

function setupHandlers(io: SocketServer): void {
  io.on("connection", (socket: TypedSocket) => {
    const userId = socket.userId as string;
    addUser(io, userId, socket.id);

    connectionEventHandlers.forEach((handler) => {
      if (handler.onConnect) {
        handler.onConnect(userId, socket);
      }
    });

    connectionEventHandlers.forEach((handler) => {
      handler.handle({
        io: io,
        socket,
        connectedUsers: connectedUsers,
      });
    });

    socket.on("disconnect", () => {
      connectedUsers.delete(userId);
      socket.rooms.clear();

      connectionEventHandlers.forEach((handler) => {
        if (handler.onDisconnect) {
          handler.onDisconnect(userId, socket, connectedUsers);
        }
      });
    });
  });
}

function addUser(io: SocketServer, userId: string, socketId: string): void {
  const currentUser = connectedUsers.get(userId);
  if (currentUser) {
    io.to(currentUser.socketId).emit("closed", "NEW_WINDOW");
    io.in(currentUser.socketId).disconnectSockets(true);
  }

  connectedUsers.set(userId, { userId, socketId, activeChatId: null });
}
