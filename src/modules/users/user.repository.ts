import { IUserRepository } from "./user.service.interface";
import prisma from "../../common/config/db";
import { UserData } from "./user.service.interface";

export class UserRepository implements IUserRepository {
    async findByEmail(email: string): Promise<UserData | null> {
        try {
            return await prisma.user.findUnique({
                where: { email },
                select: {
                    userId: true,
                    email: true,
                    username: true,
                },
            });
        } catch (error) {
            throw new Error("Database error while fetching user.");
        }
    }

    async createUser(email: string, username: string): Promise<UserData> {
        try {
            return await prisma.user.create({
                data: { email, username },
                select: { email: true, userId: true, username: true },
            });
        } catch (error) {
            throw new Error("Database error while creating user.");
        }
    }


    async getUserId () {
        
    }
}
