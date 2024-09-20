import pool from "../db/db"

class AuthService {
    
    public async checkUserExist(email: string){
        const result = await pool.query(`select * from users where email==${email}`)
        console.log(result)
    }
}

export default AuthService;