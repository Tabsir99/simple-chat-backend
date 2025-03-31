// src/common/errors/AuthError.ts
export type AuthErrorCode =
  | 'TOKEN_NOT_FOUND'
  | 'TOKEN_EXPIRED'
  | 'INVALID_TOKEN'
  | 'EMAIL_VERIFICATION_FAILED'
  | 'GOOGLE_AUTH_FAILED'
  | 'LOGIN_FAILED'
  | 'MAGIC_LINK_EXPIRED'
  | 'MAGIC_LINK_INVALID'
  | 'GOOGLE_TOKEN_EXCHANGE_FAILED'
  | 'GOOGLE_TOKEN_VERIFICATION_FAILED'
  | 'TOKEN_ROTATION_FAILED'
  | 'TOKEN_REVOCATION_FAILED';

export class AuthError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number,
    public readonly errorCode: AuthErrorCode,
    public readonly details?: Record<string, any>
  ) {
    super(message);
    this.name = "AuthError";
    Error.captureStackTrace(this, this.constructor);
  }

  static tokenNotFound(details?: Record<string, any>): AuthError {
    return new AuthError(
      'Refresh token not found or invalid',
      401,
      'TOKEN_NOT_FOUND',
      details
    );
  }

  static tokenExpired(details?: Record<string, any>): AuthError {
    return new AuthError(
      'Token has expired',
      401,
      'TOKEN_EXPIRED',
      details
    );
  }

  static invalidToken(details?: Record<string, any>): AuthError {
    return new AuthError(
      'Invalid token',
      401,
      'INVALID_TOKEN',
      details
    );
  }

  static emailVerificationFailed(details?: Record<string, any>): AuthError {
    return new AuthError(
      'Failed to send verification email',
      500,
      'EMAIL_VERIFICATION_FAILED',
      details
    );
  }

  static magicLinkExpired(details?: Record<string, any>): AuthError {
    return new AuthError(
      'Magic link has expired',
      401,
      'MAGIC_LINK_EXPIRED',
      details
    );
  }

  static magicLinkInvalid(details?: Record<string, any>): AuthError {
    return new AuthError(
      'Magic link is invalid or has been used',
      401,
      'MAGIC_LINK_INVALID',
      details
    );
  }

  static googleAuthFailed(details?: Record<string, any>): AuthError {
    return new AuthError(
      'Google authentication failed',
      401,
      'GOOGLE_AUTH_FAILED',
      details
    );
  }

  static googleTokenExchangeFailed(details?: Record<string, any>): AuthError {
    return new AuthError(
      'Failed to exchange authorization code for tokens',
      401,
      'GOOGLE_TOKEN_EXCHANGE_FAILED',
      details
    );
  }

  static googleTokenVerificationFailed(details?: Record<string, any>): AuthError {
    return new AuthError(
      'Failed to verify Google token',
      401,
      'GOOGLE_TOKEN_VERIFICATION_FAILED',
      details
    );
  }

  static loginFailed(details?: Record<string, any>): AuthError {
    return new AuthError(
      'Login failed',
      401,
      'LOGIN_FAILED',
      details
    );
  }

  static tokenRotationFailed(details?: Record<string, any>): AuthError {
    return new AuthError(
      'Failed to rotate refresh token',
      500,
      'TOKEN_ROTATION_FAILED',
      details
    );
  }

  static tokenRevocationFailed(details?: Record<string, any>): AuthError {
    return new AuthError(
      'Failed to revoke refresh token',
      500,
      'TOKEN_REVOCATION_FAILED',
      details
    );
  }
}