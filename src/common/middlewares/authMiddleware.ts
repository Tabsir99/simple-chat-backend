import { NextFunction, Request, Response } from "express";
import { jwtVerify } from "jose";
import config from "../config/env";
import { formatResponse } from "../utils/responseFormatter";

export default async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  
    const authHeader = req.headers['authorization']; // Get the Authorization header
    const token = authHeader?.split(' ')[1];
    
    // console.log("Auth header:",authHeader)
    if(!token){
        return res.status(401).json({
            message: "Token not provided"
        })
    }
    try {
        const result = await jwtVerify(token, new TextEncoder().encode(config.jwtSecretAccess))
        // console.log("Verifying accesstoken success, result:",result)
        req.user = {
            userId: result.payload.userId as string,
        }
    } catch (error) {
       console.log(error instanceof Error?error.message:"", "\n acess Token verification failed, from authmiddleware")
        return res.status(401).json({
            message: "Access Token verification failed",
            error: error
        })
    }


    return next()
}
 

export async function refreshMiddleware(req: Request, res: Response, next: NextFunction) {
    const refreshToken = req.cookies["refreshToken"] as string

 
    if(!refreshToken){
        return res.status(401).json(formatResponse({
            success: false,
            message: "Invalid request, Refresh Token not provided"
        }))
    }
    // console.log("refresh acccesstoken middleware running, recived refresh token \n refreshToken:",refreshToken)

    // if(typeof refreshToken !== "string" || refreshToken.length !== 128){
    //     console.log("Invalid refresh token, from refreshMiddleare")
    //     return res.status(401).json(formatResponse({
    //         success: false,
    //         message: "Invalid Refresh Token"
    //     }))
    // }

    // console.log("Preparing to go next ... \n")
    return next()
}