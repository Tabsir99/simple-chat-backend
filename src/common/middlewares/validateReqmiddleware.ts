import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { formatResponse } from "../utils/responseFormatter";

export const validateRequestBody =
  (schema: z.ZodObject<any>) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const response = formatResponse({
          message: "Invalid Email format",
          success: false,
        });
        return res.json(response);
      }

      const response = formatResponse({
        message: "Unexpected Error Occured",
        success: false,
      });
      return res.status(500).json(response);
    }
    return next();
  };

export const validateReqQuery =
  (schema: z.ZodObject<any>) =>
  (req: Request, res: Response, next: NextFunction) => {
    const query = req.query;

    try {
      const result = schema.safeParse(query);

      if (!result.success) {
        throw new Error(`${result.error.name}`, {
          cause: result.error.errors,
        });
      }
      req.query = result.data;
    } catch (error) {
      if (error instanceof Error) {
        const response = formatResponse({
          message: "Invalid query format",
          success: false,
        });
        return res.status(400).json(response);
      }

      const response = formatResponse({
        message: "Unexpected Error Occured",
        success: false,
      });
      return res.status(500).json(response);
    }
    return next();
  };

