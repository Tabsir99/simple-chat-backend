import { IUserRepository, MiniUserProfile, RawUserData } from "./user.service.interface";
import prisma from "../../common/config/db";
import { UserData } from "./user.service.interface";
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
  ): Promise<{ email: string; userId: string; username: string }> {
    try {
      return await prisma.user.create({
        data: { email, username },
        select: { email: true, userId: true, username: true },
      });
    } catch (error) {
      throw new Error("Database error while creating user.");
    }
  }

  async getUserInfo(userId: string): Promise<RawUserData | null> {
      return prisma.user.findUnique({
        where: { userId: userId },
        select: {
          username: true,
          email: true,
          bio: true,
          title: true,
          profilePicture: true,
          createdAt: true,
          
          _count: {
            select: {
              ChatRoomMember: true,
              messages: {
                where: {
                  senderId: userId,
                },
              },
              MessageReceipt: {
                where: {
                  userId: userId,
                },
              },
            },
          },
        },
      });

  }

  searchUsername = async (
    query: string,
    userId: string
  ): Promise<Array<MiniUserProfile>> => {
    return prisma.$queryRaw`SELECT "userId", "username", "profilePicture", "bio" FROM "User" WHERE similarity("username", ${query}) > 0.2 AND "userId" != ${userId}::uuid LIMIT 6`;
  };

  updateUserStatus = async (userId: string, status: "online"|"offline") => {
    return await prisma.user.update({
      where: {
        userId: userId
      },
      data: {
        userStatus: status
      },
      select: {
        userStatus: true
      }
    })
  }
}