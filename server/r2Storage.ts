import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "node:crypto";

function config() {
  const endpoint = process.env.R2_ENDPOINT?.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
  const bucket = process.env.R2_BUCKET?.trim();
  if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) throw new Error("R2 não configurado: defina R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY e R2_BUCKET.");
  return { endpoint, accessKeyId, secretAccessKey, bucket };
}

function client() {
  const { endpoint, accessKeyId, secretAccessKey } = config();
  return new S3Client({ region: "auto", endpoint, credentials: { accessKeyId, secretAccessKey } });
}

function keyFor(relKey: string) {
  const key = relKey.replace(/^\/+/, "");
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const dot = key.lastIndexOf(".");
  return dot === -1 ? `${key}_${hash}` : `${key.slice(0, dot)}_${hash}${key.slice(dot)}`;
}

export async function r2Put(relKey: string, data: Buffer | Uint8Array | string, contentType: string) {
  const { bucket } = config();
  const key = keyFor(relKey);
  await client().send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: data, ContentType: contentType }));
  return { key, url: `/storage/${key}` };
}

export async function r2SignedUrl(relKey: string) {
  const { bucket } = config();
  return getSignedUrl(client(), new GetObjectCommand({ Bucket: bucket, Key: relKey.replace(/^\/+/, "") }), { expiresIn: 900 });
}
