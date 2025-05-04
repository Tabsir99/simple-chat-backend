import { randomInt } from "crypto";
import prisma from "../../common/config/db";
import { UserData } from "./user.interface";
import { UserStatus } from "@prisma/client";

export const getUserId = async (
  email: string
): Promise<{ userId: string } | null> => {
  try {
    return await prisma.user.findUnique({
      where: { email },
      select: {
        userId: true,
      },
    });
  } catch (error) {
    throw new Error("Database error while fetching user.");
  }
};

export const createUser = async (
  email: string,
  username: string,
  profilePicture?: string
): Promise<{ userId: string }> => {
  try {
    return await prisma.$transaction(async (tx) => {
      const userId = await tx.user.create({
        data: {
          email,
          username,
          profilePicture,
          userStatus: UserStatus.online,
        },
        select: { userId: true },
      });
      await tx.recentActivity.create({
        data: {
          totalNewUnseenChats: 0,
          userId: userId.userId,
          lastUpdated: new Date(),
        },
      });

      return userId;
    });
  } catch (error) {
    throw new Error("Database error while creating user.");
  }
};
export const getUserInfo = async (userId: string, query?: object) => {
  const baseSelect = {
    username: true,
    email: true,
    bio: true,
    profilePicture: true,
    createdAt: true,
    _count: {
      select: {
        ChatRoomMember: true,
        MessageSender: {
          where: {
            senderId: userId,
          },
        },
      },
    },
  };

  const select =
    query && Object.keys(query).length > 0
      ? Object.fromEntries(
          Object.entries(query).map(([key, value]) => [key, value === "true"])
        )
      : baseSelect;

  return prisma.user.findUnique({
    where: { userId: userId },
    select: select,
  });
};

export const searchUsername = async (
  query: string,
  userId: string
): Promise<Array<UserData>> => {
  return prisma.$queryRaw`
    SELECT "userId", "username", "profilePicture", "bio"
    FROM "User"
    WHERE similarity("username", ${query}) > 0.2
    AND "userId" != ${userId}::uuid
    LIMIT 10`;
};

export const updateUser = async ({
  userId,
  userData,
}: {
  userId: string;
  userData: {
    username?: string;
    bio?: string;
    profilePicture?: string;
    status?: UserStatus;
  };
}): Promise<any> => {
  return await prisma.user.update({
    where: {
      userId: userId,
    },
    data: {
      ...(userData.username && { username: userData.username }),
      ...(userData.bio && { bio: userData.bio }),
      ...(userData.profilePicture && {
        profilePicture: userData.profilePicture,
      }),
      ...(userData.status && { userStatus: userData.status }),
    },
  });
};
