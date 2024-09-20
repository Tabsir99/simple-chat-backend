import { sendErrorResponse } from "../utils/responseHandler";
import { Request,Response, NextFunction } from "express";
import { z } from "zod";

export const validateRequestBody = (schema: z.ZodObject<any>) => (req: Request, res: Response, next: NextFunction) => {
  
  try {
    schema.parse(req.body)
  } catch (error) {
    if(error instanceof z.ZodError){
      
      return sendErrorResponse({ res: res, message: "Invalid Email format", errors: JSON.parse(error.message) })
    }
    
    return sendErrorResponse({ res: res, message: "Unexpected Error Occured", statusCode: 500 })
  }
  return next()
};
