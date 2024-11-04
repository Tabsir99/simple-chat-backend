import { injectable } from "inversify";
import { bucket } from "../../common/config/firebase";

// type CommonContentType =
//   | "image/jpeg"
//   | "image/png"
//   | "image/gif"
//   | "image/webp"
//   | "image/svg+xml"
//   | "application/pdf"
//   | "application/msword"
//   | "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
//   | "application/vnd.ms-excel"
//   | "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
//   | "text/plain"
//   | "audio/mpeg"
//   | "audio/wav"
//   | "audio/m4a"
//   | "video/mp4"
//   | "video/webm"
//   | "application/zip"
//   | "application/x-rar-compressed"
//   | "application/octet-stream";
@injectable()
export class MediaService {
  private readonly DEFAULT_EXPIRY = 5 * 60 * 1000; // 5 minutes

  /**
   * Generate a signed URL for reading/downloading files
   */
  async getReadSignedUrl(
    path: string,
    options?: {
      fileName?: string;
      contentType?: string;
      expiresIn?: number;
    }
  ): Promise<string> {
    

    const result = await bucket.file(path).getSignedUrl({
      version: "v4",
      action: "read",
      expires: Date.now() + (options?.expiresIn || this.DEFAULT_EXPIRY),
      responseDisposition: `attachment; filename="${options?.fileName || path}"`,
    });

    return result[0];
  }

  /**
   * Generate a signed URL for writing/uploading files
   */
  async getWriteSignedUrl(
    path: string,
    options: {
      contentSize: number;
      contentType: string;
      expiresIn?: number;
    }
  ): Promise<string> {
    const result = await bucket.file(path).getSignedUrl({
      version: "v4",
      action: "write",
      expires: Date.now() + (options.expiresIn || this.DEFAULT_EXPIRY),
      contentType: options.contentType,
      extensionHeaders: {
        "content-length": `${options.contentSize}`,
      },
    });

    return result[0];
  }

  /**
   * Get media URL optimized for streaming (video/audio)
   */
  async getStreamingUrl(
    path: string,
    options?: {
      contentType?: string;
      expiresIn?: number;
    }
  ): Promise<string> {
    const result = await bucket.file(path).getSignedUrl({
      version: "v4",
      action: "read",
      expires: Date.now() + (options?.expiresIn || 15 * 60 * 1000), // 15 minutes for streaming
      ...(options?.contentType && { contentType: options.contentType }),
      // Don't set responseDisposition for streaming
    });

    return result[0];
  }
}