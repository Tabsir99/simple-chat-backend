// src/messages/errors/MessageError.ts
export type MessageErrorCode = 
  | 'MEMBER_ACCESS_DENIED'
  | 'MESSAGE_NOT_FOUND'
  | 'ATTACHMENT_PROCESSING_FAILED'
  | 'MESSAGE_CREATION_FAILED'
  | 'INVALID_REACTION'
  | 'RECEIPT_UPDATE_FAILED';

export class MessageError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number,
    public readonly errorCode: MessageErrorCode,
    public readonly details?: Record<string, any>
  ) {
    super(message);
    this.name = 'MessageError';
    Error.captureStackTrace(this, this.constructor);
  }

  // Most important for your service - access control
  static memberAccessDenied(details?: Record<string, any>): MessageError {
    return new MessageError(
      'User does not have access to this chat room',
      403,
      'MEMBER_ACCESS_DENIED',
      details
    );
  }

  // Critical for message operations
  static messageCreationFailed(details?: Record<string, any>): MessageError {
    return new MessageError(
      'Failed to create message',
      500,
      'MESSAGE_CREATION_FAILED',
      details
    );
  }

  // Important for attachment handling
  static attachmentProcessingFailed(details?: Record<string, any>): MessageError {
    return new MessageError(
      'Failed to process message attachment',
      500,
      'ATTACHMENT_PROCESSING_FAILED',
      details
    );
  }

  // For message modifications
  static messageNotFound(details?: Record<string, any>): MessageError {
    return new MessageError(
      'Message not found',
      404,
      'MESSAGE_NOT_FOUND',
      details
    );
  }

  // For receipt operations
  static receiptUpdateFailed(details?: Record<string, any>): MessageError {
    return new MessageError(
      'Failed to update message receipt',
      500,
      'RECEIPT_UPDATE_FAILED',
      details
    );
  }
}