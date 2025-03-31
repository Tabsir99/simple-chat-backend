import prisma from "../../common/config/db";
import { randomUUID } from "crypto";
import { MessageType, Prisma } from "@prisma/client";
import { ChatError } from "../../common/errors/chatErrors";
import { CallData } from "./chat.interface";

export const findChatsByUserId = async (userId: string) => {
  try {
    const chatRooms = await prisma.chatRoomMember.findMany({
      where: {
        userId: userId,
      },
      select: {
        chatRoomId: true,
        chatClearedAt: true,
        joinedAt: true,
        removedAt: true,
        unreadCount: true,

        chatRoom: {
          select: {
            isGroup: true,
            ChatRoomMember: {
              where: {
                userId: {
                  not: userId,
                },
              },
              select: {
                nickName: true,
                userId: true,
                readAt: true,
                user: {
                  select: {
                    userStatus: true,
                    profilePicture: true,
                    lastActive: true,
                  },
                },
              },
            },
            roomName: true,
            roomImage: true,
            lastMessage: {
              select: {
                content: true,
                createdAt: true,
                senderId: true,
                sender: {
                  select: {
                    username: true,
                  },
                },
                attachment: true,
                type: true,
              },
            },
          },
        },
      },
    });

    return chatRooms;
  } catch (error) {
    console.error("Error fetching chat rooms:", error);
    return [];
  }
};

export const findUserChatroomStatus = async (userId: string) => {
  const status = await prisma.chatRoomMember.findMany({
    where: {
      userId: userId,
    },
    select: {
      chatRoomId: true,
      unreadCount: true,
      removedAt: true,
    },
  });

  return status;
};

export const createChat = async (
  currentUserId: string,
  users: {
    userId: string;
    username: string;
  }[],
  groupName: string
) => {
  return await prisma.$transaction(async (tx) => {
    const chatRoom = await tx.chatRoom.create({
      data: {
        isGroup: users.length > 2,
        createdBy: currentUserId,
        roomName: groupName,

        ChatRoomMember: {
          createMany: {
            data: users.map((user) => ({
              userId: user.userId,
              userRole: user.userId === currentUserId ? "admin" : "member",
              nickName: user.username,
            })),
          },
        },
      },

      select: {
        chatRoomId: true,
        isGroup: true,
        roomName: true,
        createdBy: true,
        roomImage: true,
      },
    });

    await tx.message.create({
      data: {
        content: `${
          users.find((user) => user.userId === currentUserId)?.username
        } created the group.`,
        type: "system",
        chatRoomId: chatRoom.chatRoomId,
        LastMessageFor: { connect: { chatRoomId: chatRoom.chatRoomId } },
      },
    });

    return { chatRoom };
  });
};

export const getChatRoomMembers = async (
  chatRoomId: string,
  userId: string
) => {
  return await prisma.chatRoom.findUnique({
    where: {
      chatRoomId: chatRoomId,
      ChatRoomMember: {
        some: {
          userId: userId,
        },
      },
    },
    select: {
      createdBy: true,
      ChatRoomMember: {
        select: {
          removedAt: true,
          userRole: true,
          nickName: true,
          user: {
            select: {
              username: true,
              userId: true,
              profilePicture: true,
              userStatus: true,
            },
          },
        },
      },
    },
  });
};

export const getChatRoomListByUserId = async (userId: string) => {
  const res = await prisma.chatRoomMember.findMany({
    where: {
      userId: userId,
      removedAt: null,
    },
    select: {
      chatRoomId: true,
    },
  });
  return res;
};

export const updateGroupMemberRole = async (
  chatRoomId: string,
  userId: string,
  userRole: "admin" | "member",
  message: string
) => {
  const uuid = randomUUID();
  await prisma.chatRoomMember.update({
    where: {
      chatRoomId_userId: {
        chatRoomId: chatRoomId,
        userId: userId,
      },
      userRole: {
        not: userRole,
      },
    },
    data: {
      userRole: userRole,
      chatRoom: {
        update: {
          Messages: {
            create: {
              content: message,
              messageId: uuid,
              type: "system",
              status: "delivered",
            },
          },
        },
      },
    },
    select: {
      userRole: true,
    },
  });
  return {
    messageId: uuid,
    content: message,
    createdAt: new Date(),
  };
};

export const updateGroupMember = async (
  chatRoomId: string,
  userId: string,
  message: string,
  nickname: string,
  currentUserName: string
) => {
  const uuid = randomUUID();
  await prisma.chatRoomMember.update({
    where: {
      chatRoomId_userId: {
        chatRoomId: chatRoomId,
        userId: userId,
      },
    },
    data: {
      nickName: nickname,
      chatRoom: {
        update: {
          Messages: {
            create: {
              content: message,
              messageId: uuid,
              type: "system",
              status: "delivered",
            },
          },
        },
      },
    },
    select: {
      nickName: true,
    },
  });

  return {
    messageId: uuid,
    createdAt: new Date(),
    content: message,
  };
};

export const findChatRoom = async (userId: string, chatRoomId: string) => {
  return await prisma.chatRoomMember.findUnique({
    where: {
      chatRoomId_userId: {
        chatRoomId: chatRoomId,
        userId: userId,
      },
    },
    select: {
      chatClearedAt: true,
      joinedAt: true,
      removedAt: true,
    },
  });
};

export const deleteGroupMember = async (
  chatRoomId: string,
  userId: string,
  messageContent: string
) => {
  

  const result = await prisma.$transaction(async (tx) => {
    const message = await tx.message.create({
      data: {
        content: messageContent,
        type: "system",
        chatRoomId: chatRoomId,
      },
      select: {
        content: true,
        createdAt: true,
        messageId: true,
      },
    });

    const removalTime = new Date(message.createdAt.getTime() + 50);
    await tx.$executeRaw`
          UPDATE "ChatRoomMember"
          SET 
              "removedAt" = ${removalTime},
              "unreadCount" = 0,
              "nickName" = null,
              "userRole" = 'member'
          WHERE 
              "chatRoomId" = ${chatRoomId}::uuid
              AND "userId" = ${userId}::uuid
`;
    return message;
  });
  return result;
};

export const clearChat = async (chatRoomId: string, userId: string) => {
  return await prisma.chatRoomMember.update({
    where: {
      chatRoomId_userId: {
        chatRoomId: chatRoomId,
        userId: userId,
      },
    },
    data: {
      chatClearedAt: new Date(),
      unreadCount: 0,
    },
    select: {
      chatClearedAt: true,
    },
  });
};

export const addGroupMember = async (
  data: { chatRoomId: string; users: { userId: string; username: string }[] },
  currentUsername: string
) => {
  let messageContent = "";
  if (data.users.length === 1) {
    messageContent = `${currentUsername} added ${data.users[0].username} to the group`;
  } else if (data.users.length === 2) {
    messageContent = `${currentUsername} added ${data.users[0].username} and ${data.users[1].username} to the group`;
  } else {
    messageContent = `${currentUsername} added ${data.users[0].username}, ${
      data.users[1].username
    } and ${data.users.length - 2} other person${
      data.users.length - 2 > 1 ? "s" : ""
    } to the group`;
  }

  let chatRoomMemberValues: Prisma.Sql[] = [];
  let userIds: string[] = [];
  const uuid = randomUUID();

  for (let i = 0; i < data.users.length; i++) {
    chatRoomMemberValues.push(
      Prisma.sql`(${data.chatRoomId}::uuid, ${data.users[i].userId}::uuid)`
    );
    userIds.push(data.users[i].userId);
  }

  await prisma.$transaction(async (tx) => {
    const existingValidMembers = await tx.chatRoomMember.findMany({
      where: {
        chatRoomId: data.chatRoomId,
        userId: { in: userIds },
      },
      select: {
        removedAt: true,
      },
    });

    if (existingValidMembers.find((m) => m.removedAt === null)) {
      throw ChatError.memberAlreadyExists();
    }

    await tx.$executeRaw`
      WITH inserted_members AS (
      INSERT INTO "ChatRoomMember" ("chatRoomId", "userId")
      VALUES ${Prisma.join(chatRoomMemberValues)}
      ON CONFLICT ("chatRoomId", "userId") 
      DO UPDATE SET
        "joinedAt" = CURRENT_TIMESTAMP(3),
        "removedAt" = NULL,
        "unreadCount" = 0,
        "userRole" = 'member'
      RETURNING "userId"
    ),
    inserted_message AS (
      INSERT INTO "Message" ("messageId", "chatRoomId", "content", "type")
      VALUES (
        ${uuid}::uuid, 
        ${data.chatRoomId}::uuid,
        ${messageContent},
        'system'
      )
      RETURNING "messageId"
    ),
    message_receipt AS (
      INSERT INTO "MessageReceipt" ("userId","chatRoomId","lastReadMessageId")
      SELECT m."userId", ${data.chatRoomId}::uuid, msg."messageId"
      FROM inserted_members m
      CROSS JOIN inserted_message msg
      ON CONFLICT ("userId","chatRoomId")
      DO NOTHING
      RETURNING "userId"
    )
    UPDATE "ChatRoom"
    SET "lastMessageId" = (SELECT "messageId" FROM inserted_message)
    WHERE "chatRoomId" = ${data.chatRoomId}::uuid
  `;
  });

  return { messageId: uuid, content: messageContent, createdAt: new Date() };
};

export const findUserPermission = async (
  userId: string,
  chatRoomId: string
) => {
  return await prisma.chatRoomMember.findFirst({
    where: {
      chatRoomId: chatRoomId,
      userId: userId,
    },
    select: {
      userRole: true,
      joinedAt: true,
      chatClearedAt: true,
      removedAt: true,
      user: {
        select: { username: true },
      },
    },
  });
};

export const updateChat = async (
  chatRoomId: string,
  content: string,
  data?: string,
  url?: string
) => {
  return await prisma.$transaction(async (tx) => {
    const newMessage = await tx.message.create({
      data: {
        content: content,
        type: "system",
        chatRoomId: chatRoomId,
      },
      select: {
        messageId: true,
        createdAt: true,
        content: true,
      },
    });

    await tx.chatRoom.update({
      where: {
        chatRoomId: chatRoomId,
      },
      data: {
        ...(data && { roomName: data }),
        ...(url && { roomImage: url }),
        lastActivity: new Date(),
        lastMessageId: newMessage.messageId,
      },
    });

    return newMessage;
  });
};

export const createCallMessage = async (callData: CallData) => {
  await prisma.message.create({
    data: {
      chatRoomId: callData.chatRoomId,
      type: MessageType.call,

      CallSession: {
        create: {
          chatRoomId: callData.chatRoomId,
          isVideoCall: callData.isVideoCall,
          status: callData.status as any,
          callerId: callData.callerId,
          startTime: callData.startTime!,
          endTime: callData.endTime!,
          callId: callData.callId,
          CallParticipant: {
            createMany: {
              data: callData.participants as any,
            },
          },
        },
      },
      LastMessageFor: { connect: { chatRoomId: callData.chatRoomId } },
    },
    select: {
      messageId: true,
    },
  });
};
