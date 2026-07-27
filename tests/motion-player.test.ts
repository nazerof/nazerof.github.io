import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MotionDefinition, NarrativeDefinition } from "../src/visual-engine/types";
import { compileNarrative, normalizeMotion } from "../src/visual-engine/compiler";
import { MotionPlayer } from "../src/visual-engine/motion-player";
import { loadContext } from "./fixtures";

class MockIntersectionObserver {
  static instances: MockIntersectionObserver[] = [];
  callback: IntersectionObserverCallback;
  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    MockIntersectionObserver.instances.push(this);
  }
  observe(): void {}
  disconnect(): void {}
  unobserve(): void {}
  takeRecords(): IntersectionObserverEntry[] { return []; }
  root = null;
  rootMargin = "0px";
  thresholds = [0.1];
}

describe("motion player", () => {
  const context = loadContext();
  const motion = context.definitions.get("scheduling-collision") as MotionDefinition;
  const narrative = context.definitions.get("automation-becomes-operations") as NarrativeDefinition;

  beforeEach(() => {
    MockIntersectionObserver.instances = [];
    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
    vi.stubGlobal("requestAnimationFrame", vi.fn(() => 1));
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    Object.defineProperty(SVGElement.prototype, "animate", { configurable: true, value: vi.fn() });
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
    });
  });

  it("supports play, pause, replay, seek, speed, progress, and keyboard controls", () => {
    const container = document.createElement("div");
    document.body.append(container);
    const player = new MotionPlayer(container, normalizeMotion(motion));
    const play = container.querySelector<HTMLButtonElement>('[aria-label="Play"]')!;
    play.click();
    expect(play.getAttribute("aria-label")).toBe("Pause");
    play.click();
    expect(play.getAttribute("aria-label")).toBe("Play");
    const seek = container.querySelector<HTMLInputElement>(".visual-seek")!;
    seek.value = "12";
    seek.dispatchEvent(new Event("input"));
    expect(container.querySelector(".visual-progress")?.textContent).toContain("12 / 24s");
    const speed = container.querySelector<HTMLSelectElement>(".visual-speed")!;
    speed.value = "1.5";
    speed.dispatchEvent(new Event("change"));
    container.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
    expect(container.querySelector(".visual-progress")?.textContent).toContain("14 / 24s");
    player.destroy();
  });

  it("provides a step-based reduced-motion equivalent", () => {
    vi.mocked(window.matchMedia).mockReturnValue({ matches: true } as MediaQueryList);
    const container = document.createElement("div");
    new MotionPlayer(container, normalizeMotion(motion));
    expect(container.querySelectorAll("li")).toHaveLength(motion.reducedMotionSteps.length);
    expect(container.querySelector("svg")).toBeNull();
  });

  it("pauses when offscreen", () => {
    const container = document.createElement("div");
    new MotionPlayer(container, normalizeMotion(motion));
    container.querySelector<HTMLButtonElement>('[aria-label="Play"]')!.click();
    MockIntersectionObserver.instances[0].callback([{ isIntersecting: false } as IntersectionObserverEntry], {} as IntersectionObserver);
    expect(container.querySelector('[aria-label="Play"]')).not.toBeNull();
  });

  it("pauses when the tab is hidden", () => {
    const container = document.createElement("div");
    new MotionPlayer(container, normalizeMotion(motion));
    container.querySelector<HTMLButtonElement>('[aria-label="Play"]')!.click();
    Object.defineProperty(document, "hidden", { configurable: true, value: true });
    document.dispatchEvent(new Event("visibilitychange"));
    expect(container.querySelector('[aria-label="Play"]')).not.toBeNull();
    Object.defineProperty(document, "hidden", { configurable: true, value: false });
  });

  it("renders one clickable chapter per scene and jumps to it", () => {
    const container = document.createElement("div");
    new MotionPlayer(container, normalizeMotion(motion));
    const chapters = container.querySelectorAll<HTMLButtonElement>(".visual-chapter");
    expect(chapters).toHaveLength(motion.scenes.length);
    chapters[2].click();
    expect(container.querySelector(".visual-progress")?.textContent).toContain(`${Math.floor(motion.scenes[2].start)} / 24s`);
    expect(chapters[2].getAttribute("aria-current")).toBe("step");
  });

  it("shows the poster before playback and hides it on play", () => {
    const container = document.createElement("div");
    const player = new MotionPlayer(container, normalizeMotion(motion));
    const poster = container.querySelector<HTMLButtonElement>(".visual-poster")!;
    expect(poster.classList.contains("is-hidden")).toBe(false);
    poster.click();
    expect(poster.classList.contains("is-hidden")).toBe(true);
    expect(container.querySelector('[aria-label="Pause"]')).not.toBeNull();
    player.destroy();
  });

  it("captions the active scene and updates on seek", () => {
    const container = document.createElement("div");
    new MotionPlayer(container, normalizeMotion(motion));
    expect(container.querySelector(".visual-caption-body")?.textContent).toBe(motion.scenes[0].narration);
    const seek = container.querySelector<HTMLInputElement>(".visual-seek")!;
    seek.value = "13";
    seek.dispatchEvent(new Event("input"));
    const active = [...motion.scenes].reverse().find((scene) => 13 >= scene.start)!;
    expect(container.querySelector(".visual-caption-body")?.textContent).toBe(active.narration);
    expect(container.querySelector(".visual-caption-kicker")?.textContent).toContain(active.displayText);
  });

  it("renders the journey variant with a milestone rail and narrative captions", () => {
    const container = document.createElement("div");
    new MotionPlayer(container, compileNarrative(narrative), narrative.captions, "journey");
    expect(container.querySelectorAll(".vs-milestone")).toHaveLength(4);
    const seek = container.querySelector<HTMLInputElement>(".visual-seek")!;
    seek.value = "30";
    seek.dispatchEvent(new Event("input"));
    const caption = narrative.captions.find(({ start, end }) => 30 >= start && 30 < end)!;
    expect(container.querySelector(".visual-caption-body")?.textContent).toBe(caption.text);
    expect(container.querySelectorAll(".vs-milestone.is-active")).toHaveLength(1);
  });
});
