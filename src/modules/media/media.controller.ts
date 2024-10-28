import { inject, injectable } from "inversify";
import { NextFunction, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { bucket } from "../../common/config/firebase";
import { formatResponse } from "../../common/utils/responseFormatter";
import { TYPES } from "../../inversify/types";
import { MediaService } from "./media.services";
import { getExtensionFromMimeType } from "../../common/utils/utils";
import { $Enums } from "@prisma/client";
import { Attachment } from "../messages/message.interface";

export interface MessageAttachment {
  attachment: {
    fileType: string; // MIME type, e.g., "text/html"
    fileName: string; // Name of the file, e.g., "download.html"
    fileSize: number; // Size of the file in bytes
  };
  chatRoomId: string; // ID of the chat room the attachment belongs to
  messageId: string; // ID of the specific message containing the attachment
}
@injectable()
export class MediaController {
  constructor(@inject(TYPES.MediaService) private mediaService: MediaService) {}
  getUploadUrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { attachment, chatRoomId, messageId } =
        req.body as MessageAttachment;

      if (!attachment.fileType || !attachment.fileName || !attachment.fileSize) {
        return res.status(400).json(
          formatResponse({
            success: false,
            message: "Content type and file name are required",
          })
        );
      }
      if(attachment.fileSize > 5*1024*1024){
        return res.status(400).json(formatResponse({
          success: false,
          message: "File size exceeds limit which is 5MB",
          data: attachment
        }))
      }

      // Generate a unique path for the file
      const path = `chatRoom/${chatRoomId}/${messageId}.${attachment.fileName}`;

      const url = await this.mediaService.getWriteSignedUrl(
        path,
        {contentSize: attachment.fileSize,contentType: attachment.fileType}
      );

      res.json(
        formatResponse({
          success: true,
          data: {
            url,
            path,
          },
        })
      );
    } catch (error) {
      console.error("Error generating upload URL:", error);
      return next(error);
    }
  };

  getDownloadUrl = async (req: Request, res: Response) => {
    try {
      const { chatRoomId,messageId } = req.params as {chatRoomId: string, messageId: string}
      const { fileName } = req.query as {fileName: string}
      //   const userId = req.user.userId as string;

      // Here you would typically:
      // 1. Verify the user has permission to access this file
      // 2. Get the file path from your database
      // For now, we'll assume the path format:

      const path = `chatRoom/${chatRoomId}/${messageId}.${fileName}`;

      const url = await this.mediaService.getReadSignedUrl(path, {fileName: fileName,expiresIn: 3600*1000});

      res.json(formatResponse({
        success: true,
        data: url
      }));
    } catch (error) {
      console.error("Error generating download URL:", error);
      res.status(500).json({ error: "Failed to generate download URL" });
    }
  };

  async deleteFile(req: Request, res: Response) {
    try {
      const { fileId } = req.params;
      const userId = req.user.userId as string;

      // Here you would typically:
      // 1. Verify the user has permission to delete this file
      // 2. Get the file path from your database
      const path = `users/${userId}/${fileId}`;

      await bucket.file(path).delete();

      res.json({ message: "File deleted successfully" });
    } catch (error) {
      console.error("Error deleting file:", error);
      res.status(500).json({ error: "Failed to delete file" });
    }
  }
}
