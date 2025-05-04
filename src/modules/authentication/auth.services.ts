import { createHash, randomBytes } from "crypto";
import { JWTVerifyResult, SignJWT, createRemoteJWKSet, jwtVerify } from "jose";

import redisClient from "../../common/config/redisConfig";
import { AuthError } from "../../common/errors/authErrors";
import config from "../../common/config/env";
import * as userService from "../users/user.services";
import * as authRepository from "./auth.repository";
import sendEmail from "../../common/config/sendGrid";

export const generateAccessToken = async (
  userData: any,
  duration: string,
  secret: string
): Promise<string> => {
  return new SignJWT({ ...userData })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(duration)
    .sign(new TextEncoder().encode(secret));
};

function generateRefreshToken(): string {
  return randomBytes(64).toString("hex");
}
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function getExpiry(days: number): Date {
  const now = new Date();
  now.setDate(now.getDate() + days);
  return now;
}

export async function handleUserLogin(
  email: string,
  name?: string
): Promise<{ refreshToken: string; userId: string }> {
  try {
    let userId = await userService.getUserId(email);

    if (!userId) {
      userId = await userService.createUser(
        email,
        name || userService.generateUsernameFromEmail(email)
      );
    }

    const refreshToken = generateRefreshToken();
    const hashedToken = hashToken(refreshToken);
    const expiresAt = getExpiry(14);

    await authRepository.saveToken(hashedToken, userId, expiresAt);

    return { refreshToken, userId };
  } catch (error) {
    console.error(error, "FROM AUTH SERVICE HANDLE LOG IN");
    throw new Error("Error handling user login");
  }
}

export async function sendVerificationEmail(email: string): Promise<any> {
  const token = await generateAccessToken(
    { email },
    "5m",
    config.jwtSecretMagicLink
  );

  const magicLink = `${config.baseUrl}/api/auth/login?token=${token}`;
  await redisClient.setex(`linkToken:${token}`, 15 * 60, email);

  try {
    await sendEmail(email, "Verify your email", magicLink);
    return true;
  } catch (error) {
    console.error("Error occurred", error);
    throw new Error("Couldnt send verification email");
  }
}

export async function emailLogIn(
  token: string
): Promise<{ refreshToken: string | null }> {
  try {
    const tokenExists = await redisClient.get(`linkToken:${token}`);
    if (!tokenExists) {
      return {
        refreshToken: null,
      };
    }

    const decoded: JWTVerifyResult<{ email: string }> = await jwtVerify(
      token,
      new TextEncoder().encode(config.jwtSecretMagicLink)
    );

    await redisClient.del(`linkToken:${token}`);
    const refreshToken = await handleUserLogin(decoded.payload.email);
    return refreshToken;
  } catch (err) {
    console.error(err, " FROM AUTH SERVICE EMAIL OGIN");
    return {
      refreshToken: null,
    };
  }
}

export async function googleLogIn(
  code: string
): Promise<{ refreshToken: string | null }> {
  try {
    const token = await exchangeCodeForToken(code);
    const payload = await verifyGoogleToken(token.id_token);
    const result = await handleUserLogin(payload.email);
    return result;
  } catch (error) {
    return {
      refreshToken: null,
    };
  }
}

async function exchangeCodeForToken(code: string): Promise<any> {
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: config.googleClientId,
      client_secret: config.googleClientSecret,
      redirect_uri: `${config.baseUrl}/api/auth/google/callback`,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenResponse.ok) {
    const errorData = await tokenResponse.json();
    throw new Error(
      "Failed to exchange authorization code for tokens: " + errorData.error
    );
  }

  return tokenResponse.json();
}

export async function verifyGoogleToken(
  idToken: string
): Promise<{ email: string; name: string; picture: string }> {
  const jwkUrl = "https://www.googleapis.com/oauth2/v3/certs";
  const JWKS = createRemoteJWKSet(new URL(jwkUrl));

  const payload: JWTVerifyResult<{
    email: string;
    name: string;
    picture: string;
  }> = await jwtVerify(idToken, JWKS, {
    issuer: "https://accounts.google.com",
    audience: config.googleClientId,
  });

  return payload.payload;
}

export async function verifyOrRefreshToken(
  refreshToken: string
): Promise<{ newAccessToken: string; newRefreshToken: string }> {
  try {
    const oldToken = await authRepository.getToken(hashToken(refreshToken));

    if (!oldToken) {
      throw AuthError.tokenNotFound({ refreshToken });
    }
    if (oldToken.expiresAt < new Date()) {
      throw AuthError.tokenExpired({
        oldTokenId: oldToken.tokenId,
      });
    }

    const newAccessToken = await generateAccessToken(
      { userId: oldToken.userId },
      "30m",
      config.jwtSecretAccess
    );

    const newRefreshToken = generateRefreshToken();
    const newRefreshTokenHash = hashToken(newRefreshToken);

    await authRepository.rotateToken(
      {
        expiresAt: oldToken.expiresAt,
        tokenId: oldToken.tokenId,
      },
      newRefreshTokenHash,
      oldToken.userId
    );

    return { newAccessToken, newRefreshToken };
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.errorCode === "TOKEN_EXPIRED") {
        await authRepository.revokeToken(error.details?.oldTokenId as string);
        throw error;
      }
    }
    throw AuthError.invalidToken({ expiredIn: error });
  }
}

export async function revokeRefreshToken(oldToken: string) {
  try {
    const res = await authRepository.getToken(hashToken(oldToken));
    if (res) {
      await authRepository.revokeToken(res.tokenId);
    }
  } catch (error) {
    console.error(error);
    throw error;
  }
}
