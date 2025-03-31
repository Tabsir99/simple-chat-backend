/*
  Warnings:

  - Made the column `nickName` on table `ChatRoomMember` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "ChatRoomMember" ALTER COLUMN "nickName" SET NOT NULL;
