import { describe, expect, it } from "vitest";
import type { DiagramDefinition, MotionDefinition, NarrativeDefinition } from "../src/visual-engine/types";
import { compileNarrative, normalizeMotion } from "../src/visual-engine/compiler";
import { diagramToSkeleton } from "../src/visual-engine/diagram-adapter";
import { loadContext } from "./fixtures";

describe("normalization and adapters", () => {
  const context = loadContext();
  const diagram = context.definitions.get("rpa-operating-architecture") as DiagramDefinition;
  const motion = context.definitions.get("scheduling-collision") as MotionDefinition;
  const narrative = context.definitions.get("automation-becomes-operations") as NarrativeDefinition;

  it("converts every diagram node and edge into valid scene skeletons", () => {
    const skeleton = diagramToSkeleton(diagram);
    expect(skeleton.filter(({ type }) => type === "rectangle")).toHaveLength(diagram.nodes.length);
    expect(skeleton.filter(({ type }) => type === "arrow")).toHaveLength(diagram.edges.length);
    expect(diagram.nodes.map(({ id }) => id)).toEqual(expect.arrayContaining([
      "scheduler", "dependency-orchestrator", "session-manager", "connectors", "queue",
      "retry-boundary", "circuit-breaker", "validator", "storage", "structured-logs",
      "heartbeat-monitor", "validation-monitor", "trend-monitor", "operator-dashboard"
    ]));
    expect(skeleton.every(({ id, label, strokeColor }) => Boolean(id && label.text && strokeColor))).toBe(true);
    expect(skeleton.filter(({ type }) => type === "arrow").every(({ points }) => points?.length === 2)).toBe(true);
  });

  it("normalizes motion deterministically", () => {
    expect(normalizeMotion(motion)).toEqual(normalizeMotion(motion));
    expect(normalizeMotion(motion).durationSeconds).toBe(24);
  });

  it("compiles narrative into the shared motion timeline", () => {
    const timeline = compileNarrative(narrative);
    expect(timeline.scenes).toHaveLength(narrative.storyBeats.length);
    expect(timeline.scenes.every((scene) => scene.learningObjectiveRefs.length > 0)).toBe(true);
    expect(timeline.durationSeconds).toBeGreaterThanOrEqual(45);
    expect(timeline.durationSeconds).toBeLessThanOrEqual(90);
  });

  it("keeps captions continuous and transcript complete", () => {
    expect(narrative.captions[0].start).toBe(0);
    expect(narrative.captions.at(-1)?.end).toBe(narrative.durationSeconds);
    narrative.storyBeats.forEach(({ narration }) => expect(narrative.transcript).toContain(narration));
    expect(narrative.accessibility.longDescription).not.toMatch(/audio required/i);
  });
});
