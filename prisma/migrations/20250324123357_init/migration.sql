/*
  Warnings:

  - You are about to drop the `Friendship` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Friendship" DROP CONSTRAINT "Friendship_blockedUserId_fkey";

-- DropForeignKey
ALTER TABLE "Friendship" DROP CONSTRAINT "Friendship_chatRoomId_fkey";

-- DropForeignKey
ALTER TABLE "Friendship" DROP CONSTRAINT "Friendship_senderId_fkey";

-- DropForeignKey
ALTER TABLE "Friendship" DROP CONSTRAINT "Friendship_userId1_fkey";

-- DropForeignKey
ALTER TABLE "Friendship" DROP CONSTRAINT "Friendship_userId2_fkey";

-- DropTable
DROP TABLE "Friendship";
