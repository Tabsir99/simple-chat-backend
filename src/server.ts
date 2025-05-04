import "reflect-metadata";

import express, { Request, Response } from "express";
import cors from "cors";
import config from "./common/config/env.js";
import cookieParser from "cookie-parser";
import authRoute from "./modules/authentication/auth.routes.js";
import userRoute from "./modules/users/user.routes.js";
import chatRoute from "./modules/chats/chat.routes";
import { createServer } from "http";

import messageRouter from "./modules/messages/message.routes";
import mediaRouter from "./modules/media/media.route";
import { initialize } from "./common/websockets/websocket.js";

// const cert = readFileSync("./ssl/cert.pem")
// const key = readFileSync("./ssl/key.pem")

process.env.TZ = "UTC";
const app = express();
const httpServer = createServer(app);

initialize(httpServer);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: config.baseUrlFrontend,
    credentials: true,
    methods: "*",
    maxAge: 86400,
  })
);
app.use(cookieParser());

app.use("/api", authRoute);
app.use("/api", messageRouter);
app.use("/api", mediaRouter);
app.use("/api", userRoute);
app.use("/api", chatRoute);

app.all("*", (req, res) => {
  res
    .json({
      error: "API Route doesn't Exists",
      url: req.url,
    })
    .status(404);
});

app.use((err: Error, _: Request, res: Response) => {
  console.error(err.stack, "From Error middleware");

  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: err.message,
  });
});

const PORT = 3000;
httpServer.listen(PORT, () => {
  console.info("Server started at port:", PORT, process.env.TZ);
});
