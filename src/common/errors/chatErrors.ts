export type ChatErrorCode =
  | 'MEMBER_ACCESS_DENIED'
  | 'MEMBER_ALREADY_EXISTS'
  | 'MEMBER_NOT_FOUND'
  | 'INVALID_ROLE'
  | 'ROOM_NOT_FOUND'
  | 'MEMBER_LIMIT_EXCEEDED'

export class ChatError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number,
    public readonly errorCode: ChatErrorCode,
    public readonly details?: Record<string, any>
  ) {
    super(message);
    this.name = "ChatError";
    Error.captureStackTrace(this, this.constructor);
  }

  // Member related errors
  static memberAccessDenied(details?: Record<string, any>): ChatError {
    return new ChatError(
      'User does not have access to this chat room',
      403,
      'MEMBER_ACCESS_DENIED',
      details
    );
  }

  static memberAlreadyExists(details?: Record<string, any>): ChatError {
    return new ChatError(
      'One or more members already exist in this chat room',
      400,
      'MEMBER_ALREADY_EXISTS',
      details
    );
  }

  static memberNotFound(details?: Record<string, any>): ChatError {
    return new ChatError(
      'Member not found in this chat room',
      404,
      'MEMBER_NOT_FOUND',
      details
    );
  }

  static memberLimitExceeded(details?: Record<string, any>): ChatError {
    return new ChatError(
      'Chat room member limit exceeded',
      400,
      'MEMBER_LIMIT_EXCEEDED',
      details
    );
  }

  // Room related errors
  static roomNotFound(details?: Record<string, any>): ChatError {
    return new ChatError(
      'Chat room not found',
      404,
      'ROOM_NOT_FOUND',
      details
    );
  }

  // Role related errors
  static invalidRole(details?: Record<string, any>): ChatError {
    return new ChatError(
      'Invalid user role for this operation',
      403,
      'INVALID_ROLE',
      details
    );
  }

}