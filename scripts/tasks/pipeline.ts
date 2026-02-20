#!/usr/bin/env tsx

import { spawn } from "node:child_process";

const PIPELINE_REVALIDATE = process.env.PIPELINE_REVALIDATE ?? "true";

function run(command: string, args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit" });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(
        new Error(`${command} ${args.join(" ")} failed with exit code ${code}`),
      );
    });
  });
}

function shouldRevalidate() {
  return ["1", "true", "yes", "on"].includes(
    String(PIPELINE_REVALIDATE).toLowerCase(),
  );
}

async function main() {
  console.log("Starting ingestion pipeline...");
  await run("npm", ["run", "task:download-videos"]);
  await run("npm", ["run", "task:analyze-videos"]);

  if (shouldRevalidate()) {
    console.log("Running cache revalidation...");
    await run("npm", ["run", "task:revalidate-cache"]);
  } else {
    console.log("Skipping cache revalidation (PIPELINE_REVALIDATE=false).");
  }

  console.log("Pipeline finished successfully.");
}

main().catch((error) => {
  console.error("Pipeline failed:", error);
  process.exit(1);
});
