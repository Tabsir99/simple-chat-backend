import { responseFormatter } from "../utils/responseFormatter";
import { Request,Response, NextFunction } from "express";
import { z } from "zod";

export const validateRequestBody = (schema: z.ZodObject<any>) => (req: Request, res: Response, next: NextFunction) => {
  
  try {
    schema.parse(req.body)
  } catch (error) {
    if(error instanceof z.ZodError){
      
      const response = responseFormatter.formatErrorResponse({ message: "Invalid Email format", statusCode: 403 })
      return res.json(response)
    }
    
    const response = responseFormatter.formatErrorResponse({ message: "Unexpected Error Occured", statusCode: 500 })
    return res.json(response)
  }
  return next()
};
