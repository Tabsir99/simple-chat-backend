import { NextFunction, Request, Response } from "express";
import config from "../config/env";
import AuthService from "../services/authServices";
export default async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  
    const accessToken = req.cookies["accessToken"]
    if(!accessToken){
        return res.status(401).redirect(config.baseUrlFrontend)
    }
    
    const isTokenValid = await AuthService.verifyToken(accessToken, "access")
    if(!isTokenValid){
        return res.status(401).redirect(config.baseUrlFrontend)
    }
    
    next()
}
