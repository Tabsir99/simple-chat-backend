import { Socket } from "socket.io";
import { TYPES } from "../../inversify/types";
import { inject, injectable } from "inversify";
// import MessageService from "./message.services";
import {
  IConnectedUser,
  IConnectionEventHandler,
} from "../../common/websockets/websocket";
import { MessageService } from "./message.services";
import { Attachment, IMessage } from "./message.interface";
import { validReactionSet } from "../../common/utils/utils";
import { MediaService } from "../media/media.services";

@injectable()
export default class MessageWebSocketHandler
  implements IConnectionEventHandler
{
  constructor(
    @inject(TYPES.MessageService) private messageService: MessageService,
    @inject(TYPES.MediaService) private mediaService: MediaService
  ) {}

  async handle(
    socket: Socket,
    connectedUsers: Map<string, IConnectedUser>
  ): Promise<void> {
    socket.on("chat:focus", async ({ chatRoomId }: { chatRoomId: string }) => {
      const userId = socket.userId;
      if (!userId || !socket.rooms.has(chatRoomId)) return;

      // Update which chat the user is actively viewing
      const userStatus = connectedUsers.get(userId);
      if (userStatus) {
        userStatus.activeChatId = chatRoomId;
        connectedUsers.set(userId, userStatus);

        // Mark messages as read since user is now viewing this chat
        const msgId = await this.messageService.updateMessageRecipt(
          chatRoomId,
          [userId]
        );

        // Notify others that messages have been read
        if (msgId) {
          socket.to(chatRoomId).emit("messageEvent", {
            event: "message:read",
            data: {
              chatRoomId,
              readerId: userId,
              messageId: msgId,
            },
          });
        }
      }

      // console.log("chat focused",userStatus)
    });

    socket.on("chat:unfocus", ({ chatRoomId }: { chatRoomId: string }) => {
      const userId = socket.userId;
      if (!userId || !socket.rooms.has(chatRoomId)) return;

      const userStatus = connectedUsers.get(userId);
      if (userStatus && userStatus.activeChatId === chatRoomId) {
        userStatus.activeChatId = null;
        connectedUsers.set(userId, userStatus);
      }

      // console.log("chat Unfocused",userStatus)
    });

    interface NewMessage {
      chatRoomId: string;
      message: IMessage;
      attachment: Omit<Attachment, "filePath"> | undefined;
    }
    socket.on(
      "message:send",
      async ({ chatRoomId, message, attachment }: NewMessage) => {
        try {
          if (!socket.rooms.has(chatRoomId)) {
            socket.emit("message:status", {
              messageId: message.messageId,
              status: "failed",
              readBy: [],
            });
            return;
          }
          if (!message.content.trim() && !attachment) return;

          const chatRoomMembers = await this.messageService.getChatRoomMembers(
            chatRoomId
          );

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

          console.log("Creating message");
          const [_, signedUrl] = await this.messageService.createMessageInChat(
            chatRoomId,
            message,
            status,
            attachment,
            notReadBy
          );

          console.log("message created");
          // console.log(chatRoomMembers, activeInChatRoom, "From socket")

          this.messageService.updateMessageRecipt(chatRoomId, readBy);

          socket.to(chatRoomId).emit("messageEvent", {
            event: "message:new",
            data: {
              message,
              chatRoomId,
              readBy,
              attachment: attachment
                ? { ...attachment, fileUrl: signedUrl }
                : undefined,
            },
          });

          socket.emit("message:status", {
            status,
            messageId: message.messageId,
            readBy: readBy,
            fileUrl: signedUrl,
          });
          console.log("status sent");
        } catch (error) {
          console.log("message sending failed", error);
          socket.emit("message:status", {
            messageId: message.messageId,
            status: "failed",
          });
        }
      }
    );

    socket.on(
      "message:reaction",
      async ({
        meta: { messageId, reactionType, chatRoomId, username },
        reactions,
      }: {
        meta: {
          messageId: string;
          username: string;
          reactionType: string;
          chatRoomId: string;
        };
        reactions: IMessage["MessageReaction"];
      }) => {
        if (
          !validReactionSet.has(reactionType) ||
          !socket.userId ||
          !socket.rooms.has(chatRoomId)
        )
          return console.log("doesnt includes emoji");
        const result = await this.messageService.addReactionToMessage(
          messageId,
          reactionType,
          socket.userId
        );
        if (result !== false) {
          socket.to(chatRoomId).emit("messageEvent", {
            event: "message:reaction",
            data: {
              reactions,
              messageId,
              chatRoomId,
              username,
              reactionType,
              isDeleting: result === 1,
            },
          });
        }
      }
    );

    // socket.on("message:failed",(ev: {code: "FILE_SIZE_LIMIT"}) => {

    // })
  }
}

const used = process.memoryUsage().heapUsed;

console.log("In KB:", (used / 1024).toFixed(1)); // divide by 1024
console.log("In MB:", (used / (1024 * 1024)).toFixed(1));
