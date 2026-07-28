import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { ValidationContext, VisualDefinition, VisualPackage } from "../src/visual-engine/types";
import { formatIssues, parseUntrustedJson, validateContext } from "../src/visual-engine/validation";

const root = resolve(import.meta.dirname, "..");
const contentRoot = resolve(root, "content/visuals");
const packageDirectories = (await readdir(contentRoot, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => resolve(contentRoot, entry.name));

let failed = false;
for (const packageDirectory of packageDirectories) {
  const visualPackage = parseUntrustedJson(
    await readFile(resolve(packageDirectory, "package.json"), "utf8"),
    packageDirectory
  ) as VisualPackage;
  const definitions = new Map<string, VisualDefinition>();
  for (const visual of visualPackage.visuals) {
    const content = await readFile(resolve(packageDirectory, visual.path), "utf8");
    definitions.set(visual.id, parseUntrustedJson(content, visual.id) as VisualDefinition);
  }
  const context: ValidationContext = { visualPackage, definitions };
  const issues = validateContext(context);
  if (issues.length) {
    console.error(formatIssues(issues));
    failed = true;
  } else {
    console.log(`Validated ${definitions.size} visual definition(s) in ${visualPackage.id}.`);
  }
}
if (failed) process.exitCode = 1;
