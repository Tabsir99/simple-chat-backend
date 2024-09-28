import redisClient from "../../common/config/redisConfig";
import { IAuthRepository } from "./auth.service.interface";


export default class AuthRepository implements IAuthRepository {

  async saveToken(token: string, email: string, expirationTime: number): Promise<void> {
    try {
      await redisClient.setex(token, expirationTime, email);
    } catch (error) {
      console.error('Error saving token to Redis:', error);
      throw new Error('Error saving token.');
    }
  }

  async getToken(token: string): Promise<string | null> {
    try {
      return await redisClient.get(token);
    } catch (error) {
      console.error('Error fetching token from Redis:', error);
      throw new Error('Error fetching token.');
    }
  }

  async deleteToken(token: string): Promise<void> {
    try {
      await redisClient.del(token);
    } catch (error) {
      console.error('Error deleting token from Redis:', error);
      throw new Error('Error deleting token.');
    }
  }
}
