import { UserStatus } from "@prisma/client";
import { ChatError } from "../../common/errors/chatErrors";
import { CallData, ChatRoomHead } from "./chat.interface";
import * as chatRepository from "./chat.repository";

export const getChats = async (userId: string) => {
  try {
    const chats = await chatRepository.findChatsByUserId(userId);
    const refinedChats: ChatRoomHead[] = chats
      .map((chat) => {
        const otherMember = chat.chatRoom.ChatRoomMember[0];
        const lastMessageReadBy = chat.chatRoom.ChatRoomMember.filter(
          (m) => m.readAt && m.readAt >= chat.chatRoom.lastMessage!.createdAt
        ).sort((a, b) => a.readAt!.getTime() - b.readAt!.getTime());

        const roomStatus: UserStatus = chat.chatRoom.isGroup
          ? chat.chatRoom.ChatRoomMember.some(
              (m) => m.user.userStatus === "online"
            )
            ? "online"
            : "invisible"
          : otherMember.user.userStatus;
        return {
          chatRoomId: chat.chatRoomId,
          roomName: chat.chatRoom.roomName || otherMember.nickName,
          roomImage: chat.chatRoom.roomImage || otherMember.user.profilePicture,
          roomStatus: roomStatus,
          unreadCount: chat.unreadCount,
          isGroup: chat.chatRoom.isGroup,
          chatClearedAt: chat.chatClearedAt,

          joinedAt: chat.joinedAt,
          removedAt: chat.removedAt,
          lastMessageReadBy: lastMessageReadBy.map((m) => {
            return m.user;
          }),
          lastMessage: chat.chatRoom.lastMessage
            ? {
                ...chat.chatRoom.lastMessage,
                senderUsername: otherMember.nickName,
              }
            : null,
        };
      })
      .sort(
        (a, b) =>
          new Date(b.lastMessage?.createdAt!).getTime() -
          new Date(a.lastMessage?.createdAt!).getTime()
      );
    return refinedChats;
  } catch (error) {
    console.error(error);
    throw new Error("Failed to get all chats");
  }
};

export const createChatRoom = async (
  currentUserId: string,
  users: { userId: string; username: string }[],
  groupName: string
) => {
  try {
    const result = await chatRepository.createChat(
      currentUserId,
      users,
      groupName
    );

    return { ...result };
  } catch (error) {
    console.error(
      error instanceof Error
        ? error.message
        : "error occured from createChatRom"
    );
    throw new Error("Could not create a chatRoom");
  }
};

export const getChatRoomMembers = async (
  chatRoomId: string,
  userId: string
) => {
  const members = await chatRepository.getChatRoomMembers(chatRoomId, userId);

  if (!members)
    throw new Error("ChatRoom does not exist or you are not a member", {
      cause: 400,
    });

  const modifiedMembers = members?.ChatRoomMember.filter(
    (m) => m.removedAt === null
  ).map((member) => {
    return {
      ...member.user,
      isCreator: member.user.userId === members.createdBy,
      nickName: member.nickName,
      isAdmin: member.userRole === "admin",
      removedAt: member.removedAt,
    };
  });

  return modifiedMembers;
};

export const getChatRoomList = async (userId: string) => {
  const chatRoomList = await chatRepository.getChatRoomListByUserId(userId);
  return chatRoomList.map((chatRoom) => chatRoom.chatRoomId);
};

export const updateGroupMember = async (
  chatRoomId: string,
  userId: string,
  action: "promote" | "demote" | "nickname",
  currentUserId: string,
  username: string,
  nickname?: string
) => {
  let res: { messageId: string; content: string; createdAt: Date };

  const currentUser = await verifyUserPermission(currentUserId, chatRoomId);

  if (action === "nickname") {
    const message = `${currentUser.username} changed ${
      currentUserId === userId ? "his" : `${username}'s`
    } nickname to '${nickname}'`;

    res = await chatRepository.updateGroupMember(
      chatRoomId,
      userId,
      message,
      nickname as string,
      currentUser.username
    );
    return res;
  }

  if (!currentUser.isAdmin) throw new Error("Not enough permission");

  const message = `${currentUser.username} has ${
    action === "demote" ? "removed" : "promoted"
  } ${username} ${action === "demote" ? "from admin role" : "to admin"} `;

  res = await chatRepository.updateGroupMemberRole(
    chatRoomId,
    userId,
    action === "demote" ? "member" : "admin",
    message
  );

  return res;
};

export const updateGroupMembership = async (
  chatRoomId: string,
  userId: string,
  currentUserId: string,
  username: string
) => {
  try {
    const currentUser = await verifyUserPermission(currentUserId, chatRoomId);
    if (!currentUser.isAdmin) {
      throw new Error("Not enough permission");
    }

    const willLeaveGroup = userId === currentUserId;
    const messageContent = `${currentUser.username} ${
      willLeaveGroup ? "left" : "removed"
    } ${willLeaveGroup ? "" : username + " from "}the group`;

    const res = await chatRepository.deleteGroupMember(
      chatRoomId,
      userId,
      messageContent
    );

    return res;
  } catch (error) {
    return false;
  }
};

export const validateMember = async (userId: string, chatRoomId: string) => {
  const res = await chatRepository.findChatRoom(userId, chatRoomId);
  if (!res || res.removedAt) throw ChatError.memberAccessDenied();
  return res;
};

export const clearChat = async (chatRoomId: string, userId: string) => {
  try {
    const res = await chatRepository.clearChat(chatRoomId, userId);
    return res;
  } catch (error) {
    return false;
  }
};

export const addMember = async (
  data: { chatRoomId: string; users: { userId: string; username: string }[] },
  currentUserId: string
) => {
  const currentUser = await verifyUserPermission(
    currentUserId,
    data.chatRoomId
  );
  const res = await chatRepository.addGroupMember(data, currentUser.username);
  return res;
};

export const verifyUserPermission = async (
  userId: string,
  chatRoomId: string
) => {
  const res = await chatRepository.findUserPermission(userId, chatRoomId);
  if (!res) throw new Error("ChatRoomMember does not exists");

  if (res.removedAt) throw new Error("User is no longer in the chatroom");

  return {
    isAdmin: res.userRole === "admin" ? true : false,
    username: res.user.username,
  };
};

export const createCallMessage = async (callData: CallData) => {
  try {
    const res = await chatRepository.createCallMessage(callData);
  } catch (error) {
    console.error("error occurd", error);
  }
};
