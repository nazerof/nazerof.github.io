import type { ParameterPlaygroundFigure } from "../types";
import { FigureState } from "./state";
import { classifyRuns, simulateRunStream, type AlertParameters, type SimulatedRun, type Verdict } from "./model";
import { html, legendChip, statChip, svg, trustMeter, type StatChipHandle } from "./primitives";

const STAGE_WIDTH = 960;
const COLUMNS = 20;
const CELL = 40;
const GAP = 6;

const VERDICT_LABEL: Record<Verdict, string> = {
  healthy: "healthy run",
  caught: "silent failure — caught",
  missed: "silent failure — missed",
  "false-alarm": "false alarm"
};

/**
 * Archetype A1: sliders drive a deterministic run-stream simulation; every
 * view (run grid, counters, trust meter) recomputes from the same state.
 */
export class ParameterPlaygroundRenderer {
  private readonly state: FigureState;
  private readonly runs: SimulatedRun[];
  private cells: SVGRectElement[] = [];
  private glyphs: SVGElement[] = [];
  private caught!: StatChipHandle;
  private missed!: StatChipHandle;
  private falseAlarms!: StatChipHandle;
  private trust!: ReturnType<typeof trustMeter>;
  private detail!: HTMLElement;

  constructor(
    private readonly container: HTMLElement,
    private readonly figure: ParameterPlaygroundFigure
  ) {
    this.runs = simulateRunStream(figure.model);
    const initial: Record<string, number> = {};
    for (const parameter of figure.parameters) initial[parameter.key] = parameter.initial;
    this.state = new FigureState({ ...initial, hoveredRun: null });
    this.mount();
    for (const parameter of figure.parameters) this.state.subscribe(parameter.key, () => this.render());
    this.state.subscribe("hoveredRun", () => this.renderDetail());
    this.render();
  }

  private parameters(): AlertParameters {
    return {
      volumeBandPercent: this.state.get<number>("volumeBandPercent") ?? 100,
      freshnessToleranceHours: this.state.get<number>("freshnessToleranceHours") ?? 1000,
      heartbeatWindowHours: this.state.get<number>("heartbeatWindowHours") ?? 1000
    };
  }

  private mount(): void {
    const sliders = html("div", "fig-sliders");
    for (const parameter of this.figure.parameters) {
      const field = html("label", "fig-slider");
      const caption = html("span", "fig-slider-label");
      const value = html("strong", "fig-slider-value");
      caption.append(document.createTextNode(`${parameter.label} `), value);
      const input = html("input", "fig-slider-input");
      input.type = "range";
      input.min = String(parameter.min);
      input.max = String(parameter.max);
      input.step = String(parameter.step);
      input.value = String(parameter.initial);
      input.setAttribute("aria-label", parameter.label);
      const readout = (): void => {
        value.textContent = `${parameter.symbol} = ${input.value}${parameter.unit}`;
      };
      input.addEventListener("input", () => {
        readout();
        this.state.set(parameter.key, Number(input.value));
      });
      readout();
      field.append(caption, input);
      sliders.append(field);
    }

    const rows = Math.ceil(this.runs.length / COLUMNS);
    const width = COLUMNS * (CELL + GAP);
    const offsetX = (STAGE_WIDTH - width) / 2;
    const stageWrap = html("div", "fig-stage");
    const stage = svg("svg", {
      viewBox: `0 0 ${STAGE_WIDTH} ${rows * (CELL + GAP) + 16}`,
      class: "fig-svg",
      role: "img",
      "aria-label": `${this.figure.title} — simulated runs classified by the current thresholds`
    });
    this.runs.forEach((run, index) => {
      const column = index % COLUMNS;
      const row = Math.floor(index / COLUMNS);
      const x = offsetX + column * (CELL + GAP);
      const y = 8 + row * (CELL + GAP);
      const cell = svg("rect", { x: String(x), y: String(y), width: String(CELL), height: String(CELL), rx: "9", class: "fig-run" });
      if (!run.present) cell.classList.add("is-absent");
      cell.addEventListener("mouseenter", () => this.state.set("hoveredRun", index));
      cell.addEventListener("mouseleave", () => this.state.set("hoveredRun", null));
      this.cells.push(cell);
      stage.append(cell);
      const center = { x: x + CELL / 2, y: y + CELL / 2 };
      const glyph =
        run.failure === "none"
          ? svg("circle", { cx: String(center.x), cy: String(center.y), r: "4", class: "fig-run-glyph" })
          : svg("path", {
              d: `M ${center.x} ${center.y - 6} L ${center.x + 6} ${center.y + 5} L ${center.x - 6} ${center.y + 5} Z`,
              class: "fig-run-glyph"
            });
      this.glyphs.push(glyph);
      stage.append(glyph);
    });
    stageWrap.append(stage);

    const legend = html("div", "fig-legend");
    legend.append(
      legendChip("is-healthy", "healthy"),
      legendChip("is-caught", "failure caught"),
      legendChip("is-missed", "failure missed"),
      legendChip("is-false", "false alarm"),
      legendChip("is-shape", "▲ = injected silent failure")
    );

    const readouts = html("div", "fig-readouts");
    this.caught = statChip("silent failures caught", "green");
    this.missed = statChip("missed", "red");
    this.falseAlarms = statChip("false alarms", "amber");
    this.trust = trustMeter("alert trust");
    readouts.append(this.caught.element, this.missed.element, this.falseAlarms.element, this.trust.element);

    this.detail = html("p", "fig-detail", "Hover a run to see how the current thresholds judged it.");
    this.container.append(sliders, stageWrap, legend, readouts, this.detail);
  }

  private render(): void {
    const { perRun, totals } = classifyRuns(this.runs, this.figure.model, this.parameters());
    perRun.forEach((classification, index) => {
      const cell = this.cells[index];
      cell.classList.toggle("is-healthy", classification.verdict === "healthy");
      cell.classList.toggle("is-caught", classification.verdict === "caught");
      cell.classList.toggle("is-missed", classification.verdict === "missed");
      cell.classList.toggle("is-false", classification.verdict === "false-alarm");
    });
    this.caught.setValue(`${totals.caught} of ${totals.failures}`);
    this.missed.setValue(String(totals.missed));
    this.falseAlarms.setValue(String(totals.falseAlarms));
    this.trust.setFraction(totals.trust);
    this.renderDetail();
  }

  private renderDetail(): void {
    const hovered = this.state.get<number | null>("hoveredRun");
    this.cells.forEach((cell, index) => cell.classList.toggle("is-hovered", index === hovered));
    if (hovered === null) {
      this.detail.textContent = "Hover a run to see how the current thresholds judged it.";
      return;
    }
    const { perRun } = classifyRuns(this.runs, this.figure.model, this.parameters());
    const run = this.runs[hovered];
    const classification = perRun[hovered];
    if (run.failure === "none") {
      const judged = classification.verdict === "healthy" ? "passes" : "trips the checks anyway — a false alarm";
      this.detail.textContent = `Run ${hovered + 1} is a healthy run and ${judged}: ${classification.reason}.`;
      return;
    }
    const nature =
      run.failure === "stale" ? "a stale-source failure" : run.failure === "partial" ? "a partial-result failure" : "a missing run";
    this.detail.textContent = `Run ${hovered + 1} is ${nature} → ${VERDICT_LABEL[classification.verdict]}: ${classification.reason}.`;
  }

  destroy(): void {
    // No loops to stop: this archetype recomputes only on input.
  }
}
