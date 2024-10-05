// src/common/websockets/websocket.ts
/// <reference path="../../global.d.ts" />
import { Socket, Server as SocketServer } from "socket.io";
import { Server as HttpServer } from "http";
import { inject, injectable } from "inversify";
import { jwtVerify } from "jose";
import config from "../config/env";
import { TYPES } from "../../inversify/types";

export interface IConnectedUser {
  userId: string | undefined;
  socketId: string;
}

export interface IWebSocketHandler {
  handle(socket: Socket, connectedUsers: Map<string, IConnectedUser>): void;
}

// New interface for connection event handlers
export interface IConnectionEventHandler extends IWebSocketHandler {
  onConnect?(userId: string, socketId: string): void;
  onDisconnect?(userId: string, socket: Socket): void;
}

@injectable()
export class WebSocketManager {
  private io!: SocketServer;
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
    @inject(TYPES.FriendWebSocketHandler)
    private friendHandler: IConnectionEventHandler
  ) {
    this.connectionEventHandlers = [
      this.chatHandler,
      this.userHandler,
      this.messageHandler,
      this.notificationHandler,
      this.friendHandler,
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
      console.log("New User connected: UserID:", userId);

      // Notify handlers of new connection
      this.connectionEventHandlers.forEach((handler) => {
        if (handler.onConnect) {
          handler.onConnect(userId, socket.id);
        }
      });

      // Set up handlers
      this.connectionEventHandlers.forEach((handler) => {
        handler.handle(socket, this.connectedUsers);
      });

      socket.on("disconnect", () => {
        console.log("User disconnected, UserID:", userId);
        this.removeUser(userId);

        // Notify handlers of disconnection
        this.connectionEventHandlers.forEach((handler) => {
          if (handler.onDisconnect) {
            handler.onDisconnect(userId, socket);
          }
        });
      });
    });
  }

  private addUser(userId: string, socketId: string): void {
    this.connectedUsers.set(userId, { userId, socketId });
  }

  private removeUser(userId: string): void {
    this.connectedUsers.delete(userId);
  }
}
