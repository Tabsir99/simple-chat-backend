import * as userRepository from "./user.repository";
import * as mediaService from "../media/media.services";
import { UserData } from "./user.interface";
import { UserStatus } from "@prisma/client";

export const generateUsernameFromEmail = (email: string): string => {
  return email.trim().split("@")[0];
};

export const getUserId = async (email: string): Promise<string | null> => {
  const userID = await userRepository.getUserId(email);
  if (!userID?.userId) return null;
  return userID.userId;
};

export const createUser = async (
  email: string,
  username: string,
  profilePicture?: string
): Promise<string> => {
  const userID = await userRepository.createUser(
    email,
    username,
    profilePicture
  );
  return userID.userId;
};

export const getUserInfo = async (userId: string, query?: object) => {
  try {
    const rawUserInfo = await userRepository.getUserInfo(userId, query);
    if (!rawUserInfo) {
      return null;
    }

    const userInfo = {
      ...rawUserInfo,
    };

    return userInfo;
  } catch (error) {
    console.error(error, " FROM USER SERVICE GETUSERINFO");
    return null;
  }
};

export const queryByUsername = async (
  query: { query: string; chatRoomId?: string },
  userId: string
): Promise<Array<UserData> | null> => {
  try {
    const result = await userRepository.searchUsername(query.query, userId);
    return result;
  } catch (error) {
    console.error(error, " FROM USERSERVICE QUERY BY NAME");
    return null;
  }
};

export const updateUser = async (
  userId: string,
  userData: {
    username?: string;
    bio?: string;
    image?: { imageSize: number; imageName: string; imageType: string };
    status?: UserStatus;
  }
) => {
  try {
    let urlPromise: string | undefined = undefined;
    if (userData.image) {
      const path = `avatars/${userId}`;
      urlPromise = await mediaService.getWriteSignedUrl(path, {
        contentSize: userData.image.imageSize,
        contentType: userData.image.imageType,
      });
    }
    const result = await userRepository.updateUser({
      userId,
      userData,
    });

    return result;
  } catch (error) {
    console.error(error);
    throw error;
  }
};
