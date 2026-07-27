import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ValidationContext, VisualDefinition, VisualPackage } from "../src/visual-engine/types";

const contentDirectory = resolve(process.cwd(), "content/visuals/rpa-scaling");

export function loadContext(): ValidationContext {
  const visualPackage = JSON.parse(readFileSync(resolve(contentDirectory, "package.json"), "utf8")) as VisualPackage;
  const definitions = new Map<string, VisualDefinition>();
  for (const visual of visualPackage.visuals) {
    definitions.set(visual.id, JSON.parse(readFileSync(resolve(contentDirectory, visual.path), "utf8")) as VisualDefinition);
  }
  return structuredCloneContext({ visualPackage, definitions });
}

export function structuredCloneContext(context: ValidationContext): ValidationContext {
  return {
    visualPackage: structuredClone(context.visualPackage),
    definitions: new Map([...context.definitions].map(([id, definition]) => [id, structuredClone(definition)]))
  };
}
