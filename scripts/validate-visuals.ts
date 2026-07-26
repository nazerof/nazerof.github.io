import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { ValidationContext, VisualDefinition, VisualPackage } from "../src/visual-engine/types";
import { formatIssues, parseUntrustedJson, validateContext } from "../src/visual-engine/validation";

const root = resolve(import.meta.dirname, "..");
const packageDirectory = resolve(root, "content/visuals/rpa-scaling");
const visualPackage = parseUntrustedJson(
  await readFile(resolve(packageDirectory, "package.json"), "utf8"),
  "rpa-scaling-visual-package"
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
  process.exitCode = 1;
} else {
  console.log(`Validated ${definitions.size} visual definitions in ${visualPackage.id}.`);
}
