export interface UserData {
    userId: string | null;
  }
  
  export interface IUserService {
    getUserId(email: string): Promise<UserData | null>;
    createUser(email: string, username: string): Promise<UserData>;
    generateUsernameFromEmail(email: string): string;
  }  



  // user.repository.interface.ts
  export interface IUserRepository {
      findByEmail(email: string): Promise<UserData | null>;
      createUser(email: string, username: string): Promise<UserData>;
  }
  