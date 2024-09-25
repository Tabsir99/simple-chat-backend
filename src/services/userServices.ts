import pool from "../db/db";
import userQueries from "../db/query/userQueries";

import { generateUsernameFromEmail } from "../utils/utils";

class UserService {
  async getUserInfo(email: string) {
    const result = await userQueries.getUserInfoByEmail(email);

    if (result.rows.length > 0) {
      return result.rows[0];
    } else {
      return false;
    }
  }
  async createUser(email: string, name: string | undefined = undefined) {
    const username = name ? name : generateUsernameFromEmail(email);

    return pool.query(
      "INSERT INTO users (email,username) values($1, $2) RETURNING id,username,user_status,email",
      [email, username]
    );
  }
}

const userService = new UserService();

export default userService;
