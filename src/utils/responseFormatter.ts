import { ErrorResponse, SuccessResponse } from "../types/responseTypes";


export const formatSuccessResponse = ({
    message="",
    data = {},
    statusCode = 200,
  }: SuccessResponse) => {
    return {
      status: "success",
      message,
      data,
      statusCode,
    };
  };
  
  export const formatErrorResponse = ({
    message="",
    errors = [],
    statusCode = 400,
  }:ErrorResponse ) => {
    return {
      status: "error",
      message,
      errors,
      statusCode,
    };
  };