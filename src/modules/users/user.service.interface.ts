export interface UserData {
  username: string;
  email: string;
  bio: string | null;
  title: string | null;
  profilePicture: string | null;
  createdAt: Date | string;
  totalChats: number;
  totalMessageSent: number;
  totalFriends: number;
  status: any;
  isCurrentUserSender: boolean;
  isCurrentUserBlocked: boolean;
}

export interface RawUserData {
  username: string;
  email: string;
  bio: string | null;
  title: string | null;
  profilePicture: string | null;
  createdAt: Date | string;
  _count: {
    Message: number;
    ChatRoomMember: number;
  };
}

export type MiniUserProfile = {
  username: string;
  userId: string;
  bio?: string | null;
  profilePicture: string | null;
};

export type RecentActivities = {
  totalNewFriendRequests: number;
  totalNewUnseenChats: number;
  unseenAcceptedFriendRequests: number;
};

export interface IUserService {
  getUserId(email: string): Promise<string | null>;
  createUser(email: string, username: string): Promise<string>;
  generateUsernameFromEmail(email: string): string;
  getUserInfo(
    userId: string,
    nativeUserId: string,
    query?: object
  ): Promise<Partial<UserData> | null>;
  queryByUsername(
    query: { query: string; chatRoomId?: string },
    userId: string
  ): Promise<Array<MiniUserProfile> | null>;
  getRecentActivities(userId: string): Promise<RecentActivities>;
  updateRecentActivities(
    userId: string,
    event: "reset-friends" | "reset-chats"
  ): Promise<any>;
}

// user.repository.interface.ts
export interface IUserRepository {
  getUserId(email: string): Promise<{ userId: string } | null>;
  createUser(email: string, username: string): Promise<{ userId: string }>;
  getUserInfo(
    userId: string,
    query?: object
  ): Promise<Partial<RawUserData> | null>;
  searchUsername(
    query: string,
    userId: string
  ): Promise<Array<MiniUserProfile>>;
  updateUserStatus(userId: string, status: "online" | "offline"): Promise<any>;
  getUserRecentActivities(userId: string): Promise<RecentActivities | null>;
  updateRecentActivities(userId: string, data: any): Promise<any>;
  searchFriends(
    query: string,
    chatRoomId: string,
    userId: string
  ): Promise<Omit<MiniUserProfile,"bio">[]>;
}
