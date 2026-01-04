import { mkdir, copyFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(scriptDir, "..");
const repoRoot = path.resolve(webRoot, "..");
const sourceDir = path.join(repoRoot, "data");
const targetDir = path.join(webRoot, "public", "data");

const requiredFiles = ["burger-of-the-day.json", "tvmaze-episodes.json"];
const optionalFiles = ["burger-of-the-day-context.json"];

await mkdir(targetDir, { recursive: true });

await Promise.all(
  requiredFiles.map((file) =>
    copyFile(path.join(sourceDir, file), path.join(targetDir, file))
  )
);

let optionalCopied = 0;
for (const file of optionalFiles) {
  try {
    await copyFile(path.join(sourceDir, file), path.join(targetDir, file));
    optionalCopied += 1;
  } catch (error) {
    if (error?.code !== "ENOENT") {
      throw error;
    }
  }
}

console.log(
  `Copied ${requiredFiles.length + optionalCopied} data files to ${targetDir}`
);
