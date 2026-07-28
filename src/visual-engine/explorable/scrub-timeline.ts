import type { ScrubRun, ScrubTimelineFigure } from "../types";
import { FigureState } from "./state";
import { HUE, clamp, drawLineChart, html, svg, svgText, type LineChartHandle } from "./primitives";

const STAGE_WIDTH = 960;
const PLOT_X = 64;
const PLOT_WIDTH = 848;
const TRACK_Y = 46;
const TRACK_HEIGHT = 30;
const CHART_HEIGHT = 88;
const CHART_GAP = 44;

interface RunHealth {
  healthy: boolean;
  problems: string[];
}

/**
 * Archetype A11 + A6: a dual-track scrubbable timeline. The process track
 * shows what the dashboard reported; outcome charts below show what was true.
 * Scrub, play, hover — the inspector links every view to the same day.
 */
export class ScrubTimelineRenderer {
  private readonly state: FigureState;
  private readonly dayCount: number;
  private playing = false;
  private frame = 0;
  private lastFrame = 0;
  private processCells: SVGRectElement[] = [];
  private processMarks: SVGTextElement[] = [];
  private charts: LineChartHandle[] = [];
  private playhead!: SVGLineElement;
  private hitColumns: SVGRectElement[] = [];
  private playButton!: HTMLButtonElement;
  private scrubber!: HTMLInputElement;
  private progress!: HTMLElement;
  private inspector!: HTMLElement;
  private runsByDay = new Map<number, ScrubRun>();

  constructor(
    private readonly container: HTMLElement,
    private readonly figure: ScrubTimelineFigure
  ) {
    this.dayCount = figure.timeline.labels.length;
    for (const run of figure.runs) this.runsByDay.set(run.day, run);
    this.state = new FigureState({ playhead: this.dayCount - 1, hoveredDay: null, lens: false });
    this.mount();
    this.state.subscribe("playhead", () => this.renderPlayhead());
    this.state.subscribe("hoveredDay", () => this.renderInspector());
    this.state.subscribe("lens", () => this.renderTrack());
    this.renderTrack();
    this.renderPlayhead();
    document.addEventListener("visibilitychange", this.handleVisibility);
  }

  private health(run: ScrubRun | undefined): RunHealth {
    if (!run) return { healthy: false, problems: ["no run recorded"] };
    const problems: string[] = [];
    const records = this.figure.series.find((series) => series.key === "records");
    const freshness = this.figure.series.find((series) => series.key === "freshnessHours");
    if (records?.healthyMin !== undefined && run.records < records.healthyMin) problems.push(`only ${run.records} records`);
    if (records?.healthyMax !== undefined && run.records > records.healthyMax) problems.push(`${run.records} records is implausibly high`);
    if (freshness?.healthyMax !== undefined && run.freshnessHours > freshness.healthyMax) {
      problems.push(`data is ${Math.round(run.freshnessHours)}h old`);
    }
    if (!run.sentinel) problems.push("sentinel value missing");
    if (run.error) problems.push("run reported an error");
    return { healthy: problems.length === 0, problems };
  }

  private mount(): void {
    const stageWrap = html("div", "fig-stage");
    const chartsTop = TRACK_Y + TRACK_HEIGHT + 64;
    const height = chartsTop + this.figure.series.length * (CHART_HEIGHT + CHART_GAP) + 24;
    const stage = svg("svg", {
      viewBox: `0 0 ${STAGE_WIDTH} ${height}`,
      class: "fig-svg",
      role: "img",
      "aria-label": `${this.figure.title} — interactive timeline`
    });

    stage.append(svgText({ x: String(PLOT_X), y: "24", class: "fig-track-title" }, "What the dashboard reported"));
    const step = PLOT_WIDTH / this.dayCount;
    for (let day = 0; day < this.dayCount; day++) {
      const cell = svg("rect", {
        x: String(PLOT_X + day * step + 3),
        y: String(TRACK_Y),
        width: String(step - 6),
        height: String(TRACK_HEIGHT),
        rx: "8",
        class: "fig-cell"
      });
      const mark = svgText(
        { x: String(PLOT_X + day * step + step / 2), y: String(TRACK_Y + TRACK_HEIGHT / 2 + 4.5), "text-anchor": "middle", class: "fig-cell-mark" },
        "✓"
      );
      this.processCells.push(cell);
      this.processMarks.push(mark);
      stage.append(cell, mark);
    }

    stage.append(svgText({ x: String(PLOT_X), y: String(TRACK_Y + TRACK_HEIGHT + 34), class: "fig-track-title" }, "What was actually true"));
    this.figure.series.forEach((series, index) => {
      const values = Array.from({ length: this.dayCount }, (_, day) => {
        const run = this.runsByDay.get(day);
        return run ? run[series.key] : null;
      });
      const handle = drawLineChart(stage, {
        area: { x: PLOT_X, y: chartsTop + index * (CHART_HEIGHT + CHART_GAP), width: PLOT_WIDTH, height: CHART_HEIGHT },
        label: series.label,
        hue: series.hue,
        values,
        healthyMin: series.healthyMin,
        healthyMax: series.healthyMax,
        dashed: index > 0,
        clipId: `${this.figure.id}-clip-${series.key}`
      });
      this.charts.push(handle);
    });

    for (const annotation of this.figure.annotations ?? []) {
      if (annotation.type === "region") {
        const x0 = PLOT_X + annotation.from * step;
        const x1 = PLOT_X + (annotation.to + 1) * step;
        stage.append(
          svg("rect", {
            x: String(x0),
            y: String(chartsTop - 26),
            width: String(x1 - x0),
            height: String(this.figure.series.length * (CHART_HEIGHT + CHART_GAP) - 8),
            class: "fig-region"
          })
        );
        stage.append(
          svgText({ x: String((x0 + x1) / 2), y: String(chartsTop - 32), "text-anchor": "middle", class: "fig-region-label" }, annotation.label)
        );
      } else {
        const x = PLOT_X + annotation.at * step + step / 2;
        const y = annotation.track === "process" ? TRACK_Y - 8 : chartsTop - 8;
        stage.append(svg("path", { d: `M ${x + 46} ${y - 14} Q ${x + 14} ${y - 16} ${x + 3} ${y + 2}`, class: "fig-swoopy" }));
        stage.append(svgText({ x: String(x + 50), y: String(y - 10), class: "fig-annotation" }, annotation.text));
      }
    }

    const axisY = chartsTop + this.figure.series.length * (CHART_HEIGHT + CHART_GAP) - CHART_GAP + 26;
    this.figure.timeline.labels.forEach((label, day) => {
      if (this.dayCount > 10 && day % 2 === 1) return;
      stage.append(
        svgText({ x: String(PLOT_X + day * step + step / 2), y: String(axisY), "text-anchor": "middle", class: "fig-tick" }, label)
      );
    });

    this.playhead = svg("line", {
      x1: "0",
      y1: String(TRACK_Y - 8),
      x2: "0",
      y2: String(axisY - 16),
      class: "fig-playhead"
    });
    stage.append(this.playhead);

    for (let day = 0; day < this.dayCount; day++) {
      const hit = svg("rect", {
        x: String(PLOT_X + day * step),
        y: String(TRACK_Y - 8),
        width: String(step),
        height: String(axisY - TRACK_Y - 4),
        class: "fig-hit"
      });
      hit.addEventListener("mouseenter", () => this.state.set("hoveredDay", day));
      hit.addEventListener("mouseleave", () => this.state.set("hoveredDay", null));
      hit.addEventListener("click", () => this.state.set("playhead", day));
      this.hitColumns.push(hit);
      stage.append(hit);
    }
    stageWrap.append(stage);

    const controls = html("div", "fig-controls");
    this.playButton = html("button", "visual-control visual-control-play", "Play");
    this.playButton.type = "button";
    this.playButton.setAttribute("aria-label", "Play timeline");
    this.playButton.addEventListener("click", () => (this.playing ? this.pause() : this.play()));
    this.scrubber = html("input", "visual-seek fig-scrubber");
    this.scrubber.type = "range";
    this.scrubber.min = "0";
    this.scrubber.max = String(this.dayCount - 1);
    this.scrubber.step = "0.05";
    this.scrubber.value = String(this.dayCount - 1);
    this.scrubber.setAttribute("aria-label", `Scrub by ${this.figure.timeline.unitLabel}`);
    this.scrubber.addEventListener("input", () => {
      this.pause();
      this.state.set("playhead", Number(this.scrubber.value));
    });
    this.progress = html("span", "visual-progress");
    controls.append(this.playButton, this.scrubber, this.progress);

    if (this.figure.lensToggle) {
      const lens = html("button", "fig-toggle", this.figure.lensToggle.labelWhenOff);
      lens.type = "button";
      lens.setAttribute("aria-pressed", "false");
      lens.addEventListener("click", () => {
        const next = !(this.state.get<boolean>("lens") ?? false);
        this.state.set("lens", next);
        lens.setAttribute("aria-pressed", String(next));
        lens.textContent = next ? this.figure.lensToggle!.labelWhenOn : this.figure.lensToggle!.labelWhenOff;
        lens.classList.toggle("is-on", next);
      });
      controls.append(lens);
    }

    this.inspector = html("div", "fig-inspector");
    this.inspector.setAttribute("aria-live", "polite");
    this.container.append(stageWrap, controls, this.inspector);
  }

  private renderTrack(): void {
    const lens = this.state.get<boolean>("lens") ?? false;
    for (let day = 0; day < this.dayCount; day++) {
      const run = this.runsByDay.get(day);
      const health = this.health(run);
      const cell = this.processCells[day];
      const mark = this.processMarks[day];
      const loudError = Boolean(run?.error);
      const showAsBad = loudError || (lens && !health.healthy);
      cell.classList.toggle("is-ok", !showAsBad);
      cell.classList.toggle("is-bad", showAsBad);
      mark.textContent = showAsBad ? "✕" : "✓";
    }
  }

  private renderPlayhead(): void {
    const playhead = this.state.get<number>("playhead");
    const step = PLOT_WIDTH / this.dayCount;
    const x = PLOT_X + clamp(playhead, 0, this.dayCount - 1) * step + step / 2;
    this.playhead.setAttribute("x1", String(x));
    this.playhead.setAttribute("x2", String(x));
    for (const chart of this.charts) chart.setReveal(playhead);
    if (Math.abs(Number(this.scrubber.value) - playhead) > 0.04) this.scrubber.value = String(playhead);
    const day = Math.round(clamp(playhead, 0, this.dayCount - 1));
    this.progress.textContent = `${this.figure.timeline.unitLabel} ${day + 1} of ${this.dayCount}`;
    this.renderInspector();
  }

  private renderInspector(): void {
    const hovered = this.state.get<number | null>("hoveredDay");
    const day = hovered ?? Math.round(clamp(this.state.get<number>("playhead"), 0, this.dayCount - 1));
    this.hitColumns.forEach((column, index) => column.classList.toggle("is-active", index === day));
    const run = this.runsByDay.get(day);
    const health = this.health(run);
    this.inspector.replaceChildren();
    const heading = html("p", "fig-inspector-heading");
    const dashboardSaid = run?.error ? "error" : "success";
    heading.append(
      html("strong", "", `${this.figure.timeline.labels[day]}.`),
      document.createTextNode(
        run
          ? ` The dashboard reported ${dashboardSaid} (exit code ${run.error ? 1 : 0}).`
          : " No run was recorded at all — and nothing reported that."
      )
    );
    const truth = html("p", "fig-inspector-truth");
    if (run) {
      const verdict = health.healthy ? "The output was genuinely healthy." : `The output was wrong: ${health.problems.join(", ")}.`;
      truth.append(
        html("span", `fig-verdict ${health.healthy ? "is-ok" : "is-bad"}`, health.healthy ? "✓ healthy" : "✕ silent failure"),
        document.createTextNode(` ${verdict}`)
      );
    } else {
      truth.append(html("span", "fig-verdict is-bad", "✕ absent"), document.createTextNode(" Absence is the failure no error can announce."));
    }
    this.inspector.append(heading, truth);
  }

  private tick = (time: number): void => {
    if (!this.playing) return;
    if (!this.lastFrame) this.lastFrame = time;
    const delta = (time - this.lastFrame) / 1000;
    this.lastFrame = time;
    const next = this.state.get<number>("playhead") + delta * 2.6;
    if (next >= this.dayCount - 1) {
      this.state.set("playhead", this.dayCount - 1);
      this.pause();
      return;
    }
    this.state.set("playhead", next);
    this.frame = requestAnimationFrame(this.tick);
  };

  private handleVisibility = (): void => {
    if (document.hidden && this.playing) this.pause();
  };

  play(): void {
    if (this.playing) return;
    if (this.state.get<number>("playhead") >= this.dayCount - 1.05) this.state.set("playhead", 0);
    this.playing = true;
    this.lastFrame = 0;
    this.playButton.textContent = "Pause";
    this.playButton.setAttribute("aria-label", "Pause timeline");
    this.frame = requestAnimationFrame(this.tick);
  }

  pause(): void {
    this.playing = false;
    cancelAnimationFrame(this.frame);
    this.playButton.textContent = "Play";
    this.playButton.setAttribute("aria-label", "Play timeline");
  }

  destroy(): void {
    this.pause();
    document.removeEventListener("visibilitychange", this.handleVisibility);
  }
}
