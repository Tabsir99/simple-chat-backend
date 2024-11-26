import { inject, injectable } from "inversify";
import { NextFunction, Request, Response } from "express";
import { bucket } from "../../common/config/firebase";
import { formatResponse } from "../../common/utils/responseFormatter";
import { TYPES } from "../../inversify/types";
import { MediaService } from "./media.services";

export interface MessageAttachment {
  attachment: {
    fileType: string;
    fileName: string;
    fileSize: number;
  };
  chatRoomId: string;
  messageId: string;
}
@injectable()
export class MediaController {
  constructor(@inject(TYPES.MediaService) private mediaService: MediaService) {}
  getUploadUrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { attachment, chatRoomId, messageId } =
        req.body as MessageAttachment;

      if (
        !attachment.fileType ||
        !attachment.fileName ||
        !attachment.fileSize
      ) {
        return res.status(400).json(
          formatResponse({
            success: false,
            message: "Content type and file name are required",
          })
        );
      }
      if (attachment.fileSize > 5 * 1024 * 1024) {
        return res.status(400).json(
          formatResponse({
            success: false,
            message: "File size exceeds limit which is 5MB",
            data: attachment,
          })
        );
      }

      const path = `chatRoom/${chatRoomId}/${messageId}.${attachment.fileName}`;

      const url = await this.mediaService.getWriteSignedUrl(path, {
        contentSize: attachment.fileSize,
        contentType: attachment.fileType,
      });

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
      const { chatRoomId, messageId } = req.params as {
        chatRoomId: string;
        messageId: string;
      };
      const { fileName } = req.query as { fileName: string };

      const path = `chatRoom/${chatRoomId}/${messageId}.${fileName}`;

      const url = await this.mediaService.getReadSignedUrl(path, {
        fileName: fileName,
        expiresIn: 3600 * 1000,
      });

      res.json(
        formatResponse({
          success: true,
          data: url,
        })
      );
    } catch (error) {
      console.error("Error generating download URL:", error);
      res.status(500).json({ error: "Failed to generate download URL" });
    }
  };

  async deleteFile(req: Request, res: Response) {
    try {
      const { fileId } = req.params;
      const userId = req.user.userId as string;

      const path = `users/${userId}/${fileId}`;

      await bucket.file(path).delete();

      res.json({ message: "File deleted successfully" });
    } catch (error) {
      console.error("Error deleting file:", error);
      res.status(500).json({ error: "Failed to delete file" });
    }
  }

}
