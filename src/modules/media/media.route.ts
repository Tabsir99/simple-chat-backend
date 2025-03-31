import { Router } from "express";
import * as mediaController from "./media.controller";

const mediaRouter = Router();

// mediaRouter.use(authMiddleware)

mediaRouter.post("/files", mediaController.getUploadUrl);
mediaRouter.get(
  "/chats/:chatRoomId/messages/:messageId/files",
  mediaController.getDownloadUrl
);
// mediaRouter.delete("/files", mediaController.deleteFile);
// mediaRouter.put("/files");

export default mediaRouter;
