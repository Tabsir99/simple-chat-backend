-- DropForeignKey
ALTER TABLE "ChatRoom" DROP CONSTRAINT "ChatRoom_lastMessageId_fkey";

-- AlterTable
ALTER TABLE "ChatRoom" ALTER COLUMN "lastMessageId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "ChatRoom" ADD CONSTRAINT "ChatRoom_lastMessageId_fkey" FOREIGN KEY ("lastMessageId") REFERENCES "Message"("messageId") ON DELETE SET NULL ON UPDATE CASCADE;
