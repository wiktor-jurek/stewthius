#!/usr/bin/env tsx

import { runAnalyzeTask } from "./analyze-videos";
import { revalidateCache } from "./revalidate-cache";

async function main() {
  console.log("Running transcript+embedding backfill for already-processed videos...");
  await runAnalyzeTask({ includeProcessedWithoutTranscript: true });
  await revalidateCache("all");
}

main().catch((error) => {
  console.error("Backfill task failed:", error);
  process.exit(1);
});
