import type { ExplorableDefinition, ExplorableFigure } from "../types";
import { html } from "./primitives";
import { ScrubTimelineRenderer } from "./scrub-timeline";
import { ParameterPlaygroundRenderer } from "./parameter-playground";
import { AbsenceCompareRenderer } from "./absence-compare";

export interface FigureInstance {
  destroy(): void;
}

function buildCaption(figure: ExplorableFigure): HTMLElement {
  const caption = html("figcaption", "fig-caption");
  const lead = html("strong", "fig-caption-lead", figure.caption.lead);
  caption.append(lead, document.createTextNode(` ${figure.caption.text}`));
  if (figure.caption.instructions) {
    caption.append(document.createTextNode(" "), html("em", "fig-caption-instructions", figure.caption.instructions));
  }
  return caption;
}

function buildReducedFallback(figure: ExplorableFigure): HTMLElement {
  const wrapper = html("div", "fig-reduced");
  wrapper.append(html("p", "visual-reduced-heading", figure.reducedMotion.summary));
  const list = document.createElement("ol");
  for (const step of figure.reducedMotion.steps) {
    const item = document.createElement("li");
    item.textContent = step;
    list.append(item);
  }
  wrapper.append(list);
  return wrapper;
}

/**
 * Mounts one figure from an explorable definition into a host's runtime slot.
 * The host chooses the figure with data-visual-figure; without it the first
 * figure is used.
 */
export function mountExplorableFigure(runtime: HTMLElement, definition: ExplorableDefinition, figureId?: string): FigureInstance {
  const figure = figureId ? definition.figures.find((candidate) => candidate.id === figureId) : definition.figures[0];
  if (!figure) throw new Error(`${definition.id} /: figure "${figureId ?? "(first)"}" not found`);

  runtime.replaceChildren();
  const root = document.createElement("figure");
  root.className = `visual-figure visual-figure-${figure.widthClass}`;
  root.dataset.archetype = figure.archetype;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    root.append(buildReducedFallback(figure), buildCaption(figure));
    runtime.append(root);
    return { destroy: () => undefined };
  }

  const body = html("div", "fig-body");
  root.append(body);
  let instance: FigureInstance;
  if (figure.archetype === "scrub-timeline") {
    instance = new ScrubTimelineRenderer(body, figure);
  } else if (figure.archetype === "parameter-playground") {
    instance = new ParameterPlaygroundRenderer(body, figure);
  } else {
    instance = new AbsenceCompareRenderer(body, figure);
  }
  root.append(buildCaption(figure));
  runtime.append(root);
  return instance;
}
