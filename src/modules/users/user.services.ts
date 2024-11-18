import {
  IUserRepository,
  IUserService,
  MiniUserProfile,
  RecentActivities,
  UserData,
} from "./user.service.interface";
import { inject, injectable } from "inversify";
import { TYPES } from "../../inversify/types";
import FriendshipService from "../friendship/frnd.services";

@injectable()
export default class UserService implements IUserService {
  constructor(
    @inject(TYPES.UserRepository) private userRepository: IUserRepository,
    @inject(TYPES.FriendshipService)
    private friendshipService: FriendshipService
  ) {}

  generateUsernameFromEmail(email: string): string {
    return email.trim().split("@")[0];
  }

  getUserId = async (email: string): Promise<string | null> => {
    const userID = await this.userRepository.getUserId(email);
    if (!userID?.userId) return null;
    return userID.userId;
  };

  createUser = async (email: string, username: string): Promise<string> => {
    const userID = await this.userRepository.createUser(email, username);
    return userID.userId;
  };

  getUserInfo = async (
    userId: string,
    nativeUserId: string,
    query?: object
  ): Promise<Partial<UserData> | null> => {
    try {
      const rawUserInfo = await this.userRepository.getUserInfo(userId, query);

      let result;

      result = !query
        ? await this.friendshipService.getFriendStatusAndCount(
            userId,
            nativeUserId
          )
        : null;

      if (!rawUserInfo) {
        return null;
      }

      const userInfo: Partial<UserData> = {
        ...rawUserInfo,
        createdAt: rawUserInfo.createdAt
          ? typeof rawUserInfo.createdAt !== "string"
            ? rawUserInfo.createdAt.toDateString()
            : rawUserInfo.createdAt
          : undefined,
        totalMessageSent: rawUserInfo._count
          ? rawUserInfo._count.MessageSender || 0
          : undefined,
        totalChats: rawUserInfo._count?.ChatRoomMember,
        totalFriends: result?.data.count,
        status: result?.data.status,
        isCurrentUserSender: result
          ? nativeUserId === result.data.senderId
          : undefined,
        isCurrentUserBlocked: result
          ? nativeUserId === result.data.blockedUserId
          : undefined,
      };

      return userInfo;
    } catch (error) {
      console.error(error, " FROM USER SERVICE GETUSERINFO");
      return null;
    }
  };

  queryByUsername = async (
    query: { query: string; chatRoomId?: string },
    userId: string
  ): Promise<Array<MiniUserProfile> | null> => {
    try {

      if (!query.chatRoomId) {
        const result = await this.userRepository.searchUsername(
          query.query,
          userId
        );
        return result;
      }
      const result = await this.userRepository.searchFriends(
        query.query,
        query.chatRoomId,
        userId
      );

      return result;
    } catch (error) {
      console.error(error, " FROM USERSERVICE QUERY BY NAME");
      return null;
    }
  };

  setUserStatus = async (userId: string, status: "online" | "offline") => {
    const result = await this.userRepository.updateUserStatus(userId, status);
  };

  async getRecentActivities(userId: string): Promise<RecentActivities> {
    try {
      const recentActivities =
        await this.userRepository.getUserRecentActivities(userId);

      if (!recentActivities) {
        return {
          totalNewFriendRequests: 0,
          totalNewUnseenChats: 0,
          unseenAcceptedFriendRequests: 0,
        };
      }

      return recentActivities;
    } catch (error) {
      console.error("Error fetching recent activities:", error);
      throw new Error("Failed to fetch recent activities");
    }
  }

  async updateRecentActivities(
    userId: string,
    event: "reset-friends" | "reset-chats"
  ) {
    try {
      if (event === "reset-friends") {
        await this.userRepository.updateRecentActivities(userId, {
          totalNewFriendRequests: 0,
          unseenAcceptedFriendRequests: 0,
        });
      }
      if (event === "reset-chats") {
        await this.userRepository.updateRecentActivities(userId, {
          totalNewUnseenChats: 0,
        });
      }
      return true;
    } catch (error: any) {
      console.error(error.message);
      return false;
    }
  }
}
