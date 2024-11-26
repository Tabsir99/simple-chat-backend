
import { injectable } from "inversify";
import prisma from "../../common/config/db";

@injectable()
export default class AuthRepository {
  async saveToken(
    tokenHash: string,
    userId: string,
    expiresAt: Date
  ): Promise<any> {
    try {
      return await prisma.$transaction(async (tx) => {
        const familyId = await tx.tokenFamily.create({
          data: {
            isValid: true,
            userId: userId,
          },
          select: {
            familyId: true,
          },
        });

        await tx.refreshTokens.create({
          data: {
            expiresAt: expiresAt,
            tokenHash: tokenHash,
            familyId: familyId.familyId,
            userId: userId,
            isValid: true,           
          }
        })
      });
    } catch (error) {
      console.error("Error saving token to Redis:", error);
      throw new Error("Error saving token.");
    }
  }

  async getToken(
    tokenHash: string,
  ) {
    try {
      
      const result = prisma.refreshTokens.findUnique({
        where: {
          tokenHash: tokenHash
        },
        select: {
          expiresAt: true,
          tokenFamily: {
            select: {
              familyId: true,
              isValid: true
            }
          },
          isValid: true,
          tokenId: true,
          userId: true,
        }
      })


      return result
    } catch (error) {
      console.error("Error fetching token from Redis:", error);
      throw new Error("Error fetching token.");
    }
  }

  async revokeToken(tokenId: string): Promise<void> {
    try {
      await prisma.refreshTokens.update({
        where: {
          tokenId: tokenId
        },
        data: {
          isValid: false,
        }
      })
    } catch (error) {
      console.error("Error deleting token from Redis:", error);
      throw new Error("Error deleting token.");
    }
  }

  async revokeFamily(familyId: string){
    return await prisma.tokenFamily.update({
      where: {
        familyId: familyId
      },
      data: {
        isValid: false,
        RefreshTokens: {
          updateMany: {
            where: {
              familyId: familyId
            },
            data: {
              isValid: false,
            }
          }
        }
      }
    })
  }

  async rotateToken(
    oldToken: {familyId: string, tokenId: string, expiresAt: Date},
    newTokenHash: string,
    userId: string
  ): Promise<void> {
    try {
      return await prisma.$transaction(async (tx) => {
        await tx.refreshTokens.create({
          data: {
            expiresAt: oldToken.expiresAt,
            tokenHash: newTokenHash,
            familyId: oldToken.familyId,
            userId: userId
          },
          select: {
            tokenId: true
          }
        })
        await tx.refreshTokens.update({
          where: {
            tokenId: oldToken.tokenId
          },
          data: {
            isValid: false,
          }
        })
      })
    } catch (error) {
      console.error(error, " FROM AUTH REPO ROTATE TOKEN");
      throw new Error("Error rotating token");
    }
  }
}
