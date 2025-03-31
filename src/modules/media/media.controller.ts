import { NextFunction, Request, Response } from "express";
import { formatResponse } from "../../common/utils/responseFormatter";
import { getWriteSignedUrl, getReadSignedUrl } from "./media.services";

export interface MessageAttachment {
  attachment: {
    fileType: string;
    fileName: string;
    fileSize: number;
  };
  chatRoomId: string;
  messageId: string;
}
export const getUploadUrl = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { attachment, chatRoomId, messageId } = req.body as MessageAttachment;

    if (!attachment.fileType || !attachment.fileName || !attachment.fileSize) {
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

    const url = await getWriteSignedUrl(path, {
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

export const getDownloadUrl = async (req: Request, res: Response) => {
  try {
    const { chatRoomId, messageId } = req.params as {
      chatRoomId: string;
      messageId: string;
    };
    const { fileName } = req.query as { fileName: string };

    const path = `chatRoom/${chatRoomId}/${messageId}.${fileName}`;

    const url = await getReadSignedUrl(path, {
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
