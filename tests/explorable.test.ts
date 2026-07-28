import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ExplorableDefinition, ParameterPlaygroundFigure, ScrubTimelineFigure } from "../src/visual-engine/types";
import { classifyRuns, simulateRunStream } from "../src/visual-engine/explorable/model";
import { FigureState } from "../src/visual-engine/explorable/state";
import { mountExplorableFigure } from "../src/visual-engine/explorable/mount";
import { validateContext } from "../src/visual-engine/validation";
import { loadContext } from "./fixtures";

const context = loadContext("monitoring-silent-failure");
const definition = context.definitions.get("silent-failure-explorables") as ExplorableDefinition;

describe("explorable validation", () => {
  it("accepts the monitoring package", () => {
    expect(validateContext(loadContext("monitoring-silent-failure"))).toEqual([]);
  });

  it("rejects a package that has neither the classic trio nor an explorable", () => {
    const broken = loadContext("monitoring-silent-failure");
    broken.visualPackage.visuals[0].kind = "motion";
    const reasons = validateContext(broken).map(({ reason }) => reason).join("\n");
    expect(reasons).toContain("trio or at least one explorable");
  });

  it("rejects runs pointing past the timeline", () => {
    const broken = loadContext("monitoring-silent-failure");
    const explorable = broken.definitions.get("silent-failure-explorables") as ExplorableDefinition;
    (explorable.figures[0] as ScrubTimelineFigure).runs[0].day = 39;
    const reasons = validateContext(broken).map(({ reason }) => reason).join("\n");
    expect(reasons).toContain("exceeds timeline length");
  });

  it("rejects an absence panel without a window", () => {
    const broken = loadContext("monitoring-silent-failure");
    const explorable = broken.definitions.get("silent-failure-explorables") as ExplorableDefinition;
    const figure = explorable.figures[2];
    if (figure.archetype === "absence-compare") delete figure.panels[1].windowDays;
    const reasons = validateContext(broken).map(({ reason }) => reason).join("\n");
    expect(reasons).toContain("require windowDays");
  });

  it("rejects parameter initials outside their range", () => {
    const broken = loadContext("monitoring-silent-failure");
    const explorable = broken.definitions.get("silent-failure-explorables") as ExplorableDefinition;
    (explorable.figures[1] as ParameterPlaygroundFigure).parameters[0].initial = 999;
    const reasons = validateContext(broken).map(({ reason }) => reason).join("\n");
    expect(reasons).toContain("within [min, max]");
  });
});

describe("figure state", () => {
  it("notifies subscribers only on change", () => {
    const state = new FigureState({ value: 1 });
    const seen: unknown[] = [];
    state.subscribe("value", (value) => seen.push(value));
    state.set("value", 1);
    state.set("value", 2);
    state.set("value", 2);
    expect(seen).toEqual([2]);
  });
});

describe("run-stream model", () => {
  const model = (definition.figures[1] as ParameterPlaygroundFigure).model;

  it("is deterministic for a given seed", () => {
    expect(simulateRunStream(model)).toEqual(simulateRunStream(model));
  });

  it("injects exactly the configured failures", () => {
    const runs = simulateRunStream(model);
    expect(runs.filter((run) => run.failure === "stale")).toHaveLength(model.staleFailures);
    expect(runs.filter((run) => run.failure === "partial")).toHaveLength(model.partialFailures);
    expect(runs.filter((run) => !run.present)).toHaveLength(model.missingRuns);
  });

  it("catches more with tight thresholds and alarms falsely when too tight", () => {
    const runs = simulateRunStream(model);
    const loose = classifyRuns(runs, model, { volumeBandPercent: 60, freshnessToleranceHours: 48, heartbeatWindowHours: 24 });
    const balanced = classifyRuns(runs, model, { volumeBandPercent: 20, freshnessToleranceHours: 12, heartbeatWindowHours: 6 });
    const paranoid = classifyRuns(runs, model, { volumeBandPercent: 5, freshnessToleranceHours: 2, heartbeatWindowHours: 2 });
    expect(loose.totals.caught).toBeLessThan(balanced.totals.caught);
    expect(paranoid.totals.caught).toBe(paranoid.totals.failures);
    expect(paranoid.totals.falseAlarms).toBeGreaterThan(loose.totals.falseAlarms);
    expect(paranoid.totals.trust).toBeLessThan(loose.totals.trust);
  });
});

describe("figure runtime", () => {
  beforeEach(() => {
    vi.stubGlobal("requestAnimationFrame", vi.fn(() => 1));
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
    });
  });

  it("mounts the figure a host requests", () => {
    const runtime = document.createElement("div");
    mountExplorableFigure(runtime, definition, "cheerful-lie");
    expect(runtime.querySelector("figure")?.dataset.archetype).toBe("scrub-timeline");
    expect(runtime.querySelectorAll(".fig-cell")).toHaveLength(14);
    expect(runtime.querySelector(".fig-caption")?.textContent).toContain("Fourteen days");
  });

  it("scrubbing moves the inspector to the selected day", () => {
    const runtime = document.createElement("div");
    mountExplorableFigure(runtime, definition, "cheerful-lie");
    const scrubber = runtime.querySelector<HTMLInputElement>(".fig-scrubber")!;
    scrubber.value = "2";
    scrubber.dispatchEvent(new Event("input"));
    expect(runtime.querySelector(".fig-inspector")?.textContent).toContain("Day 3");
    expect(runtime.querySelector(".fig-inspector")?.textContent).toContain("healthy");
    scrubber.value = "12";
    scrubber.dispatchEvent(new Event("input"));
    expect(runtime.querySelector(".fig-inspector")?.textContent).toContain("silent failure");
  });

  it("slider changes reclassify the playground", () => {
    const runtime = document.createElement("div");
    mountExplorableFigure(runtime, definition, "alert-threshold-playground");
    const before = runtime.querySelectorAll(".fig-run.is-missed").length;
    const sliders = runtime.querySelectorAll<HTMLInputElement>(".fig-slider-input");
    sliders.forEach((slider) => {
      slider.value = slider.min;
      slider.dispatchEvent(new Event("input"));
    });
    const after = runtime.querySelectorAll(".fig-run.is-missed").length;
    expect(before).toBeGreaterThan(0);
    expect(after).toBeLessThan(before);
    expect(runtime.querySelectorAll(".fig-run.is-false").length).toBeGreaterThan(0);
  });

  it("renders both absence panels with linked hover explainer", () => {
    const runtime = document.createElement("div");
    mountExplorableFigure(runtime, definition, "absence-of-good");
    expect(runtime.querySelectorAll(".fig-bell").length).toBeGreaterThan(2);
    const columns = runtime.querySelectorAll<SVGRectElement>(".fig-hit");
    columns[10].dispatchEvent(new Event("mouseenter"));
    const explainer = runtime.querySelector(".fig-detail")?.textContent ?? "";
    expect(explainer).toContain("Day 11");
    expect(explainer).toContain("dead-man's switch fires");
  });

  it("falls back to the reduced-motion steps", () => {
    vi.mocked(window.matchMedia).mockReturnValue({ matches: true } as MediaQueryList);
    const runtime = document.createElement("div");
    mountExplorableFigure(runtime, definition, "cheerful-lie");
    expect(runtime.querySelector("svg")).toBeNull();
    expect(runtime.querySelectorAll("li")).toHaveLength(4);
  });
});
