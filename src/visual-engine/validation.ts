import Ajv2020, { type ErrorObject, type ValidateFunction } from "ajv/dist/2020.js";
import coreSchema from "../../schemas/visuals/core.schema.json";
import packageSchema from "../../schemas/visuals/package.schema.json";
import diagramSchema from "../../schemas/visuals/diagram.schema.json";
import motionSchema from "../../schemas/visuals/motion.schema.json";
import narrativeSchema from "../../schemas/visuals/narrative.schema.json";
import type {
  DiagramDefinition,
  MotionDefinition,
  NarrativeDefinition,
  ValidationContext,
  ValidationIssue,
  VisualDefinition,
  VisualKind,
  VisualPackage
} from "./types";

export const LIMITS = {
  maxFileBytes: 100_000,
  maxDepth: 16,
  maxTextLength: 10_000,
  maxNodes: 100,
  maxScenes: 30
} as const;

const schemaIds: Record<VisualKind | "package", string> = {
  package: "https://nazerof.github.io/schemas/visuals/package.schema.json",
  diagram: "https://nazerof.github.io/schemas/visuals/diagram.schema.json",
  motion: "https://nazerof.github.io/schemas/visuals/motion.schema.json",
  narrative: "https://nazerof.github.io/schemas/visuals/narrative.schema.json"
};

const ajv = new Ajv2020({ allErrors: true, strict: true });
ajv.addSchema(coreSchema);
ajv.addSchema(packageSchema);
ajv.addSchema(diagramSchema);
ajv.addSchema(motionSchema);
ajv.addSchema(narrativeSchema);

const forbiddenKeys = /^(?:on[a-z]+|html|innerhtml|dangerouslysetinnerhtml|script|javascript|callback|expression|module|import|css)$/i;
const unsafeValue = /(?:<\s*\/?\s*(?:script|iframe|object|embed|style)|javascript\s*:|data\s*:\s*text\/html|\beval\s*\(|\bFunction\s*\()/i;

function issue(definitionId: string, path: string, reason: string): ValidationIssue {
  return { definitionId, path: path || "/", reason };
}

function errorsFromAjv(id: string, errors: ErrorObject[] | null | undefined): ValidationIssue[] {
  return (errors ?? []).map((error) =>
    issue(id, error.instancePath || "/", `${error.keyword}: ${error.message ?? "invalid value"}`)
  );
}

function inspectUntrusted(
  value: unknown,
  definitionId: string,
  path = "",
  depth = 0,
  output: ValidationIssue[] = []
): ValidationIssue[] {
  if (depth > LIMITS.maxDepth) {
    output.push(issue(definitionId, path, `nesting exceeds ${LIMITS.maxDepth}`));
    return output;
  }
  if (typeof value === "string") {
    if (value.length > LIMITS.maxTextLength) output.push(issue(definitionId, path, "text exceeds limit"));
    if (unsafeValue.test(value)) output.push(issue(definitionId, path, "unsafe executable or HTML-like content"));
    return output;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => inspectUntrusted(item, definitionId, `${path}/${index}`, depth + 1, output));
    return output;
  }
  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      const childPath = `${path}/${key}`;
      if (forbiddenKeys.test(key)) output.push(issue(definitionId, childPath, "executable or arbitrary presentation field is forbidden"));
      inspectUntrusted(child, definitionId, childPath, depth + 1, output);
    }
  }
  return output;
}

export function parseUntrustedJson(text: string, sourceId: string): unknown {
  const bytes = new TextEncoder().encode(text).byteLength;
  if (bytes > LIMITS.maxFileBytes) throw new Error(`${sourceId} /: file exceeds ${LIMITS.maxFileBytes} bytes`);
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(`${sourceId} /: invalid JSON`);
  }
  const issues = inspectUntrusted(parsed, sourceId);
  if (issues.length) throw new Error(formatIssues(issues));
  return parsed;
}

function schemaValidate(kind: VisualKind | "package", value: unknown, id: string): ValidationIssue[] {
  const validator = ajv.getSchema(schemaIds[kind]) as ValidateFunction | undefined;
  if (!validator) return [issue(id, "/", `validator unavailable for ${kind}`)];
  return validator(value) ? [] : errorsFromAjv(id, validator.errors);
}

function duplicates(ids: string[], id: string, path: string): ValidationIssue[] {
  const seen = new Set<string>();
  return ids.flatMap((value, index) => {
    if (seen.has(value)) return [issue(id, `${path}/${index}/id`, `duplicate ID "${value}"`)];
    seen.add(value);
    return [];
  });
}

function validateObjectiveAndConceptRefs(
  definition: VisualDefinition,
  visualPackage: VisualPackage,
  issues: ValidationIssue[]
): void {
  const objectives = new Set(visualPackage.learningObjectives.map(({ id }) => id));
  const concepts = new Set(visualPackage.concepts);
  const check = (refs: string[], path: string, allowed: Set<string>, label: string) => {
    refs.forEach((ref, index) => {
      if (!allowed.has(ref)) issues.push(issue(definition.id, `${path}/${index}`, `unknown ${label} "${ref}"`));
    });
  };
  check(definition.learningObjectiveRefs, "/learningObjectiveRefs", objectives, "learning objective");
  check(definition.conceptRefs, "/conceptRefs", concepts, "concept");
  const scenes = definition.kind === "motion" ? definition.scenes : definition.kind === "narrative" ? definition.storyBeats : [];
  scenes.forEach((scene, index) => {
    check(scene.learningObjectiveRefs, `/${definition.kind === "motion" ? "scenes" : "storyBeats"}/${index}/learningObjectiveRefs`, objectives, "learning objective");
    check(scene.conceptRefs, `/${definition.kind === "motion" ? "scenes" : "storyBeats"}/${index}/conceptRefs`, concepts, "concept");
  });
}

function validateDiagram(definition: DiagramDefinition): ValidationIssue[] {
  const issues = [
    ...duplicates(definition.groups.map(({ id }) => id), definition.id, "/groups"),
    ...duplicates(definition.nodes.map(({ id }) => id), definition.id, "/nodes"),
    ...duplicates(definition.edges.map(({ id }) => id), definition.id, "/edges"),
    ...duplicates(definition.notes.map(({ id }) => id), definition.id, "/notes")
  ];
  const nodes = new Set(definition.nodes.map(({ id }) => id));
  const groups = new Set(definition.groups.map(({ id }) => id));
  definition.nodes.forEach((node, index) => {
    if (!groups.has(node.group)) issues.push(issue(definition.id, `/nodes/${index}/group`, `unknown group "${node.group}"`));
  });
  definition.edges.forEach((edge, index) => {
    if (!nodes.has(edge.from)) issues.push(issue(definition.id, `/edges/${index}/from`, `unknown node "${edge.from}"`));
    if (!nodes.has(edge.to)) issues.push(issue(definition.id, `/edges/${index}/to`, `unknown node "${edge.to}"`));
  });
  definition.notes.forEach((note, noteIndex) => note.nodeRefs.forEach((ref, refIndex) => {
    if (!nodes.has(ref)) issues.push(issue(definition.id, `/notes/${noteIndex}/nodeRefs/${refIndex}`, `unknown node "${ref}"`));
  }));
  return issues;
}

function validateTimeline(
  definition: MotionDefinition | NarrativeDefinition,
  items: Array<{ id: string; start: number; duration: number }>,
  itemPath: string
): ValidationIssue[] {
  const issues = duplicates(items.map(({ id }) => id), definition.id, itemPath);
  items.forEach((item, index) => {
    if (item.start + item.duration > definition.durationSeconds + 0.001) {
      issues.push(issue(definition.id, `${itemPath}/${index}/duration`, "scene extends beyond timeline duration"));
    }
    if (index > 0 && item.start < items[index - 1].start + items[index - 1].duration) {
      issues.push(issue(definition.id, `${itemPath}/${index}/start`, "scene overlaps the previous scene"));
    }
  });
  return issues;
}

function validateReferences(context: ValidationContext): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const diagram = [...context.definitions.values()].find((item): item is DiagramDefinition => item.kind === "diagram");
  const nodes = new Set(diagram?.nodes.map(({ id }) => id) ?? []);
  for (const definition of context.definitions.values()) {
    if (definition.kind === "diagram") continue;
    const items = definition.kind === "motion" ? definition.scenes : definition.storyBeats;
    items.forEach((item, itemIndex) => item.visualReferences?.forEach((reference, refIndex) => {
      const base = `/${definition.kind === "motion" ? "scenes" : "storyBeats"}/${itemIndex}/visualReferences/${refIndex}`;
      if (!context.definitions.has(reference.visualId)) {
        issues.push(issue(definition.id, `${base}/visualId`, `unknown visual "${reference.visualId}"`));
      }
      reference.focusNodes.forEach((nodeId, nodeIndex) => {
        if (!nodes.has(nodeId)) issues.push(issue(definition.id, `${base}/focusNodes/${nodeIndex}`, `unknown diagram node "${nodeId}"`));
      });
    }));
  }
  return issues;
}

export function validateContext(context: ValidationContext): ValidationIssue[] {
  const issues: ValidationIssue[] = [
    ...schemaValidate("package", context.visualPackage, context.visualPackage.id),
    ...inspectUntrusted(context.visualPackage, context.visualPackage.id)
  ];
  issues.push(...duplicates(context.visualPackage.learningObjectives.map(({ id }) => id), context.visualPackage.id, "/learningObjectives"));
  issues.push(...duplicates(context.visualPackage.visuals.map(({ id }) => id), context.visualPackage.id, "/visuals"));
  if (new Set(context.visualPackage.visuals.map(({ kind }) => kind)).size !== 3) {
    issues.push(issue(context.visualPackage.id, "/visuals", "package must contain one diagram, one motion, and one narrative"));
  }

  for (const reference of context.visualPackage.visuals) {
    const definition = context.definitions.get(reference.id);
    if (!definition) {
      issues.push(issue(context.visualPackage.id, "/visuals", `missing definition "${reference.id}"`));
      continue;
    }
    issues.push(...schemaValidate(definition.kind, definition, definition.id));
    issues.push(...inspectUntrusted(definition, definition.id));
    if (definition.id !== reference.id || definition.kind !== reference.kind) {
      issues.push(issue(definition.id, "/", "package metadata does not match definition ID and kind"));
    }
    validateObjectiveAndConceptRefs(definition, context.visualPackage, issues);
    if (definition.kind === "diagram") issues.push(...validateDiagram(definition));
    if (definition.kind === "motion") issues.push(...validateTimeline(definition, definition.scenes, "/scenes"));
    if (definition.kind === "narrative") {
      issues.push(...validateTimeline(definition, definition.storyBeats, "/storyBeats"));
      if (definition.captions[0]?.start !== 0 || definition.captions.at(-1)?.end !== definition.durationSeconds) {
        issues.push(issue(definition.id, "/captions", "captions must cover the full duration"));
      }
      definition.captions.forEach((caption, index) => {
        if (caption.end <= caption.start) issues.push(issue(definition.id, `/captions/${index}/end`, "caption end must be after start"));
        if (index > 0 && caption.start !== definition.captions[index - 1].end) {
          issues.push(issue(definition.id, `/captions/${index}/start`, "captions must be continuous and non-overlapping"));
        }
      });
      const transcriptWords = definition.transcript.replace(/\s+/g, " ").trim();
      definition.storyBeats.forEach((beat, index) => {
        if (!transcriptWords.includes(beat.narration)) {
          issues.push(issue(definition.id, `/storyBeats/${index}/narration`, "narration is missing from transcript"));
        }
      });
    }
  }
  issues.push(...validateReferences(context));
  return issues;
}

export function formatIssues(issues: ValidationIssue[]): string {
  return issues.map(({ definitionId, path, reason }) => `${definitionId} ${path}: ${reason}`).join("\n");
}

export async function loadVisualPackage(packageUrl: URL): Promise<ValidationContext> {
  if (packageUrl.origin !== window.location.origin) throw new Error("visual-package /: cross-origin package paths are forbidden");
  const packageResponse = await fetch(packageUrl, { credentials: "same-origin" });
  if (!packageResponse.ok) throw new Error(`visual-package /: HTTP ${packageResponse.status}`);
  const visualPackage = parseUntrustedJson(await packageResponse.text(), "visual-package") as VisualPackage;
  const definitions = new Map<string, VisualDefinition>();
  for (const reference of visualPackage.visuals) {
    const url = new URL(reference.path, packageUrl);
    if (url.origin !== window.location.origin) throw new Error(`${reference.id} /: cross-origin definition paths are forbidden`);
    const response = await fetch(url, { credentials: "same-origin" });
    if (!response.ok) throw new Error(`${reference.id} /: HTTP ${response.status}`);
    definitions.set(reference.id, parseUntrustedJson(await response.text(), reference.id) as VisualDefinition);
  }
  const context = { visualPackage, definitions };
  const issues = validateContext(context);
  if (issues.length) throw new Error(formatIssues(issues));
  return context;
}
