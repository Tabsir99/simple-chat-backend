import { $Enums } from "@prisma/client";

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
  unreadCount: number | 0;
  removedAt: Date | null;
  chatClearedAt: Date | null;
}

export interface CallParticipant {
  userId: string;
  joinedAt: Date;
  leftAt: Date | null;
}

export interface CallData {
  callId: string;
  callerId: string;
  participants: CallParticipant[];
  messageId: string;
  isVideoCall: boolean;
  status: "ongoing" | "missed" | "ended" | "initiating";
  chatRoomId: string;
  startTime?: Date;
  endTime?: Date;
}

export interface IChatServices {
  getChats(userId: string): Promise<ChatRoomHead[]>;
  getChatRoomList(userId: string): Promise<string[]>;

  createChatRoom(
    currentUserId: string,
    users: { userId: string; username: string }[],
    groupName: string
  ): Promise<any>;

  getChatRoomMembers(chatRoomId: string): Promise<
    | {
        isCreator: boolean;
        nickName: string | null;
        isAdmin: boolean;
        removedAt: Date | null;
        userId: string;
        username: string;
        profilePicture: string | null;
        userStatus: string;
      }[]
    | undefined
  >;

  updateGroupMember(
    chatRoomId: string,
    userId: string,
    action: "promote" | "demote" | "nickname",
    currentUserId: string,
    username: string,
    nickname?: string
  ): Promise<{ messageId: string; content: string; createdAt: Date }>;

  updateGroupMembership(
    chatRoomId: string,
    userId: string,
    currentUserId: string,
    username: string
  ): Promise<
    | {
        createdAt: Date;
        messageId: string;
        content: string;
      }
    | boolean
  >;

  addMember(
    data: {
      chatRoomId: string;
      users: { userId: string; username: string }[];
    },
    currentUserId: string
  ): Promise<any>;

  leaveGroup(
    userId: string,
    chatRoomId: string,
    username: string
  ): Promise<any>;

  validateMember(userId: string, chatRoomId: string): Promise<any>;

  verifyUserPermission(
    userId: string,
    chatRoomId: string
  ): Promise<{
    isAdmin: boolean;
    username: string;
  }>;

  getChatRoomMedia(chatRoomId: string): Promise<
    | Array<{
        fileName: string;
        fileType: string;
        fileSize: number;
      }>
    | undefined
  >;

  updateChat(
    currentUserId: string,
    chatRoomId: string,
    data: {
      roomName?: string;
      imageName: string;
      size: number;
      imageType: string;
      type: "name" | "image";
    }
  ): Promise<any>;

  updateChatRoomImage(chatRoomId: string, currentUserId: string): Promise<any>;

  clearChat(chatRoomId: string, userId: string): Promise<any>;

  createCallMessage(callData: CallData): Promise<void>;
}





export interface IChatRepository {
  findChatsByUserId(userId: string): Promise<ChatRoomHead[]>;

  findUserChatroomStatus(userId: string): Promise<
    {
      chatRoomId: string;
      unreadCount: number;
      removedAt: Date | null;
    }[]
  >;

  createChat(
    users: {
      isCreator: boolean;
      userId: string;
      username: string;
    }[],
    groupName: string
  ): Promise<{
    chatRoom: {
      chatRoomId: string;
      isGroup: boolean;
      roomName: string | null;
      createdBy: string | null;
      roomImage: string | null;
    };
  }>;

  getChatRoomMembers(chatRoomId: string): Promise<{
    createdBy: string | null;
    ChatRoomMember: {
      removedAt: Date | null;
      userRole: string;
      nickName: string | null;
      user: {
        username: string;
        userId: string;
        profilePicture: string | null;
        userStatus: string;
      };
    }[];
  } | null>;

  getChatRoomMedia(chatRoomId: string): Promise<{
    Messages: {
      Attachment: {
        fileType: string;
        fileName: string;
        fileSize: number;
      }[];
    }[];
  } | null>;

  getChatRoomListByUserId(userId: string): Promise<{ chatRoomId: string }[]>;

  updateGroupMemberRole(
    chatRoomId: string,
    userId: string,
    userRole: "admin" | "member",
    username: string,
    currentUsername: string
  ): Promise<{
    messageId: string;
    content: string;
    createdAt: Date;
  }>;

  updateGroupMember(
    chatRoomId: string,
    userId: string,
    username: string,
    nickname: string,
    currentUserName: string
  ): Promise<{
    messageId: string;
    content: string;
    createdAt: Date;
  }>;

  findChatRoom(userId: string, chatRoomId: string): Promise<{
    chatClearedAt: Date | null;
    joinedAt: Date;
    removedAt: Date | null;
  } | null>;

  deleteGroupMember(
    chatRoomId: string,
    userId: string,
    currentUserId: string,
    username: string,
    currentUsername: string
  ): Promise<{
    content: string;
    createdAt: Date;
    messageId: string;
  }>;

  clearChat(chatRoomId: string, userId: string): Promise<{ chatClearedAt: Date | null }>;

  addGroupMember(
    data: { chatRoomId: string; users: { userId: string; username: string }[] },
    currentUsername: string
  ): Promise<{
    messageId: string;
    content: string;
    createdAt: Date;
  }>;

  findUserPermission(
    userId: string,
    chatRoomId: string
  ): Promise<{
    userRole: string;
    joinedAt: Date;
    chatClearedAt: Date | null;
    removedAt: Date | null;
    user: { username: string };
  } | null>;

  updateChat(
    chatRoomId: string,
    content: string,
    data?: string,
    url?: string
  ): Promise<{
    messageId: string;
    createdAt: Date;
    content: string;
  }>;

  createCallMessage(callData: CallData): Promise<void>;
}
