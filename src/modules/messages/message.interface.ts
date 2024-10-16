interface User {
  username: string;
  profilePicture: string | null;
  userId: string;
}

interface MessageReaction {
  reactionType: string;
  userId: string;
}

interface Attachment {
  //   fileType: string;
  fileUrl: string;
}

interface ParentMessage {
  messageId: string;
  sender: {
    username: string;
  };
  content: string;
}

export interface IRawMessage {
  messageId: string;
  content: string;
  isDeleted: boolean;
  createdAt: Date;
  sender: User;
  parentMessage: ParentMessage | null;
  MessageReaction: MessageReaction[];
  Attachment: Attachment[];
  MessageReceipt: {
    lastReadMessageId: string;
    chatRoomMember: {
      user: { userId: string; username: string; profilePicture: string | null };
    };
  }[];
}
