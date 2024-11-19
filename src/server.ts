import "reflect-metadata";

import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import config, { configService } from "./common/config/env";
import cookieParser from "cookie-parser";
import authRoute from "./modules/authentication/auth.routes";
import userRoute from "./modules/users/user.routes";
import friendRoute from "./modules/friendship/frnd.routes";
import chatRoute from "./modules/chats/chat.routes";
import { createServer } from "https";

import { WebSocketManager } from "./common/websockets/websocket";
import container from "./inversify/bindings";
import { TYPES } from "./inversify/types";
import messageRouter from "./modules/messages/message.routes";
import mediaRouter from "./modules/media/media.route";
import EventEmitter from "events";
import { readFileSync } from "fs";
import "./common/utils/cronJobs"
import prisma from "./common/config/db";


const cert = readFileSync("./ssl/cert.pem")
const key = readFileSync("./ssl/key.pem")

process.env.TZ = "UTC"
const app = express();
const httpServer = createServer({cert: cert,key},app);

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




async function main() {
  await prisma.user.createMany({
    data: [
      {
        userId: '06a3daca-7d7b-4afc-97f2-cad72db73984',
        username: 'tabsirsfc',
        email: 'tabsirsfc@gmail.com',
        createdAt: new Date('2024-11-17T18:19:13.204Z'),
        profilePicture: 'https://storage.googleapis.com/simple-chat-cg.appspot.com/avatars/defaul>',
        bio: null,
        lastActive: new Date('2024-11-18T03:10:49.658Z'),
        userStatus: 'online',
      },
      {
        userId: '2b5d761c-9a9c-41fd-bb93-c408fe3d3b63',
        username: 'tabsir348',
        email: 'tabsir348@gmail.com',
        createdAt: new Date('2024-11-17T06:28:01.712Z'),
        profilePicture: 'https://storage.googleapis.com/simple-chat-cg.appspot.com/avatars/defaul>',
        bio: null,
        lastActive: new Date('2024-11-18T10:30:56.826Z'),
        userStatus: 'offline',
      },
      {
        userId: 'd9a693c5-9d8b-48a2-af25-6b796c029f98',
        username: 'tabsircg',
        email: 'tabsircg@gmail.com',
        createdAt: new Date('2024-11-17T06:25:37.221Z'),
        profilePicture: 'https://storage.googleapis.com/simple-chat-cg.appspot.com/avatars/defaul>',
        bio: null,
        lastActive: new Date('2024-11-18T10:47:36.451Z'),
        userStatus: 'online',
      },
      {
        userId: '7c6864ed-9a0e-4a55-b0eb-ec987516cb51',
        username: 'mdtabsir0021',
        email: 'mdtabsir0021@gmail.com',
        createdAt: new Date('2024-11-17T18:35:01.682Z'),
        profilePicture: 'https://storage.googleapis.com/simple-chat-cg.appspot.com/avatars/defaul>',
        bio: null,
        lastActive: new Date('2024-11-17T18:52:12.763Z'),
        userStatus: 'offline',
      }
    ]
  });

  console.log("Users have been inserted successfully.");
}

// main()
//   .catch(e => {
//     console.error(e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });
