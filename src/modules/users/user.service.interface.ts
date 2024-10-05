import { interfaces } from "inversify";

export interface UserData {
  username: string,
  email: string,
  bio: string | null,
  title: string | null,
  profilePicture: string | null,
  createdAt: Date | string,
  totalChats: number,
  totalMessage: number,
  totalFriends: number,
  status: any,
  isSender: boolean
  }

export interface RawUserData {
  username: string,
  email: string,
  bio: string | null,
  title: string | null,
  profilePicture: string | null,
  createdAt: Date | string,
  _count: {
    messages: number;
    MessageReceipt: number;
    ChatRoomMember: number;
};
}

export type MiniUserProfile = {
  username: string,
  userId: string,
  bio: string | null,
  profilePicture: string | null,
}



  
  export interface IUserService {
    getUserId(email: string): Promise<string | null>;
    createUser(email: string, username: string): Promise<string>
    generateUsernameFromEmail(email: string): string;
    getUserInfo(userId: string, nativeUserId: string): Promise<UserData | null>;
    queryByUsername(query: string, userId: string): Promise<Array<MiniUserProfile> | null>
  }  



  // user.repository.interface.ts
  export interface IUserRepository {
      getUserId(email: string): Promise<{ userId: string } | null>;
      createUser(email: string, username: string): Promise<{ userId: string }>;
      getUserInfo(userId: string): Promise<RawUserData | null>;
      searchUsername(query: string, userId: string): Promise<Array<MiniUserProfile>>;
      updateUserStatus(userId: string, status: "online"|"offline"): Promise<any>
  }