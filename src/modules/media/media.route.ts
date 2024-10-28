import { Router } from "express";
import authMiddleware from "../../common/middlewares/authMiddleware";
import container from "../../inversify/bindings";
import { TYPES } from "../../inversify/types";
import { MediaController } from "./media.controller";


const mediaController = container.get<MediaController>(TYPES.MediaController)
const mediaRouter = Router()



// mediaRouter.use(authMiddleware)

mediaRouter.post("/files",mediaController.getUploadUrl)
mediaRouter.get("/chats/:chatRoomId/messages/:messageId/files",mediaController.getDownloadUrl)
mediaRouter.delete("/files",mediaController.deleteFile)

export default mediaRouter;