import { Router } from "express";
import authMiddleware from "../../common/middlewares/authMiddleware";
import * as chatController from "./chat.controller";

const chatRoute = Router();
chatRoute.use(authMiddleware);

chatRoute.get("/chats", chatController.getAllUserChats);
chatRoute.get("/chats/:chatId/members", chatController.getGroupMembers);
chatRoute.delete("/chats/:chatId", chatController.deleteChat);

chatRoute.put("/chats/members", chatController.updateMember);
chatRoute.post("/chats/members", chatController.addMember);

chatRoute.delete(
  "/chats/:chatId/members/:memberId",
  chatController.removeMember
);

chatRoute.post("/chats/groups", chatController.createGroupChat);

export default chatRoute;
