import { Router } from "express";
import ChatControllers from "./chat.controller";
import container from "../../inversify/bindings";
import { TYPES } from "../../inversify/types";
import authMiddleware from "../../common/middlewares/authMiddleware";

const chatController = container.get<ChatControllers>(TYPES.ChatController);
const chatRoute = Router();
chatRoute.use(authMiddleware);

chatRoute.get("/chats", chatController.getAllUserChats);
chatRoute.get("/chats/:chatId/members", chatController.getGroupMembers);
chatRoute.get("/chats/:chatId/media", chatController.getGroupMedia);
chatRoute.delete("/chats/:chatId",chatController.deleteChat)

chatRoute.put("/chats/members", chatController.updateMember)
chatRoute.post("/chats/members",chatController.addMember)

chatRoute.delete("/chats/:chatId/members/me",chatController.leaveGroup)
chatRoute.delete("/chats/:chatId/members/:memberId",chatController.removeMember)

chatRoute.post("/chats/groups", chatController.createGroupChat);

chatRoute.put("/chats/:chatId", chatController.updateChat);


export default chatRoute;
