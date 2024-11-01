export interface ChatRoomHead {
    chatRoomId: string;
    isGroup: boolean;
    roomName: string | null;
    roomImage: string | null;
    createdBy: string;
    lastActivity: Date;
    blockedUserId: string | null;
    messageContent: string | null;
    senderUserId: string | null;
    senderUsername: string | null;
    fileType: string | null;
    oppositeUserId: string | null;
    oppositeUsername: string | null;
    oppositeUserStatus: string | null;
    oppositeProfilePicture: string | null;
    unreadCount: number | 0
    removedAt: Date | null,
    chatClearedAt: Date | null
}
