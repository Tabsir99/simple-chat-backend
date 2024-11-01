import { Router } from "express";
import container from "../../inversify/bindings";
import { TYPES } from "../../inversify/types";
import MessageControllers from "./message.controller";
import authMiddleware from "../../common/middlewares/authMiddleware";




const messageControllers = container.get<MessageControllers>(TYPES.MessageController)

const messageRouter = Router()
messageRouter.use(authMiddleware)

messageRouter.get("/chats/:chatId/messages", messageControllers.getMessagesByChatId)

messageRouter.post("/chats/:chatId/messages", messageControllers.createMessageInChat)


export default messageRouter;