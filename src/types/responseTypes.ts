import { Response } from "express";

export interface SuccessResponse {
    res: Response;
    message: string;
    data?: object;
    statusCode?: number;
  }

export interface ErrorResponse {
    res: Response;
    message: string;
    errors?: Array<object>;
    statusCode?: number;
  }