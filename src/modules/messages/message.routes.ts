import { Router } from "express";
import container from "../../inversify/bindings";
import { TYPES } from "../../inversify/types";
import MessageControllers from "./message.controller";




const messageControllers = container.get<MessageControllers>(TYPES.MessageController)

const messageRouter = Router()

messageRouter.get("/chats/:chatId/messages", messageControllers.getMessagesByChatId)

messageRouter.post("/chats/:chatId/messages", messageControllers.createMessageInChat)
messageRouter.post("/chats/:chatId/messages/:messageId/reactions", messageControllers.addReactionToMessage)
messageRouter.put("/chats/:chatId/messages/:messageId", messageControllers.updateMessageById)

messageRouter.delete("/chats/:chatId/messages/:messageId", messageControllers.deleteMessageById)
messageRouter.delete("/api/chats/:chatId/messages/:messageId/reactions/:reactionId", messageControllers.deleteReactionFromMessage)


export default messageRouter;