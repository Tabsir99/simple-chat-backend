type ApiResponse = {
  success: boolean;
  message?: string
  meta: {
    timestamp: string;
    version: "1.0";
  };
  data?: any;
  error?: any;
};

type FormatResponseProps = {
  success: boolean,
  data?: any,
  error?: any,
  message?: string
}

export function formatResponse({success, message, data = null, error = null}: FormatResponseProps): ApiResponse {
  const response: ApiResponse = {
    success,
    message,
    meta: {
      timestamp: new Date().toISOString(),
      version: "1.0",
    },
  };

  if (success) {
    response.data = data;
  } else {
    response.error = error;
  }

  return response;
}
