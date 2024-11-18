// src/common/websockets/websocket.ts
/// <reference path="../../global.d.ts" />
import { DefaultEventsMap, Socket, Server as SocketServer } from "socket.io";
import { Server as HttpServer } from "http";
import { inject, injectable } from "inversify";
import { jwtVerify } from "jose";
import config from "../config/env";
import { TYPES } from "../../inversify/types";
import { EventManager } from "../config/eventService";
import { Server } from "socket.io";
import { MinifiedMessage } from "../../modules/messages/message.interface";

export interface IConnectedUser {
  userId: string | undefined;
  socketId: string;
  activeChatId: string | null;
}

export interface WebsocketHandlerParams {
  io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any> | null;
  socket: Socket;
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
    this.setUpNodeListeners();
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
        console.log("websocket middleware running, token provided\n", token);
        const payload = await jwtVerify(
          token,
          new TextEncoder().encode(config.jwtSecretAccess)
        );
        const userId = payload.payload.userId as string;

        const expiryDate = new Date((payload.payload.exp as number) * 1000);
        console.log("Token expires at:", expiryDate.toLocaleString("en-US",{
          timeZone: "Asia/Dhaka"
        }));
        
        socket.userId = userId;
      } catch (error) {
        console.error(
          error instanceof Error && `${error.message} from websocket`
        );
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

      this.connectionEventHandlers.forEach((handler) => {
        if (handler.onConnect) {
          handler.onConnect(userId, socket);
        }
      });

      this.connectionEventHandlers.forEach((handler) => {
        handler.handle({
          io: this.io,
          socket,
          connectedUsers: this.connectedUsers,
        });
      });

      socket.on("disconnect", () => {
        this.removeUser(userId);
        socket.rooms.clear();

        this.connectionEventHandlers.forEach((handler) => {
          if (handler.onDisconnect) {
            handler.onDisconnect(userId, socket, this.connectedUsers);
          }
        });
      });
    });
  }

  private addUser(userId: string, socketId: string): void {
    if (!this.io) return;
    const currentUser = this.connectedUsers.get(userId);
    if (currentUser) {
      this.io.to(currentUser.socketId).emit("closed", "NEW_WINDOW");
      this.io.in(currentUser.socketId).disconnectSockets(true);
    }

    this.connectedUsers.set(userId, { userId, socketId, activeChatId: null });
  }

  private removeUser(userId: string): void {
    this.connectedUsers.delete(userId);
  }

  private setUpNodeListeners = () => {
    const io = this.io;
    if (!io) return;
    this.eventManager.on<{
      chatRoomId: string;
      users: { username: string; userId: string }[];
      currentUserId: string;
    }>("chatRoom:create", (data) => {
      data?.users.forEach((user) => {
        const connectedUser = this.connectedUsers.get(user.userId);
        if (connectedUser) {
          io.in(connectedUser.socketId).socketsJoin(data.chatRoomId);
        }
      });

      io.to(data.chatRoomId)
        .except(this.connectedUsers.get(data.currentUserId)?.socketId || "")
        .emit("chatEvent", { event: "chatRoom:create", data: null });
    });

    this.eventManager.on<{
      chatRoomId: string;
      currentUserId: string;
      message: MinifiedMessage;
    }>("message:new", ({ chatRoomId, currentUserId, message }) => {
      io.to(chatRoomId)
        .except(this.connectedUsers.get(currentUserId)?.socketId || "")
        .emit("messageEvent", {
          event: "message:new",
          data: {
            chatRoomId,
            message: {
              ...message,
              type: "system",
            },
          },
        });
    });

    this.eventManager.on<{
      chatRoomId: string;
      userId: string;
      currentUserId: string;
    }>("member:remove", async ({ chatRoomId, userId, currentUserId }) => {
      io.to(chatRoomId)
        .except(this.connectedUsers.get(currentUserId)?.socketId || "")
        .emit("chatEvent", {
          event: "member:remove",
          data: { chatRoomId: chatRoomId, userId: userId },
        });

      io.in(this.connectedUsers.get(userId)?.socketId || "").socketsLeave(
        chatRoomId
      );
    });

    this.eventManager.on<{
      chatRoomId: string;
      data: any;
      currentUserId: string;
    }>("chatRoom:update", ({ chatRoomId, currentUserId, data }) => {
      io.to(chatRoomId)
        .except(currentUserId)
        .emit("chatEvent", {
          event: "chatRoom:update",
          data: {
            ...data,
            chatRoomId,
          },
        });
    });
    this.eventManager.on<{
      chatRoomId: string;
      users: string[];
      currentUserId: string;
    }>("member:add", async (ev) => {
      for (let index = 0; index < ev.users.length; index++) {
        const connectedUser = this.connectedUsers.get(ev.users[index]);
        if (connectedUser) {
          io.in(connectedUser.socketId).socketsJoin(ev.chatRoomId);
        }
      }
      io.to(ev.chatRoomId)
        .except(this.connectedUsers.get(ev.currentUserId)?.socketId || "")
        .emit("chatEvent", {
          event: "member:add",
          data: {
            chatRoomId: ev.chatRoomId,
            users: ev.users,
          },
        });
    });
    type MemberUpdatePayload =
      | {
          type: "role";
          data: {
            targetUserId: string;
            chatRoomId: string;
            userRole: "admin" | "member";
            currentUserId: string;
          };
        }
      | {
          type: "nickname";
          data: {
            chatRoomId: string;
            targetUserId: string;
            currentUserId: string;
            nickname: string;
          };
        };
    this.eventManager.on<MemberUpdatePayload>("member:update", (payload) => {
      const connectedUser = this.connectedUsers.get(payload.data.currentUserId);

      if (payload.type === "role") {
        io.to(payload.data.chatRoomId)
          .except(connectedUser?.socketId || "")
          .emit("chatEvent", {
            event: "role:update",
            data: {
              userId: payload.data.targetUserId,
              chatRoomId: payload.data.chatRoomId,
              userRole: payload.data.userRole,
            },
          });
      }

      if (payload.type === "nickname") {
        io.to(payload.data.chatRoomId)
          .except(connectedUser?.socketId || "")
          .emit("chatEvent", {
            event: "nickname:update",
            data: {
              userId: payload.data.targetUserId,
              chatRoomId: payload.data.chatRoomId,
              nickname: payload.data.nickname,
            },
          });
      }
    });
  };
  sendMessage({
    event,
    message,
    users,
  }: {
    event: string;
    message: {
      event: string;
      data: any;
    };
    users: string;
  }) {
    const io = this.io;
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
  }

  getSocket = () => {
    if (!this.io) return;
    return this.io;
  };
}
