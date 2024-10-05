import {
  IUserRepository,
  IUserService,
  MiniUserProfile,
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
    nativeUserId: string
  ): Promise<UserData | null> => {
    try {
      const RawUserInfo = await this.userRepository.getUserInfo(userId);

      const result = await this.friendshipService.getFriendStatusAndCount(
        userId,
        nativeUserId
      );

      if (!RawUserInfo) {
        return null;
      }

      const userInfo: UserData = {
        bio: RawUserInfo.bio,
        createdAt:
          typeof RawUserInfo.createdAt !== "string"
            ? RawUserInfo.createdAt.toDateString()
            : "",
        email: RawUserInfo.email,
        profilePicture: RawUserInfo.profilePicture,
        title: RawUserInfo.title,
        username: RawUserInfo.username,
        totalMessage:
          RawUserInfo._count.messages + RawUserInfo._count.MessageReceipt,
        totalChats: RawUserInfo._count.ChatRoomMember,
        totalFriends: result.data.count,
        status: result.data.status,
        isSender: userId === result.data.senderId,
      };

      // console.log(userInfo)
      return userInfo;
    } catch (error) {
      console.log(error, " FROM USER SERVICE GETUSERINOF");
      return null;
    }
  };

  queryByUsername = async (
    query: string,
    userId: string
  ): Promise<Array<MiniUserProfile> | null> => {
    try {
      const result = await this.userRepository.searchUsername(query, userId);
      return result;
    } catch (error) {
      console.log(error, " FROM USERSERVICE QUERY BY NAME");
      return null;
    }
  };

  setUserStatus = async (userId: string, status: "online" | "offline") => {
    const result = await this.userRepository.updateUserStatus(userId, status);
  };
}
