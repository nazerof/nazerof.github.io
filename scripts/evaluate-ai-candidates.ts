import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { ValidationContext, VisualDefinition, VisualPackage } from "../src/visual-engine/types";
import { parseUntrustedJson, validateContext } from "../src/visual-engine/validation";

const root = resolve(import.meta.dirname, "..");
const canonicalDirectory = resolve(root, "content/visuals/rpa-scaling");
const candidateDirectory = resolve(process.argv[2] ?? resolve(root, "tmp/ai-candidates"));
const visualPackage = parseUntrustedJson(
  await readFile(resolve(canonicalDirectory, "package.json"), "utf8"),
  "rpa-scaling-visual-package"
) as VisualPackage;
const definitions = new Map<string, VisualDefinition>();
const report: Record<string, unknown>[] = [];
const availability = new Map<string, { available: boolean; error?: string }>();

for (const reference of visualPackage.visuals) {
  const candidatePath = resolve(candidateDirectory, reference.path);
  let candidate: VisualDefinition;
  try {
    candidate = parseUntrustedJson(await readFile(candidatePath, "utf8"), reference.id) as VisualDefinition;
    availability.set(reference.id, { available: true });
  } catch (error) {
    availability.set(reference.id, { available: false, error: String(error) });
    candidate = parseUntrustedJson(
      await readFile(resolve(canonicalDirectory, reference.path), "utf8"),
      reference.id
    ) as VisualDefinition;
  }
  definitions.set(reference.id, candidate);
}

const context: ValidationContext = { visualPackage, definitions };
const issues = validateContext(context);
for (const reference of visualPackage.visuals) {
  const definition = definitions.get(reference.id)!;
  const canonicalText = await readFile(resolve(canonicalDirectory, reference.path), "utf8");
  const candidateText = JSON.stringify(definition);
  const candidateStatus = availability.get(reference.id)!;
  report.push({
    visualId: reference.id,
    candidateAvailable: candidateStatus.available,
    valid: candidateStatus.available ? !issues.some(({ definitionId }) => definitionId === reference.id) : null,
    parseOrSafetyError: candidateStatus.error,
    validationErrors: candidateStatus.available ? issues.filter(({ definitionId }) => definitionId === reference.id) : [],
    approximateInputTokens: candidateStatus.available ? Math.ceil(candidateText.length / 4) : null,
    canonicalApproximateTokens: Math.ceil(canonicalText.length / 4),
    repairIterations: null,
    educationalReviewRequired: true
  });
}

console.log(JSON.stringify({ candidateDirectory, report }, null, 2));
if (issues.length) process.exitCode = 1;
