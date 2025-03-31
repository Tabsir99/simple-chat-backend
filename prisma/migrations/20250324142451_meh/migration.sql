/*
  Warnings:

  - You are about to drop the column `blockedUserId` on the `ChatRoom` table. All the data in the column will be lost.
  - You are about to drop the column `totalNewFriendRequests` on the `RecentActivity` table. All the data in the column will be lost.
  - You are about to drop the column `unseenAcceptedFriendRequests` on the `RecentActivity` table. All the data in the column will be lost.
  - You are about to drop the `Attachment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MessageReceipt` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `lastReadMessageId` to the `ChatRoomMember` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AttachmentType" AS ENUM ('VIDEO', 'VOICE', 'DOCUMENT', 'ARCHIVE', 'AUDIO', 'LINK');

-- DropForeignKey
ALTER TABLE "Attachment" DROP CONSTRAINT "Attachment_chatRoomId_fkey";

-- DropForeignKey
ALTER TABLE "Attachment" DROP CONSTRAINT "Attachment_messageId_fkey";

-- DropForeignKey
ALTER TABLE "MessageReceipt" DROP CONSTRAINT "MessageReceipt_lastReadMessageId_fkey";

-- DropForeignKey
ALTER TABLE "MessageReceipt" DROP CONSTRAINT "MessageReceipt_userId_chatRoomId_fkey";

-- AlterTable
ALTER TABLE "ChatRoom" DROP COLUMN "blockedUserId";

-- AlterTable
ALTER TABLE "ChatRoomMember" ADD COLUMN     "avatar" TEXT,
ADD COLUMN     "lastReadMessageId" TEXT NOT NULL,
ADD COLUMN     "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "attachment" "AttachmentType",
ALTER COLUMN "content" DROP NOT NULL;

-- AlterTable
ALTER TABLE "RecentActivity" DROP COLUMN "totalNewFriendRequests",
DROP COLUMN "unseenAcceptedFriendRequests";

-- DropTable
DROP TABLE "Attachment";

-- DropTable
DROP TABLE "MessageReceipt";

-- DropEnum
DROP TYPE "FileType";

-- DropEnum
DROP TYPE "FriendshipStatus";
