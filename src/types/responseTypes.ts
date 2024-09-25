
export interface SuccessResponse<T = any> {
  message?: string;
  data?: T;
  statusCode?: number;
  status?: string
}

export interface ErrorResponse {
  message?: string;
  errors?: Array<object>;
  statusCode?: number;
  status?: string
}

export interface UserInfo {
  id: number;
  username: string;
  user_status: "online" | "offline";
  email: string
}
