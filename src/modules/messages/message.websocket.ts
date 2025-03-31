import { validReactionSet } from "../../common/utils/utils";
import { WebsocketHandlerParams } from "../../common/websockets/websocket";
import { connectedUsers } from "../../common/websockets/websocket";
import { IMessage } from "./message.interface";
import {
  getChatRoomMembers,
  createMessageInChat,
  addReactionToMessage,
  updateMessage,
  updateMessageRead,
} from "./message.services";

const messageWebsocketHandler = async ({
  socket,
}: WebsocketHandlerParams): Promise<void> => {
  socket.on("chat:focus", async ({ chatRoomId, latestMessageId }) => {
    const userId = socket.userId;
    if (!userId || !socket.rooms.has(chatRoomId)) return;
    // Update which chat the user is actively viewing
    const userStatus = connectedUsers.get(userId);
    if (userStatus) {
      userStatus.activeChatId = chatRoomId;
      connectedUsers.set(userId, userStatus);

      // Mark messages as read since user is now viewing this chat
      const msgId = await updateMessageRead(
        chatRoomId,
        [userId],
        latestMessageId
      );

      // Notify others that messages have been read
      if (msgId) {
        socket.to(chatRoomId).emit("message:read", {
          chatRoomId,
          latestMessageId,
          readerId: userId,
        });
      }
    }
  });

  socket.on("chat:unfocus", ({ chatRoomId }) => {
    const userId = socket.userId;
    if (!userId || !socket.rooms.has(chatRoomId)) return;

    const userStatus = connectedUsers.get(userId);
    if (userStatus && userStatus.activeChatId === chatRoomId) {
      userStatus.activeChatId = null;
      connectedUsers.set(userId, userStatus);
    }
  });

  interface NewMessage {
    chatRoomId: string;
    message: {
      messageId: string;
      sender: IMessage["sender"];
      content?: string;
      parentMessage?: IMessage["parentMessage"];
      fileInfo?: {
        fileName: string;
        fileSize: number;
        fileType: string;
        isVoice: boolean;
      };
    };
  }
  socket.on("message:send", async ({ chatRoomId, message }: NewMessage) => {
    try {
      if (!socket.rooms.has(chatRoomId)) return;
      if (!message.content?.trim() && !message.fileInfo) return;

      const chatRoomMembers = await getChatRoomMembers(chatRoomId);

      const readBy: string[] = [];
      const notReadBy: string[] = [];

      let status: "delivered" | "sent" = "sent";

      for (let i = 0; i < chatRoomMembers.length; i++) {
        if (chatRoomMembers[i].user.userId === message.sender?.userId) {
          readBy.push(chatRoomMembers[i].user.userId);
          continue;
        }
        if (connectedUsers.has(chatRoomMembers[i].user.userId)) {
          const user = connectedUsers.get(chatRoomMembers[i].user.userId);
          if (user && user.activeChatId === chatRoomId) {
            readBy.push(user.userId as string);
          } else {
            notReadBy.push(chatRoomMembers[i].user.userId);
          }
          status = "delivered";
        } else {
          notReadBy.push(chatRoomMembers[i].user.userId);
        }
      }

      const [[msg, _]] = await createMessageInChat(
        chatRoomId,
        message,
        status,
        notReadBy
      );

      updateMessageRead(chatRoomId, readBy, message.messageId);

      socket.to(chatRoomId).emit("message:new", {
        message: {
          messageId: message.messageId,
          createdAt: msg.createdAt,
          senderId: socket.userId as string,
          type: "user",
          ...(message.content && { content: message.content }),
          ...(message.parentMessage && {
            parentMessage: message.parentMessage,
          }),
        },
        chatRoomId,
        readBy,
      });
    } catch (error) {
      console.error("message sending failed", error);
    }
  });

  socket.on("message:reaction", async ({ chatRoomId, messageId, reaction }) => {
    if (
      !validReactionSet.has(reaction) ||
      !socket.userId ||
      !socket.rooms.has(chatRoomId)
    )
      return;
    const result = await addReactionToMessage(
      messageId,
      reaction,
      socket.userId
    );
    if (result !== false) {
      socket.to(chatRoomId).emit("message:reaction", {
        messageId,
        chatRoomId,
        reaction,
      });
    }
  });

  socket.on("message:edit", ({ chatRoomId, content, messageId }) => {
    if (!socket.rooms.has(chatRoomId)) return;

    updateMessage(messageId, content);
    socket.to(chatRoomId).emit("message:edit", {
      messageId,
      chatRoomId,
      content: content!,
    });
  });

  socket.on(
    "message:delete",
    ({ chatRoomId, messageId }: { chatRoomId: string; messageId: string }) => {
      if (!socket.rooms.has(chatRoomId)) return;

      updateMessage(messageId);
      socket.to(chatRoomId).emit("message:delete", {
        messageId,
        chatRoomId,
      });
    }
  );
};

const messageConnectionHandler = {
  handle: messageWebsocketHandler,
  onConnect: undefined,
  onDisconnect: undefined,
};

export default messageConnectionHandler;
