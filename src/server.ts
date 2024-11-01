import "reflect-metadata";

import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import config, { configService } from "./common/config/env";
import cookieParser from "cookie-parser";
import authRoute from "./modules/authentication/auth.routes";
import userRoute from "./modules/users/user.routes";
import friendRoute from "./modules/friendship/frnd.routes";
import chatRoute from "./modules/chats/chat.routes";
import { createServer } from "http";
import { WebSocketManager } from "./common/websockets/websocket";
import container from "./inversify/bindings";
import { TYPES } from "./inversify/types";
import messageRouter from "./modules/messages/message.routes";
import mediaRouter from "./modules/media/media.route";
import EventEmitter from "events";


process.env.TZ = "UTC"
const app = express();
const httpServer = createServer(app);
const webSocketManager = container.get<WebSocketManager>(
  TYPES.WebSocketManager
);
webSocketManager.initialize(httpServer);



app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: config.baseUrlFrontend,
    credentials: true,
    methods: "*",
    maxAge: 86400
  })
);
app.use(cookieParser());


// app.use(async (_,__,next) => {
//   await new Promise(res => setTimeout(res,2500))
//   next()
// })

app.use("/api",authRoute)
app.use("/api", messageRouter);
app.use("/api",mediaRouter)
app.use("/api", userRoute);
app.use("/api", friendRoute);
app.use("/api", chatRoute);


// Error-handling middleware

// Error-handling middleware



app.all("*", (req, res) => {
  res
    .json({
      error: "API Route doesn't Exists",
      url: req.url,
    })
    .status(404);
});

app.use((err: Error, _: Request, res: Response) => {
  console.error(err.stack, "From Error middleware"); // Log error details (stack trace)
  
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: err.message, // Send back error details (optional)
  });
});

const PORT = 3001;
httpServer.listen(PORT, () => {
  console.info("Server started at port:", PORT, process.env.TZ);
});

// Web socket server initializing
// const webSocketManager = container.get<WebSocketManager>(TYPES.WebSocketManager)
// webSocketManager.initialize(httpServer)


const eventManager = container.get(TYPES.EventManager) as any
const used = process.memoryUsage().heapUsed;

console.log("In KB:", (used / 1024).toFixed(1)); // divide by 1024
console.log("In MB:", (used / (1024 * 1024)).toFixed(1));
console.log("Listener count", eventManager.totalListenersCount())


// setInterval(() => console.clear(), 60000)