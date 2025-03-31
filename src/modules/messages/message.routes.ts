import { Router } from "express";
import authMiddleware from "../../common/middlewares/authMiddleware";
import * as messageController from "./message.controller";

const messageRouter = Router();
messageRouter.use(authMiddleware);

messageRouter.get(
  "/chats/:chatId/messages",
  messageController.getMessagesByChatId
);
messageRouter.get("/messages", messageController.searchMessages);

export default messageRouter;
