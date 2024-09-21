import pool from "../db/db"

class AuthServiceClass {
    
    async checkUserExist(email: string) {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        return result; // Return true or false based on existence
    }
}

const AuthService = new AuthServiceClass()

export default AuthService;