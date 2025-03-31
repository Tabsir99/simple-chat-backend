import { Server } from "socket.io";
import EventEmitter from "events";
import { connectedUsers } from "../websockets/websocket";
export const eventManager = new EventEmitter();

export const setUpNodeListeners = (io: Server) => {
  eventManager.on(
    "chatRoom:create",
    (data: {
      chatRoomId: string;
      users: { username: string; userId: string }[];
      currentUserId: string;
    }) => {
      data?.users.forEach((user) => {
        const connectedUser = connectedUsers.get(user.userId);
        if (connectedUser) {
          io.in(connectedUser.socketId).socketsJoin(data.chatRoomId);
        }
      });

      io.to(data.chatRoomId)
        .except(connectedUsers.get(data.currentUserId)?.socketId || "")
        .emit("chatEvent", { event: "chatRoom:create", data: null });
    }
  );

  interface MinifiedMessage {
    messageId: string;
    sender: {
      userId: string;
      username: string;
    };
  }
  interface MessageNewPayload {
    chatRoomId: string;
    currentUserId: string;
    message: MinifiedMessage;
  }
  eventManager.on(
    "message:new",
    ({ chatRoomId, currentUserId, message }: MessageNewPayload) => {
      io.to(chatRoomId)
        .except(connectedUsers.get(currentUserId)?.socketId || "")
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
    }
  );

  interface MemberRemovePayload {
    chatRoomId: string;
    userId: string;
    currentUserId: string;
  }
  eventManager.on(
    "member:remove",
    async ({ chatRoomId, userId, currentUserId }: MemberRemovePayload) => {
      io.to(chatRoomId)
        .except(connectedUsers.get(currentUserId)?.socketId || "")
        .emit("chatEvent", {
          event: "member:remove",
          data: { chatRoomId: chatRoomId, userId: userId },
        });

      io.in(connectedUsers.get(userId)?.socketId || "").socketsLeave(
        chatRoomId
      );
    }
  );

  interface ChatRoomUpdatePayload {
    chatRoomId: string;
    data: any;
    currentUserId: string;
  }
  eventManager.on(
    "chatRoom:update",
    ({ chatRoomId, currentUserId, data }: ChatRoomUpdatePayload) => {
      io.to(chatRoomId)
        .except(currentUserId)
        .emit("chatEvent", {
          event: "chatRoom:update",
          data: {
            ...data,
            chatRoomId,
          },
        });
    }
  );

  interface MemberAddPayload {
    chatRoomId: string;
    users: string[];
    currentUserId: string;
  }
  eventManager.on("member:add", async (ev: MemberAddPayload) => {
    for (let index = 0; index < ev.users.length; index++) {
      const connectedUser = connectedUsers.get(ev.users[index]);
      if (connectedUser) {
        io.in(connectedUser.socketId).socketsJoin(ev.chatRoomId);
      }
    }
    io.to(ev.chatRoomId)
      .except(connectedUsers.get(ev.currentUserId)?.socketId || "")
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

  eventManager.on("member:update", (payload: MemberUpdatePayload) => {
    const connectedUser = connectedUsers.get(payload.data.currentUserId);

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
