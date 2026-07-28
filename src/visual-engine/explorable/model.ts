import type { RunStreamModel } from "../types";

export interface SimulatedRun {
  index: number;
  present: boolean;
  records: number;
  freshnessHours: number;
  failure: "none" | "stale" | "partial" | "missing";
}

export type Verdict = "healthy" | "caught" | "missed" | "false-alarm";

export interface RunClassification {
  verdict: Verdict;
  reason: string;
}

export interface ClassificationTotals {
  failures: number;
  caught: number;
  missed: number;
  falseAlarms: number;
  trust: number;
}

export interface AlertParameters {
  volumeBandPercent: number;
  freshnessToleranceHours: number;
  heartbeatWindowHours: number;
}

/** Deterministic LCG so a given seed always renders the identical figure. */
function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

/**
 * The whitelisted "run-stream" model: a stream of automation runs with a
 * baseline volume, natural jitter, and three kinds of injected silent failure
 * (stale upstream, partial result, missing run). Computed in the engine —
 * content JSON only supplies parameters and a seed.
 */
export function simulateRunStream(model: RunStreamModel): SimulatedRun[] {
  const random = createRandom(model.seed);
  const candidates = Array.from({ length: model.runs - 2 }, (_, index) => index + 2);
  for (let index = candidates.length - 1; index > 0; index--) {
    const swap = Math.floor(random() * (index + 1));
    [candidates[index], candidates[swap]] = [candidates[swap], candidates[index]];
  }
  const failureAt = new Map<number, SimulatedRun["failure"]>();
  let cursor = 0;
  for (const failure of ["stale", "partial", "missing"] as const) {
    const count = failure === "stale" ? model.staleFailures : failure === "partial" ? model.partialFailures : model.missingRuns;
    for (let index = 0; index < count; index++) failureAt.set(candidates[cursor++], failure);
  }

  return Array.from({ length: model.runs }, (_, index) => {
    const failure = failureAt.get(index) ?? "none";
    // Bell-ish spread in [-1, 1] so most healthy runs sit near baseline while
    // a few tails stray far enough to trip an overly tight volume band.
    const spread = ((random() + random() + random()) * 2) / 3 - 1;
    if (failure === "missing") return { index, present: false, records: 0, freshnessHours: 0, failure };
    if (failure === "partial") {
      // 40–90% of baseline: severe enough to be wrong, mild enough that a
      // loose volume band lets some through — that overlap is the lesson.
      return { index, present: true, records: Math.round(model.baseVolume * (0.4 + 0.5 * random())), freshnessHours: model.cadenceHours * (0.4 + 0.5 * random()), failure };
    }
    if (failure === "stale") {
      return { index, present: true, records: Math.round(model.baseVolume * (1 + model.volumeJitter * spread)), freshnessHours: model.cadenceHours * (3 + 5 * random()), failure };
    }
    return { index, present: true, records: Math.round(model.baseVolume * (1 + model.volumeJitter * spread * 1.6)), freshnessHours: model.cadenceHours * (0.4 + 0.5 * random()), failure };
  });
}

export function classifyRuns(
  runs: SimulatedRun[],
  model: RunStreamModel,
  parameters: AlertParameters
): { perRun: RunClassification[]; totals: ClassificationTotals } {
  const band = (model.baseVolume * parameters.volumeBandPercent) / 100;
  const perRun = runs.map((run): RunClassification => {
    const isFailure = run.failure !== "none";
    let flagged = false;
    let flagReason = "";
    if (!run.present) {
      const gapHours = model.cadenceHours * 2;
      flagged = parameters.heartbeatWindowHours < gapHours;
      flagReason = flagged
        ? `no heartbeat within ${parameters.heartbeatWindowHours}h`
        : `the ${gapHours}h gap fits inside the ${parameters.heartbeatWindowHours}h window`;
    } else if (Math.abs(run.records - model.baseVolume) > band) {
      flagged = true;
      flagReason = `${run.records} records is outside the ±${parameters.volumeBandPercent}% band`;
    } else if (run.freshnessHours > parameters.freshnessToleranceHours) {
      flagged = true;
      flagReason = `data is ${Math.round(run.freshnessHours)}h old, over the ${parameters.freshnessToleranceHours}h tolerance`;
    } else {
      flagReason = "all checks passed";
    }
    if (flagged && isFailure) return { verdict: "caught", reason: flagReason };
    if (flagged) return { verdict: "false-alarm", reason: flagReason };
    if (isFailure) {
      const why =
        run.failure === "stale"
          ? `stale data (${Math.round(run.freshnessHours)}h old) slipped under the ${parameters.freshnessToleranceHours}h tolerance`
          : run.failure === "partial"
            ? `partial result (${run.records} records) stayed inside the ±${parameters.volumeBandPercent}% band`
            : flagReason;
      return { verdict: "missed", reason: why };
    }
    return { verdict: "healthy", reason: flagReason };
  });

  const totals = perRun.reduce(
    (accumulator, classification, index) => {
      if (runs[index].failure !== "none") accumulator.failures += 1;
      if (classification.verdict === "caught") accumulator.caught += 1;
      if (classification.verdict === "missed") accumulator.missed += 1;
      if (classification.verdict === "false-alarm") accumulator.falseAlarms += 1;
      return accumulator;
    },
    { failures: 0, caught: 0, missed: 0, falseAlarms: 0, trust: 1 }
  );
  totals.trust = Math.max(0, 1 - totals.falseAlarms * 0.15);
  return { perRun, totals };
}
