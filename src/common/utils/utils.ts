import { $Enums } from "@prisma/client";

export const generateUsernameFromEmail = (email: string): string => {
  const [username] = email.split("@");
  return username;
};

export async function getGoogleJWKs() {
  const response = await fetch("https://www.googleapis.com/oauth2/v3/certs");
  const jwks = await response.json();
  return jwks.keys;
}

type JWK = {
  e: string; // Public exponent (Base64 URL encoded)
  n: string; // Modulus (Base64 URL encoded)
  use?: string; // Intended use of the key
  alg?: string; // Algorithm
  kid?: string; // Key ID
  kty: string; // Key type (e.g., RSA)
};

export const jwkToPem = (jwk: JWK): string => {
  const base64UrlToBase64 = (base64Url: string): string => {
    return (
      base64Url.replace(/-/g, "+").replace(/_/g, "/") +
      "===".slice(0, (4 - (base64Url.length % 4)) % 4)
    );
  };

  const n = base64UrlToBase64(jwk.n);
  const e = base64UrlToBase64(jwk.e);

  const modulusBuffer = Buffer.from(n, "base64");
  const exponentBuffer = Buffer.from(e, "base64");

  // Construct the public key in ASN.1 format
  const publicKeyBuffer = Buffer.concat([
    Buffer.from([0x30, modulusBuffer.length + exponentBuffer.length + 5]), // SEQUENCE
    Buffer.from([0x02, modulusBuffer.length]), // INTEGER (modulus)
    modulusBuffer,
    Buffer.from([0x02, exponentBuffer.length]), // INTEGER (exponent)
    exponentBuffer,
  ]);

  // Convert to PEM format
  const publicKeyPem = `-----BEGIN PUBLIC KEY-----\n${publicKeyBuffer
    .toString("base64")
    .match(/.{1,64}/g)
    ?.join("\n")}\n-----END PUBLIC KEY-----`;

  return publicKeyPem;
};

const mimeTypeMap: Record<$Enums.FileType, string> = {
  // Images
  IMAGE_JPEG: "image/jpeg",
  IMAGE_PNG: "image/png",
  IMAGE_GIF: "image/gif",
  IMAGE_WEBP: "image/webp",
  IMAGE_SVG: "image/svg+xml",

  // Documents
  PDF: "application/pdf",
  DOC: "application/msword",
  DOCX: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  XLS: "application/vnd.ms-excel",
  XLSX: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  TXT: "text/plain",
  HTML: "text/html",
  CSS: "text/css",
  CSV: "text/csv",

  // Audio
  AUDIO_MP3: "audio/mpeg",
  AUDIO_WAV: "audio/wav",
  AUDIO_M4A: "audio/m4a",

  // Video
  VIDEO_MP4: "video/mp4",
  VIDEO_WEBM: "video/webm",

  // Archives
  ZIP: "application/zip",
  RAR: "application/x-rar-compressed",

  // Other
  OTHER: "application/octet-stream",
};
export function getMimeType(fileType: $Enums.FileType) {
  return mimeTypeMap[fileType];
}

// Function to retrieve the file type
const reverseMimeTypeMap: Record<string, $Enums.FileType> = {
  // Images
  "image/jpeg": "IMAGE_JPEG",
  "image/png": "IMAGE_PNG",
  "image/gif": "IMAGE_GIF",
  "image/webp": "IMAGE_WEBP",
  "image/svg+xml": "IMAGE_SVG",

  // Documents
  "application/pdf": "PDF",
  "application/msword": "DOC",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "DOCX",
  "application/vnd.ms-excel": "XLS",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "XLSX",
  "text/plain": "TXT",
  "text/html": "HTML",
  "text/css": "CSS",
  "text/csv": "CSV",
  // Audio
  "audio/mpeg": "AUDIO_MP3",
  "audio/wav": "AUDIO_WAV",
  "audio/m4a": "AUDIO_M4A",

  // Video
  "video/mp4": "VIDEO_MP4",
  "video/webm": "VIDEO_WEBM",

  // Archives
  "application/zip": "ZIP",
  "application/x-rar-compressed": "RAR",

  // Other
  "application/octet-stream": "OTHER",
};
export function getFileTypeFromMimeType(mimeType: string): $Enums.FileType {
  return reverseMimeTypeMap[mimeType];
}

const mimeTypeToExtension: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/svg+xml": "svg",
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "docx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "text/plain": "txt",
  "text/html": "html",
  "text/css": "css",
  "text/csv": "csv",
  "audio/mpeg": "mp3",
  "audio/wav": "wav",
  "audio/m4a": "m4a",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "application/zip": "zip",
  "application/x-rar-compressed": "rar",
  "application/octet-stream": "bin", // or "dat" if generic
};

export function getExtensionFromMimeType(mimeType: string): string | undefined {
  return mimeTypeToExtension[mimeType];
}

export const validReactionSet = new Set([
  // Smileys
  "😀",
  "😃",
  "😄",
  "😁",
  "😅",
  "😂",
  "🤣",
  "😆",
  "😊",
  "😇",
  "🙂",
  "🙃",
  "😉",
  "😌",
  "😍",
  "🥰",
  "😘",
  "😗",
  "😙",
  "😚",
  "😋",
  "😛",
  "😝",
  "😜",
  "🤪",
  "🤨",
  "🧐",
  "🤓",
  "😎",
  "🥳",
  "😏",
  "😒",
  "😞",
  "😔",
  "😟",
  "😕",
  "🙁",
  "😣",
  "😖",
  "😫",
  "😩",
  "🥺",
  "😢",
  "😭",
  "😤",
  "😠",
  "😡",
  "🤬",
  "🤯",
  "😳",
  "🥵",
  "🥶",
  "😱",
  "😨",
  "😰",
  "😥",
  "😓",
  "🤗",
  "🤔",
  "🤭",
  "🤫",
  "🤥",
  "😶",
  "😐",
  "😑",
  "😬",
  "🙄",
  "😯",
  "😦",
  "😧",
  "😮",
  "😲",
  "😴",
  "🤤",
  "😪",
  "😵",
  "🤐",
  "🥴",
  "🤢",
  "🤮",
  "🤧",
  "😷",
  "🤒",
  "🤕",
  "🤑",
  "🤠",
  "😈",
  "👿",
  "👹",
  "👺",
  "💀",
  "☠️",
  "👻",
  "👽",
  "👾",
  "🤖",
  "🎃",
  "😺",
  "😸",
  "😹",
  "😻",
  "😼",
  "😽",
  "🙀",
  "😿",
  "😾",
  // Gestures
  "👋",
  "🤚",
  "🖐️",
  "✋",
  "🖖",
  "👌",
  "🤌",
  "🤏",
  "✌️",
  "🤞",
  "🤟",
  "🤘",
  "🤙",
  "👈",
  "👉",
  "👆",
  "👇",
  "👍",
  "👎",
  "✊",
  "👊",
  "🤛",
  "🤜",
  "👏",

  // Hearts
  "❤️",
  "🧡",
  "💛",
  "💚",
  "💙",
  "💜",
  "🤎",
  "🖤",
  "🤍",
  "❤️‍🔥",
  "❤️‍🩹",
  "💔",
  "💕",
  "💞",
  "💓",
  "💗",
  "💖",
  "💘",
  "💝",

  // Animals
  "🐶",
  "🐱",
  "🐭",
  "🐹",
  "🐰",
  "🦊",
  "🐻",
  "🐼",
  "🐨",
  "🐯",
  "🦁",
  "🐮",
  "🐷",
  "🐸",
  "🐵",
  "🐔",
  "🐧",
  "🐦",
  "🦆",
  "🦅",
  "🦉",

  // Nature
  "🌸",
  "💮",
  "🌹",
  "🌺",
  "🌻",
  "🌼",
  "🌷",
  "🌱",
  "🌲",
  "🌳",
  "🌴",
  "🌵",
  "🌾",
  "🌿",
  "☘️",
  "🍀",
  "🍁",
  "🍂",
  "🍃",

  // Food
  "🍎",
  "🍐",
  "🍊",
  "🍋",
  "🍌",
  "🍉",
  "🍇",
  "🍓",
  "🍒",
  "🍑",
  "🍍",
  "🥝",
  "🍅",
  "🥑",
  "🍆",
  "🥔",
  "🥕",
  "🌭",
  "🍔",
  "🍟",
  "🍕",
]);
