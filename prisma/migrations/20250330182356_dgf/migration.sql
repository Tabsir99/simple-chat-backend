/*
  Warnings:

  - Made the column `lastMessageId` on table `ChatRoom` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "ChatRoom" DROP CONSTRAINT "ChatRoom_lastMessageId_fkey";

-- AlterTable
ALTER TABLE "ChatRoom" ALTER COLUMN "lastMessageId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "ChatRoom" ADD CONSTRAINT "ChatRoom_lastMessageId_fkey" FOREIGN KEY ("lastMessageId") REFERENCES "Message"("messageId") ON DELETE RESTRICT ON UPDATE CASCADE;
