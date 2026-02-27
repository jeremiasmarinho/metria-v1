import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const R2_URL_EXPIRATION_SECONDS = 3600;

function getR2Client(): S3Client | null {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!accountId || !accessKeyId || !secretAccessKey) return null;

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

export async function uploadToR2(
  key: string,
  buffer: Buffer,
  contentType = "application/pdf"
): Promise<string | null> {
  const client = getR2Client();
  const bucket = process.env.R2_BUCKET_NAME;
  if (!client || !bucket) return null;

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );

  return key;
}

export async function getSignedPdfUrl(key: string): Promise<string | null> {
  const client = getR2Client();
  const bucket = process.env.R2_BUCKET_NAME;
  if (!client || !bucket) return null;

  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  const url = await getSignedUrl(client, command, {
    expiresIn: R2_URL_EXPIRATION_SECONDS,
  });
  return url;
}
