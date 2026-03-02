import { randomUUID } from "crypto";
import { S3Client } from "@aws-sdk/client-s3";
import { z } from "zod";

const r2EnvSchema = z.object({
  R2_ENDPOINT: z.string().url(),
  R2_BUCKET: z.string().min(1),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  R2_PUBLIC_BASE_URL: z.string().url(),
  R2_MAX_VIDEO_SIZE_MB: z
    .string()
    .optional()
    .transform((v: string | undefined) => Number(v ?? "2048")),
});

type R2Config = {
  endpoint: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  publicBaseUrl: string;
  maxVideoSizeMb: number;
};

let cachedConfig: R2Config | null = null;
let cachedClient: S3Client | null = null;

export function getR2Config(): R2Config {
  if (cachedConfig) return cachedConfig;
  const parsed = r2EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error("Missing/invalid R2 env configuration");
  }
  cachedConfig = {
    endpoint: parsed.data.R2_ENDPOINT,
    bucket: parsed.data.R2_BUCKET,
    accessKeyId: parsed.data.R2_ACCESS_KEY_ID,
    secretAccessKey: parsed.data.R2_SECRET_ACCESS_KEY,
    publicBaseUrl: parsed.data.R2_PUBLIC_BASE_URL.replace(/\/+$/, ""),
    maxVideoSizeMb: parsed.data.R2_MAX_VIDEO_SIZE_MB,
  };
  return cachedConfig;
}

export function getR2Client(): S3Client {
  if (cachedClient) return cachedClient;
  const cfg = getR2Config();
  cachedClient = new S3Client({
    region: "auto",
    endpoint: cfg.endpoint,
    credentials: {
      accessKeyId: cfg.accessKeyId,
      secretAccessKey: cfg.secretAccessKey,
    },
  });
  return cachedClient;
}

export function normalizeSegment(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function sanitizeFilename(filename: string): string {
  return filename
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function buildR2VideoKey(params: {
  channel: string;
  movieSlug: string;
  episodeSlug: string;
  filename: string;
}): string {
  const channel = normalizeSegment(params.channel) || "nsh";
  const movieSlug = normalizeSegment(params.movieSlug);
  const episodeSlug = normalizeSegment(params.episodeSlug);
  const filename = sanitizeFilename(params.filename);
  return `videos/${channel}/${movieSlug}/${episodeSlug}/${Date.now()}-${randomUUID()}-${filename}`;
}

export function buildR2PublicUrl(objectKey: string): string {
  const cfg = getR2Config();
  return `${cfg.publicBaseUrl}/${objectKey.replace(/^\/+/, "")}`;
}
