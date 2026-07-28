import type { AbsenceCompareFigure, AbsenceEvent, AbsencePanel } from "../types";
import { FigureState } from "./state";
import { html, svg, svgText } from "./primitives";

const STAGE_WIDTH = 960;
const PLOT_X = 40;
const PLOT_WIDTH = 880;
const PANEL_HEIGHT = 118;
const CELL_HEIGHT = 34;

interface PanelJudgement {
  fires: boolean;
  first: boolean;
  reason: string;
}

function judge(panel: AbsencePanel, events: AbsenceEvent[], day: number): PanelJudgement {
  const event = events.find((candidate) => candidate.day === day);
  if (panel.rule === "presence-of-bad") {
    const fires = event?.kind === "error";
    return {
      fires,
      first: fires,
      reason: fires
        ? "an error was thrown, so error-based alerting fires"
        : event?.kind === "absent"
          ? "nothing ran, so nothing errored — this rule stays silent"
          : "the run succeeded, so there is nothing to report"
    };
  }
  const window = panel.windowDays ?? 1;
  const lastGood = events.filter((candidate) => candidate.day <= day && candidate.kind !== "absent").map((candidate) => candidate.day);
  const gap = day - (lastGood.length ? Math.max(...lastGood) : -1);
  const fires = gap > window;
  return {
    fires,
    first: fires && gap === window + 1,
    reason: fires
      ? `no heartbeat for ${gap} days — the dead-man's switch fires`
      : event?.kind === "error"
        ? "the run happened (even though it errored), so the heartbeat arrived"
        : "the expected heartbeat arrived on time"
  };
}

/**
 * Archetype A6 + A10: the same event stream judged by two alerting
 * philosophies in aligned panels; hovering a day links both views.
 */
export class AbsenceCompareRenderer {
  private readonly state: FigureState;
  private readonly dayCount: number;
  private hitColumns: SVGRectElement[] = [];
  private explainer!: HTMLElement;

  constructor(
    private readonly container: HTMLElement,
    private readonly figure: AbsenceCompareFigure
  ) {
    this.dayCount = figure.timeline.labels.length;
    this.state = new FigureState({ hoveredDay: null });
    this.mount();
    this.state.subscribe("hoveredDay", () => this.renderExplainer());
    this.renderExplainer();
  }

  private mount(): void {
    const stageWrap = html("div", "fig-stage");
    const height = this.figure.panels.length * (PANEL_HEIGHT + 26) + 34;
    const stage = svg("svg", {
      viewBox: `0 0 ${STAGE_WIDTH} ${height}`,
      class: "fig-svg",
      role: "img",
      "aria-label": `${this.figure.title} — one event stream judged by two alerting rules`
    });
    const step = PLOT_WIDTH / this.dayCount;

    this.figure.panels.forEach((panel, panelIndex) => {
      const top = 8 + panelIndex * (PANEL_HEIGHT + 26);
      stage.append(svgText({ x: String(PLOT_X), y: String(top + 12), class: "fig-track-title" }, panel.title));
      if (panel.note) {
        stage.append(svgText({ x: String(PLOT_X + PLOT_WIDTH), y: String(top + 12), "text-anchor": "end", class: "fig-annotation" }, panel.note));
      }
      for (let day = 0; day < this.dayCount; day++) {
        const event = this.figure.events.find((candidate) => candidate.day === day);
        const x = PLOT_X + day * step + 2;
        const cell = svg("rect", {
          x: String(x),
          y: String(top + 22),
          width: String(step - 4),
          height: String(CELL_HEIGHT),
          rx: "7",
          class: "fig-cell"
        });
        const kind = event?.kind ?? "ok";
        cell.classList.add(kind === "ok" ? "is-ok" : kind === "error" ? "is-bad" : "is-absent");
        stage.append(cell);
        const markText = kind === "ok" ? "✓" : kind === "error" ? "✕" : "·";
        stage.append(
          svgText(
            { x: String(x + (step - 4) / 2), y: String(top + 22 + CELL_HEIGHT / 2 + 4.5), "text-anchor": "middle", class: "fig-cell-mark" },
            markText
          )
        );
        const judgement = judge(panel, this.figure.events, day);
        if (judgement.fires) {
          const bell = svg("path", {
            d: `M ${x + (step - 4) / 2 - 5} ${top + 84} q 0 -8 5 -8 q 5 0 5 8 z`,
            class: `fig-bell ${judgement.first ? "" : "is-repeat"}`
          });
          stage.append(bell);
          stage.append(
            svg("line", {
              x1: String(x + (step - 4) / 2),
              y1: String(top + 84),
              x2: String(x + (step - 4) / 2),
              y2: String(top + 88),
              class: "fig-bell-clapper"
            })
          );
        }
      }
      stage.append(
        svgText({ x: String(PLOT_X), y: String(top + 96), class: "fig-band-label" }, panelIndex === 0 ? "alerts fired ↓" : "alerts fired ↓")
      );
    });

    const axisY = height - 8;
    this.figure.timeline.labels.forEach((label, day) => {
      if (this.dayCount > 12 && day % 2 === 1) return;
      stage.append(svgText({ x: String(PLOT_X + day * step + step / 2), y: String(axisY), "text-anchor": "middle", class: "fig-tick" }, label));
    });

    for (let day = 0; day < this.dayCount; day++) {
      const hit = svg("rect", {
        x: String(PLOT_X + day * step),
        y: "4",
        width: String(step),
        height: String(height - 20),
        class: "fig-hit"
      });
      hit.addEventListener("mouseenter", () => this.state.set("hoveredDay", day));
      hit.addEventListener("mouseleave", () => this.state.set("hoveredDay", null));
      this.hitColumns.push(hit);
      stage.append(hit);
    }

    stageWrap.append(stage);
    this.explainer = html("p", "fig-detail");
    this.explainer.setAttribute("aria-live", "polite");
    this.container.append(stageWrap, this.explainer);
  }

  private renderExplainer(): void {
    const hovered = this.state.get<number | null>("hoveredDay");
    this.hitColumns.forEach((column, index) => column.classList.toggle("is-active", index === hovered));
    if (hovered === null) {
      this.explainer.textContent = "Hover a day to compare what each alerting rule sees.";
      return;
    }
    const sentences = this.figure.panels.map((panel) => {
      const judgement = judge(panel, this.figure.events, hovered);
      return `${panel.title}: ${judgement.reason}`;
    });
    this.explainer.textContent = `${this.figure.timeline.labels[hovered]} — ${sentences.join(". ")}.`;
  }

  destroy(): void {
    // Static comparison: nothing to stop.
  }
}
