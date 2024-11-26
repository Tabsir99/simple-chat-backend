import { inject, injectable } from "inversify";
import { TYPES } from "../../inversify/types";
import { $Enums, FriendshipStatus } from "@prisma/client";
import redisClient from "../../common/config/redisConfig";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { IFriendshipRepository, IFriendshipService } from "./frnd.interface";

@injectable()
export default class FriendshipService implements IFriendshipService {
  constructor(
    @inject(TYPES.FriendshipRepository)
    private friendshipRepository: IFriendshipRepository,
  ) {}

  // Method to get the friendship status between two users
  getFriendStatusAndCount = async (userId: string, targetUserId: string) => {
    try {
      let friendshipStatus: {
        status: $Enums.FriendshipStatus;
        senderId: string;
        blockedUserId: string | null;
      } | null = null;
      if (userId !== targetUserId) {
        friendshipStatus =
          await this.friendshipRepository.findFriendshipStatusByUsers(
            userId,
            targetUserId
          );
      }

      let friendsCount = await this.getFriendIdList(userId);

      return {
        data: {
          status: friendshipStatus?.status || "canceled" as FriendshipStatus,
          count: friendsCount?.length || 0,
          senderId: friendshipStatus?.senderId || "",
          blockedUserId: friendshipStatus?.blockedUserId || "",
        },
        message: `Friendship status between ${userId} and ${targetUserId} found.`,
      };
    } catch (error) {
      console.error("Error fetching friendship status:", error);
      throw new Error(
        "Unable to retrieve friendship status. Please try again later."
      );
    }
  };

  handleFriendRequest = async (
    userId: string,
    friendId: string,
    status: Omit<FriendshipStatus,"pending">
  ) => {
    try {
      if (status === "canceled") {
        const result = await this.friendshipRepository.deleteFriendship(
          userId,
          friendId
        );

        if (result.count === 0) {
          throw new Error("No friendship found");
        }
        return {status: "canceled", chatRoomId: null};
      }

      let response: {
        status: string;
        chatRoomId: string | null;
      } | null = null;
      if (status === "accepted") {
        response = await this.friendshipRepository.acceptFriendship(
          userId,
          friendId
        );

        (async () => {
          await redisClient
            .pipeline()
            .del(`${userId}:friends`)
            .del(`${friendId}:friends`)
            .exec();
        })();
      }

      if (status === "blocked") {
        response = await this.friendshipRepository.blockFriendship(
          userId,
          friendId
        );
      }
      return response;
      
    } catch (error) {
      console.error(error, "FROM FRND SERVICE HANDLE FRIEND REQUEST");
      if (error instanceof PrismaClientKnownRequestError) {
        return null;
      }
      return null;
    }
  };

  createFriendRequest = async (senderId: string, targetUserId: string) => {
    try {
      await this.friendshipRepository.insertFriendRequest(
        senderId,
        targetUserId
      );

      return true;
    } catch (error) {
      console.error(error, " FROM FRND SERVICE CREATE FRND REQ");
      return false;
    }
  };

  getFriendIdList = async (userId: string) => {
    try {
      let result: string[] | undefined;
      const friendsCountCache = await redisClient.get(`${userId}:friends`);

      if (!friendsCountCache) {
        const friendsCount =
          await this.friendshipRepository.findAllFriendsIdByUser(userId);

        redisClient.setex(
          `${userId}:friends`,
          3600,
          JSON.stringify(friendsCount)
        );

        result = friendsCount;
      } else {
        // console("Fetched from the cache, friends");
        result = JSON.parse(friendsCountCache);
      }
      return result;
    } catch (error) {
      console.error(error);
      return undefined;
    }
  };

  getFriendList = async (userId: string) => {
    const friendList = await this.friendshipRepository.findAllConnectionsByUser(
      userId
    );

    const formattedFriendList = friendList.map((friend) => {
      if (friend.blockedUserId === userId) {
        return null;
      }
      let friendObj = {
        isCurrentUserSender: friend.senderId === userId,
        status: friend.status,
        isBlocked: friend.blockedUserId === userId,
      };
      if (friend.user1.userId !== userId) {
        friendObj = { ...friendObj, ...friend.user1 };
      }
      if (friend.user2.userId !== userId) {
        friendObj = { ...friendObj, ...friend.user2 };
      }
      return friendObj;
    });

    return formattedFriendList;
  };
}
