import type { FigureHue } from "../types";

const SVG_NS = "http://www.w3.org/2000/svg";

export const HUE: Record<FigureHue, string> = {
  blue: "#2a78d6",
  green: "#087f5b",
  amber: "#e67700",
  red: "#c92a2a",
  purple: "#7048e8",
  gray: "#5f6b7a"
};

export function svg<K extends keyof SVGElementTagNameMap>(
  name: K,
  attributes: Record<string, string> = {}
): SVGElementTagNameMap[K] {
  const element = document.createElementNS(SVG_NS, name);
  for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value);
  return element;
}

export function svgText(attributes: Record<string, string>, content: string): SVGTextElement {
  const element = svg("text", attributes);
  element.textContent = content;
  return element;
}

export function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

export function html<K extends keyof HTMLElementTagNameMap>(
  name: K,
  className: string,
  textContent?: string
): HTMLElementTagNameMap[K] {
  const element = document.createElement(name);
  element.className = className;
  if (textContent !== undefined) element.textContent = textContent;
  return element;
}

export interface ChartArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LineChartSpec {
  area: ChartArea;
  label: string;
  hue: FigureHue;
  values: Array<number | null>;
  healthyMin?: number;
  healthyMax?: number;
  dashed?: boolean;
  clipId: string;
}

export interface LineChartHandle {
  xFor(day: number): number;
  yFor(value: number): number;
  setReveal(day: number): void;
  markers: SVGCircleElement[];
}

/**
 * One series per chart, one y-scale — never a dual axis. The full series is
 * drawn as a faint context line; the colored line is revealed up to the
 * playhead through a clip rect, Distill checkpoint-replay style.
 */
/** Round a raw maximum up to a clean axis value (1/2/2.5/5 × 10^k). */
function niceCeil(value: number): number {
  if (value <= 0) return 1;
  const power = 10 ** Math.floor(Math.log10(value));
  for (const multiple of [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) {
    if (multiple * power >= value) return multiple * power;
  }
  return 10 * power;
}

export function drawLineChart(parent: SVGElement, spec: LineChartSpec): LineChartHandle {
  const { area } = spec;
  const finite = spec.values.filter((value): value is number => value !== null);
  const maximum = niceCeil(Math.max(...finite, spec.healthyMax ?? 0) * 1.05);
  const step = area.width / Math.max(spec.values.length - 1, 1);
  const xFor = (day: number): number => area.x + day * step;
  const yFor = (value: number): number => area.y + area.height - (clamp(value, 0, maximum) / maximum) * area.height;

  const group = svg("g");
  group.append(svg("circle", { cx: String(area.x + 4), cy: String(area.y - 12), r: "4", fill: HUE[spec.hue] }));
  group.append(svgText({ x: String(area.x + 14), y: String(area.y - 8), class: "fig-series-label" }, spec.label));

  if (spec.healthyMin !== undefined || spec.healthyMax !== undefined) {
    const top = spec.healthyMax !== undefined ? yFor(spec.healthyMax) : area.y;
    const bottom = spec.healthyMin !== undefined ? yFor(spec.healthyMin) : area.y + area.height;
    group.append(
      svg("rect", {
        x: String(area.x),
        y: String(Math.min(top, bottom)),
        width: String(area.width),
        height: String(Math.abs(bottom - top)),
        class: "fig-healthy-band"
      })
    );
    group.append(
      svgText(
        { x: String(area.x + area.width - 4), y: String(Math.min(top, bottom) + 12), "text-anchor": "end", class: "fig-band-label" },
        "healthy range"
      )
    );
  }

  for (const fraction of [0, 0.5, 1]) {
    const y = area.y + area.height * fraction;
    group.append(svg("line", { x1: String(area.x), y1: String(y), x2: String(area.x + area.width), y2: String(y), class: "fig-gridline" }));
    group.append(
      svgText(
        { x: String(area.x - 6), y: String(y + 3.5), "text-anchor": "end", class: "fig-tick" },
        String(Math.round(maximum * (1 - fraction)))
      )
    );
  }

  const points = spec.values
    .map((value, day) => (value === null ? null : `${xFor(day)},${yFor(value)}`))
    .filter((point): point is string => point !== null)
    .join(" ");
  const contextLine = svg("polyline", { points, class: "fig-line-context" });
  group.append(contextLine);

  const clip = svg("clipPath", { id: spec.clipId });
  const clipRect = svg("rect", { x: String(area.x - 8), y: String(area.y - 20), width: "0", height: String(area.height + 40) });
  clip.append(clipRect);
  group.append(clip);

  const revealed = svg("g", { "clip-path": `url(#${spec.clipId})` });
  const line = svg("polyline", { points, class: "fig-line", stroke: HUE[spec.hue] });
  if (spec.dashed) line.setAttribute("stroke-dasharray", "6 4");
  revealed.append(line);
  const markers: SVGCircleElement[] = [];
  spec.values.forEach((value, day) => {
    if (value === null) return;
    const marker = svg("circle", { cx: String(xFor(day)), cy: String(yFor(value)), r: "4", class: "fig-marker", fill: HUE[spec.hue] });
    markers.push(marker);
    revealed.append(marker);
  });
  group.append(revealed);
  parent.append(group);

  return {
    xFor,
    yFor,
    markers,
    setReveal(day: number): void {
      clipRect.setAttribute("width", String(Math.max(0, xFor(day) - area.x + 12)));
    }
  };
}

export interface StatChipHandle {
  element: HTMLElement;
  setValue(value: string): void;
}

export function statChip(label: string, tone: "green" | "red" | "amber" | "neutral"): StatChipHandle {
  const element = html("div", `fig-stat fig-stat-${tone}`);
  const valueElement = html("span", "fig-stat-value", "–");
  const labelElement = html("span", "fig-stat-label", label);
  element.append(valueElement, labelElement);
  return { element, setValue: (value) => (valueElement.textContent = value) };
}

export interface MeterHandle {
  element: HTMLElement;
  setFraction(fraction: number): void;
}

export function trustMeter(label: string): MeterHandle {
  const element = html("div", "fig-meter");
  const labelElement = html("span", "fig-stat-label", label);
  const track = html("div", "fig-meter-track");
  const fill = html("div", "fig-meter-fill");
  const readout = html("span", "fig-meter-readout", "–");
  track.append(fill);
  element.append(labelElement, track, readout);
  return {
    element,
    setFraction(fraction: number): void {
      const percent = Math.round(clamp(fraction, 0, 1) * 100);
      fill.style.inlineSize = `${percent}%`;
      fill.classList.toggle("is-low", fraction < 0.4);
      fill.classList.toggle("is-mid", fraction >= 0.4 && fraction < 0.75);
      readout.textContent = `${percent}%`;
    }
  };
}

export function legendChip(swatchClass: string, label: string): HTMLElement {
  const element = html("span", "fig-legend-item");
  const swatch = html("span", `fig-legend-swatch ${swatchClass}`);
  element.append(swatch, document.createTextNode(` ${label}`));
  return element;
}
