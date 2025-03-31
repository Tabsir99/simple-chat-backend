/*
  Warnings:

  - You are about to drop the column `avatar` on the `ChatRoomMember` table. All the data in the column will be lost.

*/
-- AlterEnum
ALTER TYPE "ChatRole" ADD VALUE 'bot';

-- AlterTable
ALTER TABLE "ChatRoomMember" DROP COLUMN "avatar";
