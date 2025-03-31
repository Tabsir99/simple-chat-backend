import {
  GetObjectCommand,
  PutObjectCommand,
  PutObjectAclCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import s3 from "../../common/config/s3"; // Assuming this imports your S3 client configuration
import { IMessage } from "../messages/message.interface";
import { AttachmentType } from "@prisma/client";

const DEFAULT_EXPIRY = 5 * 60; // 5 minutes (in seconds for S3)

export async function getReadSignedUrl(
  path: string,
  options?: {
    fileName?: string;
    contentType?: string;
    expiresIn?: number;
  }
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: "cg-chat",
    Key: path,
    ResponseContentDisposition: options?.fileName
      ? `attachment; filename="${options.fileName}"`
      : `attachment; filename="${path}"`,
  });

  return getSignedUrl(s3, command, {
    expiresIn: options?.expiresIn
      ? Math.floor(options.expiresIn / 1000)
      : DEFAULT_EXPIRY,
  });
}

export async function getWriteSignedUrl(
  path: string,
  options: {
    contentSize: number;
    contentType: string;
    expiresIn?: number;
  }
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: "cg-chat",
    Key: path,
    ContentType: options.contentType,
    ContentLength: options.contentSize,
  });

  return getSignedUrl(s3, command, {
    expiresIn: options.expiresIn
      ? Math.floor(options.expiresIn / 1000)
      : DEFAULT_EXPIRY,
  });
}

export async function getStreamingUrl(
  path: string,
  options?: {
    contentType?: string;
    expiresIn?: number;
  }
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: "cg-chat",
    Key: path,
    ...(options?.contentType && { ResponseContentType: options.contentType }),
  });

  return getSignedUrl(s3, command, {
    expiresIn: options?.expiresIn
      ? Math.floor(options?.expiresIn / 1000)
      : 15 * 60,
  });
}

export function getFileType(mimeType: string, isVoice: boolean): AttachmentType {
  // Define a set of valid MIME types for the chat app
  const validMimeTypes: { [key: string]: AttachmentType } = {
    // Image MIME types
    "image/jpeg": AttachmentType.IMAGE,
    "image/png": AttachmentType.IMAGE,
    "image/gif": AttachmentType.IMAGE,
    "image/webp": AttachmentType.IMAGE,
    "image/svg+xml": AttachmentType.IMAGE,

    // Audio MIME types
    "audio/mpeg": isVoice ? AttachmentType.VOICE : AttachmentType.AUDIO,
    "audio/wav": isVoice ? AttachmentType.VOICE : AttachmentType.AUDIO,
    "audio/ogg": isVoice ? AttachmentType.VOICE : AttachmentType.AUDIO,
    "audio/mp3": isVoice ? AttachmentType.VOICE : AttachmentType.AUDIO,

    // Video MIME types
    "video/mp4": AttachmentType.VIDEO,
    "video/webm": AttachmentType.VIDEO,
    "video/ogg": AttachmentType.VIDEO,

    // Document MIME types
    "application/pdf": AttachmentType.DOCUMENT,
    "application/msword": AttachmentType.DOCUMENT,
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      AttachmentType.DOCUMENT,
    "application/vnd.ms-excel": AttachmentType.DOCUMENT,
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
      AttachmentType.DOCUMENT,
    "application/vnd.ms-powerpoint": AttachmentType.DOCUMENT,
    "application/vnd.openxmlformats-officedocument.presentationml.presentation":
      AttachmentType.DOCUMENT,

    // Archive MIME types
    "application/zip": AttachmentType.ARCHIVE,
    "application/x-rar-compressed": AttachmentType.ARCHIVE,
  };

  // Validate and return the appropriate AttachmentType or throw an error
  if (validMimeTypes[mimeType]) {
    return validMimeTypes[mimeType];
  } else {
    throw new Error(`Unsupported MIME type: ${mimeType}`);
  }
}
