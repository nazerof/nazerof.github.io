import type { NormalizedTimeline, TimelineScene } from "./types";

const SVG_NS = "http://www.w3.org/2000/svg";

function svgElement<K extends keyof SVGElementTagNameMap>(
  name: K,
  attributes: Record<string, string> = {}
): SVGElementTagNameMap[K] {
  const element = document.createElementNS(SVG_NS, name);
  for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value);
  return element;
}

function button(label: string, action: () => void): HTMLButtonElement {
  const element = document.createElement("button");
  element.type = "button";
  element.className = "visual-control";
  element.textContent = label;
  element.setAttribute("aria-label", label);
  element.addEventListener("click", action);
  return element;
}

export class MotionPlayer {
  private currentTime = 0;
  private playing = false;
  private playbackRate = 1;
  private frame = 0;
  private lastFrame = 0;
  private sceneId = "";
  private resumeAfterVisibility = false;
  private observer?: IntersectionObserver;
  private range!: HTMLInputElement;
  private progress!: HTMLElement;
  private playButton!: HTMLButtonElement;
  private title!: SVGTextElement;
  private message!: SVGTextElement;
  private sources!: SVGTextElement;
  private queue!: SVGRectElement;
  private queueLabel!: SVGTextElement;
  private failures!: SVGTextElement;
  private sourceDots!: SVGGElement;
  private caption!: HTMLElement;

  constructor(
    private readonly container: HTMLElement,
    private readonly timeline: NormalizedTimeline,
    private readonly captions?: Array<{ start: number; end: number; text: string }>
  ) {
    this.mount();
  }

  private mount(): void {
    this.container.replaceChildren();
    this.container.classList.add("visual-player");
    this.container.tabIndex = 0;
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

    const svg = svgElement("svg", {
      viewBox: "0 0 960 540",
      role: "img",
      "aria-label": this.timeline.accessibility.label
    });
    const background = svgElement("rect", { x: "0", y: "0", width: "960", height: "540", rx: "18", class: "motion-bg" });
    this.title = svgElement("text", { x: "480", y: "58", "text-anchor": "middle", class: "motion-title" });
    this.message = svgElement("text", { x: "480", y: "98", "text-anchor": "middle", class: "motion-message" });
    const clock = svgElement("text", { x: "80", y: "168", class: "motion-label" });
    clock.textContent = "06:00";
    const scheduler = svgElement("rect", { x: "55", y: "190", width: "170", height: "90", rx: "14", class: "motion-box" });
    const schedulerLabel = svgElement("text", { x: "140", y: "243", "text-anchor": "middle", class: "motion-box-label" });
    schedulerLabel.textContent = "Scheduler";
    const arrowOne = svgElement("path", { d: "M 225 235 H 345", class: "motion-arrow" });
    const capacity = svgElement("rect", { x: "345", y: "170", width: "230", height: "130", rx: "14", class: "motion-capacity" });
    const capacityLabel = svgElement("text", { x: "460", y: "200", "text-anchor": "middle", class: "motion-label" });
    capacityLabel.textContent = "20 execution slots";
    this.sourceDots = svgElement("g", { class: "motion-dots" });
    const arrowTwo = svgElement("path", { d: "M 575 235 H 690", class: "motion-arrow" });
    const output = svgElement("rect", { x: "690", y: "190", width: "210", height: "90", rx: "14", class: "motion-output" });
    const outputLabel = svgElement("text", { x: "795", y: "243", "text-anchor": "middle", class: "motion-box-label" });
    outputLabel.textContent = "Validated output";
    this.sources = svgElement("text", { x: "80", y: "360", class: "motion-metric" });
    const queueTrack = svgElement("rect", { x: "280", y: "340", width: "400", height: "36", rx: "8", class: "motion-queue-track" });
    this.queue = svgElement("rect", { x: "280", y: "340", width: "0", height: "36", rx: "8", class: "motion-queue" });
    this.queueLabel = svgElement("text", { x: "480", y: "365", "text-anchor": "middle", class: "motion-queue-label" });
    this.failures = svgElement("text", { x: "80", y: "425", class: "motion-failure" });
    const legend = svgElement("text", { x: "80", y: "485", class: "motion-legend" });
    legend.textContent = "● active flow   ▰ queued work   ⚠ failed flow";
    svg.append(background, this.title, this.message, clock, scheduler, schedulerLabel, arrowOne, capacity, capacityLabel, this.sourceDots, arrowTwo, output, outputLabel, this.sources, queueTrack, this.queue, this.queueLabel, this.failures, legend);

    const controls = document.createElement("div");
    controls.className = "visual-controls";
    this.playButton = button("Play", () => this.toggle());
    const replay = button("Replay", () => {
      this.seek(0);
      this.play();
    });
    this.range = document.createElement("input");
    this.range.type = "range";
    this.range.className = "visual-seek";
    this.range.min = "0";
    this.range.max = String(this.timeline.durationSeconds);
    this.range.step = "0.1";
    this.range.value = "0";
    this.range.setAttribute("aria-label", "Seek timeline");
    this.range.addEventListener("input", () => this.seek(Number(this.range.value)));
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
    speed.addEventListener("change", () => { this.playbackRate = Number(speed.value); });
    this.progress = document.createElement("span");
    this.progress.className = "visual-progress";
    this.progress.setAttribute("aria-live", "off");
    controls.append(this.playButton, replay, this.range, speed, this.progress);
    this.caption = document.createElement("div");
    this.caption.className = "visual-caption";
    this.caption.setAttribute("aria-live", "polite");
    this.container.append(svg, controls, this.caption);
    this.render();

    this.container.addEventListener("keydown", (event) => {
      if (event.key === " " && event.target === this.container) {
        event.preventDefault();
        this.toggle();
      } else if (event.key === "ArrowRight") {
        this.seek(this.currentTime + 2);
      } else if (event.key === "ArrowLeft") {
        this.seek(this.currentTime - 2);
      }
    });
    document.addEventListener("visibilitychange", this.handleVisibility);
    this.observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting && this.playing) {
        this.resumeAfterVisibility = true;
        this.pause();
      } else if (entry.isIntersecting && this.resumeAfterVisibility && !document.hidden) {
        this.resumeAfterVisibility = false;
        this.play();
      }
    }, { threshold: 0.1 });
    this.observer.observe(this.container);
  }

  private handleVisibility = (): void => {
    if (document.hidden && this.playing) {
      this.resumeAfterVisibility = true;
      this.pause();
    } else if (!document.hidden && this.resumeAfterVisibility) {
      this.resumeAfterVisibility = false;
      this.play();
    }
  };

  private activeScene(): TimelineScene {
    return [...this.timeline.scenes].reverse().find((scene) => this.currentTime >= scene.start) ?? this.timeline.scenes[0];
  }

  private render(): void {
    const scene = this.activeScene();
    if (scene.id !== this.sceneId) {
      this.sceneId = scene.id;
      this.container.querySelector("svg")?.animate(
        scene.enter === "slide-up"
          ? [{ opacity: 0.45, transform: "translateY(8px)" }, { opacity: 1, transform: "translateY(0)" }]
          : [{ opacity: 0.55 }, { opacity: 1 }],
        { duration: 320, easing: scene.easing }
      );
    }
    this.title.textContent = scene.title;
    this.message.textContent = scene.displayText;
    this.sources.textContent = `${scene.metrics.sources} sources`;
    const width = Math.min(400, (scene.metrics.queued / Math.max(scene.metrics.sources, 1)) * 400);
    this.queue.setAttribute("width", String(width));
    this.queueLabel.textContent = `${scene.metrics.queued} queued`;
    this.failures.textContent = scene.metrics.failures ? `⚠ ${scene.metrics.failures} failures need attention` : "✓ no failed flows";
    this.sourceDots.replaceChildren();
    const count = Math.min(20, Math.max(1, Math.ceil(scene.metrics.sources / 10)));
    for (let index = 0; index < count; index++) {
      const dot = svgElement("circle", {
        cx: String(375 + (index % 5) * 42),
        cy: String(225 + Math.floor(index / 5) * 20),
        r: "6",
        class: index >= scene.metrics.capacity / 2 ? "motion-dot motion-dot-waiting" : "motion-dot"
      });
      this.sourceDots.append(dot);
    }
    const caption = this.captions?.find(({ start, end }) => this.currentTime >= start && this.currentTime < end)?.text ?? scene.narration;
    this.caption.textContent = caption;
    this.range.value = String(this.currentTime);
    this.progress.textContent = `${Math.floor(this.currentTime)} / ${this.timeline.durationSeconds}s`;
  }

  private tick = (time: number): void => {
    if (!this.playing) return;
    if (!this.lastFrame) this.lastFrame = time;
    this.currentTime += ((time - this.lastFrame) / 1000) * this.playbackRate;
    this.lastFrame = time;
    if (this.currentTime >= this.timeline.durationSeconds) {
      this.currentTime = this.timeline.durationSeconds;
      this.pause();
    }
    this.render();
    if (this.playing) this.frame = requestAnimationFrame(this.tick);
  };

  play(): void {
    if (this.currentTime >= this.timeline.durationSeconds) this.currentTime = 0;
    this.playing = true;
    this.lastFrame = 0;
    this.playButton.textContent = "Pause";
    this.playButton.setAttribute("aria-label", "Pause");
    this.frame = requestAnimationFrame(this.tick);
  }

  pause(): void {
    this.playing = false;
    cancelAnimationFrame(this.frame);
    this.playButton.textContent = "Play";
    this.playButton.setAttribute("aria-label", "Play");
  }

  toggle(): void {
    if (this.playing) this.pause(); else this.play();
  }

  seek(time: number): void {
    this.currentTime = Math.max(0, Math.min(this.timeline.durationSeconds, time));
    this.render();
  }

  destroy(): void {
    this.pause();
    this.observer?.disconnect();
    document.removeEventListener("visibilitychange", this.handleVisibility);
  }
}
