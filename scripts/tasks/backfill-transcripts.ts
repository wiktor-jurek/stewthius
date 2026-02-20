#!/usr/bin/env tsx

import { runAnalyzeTask } from "./analyze-videos";

async function main() {
  console.log("Running transcript+embedding backfill for already-processed videos...");
  await runAnalyzeTask({ includeProcessedWithoutTranscript: true });
}

main().catch((error) => {
  console.error("Backfill task failed:", error);
  process.exit(1);
});
