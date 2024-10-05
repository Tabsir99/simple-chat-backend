import { inject, injectable } from "inversify";
import FriendshipRepository from "./frnd.repository";
import { TYPES } from "../../inversify/types";
import { $Enums } from "@prisma/client";
import ChatServices from "../chats/chat.services";
import redisClient from "../../common/config/redisConfig";

@injectable()
export default class FriendshipService {
  constructor(
    @inject(TYPES.FriendshipRepository)
    private friendshipRepository: FriendshipRepository,
    @inject(TYPES.ChatService) private chatService: ChatServices
  ) {}

  // Method to get the friendship status between two users
  getFriendStatusAndCount = async (userId: string, targetUserId: string) => {
    try {
      let friendshipStatus: {
        status: $Enums.FriendshipStatus;
        senderId: string;
      } | null = null;
      if (userId !== targetUserId) {
        friendshipStatus =
          await this.friendshipRepository.findFriendshipByUsers(
            userId,
            targetUserId
          );
      }

      let friendsCount = await this.getFriendList(userId);

      return {
        data: {
          status: friendshipStatus?.status || "",
          count: friendsCount?.length || 0,
          senderId: friendshipStatus?.senderId || "",
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
    targetUserId: string,
    status: "accepted" | "blocked" | "unblocked"
  ) => {
    try {
      if (status === "unblocked") {
        await this.friendshipRepository.deleteFriendship(userId, targetUserId);
        return {
          success: true,
          message: "Unblocked successfully.",
          status: "unblocked",
        };
      }

      const response = await this.friendshipRepository.updateFriendshipStatus(
        userId,
        targetUserId,
        status
      );

      if (status === "accepted") {
        const result = await this.chatService.createChatRoom(
          userId,
          targetUserId
        );
      }

      return {
        success: true,
        message: `Friend request ${status} successfully.`,
        status: response.status,
      };
    } catch (error) {
      console.log(error, "FROM FRND SERVICE HANDLE FRIEND REQUEST");
      return {
        success: false,
        message: "An error occurred while processing the request.",
        error: error, // Optionally include the error message
      };
    }
  };

  createFriendRequest = async (senderId: string, targetUserId: string) => {
    try {
      const respo = await this.friendshipRepository.insertFriendRequest(
        senderId,
        targetUserId
      );
      return true;
    } catch (error) {
      console.log(error, " FROM FRND SERVICE CREATE FRND REQ");
      return false;
    }
  };

  getFriendList = async (userId: string) => {
    try {

      let result: string[] | undefined
      const friendsCountCache = await redisClient.get(`${userId}:friends`);

      if (!friendsCountCache) {
        console.log("Friends fetched from database");
        const friendsCount =
          await this.friendshipRepository.findAllFriendsByUser(userId);

        redisClient.setex(
          `${userId}:friends`,
          3600,
          JSON.stringify(friendsCount)
        );
      } else {
        console.log("Fetched from the cache, friends");
        result = JSON.parse(friendsCountCache);
      }
      return result;
    } catch (error) {
      console.log(error);
      return undefined;
    }
  };
}
