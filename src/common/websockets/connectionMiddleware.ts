import { jwtVerify } from "jose";
import config from "../config/env";
import { Server as SocketServer } from "socket.io";

const failedAuthAttempts = new Map<
  string,
  { count: number; timestamp: number }
>();

export function setupMiddleware(io: SocketServer): void {
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    const clientIp = socket.handshake.address || "unknown_ip";

    // 1️⃣ ✅ Prevent brute force by limiting failed attempts
    if (failedAuthAttempts.has(clientIp)) {
      const attempt = failedAuthAttempts.get(clientIp)!;
      const elapsedTime = Date.now() - attempt.timestamp;

      if (attempt.count >= 5 && elapsedTime < 10 * 60 * 1000) {
        // 10 minutes
        return next(
          new Error("Too many failed login attempts. Try again later.")
        );
      }

      if (elapsedTime > 10 * 60 * 1000) {
        failedAuthAttempts.delete(clientIp);
      }
    }

    // 2️⃣ ✅ Ensure token is present
    if (!token || typeof token !== "string") {
      return next(new Error("No Token provided"));
    }

    try {
      // 3️⃣ ✅ Validate token format before decoding
      if (
        !token.match(/^eyJ[a-zA-Z0-9-_]+\.eyJ[a-zA-Z0-9-_]+\.[a-zA-Z0-9-_]+$/)
      ) {
        return next(new Error("Invalid token format"));
      }

      // 4️⃣ ✅ Verify token and extract user ID
      const payload = await jwtVerify(
        token,
        new TextEncoder().encode(config.jwtSecretAccess)
      );

      const userId = payload.payload.userId as string;
      if (!userId) {
        return next(new Error("Invalid token payload"));
      }

      // 5️⃣ ✅ Prevent token reuse: Check token expiration
      const exp = payload.payload.exp;
      if (exp && exp * 1000 < Date.now()) {
        return next(new Error("Token has expired"));
      }

      // 6️⃣ ✅ Assign verified user ID
      socket.userId = userId;

      // Reset failed attempts after a successful login
      failedAuthAttempts.delete(clientIp);
    } catch (error) {
      console.error(
        error instanceof Error && `${error.message} from websocket`
      );

      // Track failed attempts
      if (!failedAuthAttempts.has(clientIp)) {
        failedAuthAttempts.set(clientIp, { count: 1, timestamp: Date.now() });
      } else {
        failedAuthAttempts.get(clientIp)!.count++;
      }

      return next(new Error("Token verification failed"));
    }

    next();
  });
}
