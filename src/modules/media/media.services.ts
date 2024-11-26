import { injectable } from "inversify";
import { bucket } from "../../common/config/firebase";

@injectable()
export class MediaService {
  private readonly DEFAULT_EXPIRY = 5 * 60 * 1000; // 5 minutes


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
      expires: Date.now() + (options?.expiresIn || 15 * 60 * 1000),
      ...(options?.contentType && { contentType: options.contentType }),
    });

    return result[0];
  }

  async makeFilePublic(path: string) {
    await bucket.file(path).makePublic()
  }
}