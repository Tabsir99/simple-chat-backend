import { Response } from "express";
import { SuccessResponse, ErrorResponse } from "../types/responseTypes";


export const sendSuccessResponse = ({
  res,
  message,
  data = {},
  statusCode = 200,
}: SuccessResponse): Response => {
  return res.status(statusCode).json({
    status: "success",
    message,
    data,
  });
};

// Utility for sending error responses

export const sendErrorResponse = ({
  res,
  message,
  errors = [],
  statusCode = 400,
}: ErrorResponse): Response => {
  return res.status(statusCode).json({
    status: "error",
    message,
    errors,
  });
};
