import { QueryResult } from "pg";
import pool from "../db";
import { UserInfo } from "../../types/responseTypes";




class UserQueries {
  getUserInfoByEmail(email: string): Promise<QueryResult<UserInfo>> {
    return pool.query(
      "SELECT id, username, user_status, email from users WHERE email = $1",
      [email]
    );
  }
}


export default new UserQueries()