import { Socket as SocketIOSocket } from "socket.io";

declare module "socket.io" {
  interface Socket extends SocketIO {
    userId?: string;
  }
}

declare global {
  namespace Express {
    interface Request {
      user: {
        userId?: string
      }
    }
  }
}
export {}