import { injectable } from "inversify";
import prisma from "../../common/config/db";

@injectable()
export default class FriendshipRepository {
  findFriendshipByUsers = async (userId: string, targetUserId: string) => {
    const [smallerId, LargerId] = [userId, targetUserId].sort();
    return prisma.friendship.findFirst({
      where: {
        userId1: smallerId,
        userId2: LargerId,
      },
      select: {
        status: true,
        senderId: true,
      },
    });
  };

  findAllFriendsByUser = async (userId: string) => {
    const result: Array<{friendid: string}> | null = await prisma.$queryRaw`
      SELECT CASE
        WHEN "userId1" = ${userId}::uuid THEN "userId2"
        ELSE "userId1"
      END AS friendid
      FROM "Friendship"
      WHERE ("userId1" = ${userId}::uuid OR "userId2" = ${userId}::uuid)
      AND status = 'accepted';
    `;

    return result?.map(row => row.friendid)
  };
  

  updateFriendshipStatus = async (
    userId: string,
    targetUserId: string,
    status: "accepted" | "blocked"
  ) => {
    const [smallerId, LargerId] = [userId, targetUserId].sort();
    return prisma.friendship.update({
      where: {
        userId1_userId2: { userId1: smallerId, userId2: LargerId },
        status: "pending",
      },
      data: {
        status: status,
      },
      select: {
        status: true
      }
    });
  };

  insertFriendRequest = async (senderId: string, targetUserId: string) => {
    const [smallerId, LargerId] = [senderId, targetUserId].sort();

    return prisma.friendship.create({
      data: {
        userId1: smallerId,
        userId2: LargerId,
        senderId: senderId,
        status: "pending",
      },
    });
  };

  deleteFriendship = async (userId: string, targetUserId: string) => {
    const [smallerId, LargerId] = [userId, targetUserId].sort();
    return prisma.friendship.delete({
      where: {
        userId1_userId2: {
          userId1: smallerId,
          userId2: LargerId,
        },
        status: "blocked",
      },
    });
  };
}
