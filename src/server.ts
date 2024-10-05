import "reflect-metadata";

import express from "express";
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
    origin: [config.baseUrlFrontend, "http://localhost:5500"],
    credentials: true,
  })
);
app.use(cookieParser());

app.use("/api",authRoute)
app.use("/api", userRoute);
app.use("/api", friendRoute);
app.use("/api", chatRoute);
app.use("/api", messageRouter)



app.all("*", (req, res) => {
  res
    .json({
      error: "API Route doesn't Exists",
      url: req.url,
    })
    .status(404);
});

const PORT = 3001;
httpServer.listen(PORT, "0.0.0.0", () => {
  console.log("Server started at port:", PORT);
});

// Web socket server initializing
// const webSocketManager = container.get<WebSocketManager>(TYPES.WebSocketManager)
// webSocketManager.initialize(httpServer)
