import { $Enums } from "@prisma/client";

export interface IFriendshipService {
  getFriendStatusAndCount(
    userId: string,
    targetUserId: string
  ): Promise<{
    data: {
      status: $Enums.FriendshipStatus | "canceled";
      count: number;
      senderId: string;
      blockedUserId: string | null;
    };
    message: string;
  }>;

  handleFriendRequest(
    userId: string,
    friendId: string,
    status: Omit<$Enums.FriendshipStatus, "pending">
  ): Promise<{
    status: string;
    chatRoomId: string | null;
  } | null>;

  createFriendRequest(senderId: string, targetUserId: string): Promise<boolean>;

  getFriendIdList(userId: string): Promise<string[] | undefined>;

  getFriendList(userId: string): Promise<
    ({
      isCurrentUserSender: boolean;
      status: $Enums.FriendshipStatus;
      isBlocked: boolean;
    } | null)[]
  >;
}

export interface IFriendshipRepository {
  findFriendshipStatusByUsers(
    userId: string,
    targetUserId: string
  ): Promise<{
    status: $Enums.FriendshipStatus;
    senderId: string;
    blockedUserId: string | null;
  } | null>;

  findAllFriendsIdByUser(userId: string): Promise<string[] | undefined>;

  findAllConnectionsByUser(userId: string): Promise<
    {
      senderId: string;
      status: $Enums.FriendshipStatus;
      blockedUserId: string | null;
      user1: {
        username: string;
        userId: string;
        profilePicture: string;
      };
      user2: {
        username: string;
        userId: string;
        profilePicture: string;
      };
    }[]
  >;

  insertFriendRequest(senderId: string, targetUserId: string): Promise<unknown>;

  deleteFriendship(
    userId: string,
    targetUserId: string
  ): Promise<{
    count: number;
  }>;

  acceptFriendship(
    userId: string,
    friendId: string
  ): Promise<{
    status: string;
    chatRoomId: string;
  }>;

  blockFriendship(
    userId: string,
    friendId: string
  ): Promise<{
    status: string;
    chatRoomId: string | null;
  }>;
}
