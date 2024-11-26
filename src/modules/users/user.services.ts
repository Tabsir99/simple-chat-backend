import {
  IUserRepository,
  IUserService,
  MiniUserProfile,
  RecentActivities,
  UserData,
} from "./user.interface";
import { inject, injectable } from "inversify";
import { TYPES } from "../../inversify/types";
import { MediaService } from "../media/media.services";
import { IFriendshipService } from "../friendship/frnd.interface";

@injectable()
export default class UserService implements IUserService {
  constructor(
    @inject(TYPES.UserRepository) private userRepository: IUserRepository,
    @inject(TYPES.FriendshipService)
    private friendshipService: IFriendshipService,
    @inject(TYPES.MediaService) private mediaService: MediaService
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

  async updateUser(
    userId: string,
    username?: string,
    bio?: string,
    image?: { imageSize: number; imageName: string; imageType: string }
  ) {
    try {
      let urlPromise: Promise<string> | undefined = undefined;
      if (image) {
        const path = `avatars/users/${userId}-${image.imageName}`;
        urlPromise = this.mediaService.getWriteSignedUrl(path, {
          contentSize: image.imageSize,
          contentType: image.imageType,
        });
      }
      const updatePromise = this.userRepository.updateUser({
        userId,
        username,
        bio,
      });

      const result = await Promise.all([urlPromise, updatePromise]);
      return result[0];
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async makeUserAvatarPublic(userId: string, fileName: string) {
    try {
      await this.mediaService.makeFilePublic(
        `avatars/users/${userId}-${fileName}`
      );
      const publicUrl = `https://storage.googleapis.com/simple-chat-cg.appspot.com/avatars/users/${userId}-${fileName}`;
      await this.userRepository.updateUser({
        userId,
        profilePicture: publicUrl,
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}
