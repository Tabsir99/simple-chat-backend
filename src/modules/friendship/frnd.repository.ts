import { injectable } from "inversify";
import prisma from "../../common/config/db";
import { Prisma } from "@prisma/client";
import { randomUUID } from "crypto";

@injectable()
export default class FriendshipRepository {
  findFriendshipStatusByUsers = async (
    userId: string,
    targetUserId: string
  ) => {
    const [smallerId, LargerId] = [userId, targetUserId].sort();
    return prisma.friendship.findFirst({
      where: {
        userId1: smallerId,
        userId2: LargerId,
      },
      select: {
        status: true,
        senderId: true,
        blockedUserId: true,
      },
    });
  };

  findAllFriendsIdByUser = async (userId: string) => {
    const result: Array<{ friendid: string }> | null = await prisma.$queryRaw`
      SELECT CASE
        WHEN "userId1" = ${userId}::uuid THEN "userId2"
        ELSE "userId1"
      END AS friendid
      FROM "Friendship"
      WHERE ("userId1" = ${userId}::uuid OR "userId2" = ${userId}::uuid)
      AND status = 'accepted';
    `;

    return result?.map((row) => row.friendid);
  };

  findAllConnectionsByUser = async (userId: string) => {
    return await prisma.friendship.findMany({
      where: {
        OR: [{ userId1: userId }, { userId2: userId }],
      },
      select: {
        senderId: true,
        status: true,
        blockedUserId: true,
        user1: {
          select: {
            username: true,
            userId: true,
            profilePicture: true,
          },
        },
        user2: {
          select: {
            username: true,
            userId: true,
            profilePicture: true,
          },
        },
      },
    });
  };

  insertFriendRequest = async (senderId: string, targetUserId: string) => {
    const [smallerId, LargerId] = [senderId, targetUserId].sort();

    return await prisma.$transaction([
      prisma.recentActivity.upsert({
        where: {
          userId: targetUserId,
        },
        create: {
          userId: targetUserId,
          totalNewFriendRequests: 1,
          totalNewUnseenChats: 0,
          unseenAcceptedFriendRequests: 0,
        },
        update: {
          totalNewFriendRequests: {
            increment: 1,
          },
        },
      }),
      prisma.friendship.create({
        data: {
          userId1: smallerId,
          userId2: LargerId,
          senderId: senderId,
          status: "pending",
        },
      }),
    ]);
  };

  deleteFriendship = async (userId: string, targetUserId: string) => {
    const [smallerId, largerId] = [userId, targetUserId].sort();

    return prisma.friendship.deleteMany({
      where: {
        OR: [
          {
            status: "pending",
            senderId: userId,
            userId1: smallerId,
            userId2: largerId,
          },
          {
            status: "blocked",
            blockedUserId: targetUserId,
            userId1: smallerId,
            userId2: largerId,
          },
        ],
      },
    });
  };

  async acceptFriendship(
    userId: string,
    friendId: string
  ): Promise<{ status: string }> {
    const [smallerId, largerId] = [userId, friendId].sort();

    return prisma.$transaction(async (tx) => {
      const updatedFriendship = await tx.friendship.update({
        where: {
          userId1_userId2: { userId1: smallerId, userId2: largerId },
          status: "pending",
          senderId: friendId,
        },
        data: { status: "accepted" },
        select: { status: true },
      });

      await this.findOrCreateChatRoom(tx, smallerId, largerId);

      return updatedFriendship;
    });
  }

  async blockFriendship(
    userId: string,
    friendId: string
  ): Promise<{ status: string }> {
    const [smallerId, largerId] = [userId, friendId].sort();
    return prisma.friendship.update({
      where: {
        userId1_userId2: { userId1: smallerId, userId2: largerId },
        OR: [{ status: "pending", senderId: friendId }, { status: "accepted" }],
      },
      data: {
        status: "blocked",
        blockedUserId: friendId,
      },
      select: { status: true },
    });
  }

  private async findOrCreateChatRoom(
    tx: Prisma.TransactionClient,
    userId1: string,
    userId2: string
  ): Promise<{ chatRoomId: string }> {
    const existingChatRoom = await tx.chatRoom.findFirst({
      where: {
        isGroup: false,
        ChatRoomMember: {
          every: {
            userId: { in: [userId1, userId2] },
          },
        },
      },
      select: { chatRoomId: true },
    });

    if (existingChatRoom) {
      return existingChatRoom;
    }

    const room = await tx.chatRoom.create({
      data: {
        isGroup: false,
        roomName: "",
        ChatRoomMember: {
          create: [
            { userId: userId1, userRole: "member" },
            { userId: userId2, userRole: "member" },
          ],
        },

      },
      select: { chatRoomId: true },
    });

    await tx.message.create({
      data: {
        content: "Welcome to the Chat!",
        type: "system",
        chatRoomId: room.chatRoomId,
        LastMessageFor: { connect: { chatRoomId: room.chatRoomId } },
        MessageReceipt: {
          createMany: {
            data: [
              { chatRoomId: room.chatRoomId, userId: userId1 },
              { chatRoomId: room.chatRoomId, userId: userId2 },
            ],
          },
        },
      },
    });

    return room;
  }
}
