import { Router } from "express";
import ChatControllers from "./chat.controller";
import container from "../../inversify/bindings";
import { TYPES } from "../../inversify/types";
import authMiddleware from "../../common/middlewares/authMiddleware";

const chatController = container.get<ChatControllers>(TYPES.ChatController)
const chatRoute = Router()
chatRoute.use(authMiddleware)

chatRoute.get("/chats", chatController.getAllUserChats)
chatRoute.get("/chats/:chatId", chatController.getChatById)

chatRoute.put("/chats/:chatId", chatController.updateChat)
chatRoute.post("/chats/:chatId/members",chatController.addChatMember)
chatRoute.post("/chats/:chatId/admins",chatController.addChatAdmin)

chatRoute.delete("/chats/:chatId/members", chatController.removeChatMember)
chatRoute.delete("/chats/:chatId/admins", chatController.removeChatAdmin)

export default chatRoute;