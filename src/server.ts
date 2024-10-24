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
    methods: "*"
  })
);
app.use(cookieParser());


app.use("/api",authRoute)
app.use("/api", userRoute);
app.use("/api", friendRoute);
app.use("/api", chatRoute);
app.use("/api", messageRouter)


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
  console.error(err.stack); // Log error details (stack trace)
  console.log("From error middleware")
  
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: err.message, // Send back error details (optional)
  });
});

const PORT = 3001;
httpServer.listen(PORT, () => {
  console.log("Server started at port:", PORT);
});

// Web socket server initializing
// const webSocketManager = container.get<WebSocketManager>(TYPES.WebSocketManager)
// webSocketManager.initialize(httpServer)