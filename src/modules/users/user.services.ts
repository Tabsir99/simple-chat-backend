import { IUserRepository, IUserService, UserData } from "./user.service.interface";

export default class UserService implements IUserService {
    
    constructor(private userRepository: IUserRepository){}

    generateUsernameFromEmail(email: string): string {
        return email.trim().split("@")[0]
    }


    getUserId = async (email: string): Promise<UserData | null> => {
       const userID = await this.userRepository.findByEmail(email)
        return userID
    }


    createUser = async (email: string, username: string): Promise<UserData> => {
        const userID = await this.userRepository.createUser(email, username)
        return userID
    }
}