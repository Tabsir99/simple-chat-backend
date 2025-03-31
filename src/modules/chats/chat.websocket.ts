import { Socket } from "socket.io";
import { WebsocketHandlerParams } from "../../common/websockets/websocket";
import * as chatService from "./chat.services";

import { randomUUID } from "crypto";
import { CallData } from "./chat.interface";
import { CallStatus, MessageType } from "@prisma/client";

const activeCalls = new Map<string, CallData>();

async function onConnect(userId: string, socket: Socket): Promise<void> {
  const chatRoomList = await chatService.getChatRoomList(userId);
  chatRoomList.forEach((chatRoom) => socket.join(chatRoom));
}

async function chatWebsocketHandler({
  socket,
}: WebsocketHandlerParams): Promise<void> {
  socket.on("user:typing", (ev) => {
    if (socket.rooms.has(ev.chatRoomId)) {
      socket.to(ev.chatRoomId).emit("user:typing", ev);
    }
  });

  socket.on(
    "call:offer",
    async ({ isVideoCall, offer, to, caller, callId }) => {
      if (!socket.rooms.has(to)) return;

      socket.to(to).emit("call:offer", {
        offer,
        isVideoCall,
        to,
        caller: {
          username: caller.username,
          profilePicture: caller.profilePicture,
        },
        callId,
      });

      const callData: CallData = {
        callId,
        callerId: socket.userId as string,
        chatRoomId: to,
        isVideoCall,
        messageId: randomUUID(),
        status: "initiating",
        participants: [
          {
            userId: socket.userId as string,
            joinedAt: new Date(),
            leftAt: null,
          },
        ],
      };

      activeCalls.set(callId, callData);
    }
  );

  socket.on("call:reject", async ({ callId, to }) => {
    if (!socket.rooms.has(to)) return;

    socket.to(to).emit("call:reject", { callId });

    const callData = activeCalls.get(callId);
    if (callData) {
      const newCallData: CallData = {
        ...callData,
        status: "missed",
        startTime: new Date(),
        endTime: new Date(),
      };

      const newCallEvent = {
        chatRoomId: to,
        message: {
          messageId: newCallData.messageId,
          createdAt: new Date(),
          type: MessageType.call,
          senderId: socket.userId as string,
          callSession: {
            callerId: newCallData.callerId,
            startTime: newCallData.startTime as Date,
            endTime: newCallData.endTime as Date,
            status: newCallData.status as CallStatus,
            isVideoCall: newCallData.isVideoCall,
          },
        },
        readBy: [],
      };

      socket.to(to).emit("message:new", newCallEvent);
      socket.emit("message:new", newCallEvent);
      await chatService.createCallMessage(newCallData);
    }
  });

  socket.on("call:cancel", ({ callId, to }) => {
    if (!socket.rooms.has(to)) return;

    socket.to(to).emit("call:canceled", {
      callId,
    });
  });

  socket.on("call:accept", async ({ answer, to, callId }) => {
    if (!socket.rooms.has(to)) return;

    socket.to(to).emit("call:answered", {
      answer,
      callId,
    });
  });

  socket.on("call:candidate", ({ candidate, chatRoomId }) => {
    socket.to(chatRoomId).emit("call:candidate", {
      candidate,
      chatRoomId,
    });
  });

  socket.on("call:connected", ({ callId }) => {
    const targetCall = activeCalls.get(callId);

    if (targetCall) {
      const updatedCall: CallData = {
        ...targetCall,
        startTime: new Date(),
        status: "ongoing",
        participants: [
          ...targetCall.participants,
          {
            userId: socket.userId as string,
            joinedAt: new Date(),
            leftAt: null,
          },
        ],
      };

      activeCalls.set(callId, updatedCall);
    }
  });

  socket.on("call:end", async ({ callId, to }) => {
    if (!socket.rooms.has(to)) return;

    socket.to(to).emit("call:ended", { callId });

    const callData = activeCalls.get(callId);
    activeCalls.delete(callId);
    if (callData) {
      const updatedCall: CallData = {
        ...callData,
        status: "ended",
        endTime: new Date(),
      };

      const newCallEvent = {
        chatRoomId: to,
        message: {
          messageId: updatedCall.messageId,
          createdAt: new Date(),
          senderId: socket.userId as string,
          type: MessageType.call,
          callSession: {
            callerId: updatedCall.callerId,
            startTime: updatedCall.startTime as Date,
            endTime: updatedCall.endTime as Date,
            status: updatedCall.status as CallStatus,
            isVideoCall: updatedCall.isVideoCall,
          },
        },
        readBy: [],
      };

      socket.to(to).emit("message:new", newCallEvent);
      socket.emit("message:new", newCallEvent);
      await chatService.createCallMessage(updatedCall);
    }
  });
}

const chatConnectionHandler = {
  onConnect,
  handle: chatWebsocketHandler,
  onDisconnect: undefined,
};

export default chatConnectionHandler;
