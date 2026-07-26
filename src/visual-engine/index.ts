import "./styles.css";
import { compileNarrative, normalizeMotion } from "./compiler";
import { MotionPlayer } from "./motion-player";
import type { DiagramDefinition, NarrativeDefinition, VisualDefinition } from "./types";
import { loadVisualPackage } from "./validation";

async function initializeHost(host: HTMLElement): Promise<void> {
  const packagePath = host.dataset.visualPackage;
  const visualId = host.dataset.visualId;
  const runtime = host.querySelector<HTMLElement>(".visual-runtime");
  if (!packagePath || !visualId || !runtime) return;
  host.setAttribute("aria-busy", "true");
  try {
    const context = await loadVisualPackage(new URL(packagePath, window.location.href));
    const definition = context.definitions.get(visualId);
    if (!definition) throw new Error(`${visualId} /: definition not found`);
    if (definition.kind === "diagram") {
      initializeDiagram(runtime, definition);
    } else if (definition.kind === "motion") {
      new MotionPlayer(runtime, normalizeMotion(definition));
    } else {
      const narrative = definition as NarrativeDefinition;
      new MotionPlayer(runtime, compileNarrative(narrative), narrative.captions);
    }
    host.dataset.visualReady = "true";
  } catch (error) {
    const status = document.createElement("p");
    status.className = "visual-error";
    status.setAttribute("role", "alert");
    status.textContent = `Interactive visual unavailable. ${error instanceof Error ? error.message.split("\n")[0] : "Validation failed."}`;
    runtime.replaceChildren(status);
  } finally {
    host.setAttribute("aria-busy", "false");
  }
}

function initializeDiagram(runtime: HTMLElement, definition: DiagramDefinition): void {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "visual-open-editor";
  button.textContent = "Open interactive diagram";
  button.setAttribute("aria-expanded", "false");
  const editor = document.createElement("div");
  editor.className = "visual-editor-mount";
  let dispose: (() => void) | undefined;
  button.addEventListener("click", async () => {
    button.disabled = true;
    button.textContent = "Loading editor…";
    try {
      const module = await import("./diagram-editor");
      dispose?.();
      dispose = module.openDiagramEditor(editor, definition);
      button.hidden = true;
      button.setAttribute("aria-expanded", "true");
    } catch {
      button.disabled = false;
      button.textContent = "Editor failed to load — try again";
    }
  });
  runtime.replaceChildren(button, editor);
}

function start(): void {
  document.querySelectorAll<HTMLElement>(".visual-learning-host").forEach((host) => {
    void initializeHost(host);
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", start, { once: true });
} else {
  start();
}

export type { VisualDefinition };
