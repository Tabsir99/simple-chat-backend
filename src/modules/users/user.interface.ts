import { UserStatus } from "@prisma/client";

export interface UserData {
  userId: string;
  username: string;
  profilePicture: string;
  userStatus: UserStatus;
}
