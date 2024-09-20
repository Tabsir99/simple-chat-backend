import { Request, Response } from "express";
import AuthService from "../services/authServices";

const authController = async (req: Request, res: Response) => {

    const { email } = req.body
    const userExists = await AuthService.prototype.checkUserExist(email)
    res.send(userExists)
}


export default authController;