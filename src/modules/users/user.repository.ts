import { IUserRepository, MiniUserProfile, RawUserData, RecentActivities } from "./user.service.interface";
import prisma from "../../common/config/db";
import { injectable } from "inversify";

@injectable()
export class UserRepository implements IUserRepository {
  async getUserId(email: string): Promise<{ userId: string } | null> {
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
  }

  async createUser(
    email: string,
    username: string
  ): Promise<{ userId: string }> {
    try {
      return await prisma.$transaction(async (tx) => {
        const userId = await tx.user.create({
          data: { email, username },
          select: { userId: true },
        })
        await tx.recentActivity.create({
          data: {
            totalNewFriendRequests: 0,
            totalNewUnseenChats: 0,
            unseenAcceptedFriendRequests: 0,
            userId: userId.userId
          }
        })

        return userId
      })
    } catch (error) {
      throw new Error("Database error while creating user.");
    }
  }
  async getUserInfo(userId: string, query?: object): Promise<Partial<RawUserData> | null> {
    const baseSelect = {
      username: true,
      email: true,
      bio: true,
      title: true,
      profilePicture: true,
      createdAt: true,
      _count: {
        select: {
          ChatRoomMember: true,
          Message: {
            where: {
              senderId: userId,
            },
          },
        },
      },
    };
  
    const select = query && Object.keys(query).length > 0 ? Object.fromEntries(
      Object.entries(query).map(([key, value]) => [key, value === 'true'])
    ) : baseSelect;
  
     
    return prisma.user.findUnique({
      where: { userId: userId },
      select: select,
    });
  }

  searchUsername = async (
    query: string,
    userId: string
  ): Promise<Array<MiniUserProfile>> => {
    return prisma.$queryRaw`SELECT "userId", "username", "profilePicture", "bio" FROM "User" WHERE similarity("username", ${query}) > 0.2 AND "userId" != ${userId}::uuid LIMIT 10`;
  };

  updateUserStatus = async (userId: string, status: "online"|"offline") => {
    return await prisma.user.update({
      where: {
        userId: userId
      },
      data: {
        userStatus: status,
        lastActive: new Date()
      },
      select: {
        userStatus: true
      }
    })
  }

  getUserRecentActivities = async (userId: string): Promise<RecentActivities | null> => {
    return await prisma.recentActivity.findUnique({
      where: {
        userId: userId
      },
      select: {
        totalNewFriendRequests: true,
        totalNewUnseenChats: true,
        unseenAcceptedFriendRequests: true,
      }
    })
  }
  async updateRecentActivities(userId: string, data: any): Promise<any> {
      
    return prisma.recentActivity.update({
      where: {
        userId: userId
      },
      data: data,

    })
  }
}