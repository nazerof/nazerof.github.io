export type VisualKind = "diagram" | "motion" | "narrative" | "explorable";

export interface LearningObjective {
  id: string;
  text: string;
}

export interface VisualPackage {
  schemaVersion: "1.0";
  id: string;
  source: { type: "article"; path: string };
  audience: { level: "beginner" | "intermediate" | "advanced"; roles: string[] };
  learningObjectives: LearningObjective[];
  concepts: string[];
  theme: "portfolio-default";
  visuals: Array<{ id: string; kind: VisualKind; path: string }>;
}

export interface VisualCore {
  schemaVersion: "1.0";
  id: string;
  kind: VisualKind;
  title: string;
  description: string;
  learningObjectiveRefs: string[];
  conceptRefs: string[];
  locale: "en";
  direction: "ltr";
  theme: "portfolio-default";
  accessibility: { label: string; longDescription: string };
  viewport: { width: number; height: number };
  requiredCapabilities: string[];
}

export type DiagramNodeKind =
  | "scheduler" | "boundary" | "service" | "connector" | "process"
  | "storage" | "monitor" | "dashboard";

export interface DiagramNode {
  id: string;
  label: string;
  kind: DiagramNodeKind;
  group: string;
  x: number;
  y: number;
  width: number;
  height: number;
  accessibilityLabel: string;
}

export interface DiagramEdge {
  id: string;
  from: string;
  to: string;
  label: string;
  flow: "happy" | "failure" | "observability";
}

export interface DiagramDefinition extends VisualCore {
  kind: "diagram";
  groups: Array<{ id: string; label: string }>;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  notes: Array<{ id: string; text: string; nodeRefs: string[] }>;
  layout: { direction: "left-to-right"; spacing: number };
}

export type MotionStage =
  | "smooth" | "growth" | "collision" | "queue" | "failure"
  | "stagger" | "recovery" | "manageable" | "coordination"
  | "operations" | "decision" | "conclusion";

export interface DiagramReference {
  type: "diagram-reference";
  visualId: string;
  focusNodes: string[];
}

export interface TimelineScene {
  id: string;
  start: number;
  duration: number;
  title: string;
  displayText: string;
  narration: string;
  stage: MotionStage;
  learningObjectiveRefs: string[];
  conceptRefs: string[];
  easing: "linear" | "ease-in-out";
  enter: "fade" | "slide-up" | "none";
  metrics: { sources: number; capacity: number; queued: number; failures: number };
  visualReferences?: DiagramReference[];
}

export interface SvgMotionRendererOptions {
  clockLabel?: string;
  processLabel: string;
  capacityLabel: string;
  outputLabel: string;
  sourceLabel: string;
}

export interface MotionDefinition extends VisualCore {
  kind: "motion";
  durationSeconds: number;
  scenes: TimelineScene[];
  reducedMotionSteps: string[];
  rendererOptions?: { svgMotion: SvgMotionRendererOptions };
}

export interface NarrativeBeat {
  id: string;
  start: number;
  duration: number;
  goal: string;
  displayText: string;
  narration: string;
  stage: MotionStage;
  learningObjectiveRefs: string[];
  conceptRefs: string[];
  emphasis: "normal" | "strong";
  pauseAfter: number;
  metrics: TimelineScene["metrics"];
  visualReferences?: DiagramReference[];
}

export interface NarrativeDefinition extends VisualCore {
  kind: "narrative";
  audience: string;
  premise: string;
  durationSeconds: number;
  timingPolicy: "explicit";
  storyBeats: NarrativeBeat[];
  captions: Array<{ start: number; end: number; text: string }>;
  conclusion: string;
  transcript: string;
  rendererOptions?: { svgMotion: SvgMotionRendererOptions };
}

export type FigureHue = "blue" | "green" | "amber" | "red" | "purple" | "gray";
export type FigureWidthClass = "body" | "body-outset" | "page";

export interface FigureCaption {
  lead: string;
  text: string;
  instructions?: string;
}

export interface FigureReducedMotion {
  summary: string;
  steps: string[];
}

export interface FigureTimeline {
  unitLabel: string;
  labels: string[];
}

export interface ScrubRun {
  day: number;
  records: number;
  freshnessHours: number;
  sentinel: boolean;
  error?: boolean;
}

export interface ScrubSeries {
  key: "records" | "freshnessHours";
  label: string;
  hue: FigureHue;
  healthyMin?: number;
  healthyMax?: number;
}

export type ScrubAnnotation =
  | { type: "region"; from: number; to: number; label: string }
  | { type: "callout"; at: number; track: "process" | "outcome"; text: string };

export interface ScrubTimelineFigure {
  id: string;
  archetype: "scrub-timeline";
  title: string;
  caption: FigureCaption;
  widthClass: FigureWidthClass;
  timeline: FigureTimeline;
  runs: ScrubRun[];
  series: ScrubSeries[];
  lensToggle?: { labelWhenOff: string; labelWhenOn: string };
  annotations?: ScrubAnnotation[];
  reducedMotion: FigureReducedMotion;
}

export interface RunStreamModel {
  name: "run-stream";
  seed: number;
  runs: number;
  baseVolume: number;
  volumeJitter: number;
  cadenceHours: number;
  staleFailures: number;
  partialFailures: number;
  missingRuns: number;
}

export type PlaygroundParameterKey = "volumeBandPercent" | "freshnessToleranceHours" | "heartbeatWindowHours";

export interface PlaygroundParameter {
  key: PlaygroundParameterKey;
  symbol: string;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  initial: number;
}

export interface ParameterPlaygroundFigure {
  id: string;
  archetype: "parameter-playground";
  title: string;
  caption: FigureCaption;
  widthClass: FigureWidthClass;
  model: RunStreamModel;
  parameters: PlaygroundParameter[];
  reducedMotion: FigureReducedMotion;
}

export interface AbsenceEvent {
  day: number;
  kind: "ok" | "error" | "absent";
}

export interface AbsencePanel {
  id: string;
  title: string;
  rule: "presence-of-bad" | "absence-of-good";
  windowDays?: number;
  note?: string;
}

export interface AbsenceCompareFigure {
  id: string;
  archetype: "absence-compare";
  title: string;
  caption: FigureCaption;
  widthClass: FigureWidthClass;
  timeline: FigureTimeline;
  events: AbsenceEvent[];
  panels: AbsencePanel[];
  reducedMotion: FigureReducedMotion;
}

export type ExplorableFigure = ScrubTimelineFigure | ParameterPlaygroundFigure | AbsenceCompareFigure;

export interface ExplorableDefinition extends VisualCore {
  kind: "explorable";
  figures: ExplorableFigure[];
}

export type VisualDefinition = DiagramDefinition | MotionDefinition | NarrativeDefinition | ExplorableDefinition;

export interface NormalizedTimeline {
  id: string;
  title: string;
  durationSeconds: number;
  scenes: TimelineScene[];
  accessibility: VisualCore["accessibility"];
  reducedMotionSteps: string[];
  rendererOptions?: { svgMotion: SvgMotionRendererOptions };
}

export interface ValidationIssue {
  definitionId: string;
  path: string;
  reason: string;
}

export interface ValidationContext {
  visualPackage: VisualPackage;
  definitions: Map<string, VisualDefinition>;
}
