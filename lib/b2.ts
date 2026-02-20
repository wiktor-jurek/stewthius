import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";

const BACKBLAZE_KEY_ID = process.env.BACKBLAZE_KEY_ID;
const BACKBLAZE_APPLICATION_KEY = process.env.BACKBLAZE_APPLICATION_KEY;
const BACKBLAZE_ENDPOINT =
  process.env.BACKBLAZE_ENDPOINT || "https://s3.eu-central-003.backblazeb2.com";
const BACKBLAZE_REGION = process.env.BACKBLAZE_REGION || "eu-central-003";
const BACKBLAZE_BUCKET_NAME = process.env.BACKBLAZE_BUCKET_NAME || "perpstew";

if (!BACKBLAZE_KEY_ID || !BACKBLAZE_APPLICATION_KEY) {
  throw new Error(
    "Missing required env vars: BACKBLAZE_KEY_ID and BACKBLAZE_APPLICATION_KEY",
  );
}

export const s3 = new S3Client({
  endpoint: BACKBLAZE_ENDPOINT,
  region: BACKBLAZE_REGION,
  credentials: {
    accessKeyId: BACKBLAZE_KEY_ID,
    secretAccessKey: BACKBLAZE_APPLICATION_KEY,
  },
  forcePathStyle: true,
});

export const BUCKET_NAME = BACKBLAZE_BUCKET_NAME;

export async function uploadToB2(
  key: string,
  body: Buffer,
  contentType = "video/mp4",
) {
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
  return key;
}

export async function downloadFromB2(key: string): Promise<Buffer> {
  const response = await s3.send(
    new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    }),
  );

  const stream = response.Body;
  if (!stream) {
    throw new Error(`Empty response body for key: ${key}`);
  }

  const chunks: Uint8Array[] = [];
  // @ts-expect-error -- Body is a Readable stream in Node.js
  for await (const chunk of stream) {
    chunks.push(chunk as Uint8Array);
  }
  return Buffer.concat(chunks);
}

export function videoB2Key(videoId: string, ext: string) {
  return `videos/${videoId}.${ext}`;
}
