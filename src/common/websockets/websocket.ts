// src/common/websockets/websocket.ts
/// <reference path="../../global.d.ts" />
import { Socket, Server as SocketServer } from "socket.io";
import { Server as HttpServer } from "http";
import { inject, injectable } from "inversify";
import { jwtVerify } from "jose";
import config from "../config/env";
import { TYPES } from "../../inversify/types";
import { EventManager } from "../config/eventService";

export interface IConnectedUser {
  userId: string | undefined;
  socketId: string;
  activeChatId: string | null
}

export interface IWebSocketHandler {
  handle(socket: Socket, connectedUsers: Map<string, IConnectedUser>): Promise<void>;
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

@injectable()
export class WebSocketManager {
  private io: SocketServer | null = null;
  private connectedUsers: Map<string, IConnectedUser> = new Map();
  private connectionEventHandlers: IConnectionEventHandler[] = [];

  constructor(
    @inject(TYPES.ChatWebSocketHandler)
    private chatHandler: IConnectionEventHandler,
    @inject(TYPES.UserWebSocketHandler)
    private userHandler: IConnectionEventHandler,
    @inject(TYPES.MessageWebSocketHandler)
    private messageHandler: IConnectionEventHandler,
    @inject(TYPES.NotificationWebSocketHandler)
    private notificationHandler: IConnectionEventHandler,
    @inject(TYPES.EventManager) private eventManager: EventManager
  ) {
    this.connectionEventHandlers = [
      this.chatHandler,
      this.userHandler,
      this.messageHandler,
      this.notificationHandler,
    ];
  }

  initialize(httpServer: HttpServer): void {
    this.io = new SocketServer(httpServer, {
      cors: {
        origin: config.baseUrlFrontend,
        methods: ["GET", "POST"],
        credentials: true,
      },
    });
    this.setupMiddleware();
    this.setupHandlers();
    this.setUpNodeListeners()
  }

  private setupMiddleware(): void {
    if (!this.io) {
      throw new Error("Socket server not initialized");
    }

    this.io.use(async (socket, next) => {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error("No Token provided"));
      }
      try {
        const payload = await jwtVerify(
          token,
          new TextEncoder().encode(config.jwtSecretAccess)
        );
        const userId = payload.payload.userId as string;
        socket.userId = userId;
      } catch (error) {
        console.log(error);
        return next(new Error("Token verification failed"));
      }

      next();
    });
  }

  private setupHandlers(): void {
    if (!this.io) {
      throw new Error("Socket server not initialized");
    }
    this.io.on("connection", (socket: Socket) => {
      const userId = socket.userId as string;
      this.addUser(userId, socket.id);

      // Notify handlers of new connection
      this.connectionEventHandlers.forEach((handler) => {
        if (handler.onConnect) {
          handler.onConnect(userId, socket);
        }
      });

      // Set up handlers
      this.connectionEventHandlers.forEach((handler) => {
        handler.handle(socket, this.connectedUsers);
      });

      socket.on("disconnect", () => {
        // console.log("User disconnected, UserID:", userId);
        this.removeUser(userId);
        socket.rooms.clear()
        // Notify handlers of disconnection
        this.connectionEventHandlers.forEach((handler) => {
          if (handler.onDisconnect) {
            handler.onDisconnect(userId, socket, this.connectedUsers);
          }
        });
      });
    });
  }

  private addUser(userId: string, socketId: string): void {
    this.connectedUsers.set(userId, { userId, socketId, activeChatId: null });
  }

  private removeUser(userId: string): void {
    this.connectedUsers.delete(userId);
  }

  private setUpNodeListeners = () => {
    const io = this.io
    if(!io) return
    this.eventManager.on<{chatRoomId: string, users: {username: string, userId: string}[]}>("chatRoom:create",(data) => {
      data?.users.forEach(user => {
        const connectedUser = this.connectedUsers.get(user.userId)
        console.log(connectedUser)
        if(connectedUser){
          this.io?.in(connectedUser.socketId).socketsJoin(data.chatRoomId)
        }
      })
    })
  }
  sendMessage({
    event,
    message,
    users,
  }: {
    event: string;
    message: {
      event: string,
      data: any
    };
    users: string | string[];
  }) {
    const io = this.io
    if (!io) {
      console.error("Socket server not initialized");
      return;
    }
    
    if (typeof users === "string") {
      const targetUser = this.connectedUsers.get(users);
      if (targetUser) {
        io.to(targetUser.socketId).emit(event, message);
      }
    } 
    else {
      users.forEach(user => {
        const targetUser = this.connectedUsers.get(user);
        if (targetUser) {
          io.to(targetUser.socketId).emit(event, message);
        }
      });
    }
  }

  getSocket = () => {
    if (!this.io) return;
    return this.io;
  };
}
