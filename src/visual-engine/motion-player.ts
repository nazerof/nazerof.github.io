import type { MotionStage, NormalizedTimeline, TimelineScene } from "./types";

const SVG_NS = "http://www.w3.org/2000/svg";

export type PlayerVariant = "schedule" | "journey";

type Tone = "calm" | "strain" | "critical" | "improving" | "stable";
type FocusZone = "sources" | "gate" | "slots" | "queue" | "output";

const STAGE_TONE: Record<MotionStage, Tone> = {
  smooth: "calm",
  manageable: "calm",
  growth: "strain",
  queue: "strain",
  coordination: "strain",
  collision: "critical",
  failure: "critical",
  stagger: "improving",
  recovery: "improving",
  operations: "improving",
  decision: "improving",
  conclusion: "stable"
};

const STAGE_FOCUS: Record<MotionStage, FocusZone> = {
  smooth: "slots",
  manageable: "sources",
  growth: "sources",
  coordination: "gate",
  collision: "gate",
  queue: "queue",
  failure: "slots",
  stagger: "gate",
  recovery: "queue",
  operations: "output",
  decision: "sources",
  conclusion: "output"
};

/** Stages that show the schedule gate fanned out into staggered start times. */
const STAGGERED_STAGES = new Set<MotionStage>(["stagger", "recovery", "conclusion"]);

const FOCUS_ZONES: Record<FocusZone, { x: number; y: number; width: number; height: number }> = {
  sources: { x: 34, y: 66, width: 204, height: 250 },
  gate: { x: 246, y: 66, width: 104, height: 250 },
  slots: { x: 376, y: 66, width: 252, height: 250 },
  queue: { x: 376, y: 330, width: 252, height: 52 },
  output: { x: 676, y: 66, width: 250, height: 250 }
};

const SOURCES_PER_DOT = 5;
const MAX_DOTS = 48;
const DOT_COLUMNS = 8;
const MAX_SLOTS = 24;
const SLOT_COLUMNS = 5;
const PARTICLE_LIMIT = 22;

const MILESTONES = [
  { threshold: 10, label: "10" },
  { threshold: 50, label: "50" },
  { threshold: 100, label: "100" },
  { threshold: 200, label: "200+" }
];

interface Metrics {
  sources: number;
  capacity: number;
  queued: number;
  failures: number;
}

interface Particle {
  element: SVGCircleElement;
  path: SVGPathElement;
  pathLength: number;
  progress: number;
  duration: number;
}

function svgElement<K extends keyof SVGElementTagNameMap>(
  name: K,
  attributes: Record<string, string> = {}
): SVGElementTagNameMap[K] {
  const element = document.createElementNS(SVG_NS, name);
  for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value);
  return element;
}

function svgText(attributes: Record<string, string>, content: string): SVGTextElement {
  const element = svgElement("text", attributes);
  element.textContent = content;
  return element;
}

function button(label: string, className: string, action: () => void): HTMLButtonElement {
  const element = document.createElement("button");
  element.type = "button";
  element.className = className;
  element.textContent = label;
  element.setAttribute("aria-label", label);
  element.addEventListener("click", action);
  return element;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

/** Format "06:00" plus an offset in minutes; falls back to the raw label when it is not a time. */
function offsetClock(label: string, minutes: number): string {
  const match = /^(\d{1,2}):(\d{2})$/.exec(label);
  if (!match) return label;
  const total = Number(match[1]) * 60 + Number(match[2]) + minutes;
  const hours = Math.floor(total / 60) % 24;
  const mins = total % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

export class MotionPlayer {
  private currentTime = 0;
  private playing = false;
  private hasPlayed = false;
  private playbackRate = 1;
  private frame = 0;
  private lastFrame = 0;
  private sceneId = "";
  private captionText = "";
  private resumeAfterVisibility = false;
  private isIntersecting = true;
  private observer?: IntersectionObserver;
  private supportsPathMotion = false;

  private shown: Metrics = { sources: 0, capacity: 0, queued: 0, failures: 0 };
  private queueScale = 50;
  private slotCount = 20;
  private particles: Particle[] = [];
  private inflowAccumulator = 0;
  private outflowAccumulator = 0;
  private failureAccumulator = 0;

  private range!: HTMLInputElement;
  private progress!: HTMLElement;
  private playButton!: HTMLButtonElement;
  private poster!: HTMLButtonElement;
  private posterLabel!: HTMLElement;
  private caption!: HTMLElement;
  private captionKicker!: HTMLElement;
  private captionBody!: HTMLElement;
  private chapterButtons: HTMLButtonElement[] = [];

  private svg!: SVGSVGElement;
  private particleLayer!: SVGGElement;
  private focusRing!: SVGRectElement;
  private sourceDots: SVGCircleElement[] = [];
  private sourceCount!: SVGTextElement;
  private slotElements: SVGRectElement[] = [];
  private capacityLabel!: SVGTextElement;
  private gateChipSingle!: SVGGElement;
  private gateChipSingleText!: SVGTextElement;
  private gateChipsStaggered!: SVGGElement;
  private milestoneChips: SVGGElement[] = [];
  private queueFill!: SVGRectElement;
  private queueCount!: SVGTextElement;
  private outputCount!: SVGTextElement;
  private outputMeterFill!: SVGRectElement;
  private failureBadge!: SVGGElement;
  private failureCount!: SVGTextElement;
  private inPath!: SVGPathElement;
  private outPath!: SVGPathElement;
  private failPath!: SVGPathElement;

  constructor(
    private readonly container: HTMLElement,
    private readonly timeline: NormalizedTimeline,
    private readonly captions?: Array<{ start: number; end: number; text: string }>,
    private readonly variant: PlayerVariant = "schedule"
  ) {
    this.mount();
  }

  private labels(): { clockLabel?: string; processLabel: string; capacityLabel: string; outputLabel: string; sourceLabel: string } {
    return (
      this.timeline.rendererOptions?.svgMotion ?? {
        processLabel: "Process",
        capacityLabel: "capacity",
        outputLabel: "Output",
        sourceLabel: "items"
      }
    );
  }

  private mount(): void {
    this.container.replaceChildren();
    this.container.classList.add("visual-player");
    this.container.tabIndex = 0;
    this.container.setAttribute("role", "group");
    this.container.setAttribute("aria-label", `${this.timeline.title} player`);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      const heading = document.createElement("p");
      heading.className = "visual-reduced-heading";
      heading.textContent = "Reduced-motion sequence";
      const list = document.createElement("ol");
      for (const step of this.timeline.reducedMotionSteps) {
        const item = document.createElement("li");
        item.textContent = step;
        list.append(item);
      }
      this.container.append(heading, list);
      return;
    }

    const scenes = this.timeline.scenes;
    this.queueScale = Math.max(50, ...scenes.map((scene) => scene.metrics.queued));
    this.slotCount = clamp(Math.max(...scenes.map((scene) => scene.metrics.capacity)), 1, MAX_SLOTS);
    this.shown = { ...scenes[0].metrics, sources: 0, queued: 0, failures: 0 };

    const stage = document.createElement("div");
    stage.className = "visual-stage";
    this.buildSvg();
    this.poster = this.buildPoster();
    stage.append(this.svg, this.poster);

    const controls = this.buildControls();
    const chapters = this.buildChapters();
    this.caption = this.buildCaption();
    this.container.append(stage, controls, chapters, this.caption);
    this.render(0, true);

    this.container.addEventListener("keydown", (event) => {
      // Shortcuts apply only while the container itself is focused, so the
      // seek slider and speed select keep their native arrow-key behavior.
      if (event.target !== this.container) return;
      if (event.key === " ") {
        event.preventDefault();
        this.toggle();
      } else if (event.key === "ArrowRight") {
        this.seek(this.currentTime + 2);
      } else if (event.key === "ArrowLeft") {
        this.seek(this.currentTime - 2);
      }
    });
    document.addEventListener("visibilitychange", this.handleVisibility);
    this.observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[entries.length - 1];
        this.isIntersecting = entry.isIntersecting;
        if (!entry.isIntersecting && this.playing) {
          this.resumeAfterVisibility = true;
          this.pause();
        } else if (entry.isIntersecting && this.resumeAfterVisibility && !document.hidden) {
          this.resumeAfterVisibility = false;
          this.play();
        }
      },
      { threshold: 0.1 }
    );
    this.observer.observe(this.container);
  }

  // ---------------------------------------------------------------- SVG stage

  private buildSvg(): void {
    const labels = this.labels();
    this.svg = svgElement("svg", {
      viewBox: "0 0 960 440",
      class: "visual-svg",
      role: "img",
      "aria-label": this.timeline.accessibility.label
    });

    this.svg.append(svgElement("rect", { x: "0", y: "0", width: "960", height: "440", rx: "16", class: "vs-bg" }));

    // Static flow connectors between zones.
    const defs = svgElement("defs");
    const marker = svgElement("marker", {
      id: "vs-arrow",
      markerWidth: "7",
      markerHeight: "7",
      refX: "6",
      refY: "3.5",
      orient: "auto"
    });
    marker.append(svgElement("path", { d: "M0 0L7 3.5L0 7Z", class: "vs-arrow-head" }));
    defs.append(marker);
    this.svg.append(defs);

    this.inPath = svgElement("path", { d: "M 226 150 C 262 150 262 178 298 178 C 336 178 344 190 382 190", class: "vs-flow" });
    this.outPath = svgElement("path", { d: "M 622 200 C 656 200 660 186 694 186", class: "vs-flow" });
    this.failPath = svgElement("path", { d: "M 622 262 C 660 270 700 288 724 296", class: "vs-flow vs-flow-fail" });
    const queueUp = svgElement("path", { d: "M 500 344 L 500 318", class: "vs-flow" });
    for (const path of [this.inPath, this.outPath, this.failPath, queueUp]) {
      path.setAttribute("marker-end", "url(#vs-arrow)");
      this.svg.append(path);
    }
    this.supportsPathMotion =
      typeof (this.inPath as { getPointAtLength?: unknown }).getPointAtLength === "function" &&
      typeof (this.inPath as { getTotalLength?: unknown }).getTotalLength === "function";

    // Focus ring — glides between zones to guide attention.
    this.focusRing = svgElement("rect", { class: "vs-focus", rx: "14", ...this.focusAttributes("slots") });
    this.svg.append(this.focusRing);

    this.buildSourcesZone(labels.sourceLabel);
    this.buildGateZone(labels);
    this.buildSlotsZone(labels.capacityLabel);
    this.buildQueueZone();
    this.buildOutputZone(labels.outputLabel);

    const legend = svgText({ x: "40", y: "424", class: "vs-legend" }, "");
    const legendDot = svgElement("tspan", { class: "vs-legend-run" });
    legendDot.textContent = "●";
    legend.append(
      legendDot,
      document.createTextNode(` = ${SOURCES_PER_DOT} ${labels.sourceLabel}   `)
    );
    const legendQueue = svgElement("tspan", { class: "vs-legend-queue" });
    legendQueue.textContent = "▮";
    legend.append(legendQueue, document.createTextNode(" queued   "));
    const legendFail = svgElement("tspan", { class: "vs-legend-fail" });
    legendFail.textContent = "▲";
    legend.append(legendFail, document.createTextNode(" failures"));
    this.svg.append(legend);

    this.particleLayer = svgElement("g", { class: "vs-particles" });
    this.svg.append(this.particleLayer);
  }

  private focusAttributes(zone: FocusZone): Record<string, string> {
    const box = FOCUS_ZONES[zone];
    return { x: String(box.x), y: String(box.y), width: String(box.width), height: String(box.height) };
  }

  private buildSourcesZone(sourceLabel: string): void {
    const group = svgElement("g");
    group.append(svgText({ x: "136", y: "56", "text-anchor": "middle", class: "vs-zone-title" }, "Incoming"));
    for (let index = 0; index < MAX_DOTS; index++) {
      const column = index % DOT_COLUMNS;
      const row = Math.floor(index / DOT_COLUMNS);
      const dot = svgElement("circle", {
        cx: String(56 + column * 23),
        cy: String(92 + row * 23),
        r: "6.5",
        class: "vs-dot"
      });
      this.sourceDots.push(dot);
      group.append(dot);
    }
    this.sourceCount = svgText({ x: "136", y: "272", "text-anchor": "middle", class: "vs-big-number" }, "0");
    group.append(this.sourceCount);
    group.append(svgText({ x: "136", y: "296", "text-anchor": "middle", class: "vs-sublabel" }, sourceLabel));
    this.svg.append(group);
  }

  private buildGateZone(labels: { clockLabel?: string; processLabel: string }): void {
    const group = svgElement("g");
    const title = this.variant === "journey" ? labels.clockLabel ?? labels.processLabel : labels.processLabel;
    group.append(svgText({ x: "298", y: "56", "text-anchor": "middle", class: "vs-zone-title" }, title));
    group.append(svgElement("line", { x1: "298", y1: "84", x2: "298", y2: "300", class: "vs-gate-track" }));

    if (this.variant === "journey") {
      MILESTONES.forEach((milestone, index) => {
        const chip = svgElement("g", { class: "vs-milestone" });
        const y = 104 + index * 50;
        chip.append(svgElement("rect", { x: "266", y: String(y), width: "64", height: "30", rx: "15", class: "vs-chip" }));
        chip.append(svgText({ x: "298", y: String(y + 20), "text-anchor": "middle", class: "vs-chip-text" }, milestone.label));
        this.milestoneChips.push(chip);
        group.append(chip);
      });
    } else {
      const clock = labels.clockLabel ?? "";
      this.gateChipSingle = svgElement("g", { class: "vs-gate-single" });
      this.gateChipSingle.append(svgElement("rect", { x: "254", y: "162", width: "88", height: "32", rx: "16", class: "vs-chip" }));
      this.gateChipSingleText = svgText({ x: "298", y: "183", "text-anchor": "middle", class: "vs-chip-text" }, clock);
      this.gateChipSingle.append(this.gateChipSingleText);
      group.append(this.gateChipSingle);

      this.gateChipsStaggered = svgElement("g", { class: "vs-gate-staggered" });
      [0, 10, 20].forEach((minutes, index) => {
        const y = 112 + index * 52;
        this.gateChipsStaggered.append(
          svgElement("rect", { x: "254", y: String(y), width: "88", height: "32", rx: "16", class: "vs-chip" })
        );
        this.gateChipsStaggered.append(
          svgText({ x: "298", y: String(y + 21), "text-anchor": "middle", class: "vs-chip-text" }, offsetClock(clock, minutes))
        );
      });
      group.append(this.gateChipsStaggered);
    }
    this.svg.append(group);
  }

  private buildSlotsZone(capacityLabel: string): void {
    const group = svgElement("g");
    group.append(svgText({ x: "502", y: "56", "text-anchor": "middle", class: "vs-zone-title" }, "Running"));
    for (let index = 0; index < this.slotCount; index++) {
      const column = index % SLOT_COLUMNS;
      const row = Math.floor(index / SLOT_COLUMNS);
      const slot = svgElement("rect", {
        x: String(392 + column * 48),
        y: String(84 + row * 48),
        width: "38",
        height: "38",
        rx: "10",
        class: "vs-slot"
      });
      this.slotElements.push(slot);
      group.append(slot);
    }
    const rows = Math.ceil(this.slotCount / SLOT_COLUMNS);
    this.capacityLabel = svgText(
      { x: "502", y: String(84 + rows * 48 + 22), "text-anchor": "middle", class: "vs-sublabel" },
      capacityLabel
    );
    group.append(this.capacityLabel);
    this.svg.append(group);
  }

  private buildQueueZone(): void {
    const group = svgElement("g");
    group.append(svgText({ x: "392", y: "344", class: "vs-sublabel vs-queue-title" }, "waiting"));
    group.append(svgElement("rect", { x: "392", y: "352", width: "228", height: "18", rx: "9", class: "vs-queue-track" }));
    this.queueFill = svgElement("rect", { x: "392", y: "352", width: "0", height: "18", rx: "9", class: "vs-queue-fill" });
    group.append(this.queueFill);
    this.queueCount = svgText({ x: "620", y: "344", "text-anchor": "end", class: "vs-count" }, "0 queued");
    group.append(this.queueCount);
    this.svg.append(group);
  }

  private buildOutputZone(outputLabel: string): void {
    const group = svgElement("g");
    group.append(svgText({ x: "800", y: "56", "text-anchor": "middle", class: "vs-zone-title" }, outputLabel));
    const check = svgElement("g", { class: "vs-output-check" });
    check.append(svgElement("circle", { cx: "737", cy: "160", r: "13", class: "vs-check-circle" }));
    check.append(svgElement("path", { d: "M 731 160 L 735.5 164.5 L 743.5 155", class: "vs-check-mark" }));
    group.append(check);
    this.outputCount = svgText({ x: "812", y: "172", "text-anchor": "middle", class: "vs-big-number vs-output-number" }, "0");
    group.append(this.outputCount);
    group.append(svgText({ x: "800", y: "198", "text-anchor": "middle", class: "vs-sublabel" }, "arriving downstream"));

    group.append(svgElement("rect", { x: "700", y: "216", width: "200", height: "10", rx: "5", class: "vs-meter-track" }));
    this.outputMeterFill = svgElement("rect", { x: "700", y: "216", width: "0", height: "10", rx: "5", class: "vs-meter-fill" });
    group.append(this.outputMeterFill);

    this.failureBadge = svgElement("g", { class: "vs-failure-badge" });
    this.failureBadge.append(svgElement("rect", { x: "712", y: "278", width: "176", height: "36", rx: "18", class: "vs-failure-chip" }));
    this.failureBadge.append(svgElement("path", { d: "M 734 302 L 743 286 L 752 302 Z", class: "vs-failure-icon" }));
    this.failureBadge.append(svgElement("line", { x1: "743", y1: "292", x2: "743", y2: "297", class: "vs-failure-mark" }));
    this.failureCount = svgText({ x: "764", y: "302", class: "vs-failure-text" }, "");
    this.failureBadge.append(this.failureCount);
    group.append(this.failureBadge);
    this.svg.append(group);
  }

  // ------------------------------------------------------------------- chrome

  private buildPoster(): HTMLButtonElement {
    const poster = document.createElement("button");
    poster.type = "button";
    poster.className = "visual-poster";
    poster.setAttribute("aria-label", "Play animation");
    const icon = document.createElement("span");
    icon.className = "visual-poster-icon";
    icon.setAttribute("aria-hidden", "true");
    this.posterLabel = document.createElement("span");
    this.posterLabel.className = "visual-poster-label";
    this.posterLabel.textContent = `Play · ${Math.round(this.timeline.durationSeconds)}s`;
    poster.append(icon, this.posterLabel);
    poster.addEventListener("click", () => this.play());
    return poster;
  }

  private buildControls(): HTMLElement {
    const controls = document.createElement("div");
    controls.className = "visual-controls";
    this.playButton = button("Play", "visual-control visual-control-play", () => this.toggle());
    const replay = button("Replay", "visual-control", () => {
      this.seek(0);
      this.play();
    });

    const seekWrap = document.createElement("div");
    seekWrap.className = "visual-seek-wrap";
    this.range = document.createElement("input");
    this.range.type = "range";
    this.range.className = "visual-seek";
    this.range.min = "0";
    this.range.max = String(this.timeline.durationSeconds);
    this.range.step = "0.1";
    this.range.value = "0";
    this.range.setAttribute("aria-label", "Seek timeline");
    this.range.addEventListener("input", () => this.seek(Number(this.range.value)));
    const ticks = document.createElement("div");
    ticks.className = "visual-seek-ticks";
    ticks.setAttribute("aria-hidden", "true");
    for (const scene of this.timeline.scenes.slice(1)) {
      const tick = document.createElement("span");
      tick.style.insetInlineStart = `${(scene.start / this.timeline.durationSeconds) * 100}%`;
      ticks.append(tick);
    }
    seekWrap.append(this.range, ticks);

    const speed = document.createElement("select");
    speed.className = "visual-speed";
    speed.setAttribute("aria-label", "Playback speed");
    for (const value of [0.75, 1, 1.25, 1.5]) {
      const option = document.createElement("option");
      option.value = String(value);
      option.textContent = `${value}×`;
      option.selected = value === 1;
      speed.append(option);
    }
    speed.addEventListener("change", () => {
      this.playbackRate = Number(speed.value);
    });

    this.progress = document.createElement("span");
    this.progress.className = "visual-progress";
    this.progress.setAttribute("aria-live", "off");
    controls.append(this.playButton, replay, seekWrap, speed, this.progress);
    return controls;
  }

  private buildChapters(): HTMLElement {
    // A <div> with a navigation role: the site stylesheet pins every <nav>
    // element to the top of the viewport, which must not apply here.
    const nav = document.createElement("div");
    nav.className = "visual-chapters";
    nav.setAttribute("role", "navigation");
    nav.setAttribute("aria-label", "Chapters");
    const list = document.createElement("ol");
    this.timeline.scenes.forEach((scene, index) => {
      const item = document.createElement("li");
      const chapter = document.createElement("button");
      chapter.type = "button";
      chapter.className = "visual-chapter";
      chapter.title = scene.title;
      chapter.setAttribute("aria-label", `Chapter ${index + 1}: ${scene.title}`);
      const number = document.createElement("span");
      number.className = "visual-chapter-number";
      number.textContent = String(index + 1);
      const label = document.createElement("span");
      label.className = "visual-chapter-label";
      label.textContent = scene.title;
      chapter.append(number, label);
      chapter.addEventListener("click", () => {
        this.seek(scene.start + 0.001);
        if (!this.playing) this.play();
      });
      this.chapterButtons.push(chapter);
      item.append(chapter);
      list.append(item);
    });
    nav.append(list);
    return nav;
  }

  private buildCaption(): HTMLElement {
    const caption = document.createElement("div");
    caption.className = "visual-caption";
    caption.setAttribute("aria-live", "polite");
    this.captionKicker = document.createElement("p");
    this.captionKicker.className = "visual-caption-kicker";
    this.captionBody = document.createElement("p");
    this.captionBody.className = "visual-caption-body";
    caption.append(this.captionKicker, this.captionBody);
    return caption;
  }

  // ---------------------------------------------------------------- rendering

  private handleVisibility = (): void => {
    if (document.hidden && this.playing) {
      this.resumeAfterVisibility = true;
      this.pause();
    } else if (!document.hidden && this.resumeAfterVisibility && this.isIntersecting) {
      this.resumeAfterVisibility = false;
      this.play();
    }
  };

  private activeScene(): TimelineScene {
    return [...this.timeline.scenes].reverse().find((scene) => this.currentTime >= scene.start) ?? this.timeline.scenes[0];
  }

  private render(deltaSeconds: number, snap = false): void {
    const scene = this.activeScene();
    const target = scene.metrics;

    if (scene.id !== this.sceneId) {
      this.sceneId = scene.id;
      this.applySceneChange(scene);
    }

    // Critically-damped approach toward the scene's metrics — values glide, never jump.
    const blend = snap ? 1 : 1 - Math.exp(-4.5 * Math.max(deltaSeconds, 0));
    this.shown.sources += (target.sources - this.shown.sources) * blend;
    this.shown.capacity += (target.capacity - this.shown.capacity) * blend;
    this.shown.queued += (target.queued - this.shown.queued) * blend;
    this.shown.failures += (target.failures - this.shown.failures) * blend;

    this.renderMetrics(scene);
    this.renderCaption(scene);
    if (this.playing && this.supportsPathMotion) this.updateParticles(deltaSeconds, scene);

    if (Math.abs(Number(this.range.value) - this.currentTime) > 0.05) {
      this.range.value = String(this.currentTime);
    }
    this.progress.textContent = `${Math.floor(this.currentTime)} / ${this.timeline.durationSeconds}s`;
  }

  private applySceneChange(scene: TimelineScene): void {
    const index = this.timeline.scenes.indexOf(scene);
    this.container.dataset.tone = STAGE_TONE[scene.stage];

    const zone = STAGE_FOCUS[scene.stage];
    for (const [key, value] of Object.entries(this.focusAttributes(zone))) this.focusRing.setAttribute(key, value);

    if (this.variant === "schedule" && this.gateChipSingle) {
      const staggered = STAGGERED_STAGES.has(scene.stage);
      this.gateChipSingle.classList.toggle("is-hidden", staggered);
      this.gateChipsStaggered.classList.toggle("is-hidden", !staggered);
    }

    this.chapterButtons.forEach((chapter, chapterIndex) => {
      chapter.classList.toggle("is-active", chapterIndex === index);
      chapter.classList.toggle("is-done", chapterIndex < index);
      if (chapterIndex === index) chapter.setAttribute("aria-current", "step");
      else chapter.removeAttribute("aria-current");
    });

    this.captionKicker.textContent = `Chapter ${index + 1} of ${this.timeline.scenes.length} — ${scene.displayText}`;
    this.caption.classList.remove("is-entering");
    void this.caption.offsetWidth;
    this.caption.classList.add("is-entering");
  }

  /** Runs every render so caption tracks finer than scene boundaries still display. */
  private renderCaption(scene: TimelineScene): void {
    const caption =
      this.captions?.find(({ start, end }) => this.currentTime >= start && this.currentTime < end)?.text ?? scene.narration;
    if (caption !== this.captionText) {
      this.captionText = caption;
      this.captionBody.textContent = caption;
    }
  }

  private renderMetrics(scene: TimelineScene): void {
    const sources = Math.round(this.shown.sources);
    const queued = Math.round(this.shown.queued);
    const failures = Math.round(this.shown.failures);
    const capacity = Math.round(this.shown.capacity);
    const completed = Math.max(0, sources - queued - failures);
    const labels = this.labels();

    // Sources cluster.
    const dots = clamp(Math.ceil(sources / SOURCES_PER_DOT), sources > 0 ? 1 : 0, MAX_DOTS);
    this.sourceDots.forEach((dot, index) => dot.classList.toggle("is-on", index < dots));
    this.sourceCount.textContent = String(sources);

    // Execution slots: running fills from the front, failures surface from the back.
    const failedSlots = failures > 0 ? clamp(Math.round(failures / 10), 1, this.slotCount) : 0;
    const runningSlots = clamp(sources - queued, 0, Math.min(capacity, this.slotCount) - failedSlots);
    this.slotElements.forEach((slot, index) => {
      const failed = index >= this.slotCount - failedSlots;
      slot.classList.toggle("is-fail", failed);
      slot.classList.toggle("is-run", !failed && index < runningSlots);
    });
    this.capacityLabel.textContent = `${capacity} ${labels.capacityLabel}`;

    // Queue bar (scaled to the timeline's own maximum so growth stays comparable).
    this.queueFill.setAttribute("width", String((clamp(queued, 0, this.queueScale) / this.queueScale) * 228));
    this.queueCount.textContent = `${queued} queued`;
    this.queueCount.classList.toggle("is-hot", queued > this.queueScale * 0.6);

    // Output + failures.
    this.outputCount.textContent = String(completed);
    this.outputMeterFill.setAttribute("width", String(sources > 0 ? (completed / Math.max(sources, 1)) * 200 : 0));
    this.failureBadge.classList.toggle("is-visible", failures > 0);
    this.failureCount.textContent = `${failures} failed`;

    // Milestone rail (journey variant).
    if (this.variant === "journey") {
      const active = MILESTONES.reduce((current, milestone, index) => (scene.metrics.sources >= milestone.threshold ? index : current), 0);
      this.milestoneChips.forEach((chip, index) => {
        chip.classList.toggle("is-active", index === active);
        chip.classList.toggle("is-done", index < active);
      });
    }
  }

  // ---------------------------------------------------------------- particles

  private updateParticles(deltaSeconds: number, scene: TimelineScene): void {
    const { sources, capacity, queued, failures } = scene.metrics;
    const completed = Math.max(0, sources - queued - failures);
    const inflowRate = clamp(Math.min(sources, capacity) / 7, 0.6, 3.5);
    const outflowRate = completed > 0 ? clamp(completed / 60, 0.5, 3) : 0;
    const failureRate = failures > 0 ? clamp(failures / 30, 0.4, 2.5) : 0;

    this.inflowAccumulator += deltaSeconds * inflowRate;
    this.outflowAccumulator += deltaSeconds * outflowRate;
    this.failureAccumulator += deltaSeconds * failureRate;
    while (this.inflowAccumulator >= 1) {
      this.inflowAccumulator -= 1;
      this.spawnParticle(this.inPath, "vs-particle vs-particle-run", 1.15);
    }
    while (this.outflowAccumulator >= 1) {
      this.outflowAccumulator -= 1;
      this.spawnParticle(this.outPath, "vs-particle vs-particle-ok", 0.9);
    }
    while (this.failureAccumulator >= 1) {
      this.failureAccumulator -= 1;
      this.spawnParticle(this.failPath, "vs-particle vs-particle-fail", 1);
    }

    for (const particle of [...this.particles]) {
      particle.progress += deltaSeconds / particle.duration;
      if (particle.progress >= 1) {
        particle.element.remove();
        this.particles.splice(this.particles.indexOf(particle), 1);
        continue;
      }
      const eased = particle.progress < 0.5 ? 2 * particle.progress * particle.progress : 1 - (-2 * particle.progress + 2) ** 2 / 2;
      const point = particle.path.getPointAtLength(eased * particle.pathLength);
      particle.element.setAttribute("cx", String(point.x));
      particle.element.setAttribute("cy", String(point.y));
    }
  }

  private spawnParticle(path: SVGPathElement, className: string, duration: number): void {
    if (this.particles.length >= PARTICLE_LIMIT) return;
    let pathLength = 0;
    try {
      pathLength = path.getTotalLength();
    } catch {
      return;
    }
    const start = path.getPointAtLength(0);
    const element = svgElement("circle", { r: "5", class: className, cx: String(start.x), cy: String(start.y) });
    this.particleLayer.append(element);
    this.particles.push({ element, path, pathLength, progress: 0, duration });
  }

  private clearParticles(): void {
    for (const particle of this.particles) particle.element.remove();
    this.particles = [];
    this.inflowAccumulator = 0;
    this.outflowAccumulator = 0;
    this.failureAccumulator = 0;
  }

  // ----------------------------------------------------------------- playback

  private tick = (time: number): void => {
    if (!this.playing) return;
    if (!this.lastFrame) this.lastFrame = time;
    const deltaSeconds = ((time - this.lastFrame) / 1000) * this.playbackRate;
    this.currentTime += deltaSeconds;
    this.lastFrame = time;
    if (this.currentTime >= this.timeline.durationSeconds) {
      this.currentTime = this.timeline.durationSeconds;
      this.render(deltaSeconds);
      this.pause();
      this.showPoster("Replay");
      return;
    }
    this.render(deltaSeconds);
    if (this.playing) this.frame = requestAnimationFrame(this.tick);
  };

  private showPoster(label: string): void {
    this.posterLabel.textContent = label;
    this.poster.setAttribute("aria-label", `${label} animation`);
    this.poster.classList.remove("is-hidden");
  }

  play(): void {
    if (!this.playButton) return;
    cancelAnimationFrame(this.frame);
    if (this.currentTime >= this.timeline.durationSeconds) {
      this.currentTime = 0;
      this.sceneId = "";
    }
    this.playing = true;
    this.hasPlayed = true;
    this.lastFrame = 0;
    this.poster.classList.add("is-hidden");
    this.container.classList.add("is-playing");
    this.playButton.textContent = "Pause";
    this.playButton.setAttribute("aria-label", "Pause");
    this.frame = requestAnimationFrame(this.tick);
  }

  pause(): void {
    this.playing = false;
    cancelAnimationFrame(this.frame);
    this.container.classList.remove("is-playing");
    if (!this.playButton) return;
    this.playButton.textContent = "Play";
    this.playButton.setAttribute("aria-label", "Play");
  }

  toggle(): void {
    if (this.playing) this.pause();
    else this.play();
  }

  seek(time: number): void {
    this.currentTime = clamp(time, 0, this.timeline.durationSeconds);
    this.clearParticles();
    if (this.hasPlayed || this.currentTime > 0) this.poster.classList.add("is-hidden");
    this.render(0, true);
  }

  destroy(): void {
    this.pause();
    this.clearParticles();
    this.observer?.disconnect();
    document.removeEventListener("visibilitychange", this.handleVisibility);
  }
}
