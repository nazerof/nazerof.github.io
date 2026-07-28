# Explorable DSL generation prompt

Generate one JSON document that validates against `schemas/visuals/explorable.schema.json`. Return JSON only — no code, HTML, CSS, URLs, callbacks, or fields absent from the schema. Keys matching `on[a-z]+` are rejected by the security filter.

## What an explorable is

One definition holds 1–4 interactive figures; each article host mounts one figure by ID at the point in the prose where its argument lives. Figures are Distill-class components rendered entirely by the engine from your data — you author the data and the words, never behavior.

## The three archetypes (choose per figure)

- **`scrub-timeline`** — teaches a divergence over time between what a process reported and what was true. Author 4–40 inline runs (`records`, `freshnessHours`, `sentinel`, optional `error`), up to two series (each gets its own chart and y-scale; give `healthyMin`/`healthyMax` so the healthy band renders), an optional truth-lens toggle, and region/callout annotations placed on day indices. Make the divergence *gradual* — the reader should discover the drift by scrubbing.
- **`parameter-playground`** — teaches a threshold tradeoff. You parameterize the engine's seeded `run-stream` model (baseline volume, jitter, cadence, injected stale/partial/missing failures) and declare 1–3 sliders. Choose values so the tradeoff is real: initial thresholds should miss most failures, tight thresholds should catch them all *and* start flagging healthy jitter (jitter tails must overlap the tightest band). Injected failures must stay below half the runs.
- **`absence-compare`** — teaches that two rules see the same stream differently. Author one event stream (`ok`/`error`/`absent` days) and two panels (`presence-of-bad` vs `absence-of-good` + `windowDays`). Include a stretch of loud failures the first rule catches and a long silence only the second rule catches.

## Writing quality bar (Distill conventions)

- `caption.lead`: a bold, concrete hook ("Fourteen days of green checkmarks."). `caption.text`: the interpretive claim the figure proves — captions carry claims, not descriptions. `caption.instructions`: the interaction verbs, imperative ("Press play… hover any day…").
- Timeline labels short ("Day 7"); panel titles name the philosophy, panel `note` its blind spot.
- Numbers must be story-consistent across the figure, the caption, and `reducedMotion.steps` — reduced-motion steps are the complete lesson in 2–8 sentences quoting the same numbers.
- Ground every number and claim in the supplied article excerpt; reference only approved learning-objective and concept IDs.

## Article-specific brief (replace per article)

For `pages/blog/monitoring-for-silent-failure.html`: figure 1 shows a two-week silent-success timeline (stale upstream from day 7, volume collapse from day 10, all runs reporting success); figure 2 tunes volume/freshness/heartbeat thresholds over 60 runs with 12 injected silent failures; figure 3 compares error-based alerting with a one-day dead-man's switch over three weeks where the job silently stops on day 10.
