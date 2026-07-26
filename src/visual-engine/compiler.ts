import type { MotionDefinition, NarrativeDefinition, NormalizedTimeline, TimelineScene } from "./types";

export function normalizeMotion(definition: MotionDefinition): NormalizedTimeline {
  return {
    id: definition.id,
    title: definition.title,
    durationSeconds: definition.durationSeconds,
    scenes: definition.scenes.map((scene) => ({ ...scene })),
    accessibility: definition.accessibility,
    reducedMotionSteps: definition.reducedMotionSteps
  };
}

export function compileNarrative(definition: NarrativeDefinition): NormalizedTimeline {
  const scenes: TimelineScene[] = definition.storyBeats.map((beat) => ({
    id: beat.id,
    start: beat.start,
    duration: beat.duration,
    title: beat.goal,
    displayText: beat.displayText,
    narration: beat.narration,
    stage: beat.stage,
    learningObjectiveRefs: [...beat.learningObjectiveRefs],
    conceptRefs: [...beat.conceptRefs],
    easing: "ease-in-out",
    enter: beat.emphasis === "strong" ? "slide-up" : "fade",
    metrics: { ...beat.metrics },
    visualReferences: beat.visualReferences?.map((reference) => ({
      ...reference,
      focusNodes: [...reference.focusNodes]
    }))
  }));
  return {
    id: definition.id,
    title: definition.title,
    durationSeconds: definition.durationSeconds,
    scenes,
    accessibility: definition.accessibility,
    reducedMotionSteps: definition.storyBeats.map((beat) => `${beat.goal} ${beat.displayText}`)
  };
}
