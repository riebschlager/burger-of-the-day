import { mkdir, copyFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(scriptDir, "..");
const repoRoot = path.resolve(webRoot, "..");
const sourceDir = path.join(repoRoot, "data");
const targetDir = path.join(webRoot, "public", "data");

const files = ["burger-of-the-day.json", "tvmaze-episodes.json"];

await mkdir(targetDir, { recursive: true });

await Promise.all(
  files.map((file) =>
    copyFile(path.join(sourceDir, file), path.join(targetDir, file))
  )
);

console.log(`Copied ${files.length} data files to ${targetDir}`);
