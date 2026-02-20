#!/usr/bin/env tsx

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { db, schema } from "../../lib/db/client";
import { uploadToB2, videoB2Key } from "../../lib/b2";

const TIKTOK_PROFILE_URL =
  process.env.TIKTOK_PROFILE_URL ||
  "https://www.tiktok.com/@zaq.projects?lang=en";
const YTDLP_BIN = process.env.YTDLP_BIN || "yt-dlp";
const DOWNLOAD_FORMAT =
  process.env.YTDLP_FORMAT || "best[height<=720]/best[height<=1080]/best";
const MAX_DOWNLOADS = Number.parseInt(process.env.MAX_DOWNLOADS || "0", 10);
const MAX_RETRIES = Number.parseInt(process.env.DL_MAX_RETRIES || "4", 10);
const BASE_DELAY_MS = Number.parseInt(
  process.env.DL_BASE_DELAY_MS || "3000",
  10,
);
const COOLDOWN_AFTER_CONSECUTIVE_FAILURES = Number.parseInt(
  process.env.DL_COOLDOWN_MS || "60000",
  10,
);
const CONSECUTIVE_FAILURE_THRESHOLD = Number.parseInt(
  process.env.DL_CONSECUTIVE_FAIL_THRESHOLD || "3",
  10,
);

type YtDlpMetadata = {
  id: string;
  title?: string;
  description?: string;
  uploader?: string;
  channel?: string;
  duration?: number;
  view_count?: number;
  like_count?: number;
  comment_count?: number;
  repost_count?: number;
};

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function runCommand(command: string, args: string[]) {
  return new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }
      reject(new Error(`${command} exited with code ${code}\n${stderr}`));
    });
  });
}

async function runCommandWithBackoff(
  command: string,
  args: string[],
  label: string,
) {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await runCommand(command, args);
    } catch (error) {
      if (attempt >= MAX_RETRIES) throw error;

      const backoffMs = Math.min(BASE_DELAY_MS * 2 ** attempt, 120_000);
      const jitter = Math.floor(Math.random() * backoffMs * 0.3);
      const waitMs = backoffMs + jitter;
      console.warn(
        `  ${label} failed (attempt ${attempt + 1}/${MAX_RETRIES + 1}), retrying in ${Math.round(waitMs / 1000)}s...`,
      );
      await sleep(waitMs);
    }
  }
  throw new Error("Exhausted retries");
}

async function getExistingVideoUrls() {
  const rows = await db
    .select({ tiktokUrl: schema.videos.tiktokUrl })
    .from(schema.videos);
  return new Set(rows.map((row) => row.tiktokUrl));
}

async function scrapeTikTokVideoUrls() {
  const { stdout } = await runCommand(YTDLP_BIN, [
    "--flat-playlist",
    "--print",
    "%(webpage_url)s",
    TIKTOK_PROFILE_URL,
  ]);

  return stdout
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((url) => url.includes("/video/"));
}

async function getVideoMetadata(url: string): Promise<YtDlpMetadata> {
  const { stdout } = await runCommandWithBackoff(
    YTDLP_BIN,
    ["--dump-single-json", "--skip-download", url],
    "Metadata fetch",
  );
  return JSON.parse(stdout) as YtDlpMetadata;
}

async function downloadVideoToDir(url: string, dir: string) {
  try {
    await runCommandWithBackoff(
      YTDLP_BIN,
      [
        "-f",
        DOWNLOAD_FORMAT,
        "-o",
        path.join(dir, "%(id)s.%(ext)s"),
        "--no-write-subs",
        "--no-warnings",
        url,
      ],
      "Download",
    );
  } catch (error) {
    console.warn(
      `Primary format failed for ${url}, retrying fallback format...`,
    );
    await runCommandWithBackoff(
      YTDLP_BIN,
      [
        "-o",
        path.join(dir, "%(id)s.%(ext)s"),
        "--no-write-subs",
        "--no-warnings",
        url,
      ],
      "Download (fallback)",
    );
    if (error instanceof Error) {
      console.warn(error.message);
    }
  }
}

async function findDownloadedFile(dir: string, videoId: string) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const match = entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .find(
      (name) => name.startsWith(`${videoId}.`) && !name.endsWith(".info.json"),
    );

  if (!match) {
    return null;
  }

  const filePath = path.join(dir, match);
  const stat = await fs.stat(filePath);
  const ext = path.extname(match).replace(".", "");

  return { filePath, fileSize: stat.size, ext };
}

async function saveVideo(videoData: {
  tiktokUrl: string;
  videoId: string;
  title: string | null;
  description: string | null;
  author: string | null;
  duration: number | null;
  viewCount: number | null;
  likeCount: number | null;
  commentCount: number | null;
  shareCount: number | null;
  b2Key: string;
  fileSize: number;
}) {
  await db
    .insert(schema.videos)
    .values({
      tiktokUrl: videoData.tiktokUrl,
      videoId: videoData.videoId,
      title: videoData.title,
      description: videoData.description,
      author: videoData.author,
      duration: videoData.duration,
      viewCount: videoData.viewCount,
      likeCount: videoData.likeCount,
      commentCount: videoData.commentCount,
      shareCount: videoData.shareCount,
      b2Key: videoData.b2Key,
      fileSize: videoData.fileSize,
      processingStatus: "unprocessed",
    })
    .onConflictDoNothing({ target: schema.videos.tiktokUrl });
}

async function main() {
  const startedAt = Date.now();

  console.log("Preparing video downloader task...");

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "stewthius-dl-"));
  console.log(`Using temp directory: ${tmpDir}`);

  try {
    console.log(`Scraping TikTok profile: ${TIKTOK_PROFILE_URL}`);
    const allUrls = await scrapeTikTokVideoUrls();
    if (allUrls.length === 0) {
      console.log("No videos found on profile.");
      return;
    }

    const existingUrls = await getExistingVideoUrls();
    const unseenUrls = allUrls.filter((url) => !existingUrls.has(url));
    const targetUrls =
      MAX_DOWNLOADS > 0
        ? unseenUrls.slice(0, Math.max(0, MAX_DOWNLOADS))
        : unseenUrls;

    if (targetUrls.length === 0) {
      console.log("No new videos to download.");
      return;
    }

    console.log(`Found ${targetUrls.length} new videos.`);
    let success = 0;
    let failed = 0;
    let consecutiveFailures = 0;

    for (let i = 0; i < targetUrls.length; i += 1) {
      const url = targetUrls[i];
      console.log(`[${i + 1}/${targetUrls.length}] Downloading ${url}`);

      if (consecutiveFailures >= CONSECUTIVE_FAILURE_THRESHOLD) {
        const cooldownSec = Math.round(
          COOLDOWN_AFTER_CONSECUTIVE_FAILURES / 1000,
        );
        console.warn(
          `${consecutiveFailures} consecutive failures — cooling down for ${cooldownSec}s to avoid rate limit...`,
        );
        await sleep(COOLDOWN_AFTER_CONSECUTIVE_FAILURES);
        consecutiveFailures = 0;
      }

      try {
        const metadata = await getVideoMetadata(url);
        await downloadVideoToDir(url, tmpDir);

        const file = await findDownloadedFile(tmpDir, metadata.id);
        if (!file) {
          throw new Error(
            `Downloaded file not found for video id ${metadata.id}`,
          );
        }

        const b2Key = videoB2Key(metadata.id, file.ext || "mp4");
        const fileBuffer = await fs.readFile(file.filePath);

        console.log(
          `  Uploading to B2: ${b2Key} (${(file.fileSize / 1024 / 1024).toFixed(1)} MB)`,
        );
        await uploadToB2(b2Key, fileBuffer);

        await saveVideo({
          tiktokUrl: url,
          videoId: metadata.id,
          title: metadata.title || null,
          description: metadata.description || null,
          author: metadata.uploader || metadata.channel || null,
          duration: metadata.duration || null,
          viewCount: metadata.view_count || null,
          likeCount: metadata.like_count || null,
          commentCount: metadata.comment_count || null,
          shareCount: metadata.repost_count || null,
          b2Key,
          fileSize: file.fileSize,
        });

        await fs.rm(file.filePath, { force: true });

        success += 1;
        consecutiveFailures = 0;
        console.log(`  Saved ${metadata.id} (b2://${b2Key})`);
      } catch (error) {
        failed += 1;
        consecutiveFailures += 1;
        console.error(`Failed to process ${url}:`, error);
      }

      if (i < targetUrls.length - 1) {
        const jitter = Math.floor(Math.random() * BASE_DELAY_MS * 0.5);
        await sleep(BASE_DELAY_MS + jitter);
      }
    }

    const elapsedMs = Date.now() - startedAt;
    console.log(
      `Download task done. Success=${success} Failed=${failed} Elapsed=${Math.round(elapsedMs / 1000)}s`,
    );
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}

main().catch((error) => {
  console.error("Downloader task failed:", error);
  process.exitCode = 1;
});
