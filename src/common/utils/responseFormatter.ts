export interface SuccessResponse<T> {
  message: string;
  data: T;
}

export interface ErrorResponse {
  message: string;
  statusCode: number;
}

export interface IResponseFormatter {
  formatSuccessResponse<T>(response: SuccessResponse<T>): SuccessResponse<T>;
  formatErrorResponse(error: ErrorResponse): ErrorResponse;
}

export class ResponseFormatter implements IResponseFormatter {
  public formatSuccessResponse<T>(response: SuccessResponse<T>): SuccessResponse<T> {
    return {
      message: response.message,
      data: response.data,
    };
  }

  public formatErrorResponse(error: ErrorResponse): ErrorResponse {
    return {
      message: error.message,
      statusCode: error.statusCode,
    };
  }
}

export const responseFormatter = new ResponseFormatter()