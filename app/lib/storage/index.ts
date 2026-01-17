import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const getConfig = () => {
  const endpoint = process.env.MINIO_ENDPOINT;
  const accessKey = process.env.MINIO_ACCESS_KEY;
  const secretKey = process.env.MINIO_SECRET_KEY;
  const bucket = process.env.MINIO_BUCKET || "uploads";
  const region = process.env.MINIO_REGION || "us-east-1";

  if (!endpoint || !accessKey || !secretKey) {
    throw new Error(
      "MinIO configuration missing. Set MINIO_ENDPOINT, MINIO_ACCESS_KEY, and MINIO_SECRET_KEY."
    );
  }

  return { endpoint, accessKey, secretKey, bucket, region };
};

let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (s3Client) return s3Client;

  const config = getConfig();
  s3Client = new S3Client({
    endpoint: config.endpoint,
    region: config.region,
    credentials: {
      accessKeyId: config.accessKey,
      secretAccessKey: config.secretKey,
    },
    forcePathStyle: true, // Required for MinIO
  });

  return s3Client;
}

export async function uploadFile(
  key: string,
  buffer: Buffer,
  contentType: string
): Promise<void> {
  const client = getS3Client();
  const { bucket } = getConfig();

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );
}

export async function getSignedDownloadUrl(
  key: string,
  expiresIn = 900 // 15 minutes
): Promise<string> {
  const client = getS3Client();
  const { bucket } = getConfig();

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  return getSignedUrl(client, command, { expiresIn });
}

export async function deleteFile(key: string): Promise<void> {
  const client = getS3Client();
  const { bucket } = getConfig();

  await client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  );
}

export async function downloadFile(key: string): Promise<Buffer> {
  const client = getS3Client();
  const { bucket } = getConfig();

  const response = await client.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  );

  if (!response.Body) {
    throw new Error(`No body returned for key: ${key}`);
  }

  return Buffer.from(await response.Body.transformToByteArray());
}

export function generateStorageKey(
  folder: string,
  entityId: string,
  filename: string
): string {
  const timestamp = Date.now();
  const safeName = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
  return `${folder}/${entityId}/${timestamp}-${safeName}`;
}
