-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('offline', 'online', 'away');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('text', 'image', 'video', 'audio', 'file');

-- CreateEnum
CREATE TYPE "FriendshipStatus" AS ENUM ('pending', 'accepted', 'rejected');

-- CreateEnum
CREATE TYPE "ChatRole" AS ENUM ('member', 'admin');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('newMessage', 'friendRequestRejected', 'friendRequestAccepted', 'groupMessage');

-- CreateTable
CREATE TABLE "User" (
    "userId" UUID NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "email" VARCHAR(200) NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "profilePicture" VARCHAR(250),
    "lastActive" TIMESTAMP(6),
    "userStatus" "UserStatus" NOT NULL DEFAULT 'offline',
    "bio" VARCHAR(500),

    CONSTRAINT "User_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "ChatRoom" (
    "chatRoomId" UUID NOT NULL,
    "isGroup" BOOLEAN NOT NULL DEFAULT false,
    "roomName" VARCHAR(100),
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActivity" TIMESTAMP(6),

    CONSTRAINT "ChatRoom_pkey" PRIMARY KEY ("chatRoomId")
);

-- CreateTable
CREATE TABLE "Message" (
    "messageId" UUID NOT NULL,
    "chatRoomId" UUID NOT NULL,
    "senderId" UUID NOT NULL,
    "content" VARCHAR(2000) NOT NULL,
    "parentMessageId" UUID,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("messageId")
);

-- CreateTable
CREATE TABLE "Attachment" (
    "attachmentId" UUID NOT NULL,
    "fileUrl" CHAR(500) NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "messageId" UUID NOT NULL,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("attachmentId")
);

-- CreateTable
CREATE TABLE "MessageReceipt" (
    "receiptId" UUID NOT NULL,
    "messageId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "readAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageReceipt_pkey" PRIMARY KEY ("receiptId")
);

-- CreateTable
CREATE TABLE "Friendship" (
    "friendshipId" UUID NOT NULL,
    "userId1" UUID NOT NULL,
    "userId2" UUID NOT NULL,
    "status" "FriendshipStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Friendship_pkey" PRIMARY KEY ("friendshipId")
);

-- CreateTable
CREATE TABLE "ChatRoomMember" (
    "chatRoomMemberId" UUID NOT NULL,
    "chatRoomId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "userRole" "ChatRole" NOT NULL DEFAULT 'member',
    "joinedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "muteUntil" TIMESTAMP(6),

    CONSTRAINT "ChatRoomMember_pkey" PRIMARY KEY ("chatRoomMemberId")
);

-- CreateTable
CREATE TABLE "MessageReaction" (
    "messageReactionId" UUID NOT NULL,
    "messageId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "reactionType" VARCHAR(20) NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageReaction_pkey" PRIMARY KEY ("messageReactionId")
);

-- CreateTable
CREATE TABLE "RecentActivity" (
    "recentActivityId" SERIAL NOT NULL,
    "userId" UUID NOT NULL,
    "activityType" "ActivityType" NOT NULL,
    "chatRoomId" UUID,
    "groupChatId" UUID,
    "targetUserId" UUID,
    "description" TEXT,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecentActivity_pkey" PRIMARY KEY ("recentActivityId")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_username_idx" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_lastActive_idx" ON "User"("lastActive");

-- CreateIndex
CREATE INDEX "ChatRoom_lastActivity_idx" ON "ChatRoom"("lastActivity");

-- CreateIndex
CREATE INDEX "Attachment_messageId_idx" ON "Attachment"("messageId");

-- CreateIndex
CREATE INDEX "MessageReceipt_readAt_idx" ON "MessageReceipt"("readAt");

-- CreateIndex
CREATE UNIQUE INDEX "MessageReceipt_messageId_userId_key" ON "MessageReceipt"("messageId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Friendship_userId1_userId2_key" ON "Friendship"("userId1", "userId2");

-- CreateIndex
CREATE INDEX "ChatRoomMember_chatRoomId_idx" ON "ChatRoomMember"("chatRoomId");

-- CreateIndex
CREATE INDEX "ChatRoomMember_userId_idx" ON "ChatRoomMember"("userId");

-- CreateIndex
CREATE INDEX "ChatRoomMember_muteUntil_idx" ON "ChatRoomMember"("muteUntil");

-- CreateIndex
CREATE UNIQUE INDEX "ChatRoomMember_chatRoomId_userId_key" ON "ChatRoomMember"("chatRoomId", "userId");

-- CreateIndex
CREATE INDEX "MessageReaction_messageId_idx" ON "MessageReaction"("messageId");

-- CreateIndex
CREATE INDEX "MessageReaction_userId_idx" ON "MessageReaction"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MessageReaction_messageId_userId_reactionType_key" ON "MessageReaction"("messageId", "userId", "reactionType");

-- CreateIndex
CREATE INDEX "RecentActivity_userId_createdAt_idx" ON "RecentActivity"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_chatRoomId_fkey" FOREIGN KEY ("chatRoomId") REFERENCES "ChatRoom"("chatRoomId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_parentMessageId_fkey" FOREIGN KEY ("parentMessageId") REFERENCES "Message"("messageId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("messageId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageReceipt" ADD CONSTRAINT "MessageReceipt_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("messageId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageReceipt" ADD CONSTRAINT "MessageReceipt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_userId1_fkey" FOREIGN KEY ("userId1") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_userId2_fkey" FOREIGN KEY ("userId2") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatRoomMember" ADD CONSTRAINT "ChatRoomMember_chatRoomId_fkey" FOREIGN KEY ("chatRoomId") REFERENCES "ChatRoom"("chatRoomId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatRoomMember" ADD CONSTRAINT "ChatRoomMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageReaction" ADD CONSTRAINT "MessageReaction_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("messageId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageReaction" ADD CONSTRAINT "MessageReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecentActivity" ADD CONSTRAINT "RecentActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecentActivity" ADD CONSTRAINT "RecentActivity_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecentActivity" ADD CONSTRAINT "RecentActivity_chatRoomId_fkey" FOREIGN KEY ("chatRoomId") REFERENCES "ChatRoom"("chatRoomId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecentActivity" ADD CONSTRAINT "RecentActivity_groupChatId_fkey" FOREIGN KEY ("groupChatId") REFERENCES "ChatRoom"("chatRoomId") ON DELETE SET NULL ON UPDATE CASCADE;
