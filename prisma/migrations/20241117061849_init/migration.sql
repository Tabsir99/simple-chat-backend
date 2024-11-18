-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('offline', 'online', 'away');

-- CreateEnum
CREATE TYPE "FriendshipStatus" AS ENUM ('pending', 'accepted', 'blocked', 'canceled');

-- CreateEnum
CREATE TYPE "ChatRole" AS ENUM ('member', 'admin');

-- CreateEnum
CREATE TYPE "FileType" AS ENUM ('IMAGE_JPEG', 'IMAGE_PNG', 'IMAGE_GIF', 'IMAGE_WEBP', 'IMAGE_SVG', 'PDF', 'DOC', 'DOCX', 'XLS', 'XLSX', 'TXT', 'HTML', 'CSS', 'CSV', 'AUDIO_MP3', 'AUDIO_WAV', 'AUDIO_M4A', 'VIDEO_MP4', 'VIDEO_WEBM', 'ZIP', 'RAR', 'OTHER');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('sent', 'delivered', 'seen', 'failed');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('user', 'system', 'call');

-- CreateEnum
CREATE TYPE "CallStatus" AS ENUM ('missed', 'connected', 'ended');

-- CreateTable
CREATE TABLE "User" (
    "userId" UUID NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "email" VARCHAR(200) NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "profilePicture" VARCHAR(250) NOT NULL,
    "bio" VARCHAR(500),
    "lastActive" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userStatus" "UserStatus" NOT NULL DEFAULT 'offline',

    CONSTRAINT "User_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "ChatRoom" (
    "chatRoomId" UUID NOT NULL,
    "isGroup" BOOLEAN NOT NULL DEFAULT false,
    "roomName" VARCHAR(150),
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActivity" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastMessageId" UUID,
    "createdBy" UUID,
    "roomImage" TEXT,
    "blockedUserId" UUID,

    CONSTRAINT "ChatRoom_pkey" PRIMARY KEY ("chatRoomId")
);

-- CreateTable
CREATE TABLE "Message" (
    "messageId" UUID NOT NULL,
    "chatRoomId" UUID NOT NULL,
    "senderId" UUID,
    "content" VARCHAR(2000) NOT NULL,
    "parentMessageId" UUID,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "isEdited" BOOLEAN NOT NULL DEFAULT false,
    "type" "MessageType" NOT NULL DEFAULT 'user',
    "status" "MessageStatus" NOT NULL DEFAULT 'sent',
    "targetUserId" UUID,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("messageId")
);

-- CreateTable
CREATE TABLE "CallSession" (
    "callId" TEXT NOT NULL,
    "callerId" UUID NOT NULL,
    "recipientId" UUID NOT NULL,
    "isVideoCall" BOOLEAN NOT NULL,
    "status" "CallStatus" NOT NULL,
    "messageId" UUID NOT NULL,
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),

    CONSTRAINT "CallSession_pkey" PRIMARY KEY ("callId")
);

-- CreateTable
CREATE TABLE "Attachment" (
    "filePath" VARCHAR(255) NOT NULL,
    "fileType" "FileType" NOT NULL,
    "fileName" VARCHAR(200) NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "messageId" UUID NOT NULL,
    "chatRoomId" UUID NOT NULL,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("filePath")
);

-- CreateTable
CREATE TABLE "MessageReceipt" (
    "lastReadMessageId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "chatRoomId" UUID NOT NULL,
    "readAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageReceipt_pkey" PRIMARY KEY ("userId","chatRoomId")
);

-- CreateTable
CREATE TABLE "Friendship" (
    "friendshipId" UUID NOT NULL,
    "userId1" UUID NOT NULL,
    "userId2" UUID NOT NULL,
    "status" "FriendshipStatus" NOT NULL DEFAULT 'pending',
    "senderId" UUID NOT NULL,
    "blockedUserId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "chatRoomId" UUID,

    CONSTRAINT "Friendship_pkey" PRIMARY KEY ("friendshipId")
);

-- CreateTable
CREATE TABLE "ChatRoomMember" (
    "chatRoomId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "userRole" "ChatRole" NOT NULL DEFAULT 'member',
    "joinedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unreadCount" INTEGER NOT NULL DEFAULT 0,
    "nickName" VARCHAR(50),
    "removedAt" TIMESTAMP(3),
    "chatClearedAt" TIMESTAMP(3),

    CONSTRAINT "ChatRoomMember_pkey" PRIMARY KEY ("chatRoomId","userId")
);

-- CreateTable
CREATE TABLE "MessageReaction" (
    "messageId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "reactionType" VARCHAR(20) NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageReaction_pkey" PRIMARY KEY ("messageId","userId")
);

-- CreateTable
CREATE TABLE "RecentActivity" (
    "recentActivityId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "totalNewFriendRequests" INTEGER NOT NULL DEFAULT 0,
    "totalNewUnseenChats" INTEGER NOT NULL DEFAULT 0,
    "unseenAcceptedFriendRequests" INTEGER NOT NULL DEFAULT 0,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecentActivity_pkey" PRIMARY KEY ("recentActivityId")
);

-- CreateTable
CREATE TABLE "TokenFamily" (
    "familyId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isValid" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "TokenFamily_pkey" PRIMARY KEY ("familyId")
);

-- CreateTable
CREATE TABLE "RefreshTokens" (
    "tokenId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "familyId" UUID NOT NULL,
    "tokenHash" VARCHAR(256) NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isValid" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "RefreshTokens_pkey" PRIMARY KEY ("tokenId")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_lastActive_idx" ON "User"("lastActive");

-- CreateIndex
CREATE INDEX "ChatRoom_lastActivity_idx" ON "ChatRoom"("lastActivity");

-- CreateIndex
CREATE INDEX "Attachment_messageId_idx" ON "Attachment"("messageId");

-- CreateIndex
CREATE UNIQUE INDEX "Attachment_messageId_key" ON "Attachment"("messageId");

-- CreateIndex
CREATE INDEX "MessageReceipt_readAt_idx" ON "MessageReceipt"("readAt");

-- CreateIndex
CREATE UNIQUE INDEX "MessageReceipt_userId_chatRoomId_key" ON "MessageReceipt"("userId", "chatRoomId");

-- CreateIndex
CREATE UNIQUE INDEX "Friendship_userId1_userId2_key" ON "Friendship"("userId1", "userId2");

-- CreateIndex
CREATE INDEX "ChatRoomMember_chatRoomId_idx" ON "ChatRoomMember"("chatRoomId");

-- CreateIndex
CREATE INDEX "ChatRoomMember_userId_idx" ON "ChatRoomMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ChatRoomMember_chatRoomId_userId_key" ON "ChatRoomMember"("chatRoomId", "userId");

-- CreateIndex
CREATE INDEX "MessageReaction_messageId_idx" ON "MessageReaction"("messageId");

-- CreateIndex
CREATE INDEX "MessageReaction_userId_idx" ON "MessageReaction"("userId");

-- CreateIndex
CREATE INDEX "RecentActivity_userId_idx" ON "RecentActivity"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "RecentActivity_userId_key" ON "RecentActivity"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshTokens_tokenHash_key" ON "RefreshTokens"("tokenHash");

-- AddForeignKey
ALTER TABLE "ChatRoom" ADD CONSTRAINT "ChatRoom_lastMessageId_fkey" FOREIGN KEY ("lastMessageId") REFERENCES "Message"("messageId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatRoom" ADD CONSTRAINT "ChatRoom_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_chatRoomId_fkey" FOREIGN KEY ("chatRoomId") REFERENCES "ChatRoom"("chatRoomId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_parentMessageId_fkey" FOREIGN KEY ("parentMessageId") REFERENCES "Message"("messageId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallSession" ADD CONSTRAINT "CallSession_callerId_fkey" FOREIGN KEY ("callerId") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallSession" ADD CONSTRAINT "CallSession_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallSession" ADD CONSTRAINT "CallSession_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("messageId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("messageId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_chatRoomId_fkey" FOREIGN KEY ("chatRoomId") REFERENCES "ChatRoom"("chatRoomId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageReceipt" ADD CONSTRAINT "MessageReceipt_lastReadMessageId_fkey" FOREIGN KEY ("lastReadMessageId") REFERENCES "Message"("messageId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageReceipt" ADD CONSTRAINT "MessageReceipt_userId_chatRoomId_fkey" FOREIGN KEY ("userId", "chatRoomId") REFERENCES "ChatRoomMember"("userId", "chatRoomId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_userId1_fkey" FOREIGN KEY ("userId1") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_userId2_fkey" FOREIGN KEY ("userId2") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_blockedUserId_fkey" FOREIGN KEY ("blockedUserId") REFERENCES "User"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_chatRoomId_fkey" FOREIGN KEY ("chatRoomId") REFERENCES "ChatRoom"("chatRoomId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatRoomMember" ADD CONSTRAINT "ChatRoomMember_chatRoomId_fkey" FOREIGN KEY ("chatRoomId") REFERENCES "ChatRoom"("chatRoomId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatRoomMember" ADD CONSTRAINT "ChatRoomMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageReaction" ADD CONSTRAINT "MessageReaction_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("messageId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageReaction" ADD CONSTRAINT "MessageReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecentActivity" ADD CONSTRAINT "RecentActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TokenFamily" ADD CONSTRAINT "TokenFamily_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshTokens" ADD CONSTRAINT "RefreshTokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshTokens" ADD CONSTRAINT "RefreshTokens_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "TokenFamily"("familyId") ON DELETE RESTRICT ON UPDATE CASCADE;
