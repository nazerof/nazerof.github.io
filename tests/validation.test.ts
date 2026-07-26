import { describe, expect, it } from "vitest";
import type { DiagramDefinition, MotionDefinition, NarrativeDefinition } from "../src/visual-engine/types";
import { formatIssues, parseUntrustedJson, validateContext } from "../src/visual-engine/validation";
import { loadContext } from "./fixtures";

function reasons(context = loadContext()): string {
  return formatIssues(validateContext(context));
}

describe("visual package validation", () => {
  it("accepts the canonical package", () => {
    expect(validateContext(loadContext())).toEqual([]);
  });

  it("rejects an invalid schema version", () => {
    const context = loadContext();
    (context.visualPackage as { schemaVersion: string }).schemaVersion = "2.0";
    expect(reasons(context)).toContain("schemaVersion");
  });

  it("rejects duplicate IDs", () => {
    const context = loadContext();
    context.visualPackage.learningObjectives[1].id = context.visualPackage.learningObjectives[0].id;
    expect(reasons(context)).toContain("duplicate ID");
  });

  it("rejects broken node references", () => {
    const context = loadContext();
    const diagram = context.definitions.get("rpa-operating-architecture") as DiagramDefinition;
    diagram.edges[0].to = "missing-node";
    expect(reasons(context)).toContain('unknown node "missing-node"');
  });

  it("rejects broken learning-objective references", () => {
    const context = loadContext();
    const motion = context.definitions.get("scheduling-collision") as MotionDefinition;
    motion.learningObjectiveRefs = ["missing-objective"];
    expect(reasons(context)).toContain("unknown learning objective");
  });

  it("rejects broken diagram references", () => {
    const context = loadContext();
    const motion = context.definitions.get("scheduling-collision") as MotionDefinition;
    motion.scenes[2].visualReferences![0].focusNodes = ["missing-node"];
    expect(reasons(context)).toContain("unknown diagram node");
  });

  it("rejects excessive element counts", () => {
    const context = loadContext();
    const diagram = context.definitions.get("rpa-operating-architecture") as DiagramDefinition;
    diagram.nodes = Array.from({ length: 101 }, (_, index) => ({ ...diagram.nodes[0], id: `node-${index}` }));
    expect(reasons(context)).toContain("maxItems");
  });

  it.each([
    ["invalid animation preset", "enter", "bounce-spin"],
    ["invalid easing", "easing", "run-code"]
  ])("rejects %s", (_label, key, value) => {
    const context = loadContext();
    const motion = context.definitions.get("scheduling-collision") as MotionDefinition;
    (motion.scenes[0] as unknown as Record<string, string>)[key] = value;
    expect(reasons(context)).toContain(key);
  });

  it("rejects negative durations", () => {
    const context = loadContext();
    const motion = context.definitions.get("scheduling-collision") as MotionDefinition;
    motion.scenes[0].duration = -1;
    expect(reasons(context)).toContain("/duration");
  });

  it("rejects timeline overflow", () => {
    const context = loadContext();
    const narrative = context.definitions.get("automation-becomes-operations") as NarrativeDefinition;
    narrative.storyBeats.at(-1)!.duration = 20;
    expect(reasons(context)).toContain("extends beyond timeline duration");
  });

  it("rejects unsafe URLs, HTML, executable fields, and invalid assets", () => {
    expect(() => parseUntrustedJson('{"id":"x","url":"javascript:alert(1)"}', "unsafe")).toThrow("unsafe");
    expect(() => parseUntrustedJson('{"id":"x","text":"<script>alert(1)</script>"}', "unsafe")).toThrow("unsafe");
    expect(() => parseUntrustedJson('{"id":"x","onClick":"doThing"}', "unsafe")).toThrow("forbidden");
    const context = loadContext();
    (context.visualPackage as unknown as Record<string, unknown>).assets = ["https://example.com/file.svg"];
    expect(reasons(context)).toContain("additionalProperties");
  });

  it("rejects deeply nested and oversized input", () => {
    let nested: unknown = "value";
    for (let index = 0; index < 18; index++) nested = { child: nested };
    expect(() => parseUntrustedJson(JSON.stringify(nested), "deep")).toThrow("nesting exceeds");
    expect(() => parseUntrustedJson(JSON.stringify({ text: "x".repeat(100_001) }), "large")).toThrow("file exceeds");
  });
});
