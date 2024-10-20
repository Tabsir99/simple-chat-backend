import { Socket } from "socket.io";
import { TYPES } from "../../inversify/types";
import { inject, injectable } from "inversify";
// import MessageService from "./message.services";
import { IConnectedUser } from "../../common/websockets/websocket";
import redisClient from "../../common/config/redisConfig";
import { MessageService } from "./message.services";
import { IMessage } from "./message.interface";
import { $Enums } from "@prisma/client";

@injectable()
export default class MessageWebSocketHandler {
  constructor(
    @inject(TYPES.MessageService) private messageService: MessageService
  ) {}

  async handle(
    socket: Socket,
    connectedUsers: Map<string, IConnectedUser>
  ): Promise<void> {
    socket.on("chat:focus", async ({ chatRoomId, profilePicture, readerName}: { chatRoomId: string, profilePicture: string, readerName: string }) => {
      const userId = socket.userId;
      if (!userId || !socket.rooms.has(chatRoomId)) return;

      // Update which chat the user is actively viewing
      const userStatus = connectedUsers.get(userId);
      if (userStatus) {
        userStatus.activeChatId = chatRoomId;
        connectedUsers.set(userId, userStatus);

        // Mark messages as read since user is now viewing this chat
        const message = await this.messageService.createMessageRecipt(chatRoomId, userId, "read");

        // Notify others that messages have been read
        if(message){

        socket.to(chatRoomId).emit("messageEvent", {
          event: "message:read",
          data: {
            chatRoomId,
            readerId: userId,
            profilePicture,
            readerName,
            messageId: message.lastReadMessageId
          },
        });}
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

    socket.on(
      "message:send",
      async ({
        chatRoomId,
        message,
      }: {
        chatRoomId: string;
        message: IMessage;
      }) => {
        try {
          if (!socket.rooms.has(chatRoomId)) {
            socket.emit("message:status", {
              messageId: message.messageId,
              status: "failed",
            });
            return;
          }

          const chatRoomMembers = await this.messageService.getChatRoomMembers(
            chatRoomId,
            message.sender.senderId
          );

          const activeRecipients = chatRoomMembers
            .filter((member) => member.user.userId !== message.sender.senderId)
            .filter((member) => {
              const userStatus = connectedUsers.get(member.user.userId);
              return userStatus?.activeChatId === chatRoomId;
            });

          let status: "read" | "delivered" | "sent";
          if (activeRecipients.length > 0) {
            status = "read";
          } else if (
            chatRoomMembers.some((member) =>
              connectedUsers.has(member.user.userId)
            )
          ) {
            status = "delivered";
          } else {
            status = "sent";
          }

          await this.messageService.createMessageInChat(
            chatRoomId,
            message,
            status
          );

          const readBy: {
            readerId: string;
            readerName: string;
            profilePicture: string | null;
          }[] =
            status === "read"
              ? chatRoomMembers.map((recipient) => ({
                  readerId: recipient.user.userId,
                  readerName: recipient.user.username,
                  profilePicture: recipient.user.profilePicture,
                }))
              : [];

              console.log(readBy)
          readBy.length > 0
            ? readBy.forEach(async (d) =>
                this.messageService.createMessageRecipt(chatRoomId, d.readerId, status)
              )
            : this.messageService.createMessageRecipt(
                chatRoomId,
                message.sender.senderId,
                status
              );

          socket.to(chatRoomId).emit("messageEvent", {
            event: "message:new",
            data: {
              chatRoomId,
              message: {
                ...message,
                readBy: readBy,
                status,
              },
            },
          });

          // console.log("Has online ?",hasOnlineMembers)
          socket.emit("message:status", {
            messageId: message.messageId,
            readBy: readBy,
            status: status,
          });
        } catch (error) {
          console.log("message sending failed", error);
          socket.emit("message:status", {
            messageId: message.messageId,
            status: "failed",
          });
        }
      }
    );
  }
}
