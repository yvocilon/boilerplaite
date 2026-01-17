export const ALLOWED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB per file
export const MAX_TOTAL_SIZE = 20 * 1024 * 1024; // 20MB total

// Magic bytes for image detection
const MAGIC_BYTES: Record<AllowedMimeType, number[][]> = {
  "image/png": [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  "image/jpeg": [
    [0xff, 0xd8, 0xff, 0xe0],
    [0xff, 0xd8, 0xff, 0xe1],
    [0xff, 0xd8, 0xff, 0xe2],
    [0xff, 0xd8, 0xff, 0xdb],
    [0xff, 0xd8, 0xff, 0xee],
  ],
  "image/gif": [
    [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], // GIF87a
    [0x47, 0x49, 0x46, 0x38, 0x39, 0x61], // GIF89a
  ],
  "image/webp": [[0x52, 0x49, 0x46, 0x46]], // RIFF (+ WEBP at offset 8)
};

export function detectMimeType(buffer: Buffer): AllowedMimeType | null {
  for (const [mimeType, signatures] of Object.entries(MAGIC_BYTES)) {
    for (const signature of signatures) {
      if (buffer.length >= signature.length) {
        const matches = signature.every(
          (byte, index) => buffer[index] === byte
        );
        if (matches) {
          // Extra check for WebP: bytes 8-11 should be "WEBP"
          if (mimeType === "image/webp") {
            if (buffer.length >= 12) {
              const webpMarker = buffer.slice(8, 12).toString("ascii");
              if (webpMarker === "WEBP") {
                return mimeType as AllowedMimeType;
              }
            }
            continue;
          }
          return mimeType as AllowedMimeType;
        }
      }
    }
  }
  return null;
}

export function isAllowedMimeType(
  mimeType: string
): mimeType is AllowedMimeType {
  return ALLOWED_MIME_TYPES.includes(mimeType as AllowedMimeType);
}

export function validateFileSize(size: number): boolean {
  return size > 0 && size <= MAX_FILE_SIZE;
}

export function validateTotalSize(totalSize: number): boolean {
  return totalSize <= MAX_TOTAL_SIZE;
}

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  mimeType?: AllowedMimeType;
}

export async function validateFile(file: File): Promise<FileValidationResult> {
  // Check file size
  if (!validateFileSize(file.size)) {
    return {
      valid: false,
      error: `File "${file.name}" exceeds maximum size of 5MB`,
    };
  }

  // Read file buffer for magic byte detection
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Detect actual MIME type from magic bytes
  const detectedMimeType = detectMimeType(buffer);
  if (!detectedMimeType) {
    return {
      valid: false,
      error: `File "${file.name}" is not a valid image (PNG, JPG, GIF, or WebP)`,
    };
  }

  return {
    valid: true,
    mimeType: detectedMimeType,
  };
}

export async function validateFiles(
  files: File[]
): Promise<
  FileValidationResult & {
    validatedFiles?: Array<{ file: File; mimeType: AllowedMimeType }>;
  }
> {
  if (files.length === 0) {
    return { valid: true, validatedFiles: [] };
  }

  // Check total size
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  if (!validateTotalSize(totalSize)) {
    return {
      valid: false,
      error: "Total file size exceeds 20MB limit",
    };
  }

  // Validate each file
  const validatedFiles: Array<{ file: File; mimeType: AllowedMimeType }> = [];
  for (const file of files) {
    const result = await validateFile(file);
    if (!result.valid) {
      return result;
    }
    validatedFiles.push({ file, mimeType: result.mimeType! });
  }

  return { valid: true, validatedFiles };
}

export function getFileExtension(mimeType: AllowedMimeType): string {
  const extensions: Record<AllowedMimeType, string> = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/gif": ".gif",
    "image/webp": ".webp",
  };
  return extensions[mimeType];
}
