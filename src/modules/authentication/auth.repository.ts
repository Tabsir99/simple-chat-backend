import prisma from "../../common/config/db";

export async function saveToken(
  tokenHash: string,
  userId: string,
  expiresAt: Date
): Promise<any> {
  try {
    return await prisma.$transaction(async (tx) => {
      await tx.refreshTokens.create({
        data: {
          expiresAt: expiresAt,
          tokenHash: tokenHash,
          userId: userId,
        },
      });
    });
  } catch (error) {
    console.error("Error saving token to Redis:", error);
    throw new Error("Error saving token.");
  }
}

export async function getToken(tokenHash: string) {
  try {
    const result = prisma.refreshTokens.findUnique({
      where: {
        tokenHash: tokenHash,
      },
      select: {
        expiresAt: true,
        tokenId: true,
        userId: true,
      },
    });

    return result;
  } catch (error) {
    console.error("Error fetching token from Redis:", error);
    throw new Error("Error fetching token.");
  }
}

export async function revokeToken(tokenId: string): Promise<void> {
  try {
    await prisma.refreshTokens.delete({
      where: {
        tokenId,
      },
    });
  } catch (error) {
    console.error("Error deleting token from Redis:", error);
    throw new Error("Error deleting token.");
  }
}

export async function rotateToken(
  oldToken: { tokenId: string; expiresAt: Date },
  newTokenHash: string,
  userId: string
): Promise<void> {
  try {
    return await prisma.$transaction(async (tx) => {
      await tx.refreshTokens.update({
        where: {
          tokenId: oldToken.tokenId,
        },
        data: {
          expiresAt: oldToken.expiresAt,
          tokenHash: newTokenHash,
          userId: userId,
        },
      });
    });
  } catch (error) {
    console.error(error, " FROM AUTH REPO ROTATE TOKEN");
    throw new Error("Error rotating token");
  }
}
