import redisClient from "../../common/config/redisConfig";
import { IAuthRepository } from "./auth.service.interface";
import { injectable } from "inversify";

@injectable()
export default class AuthRepository implements IAuthRepository {
  async saveToken(
    token: string,
    email: string,
    expirationTime: number
  ): Promise<void> {
    try {
      await redisClient.setex(token, expirationTime, email);
    } catch (error) {
      console.error("Error saving token to Redis:", error);
      throw new Error("Error saving token.");
    }
  }

  async getToken(token: string): Promise<[error: Error | null, result: unknown][] | null | null> {
    try {
     return await redisClient.multi().get(token).ttl(token).exec();
    } catch (error) {
      console.error("Error fetching token from Redis:", error);
      throw new Error("Error fetching token.");
    }
  }

  async deleteToken(token: string): Promise<void> {
    try {
      await redisClient.del(token);
    } catch (error) {
      console.error("Error deleting token from Redis:", error);
      throw new Error("Error deleting token.");
    }
  }

  async rotateToken(oldToken: string, newToken: string, value: string, ttl: number): Promise<void> {
    
    try {
      await redisClient.multi().del(oldToken).setex(newToken, ttl, value).exec()
    } catch (error) {
      console.log(error ," FROM AUTH REPO ROTATE TOKEN")
      throw new Error("Error rotating token")
    }
  }
}
