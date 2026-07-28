# Motion DSL generation prompt

Generate one JSON document that validates against `schemas/visuals/motion.schema.json`. Return JSON only — no Markdown, HTML, CSS, JavaScript, URLs, imports, or fields absent from the schema.

## How the renderer uses your data (write for it)

The player renders an animated pipeline stage: a sources cluster → a schedule gate → a grid of execution slots → a validated-output meter, with a queue lane and a failure badge. Everything on screen is driven by your scene `metrics` and `stage`:

- `metrics.sources` fills the dot cluster (1 dot = 5 sources) and the big counter; `capacity` sizes the slot grid (values ≤ 24 display best); `queued` fills the amber queue bar (scaled to the timeline's own maximum); `failures` fills red slots and the failure badge. The green output counter shows `max(0, sources − queued − failures)` — choose metrics so this number tells the truth of each scene (let it reach 0 only when the story is "output collapses").
- Metrics **tween continuously between scenes**. Make adjacent scenes differ enough to be visibly animated, and keep values continuous — no unexplained resets.
- `stage` drives color tone and a guided-attention focus ring: calm (`smooth`, `manageable`) → strain (`growth`, `queue`, `coordination`) → critical (`collision`, `failure`) → improving (`stagger`, `recovery`, `operations`, `decision`) → stable (`conclusion`). Order scenes so tones follow that arc; end on `conclusion` for a stable close.
- During `stagger`, `recovery`, and `conclusion` stages the schedule gate fans a `clockLabel` of the form `HH:MM` out into staggered start times — give `rendererOptions.svgMotion.clockLabel` a real time whenever the lesson involves scheduling.

## Writing quality bar

- `title` becomes a chapter pill: **1–2 words**, unique across scenes.
- `displayText` becomes the caption headline: ≤ 8 punchy words stating the scene's one idea.
- `narration` is the caption body: one or two spoken-style, present-tense sentences, ≤ 30 words.
- `rendererOptions.svgMotion` labels are short nouns completing on-stage phrases: `sourceLabel` finishes the counter caption (e.g. "220 flows"), `capacityLabel` finishes the slot caption (e.g. "20 execution slots"); `processLabel` and `outputLabel` are zone headings.
- `reducedMotionSteps` (3–6 items) must stand alone as the complete lesson and quote the same numbers as the metrics.
- Duration 20–30 seconds; 6–10 contiguous scenes of 2–4 seconds that exactly fill `durationSeconds`.

Reference only approved learning objectives, concepts, visual IDs, and diagram node IDs supplied with the article brief. Use only schema-enumerated stages, easing, and entry presets. Use `viewport` 960×440. Include an accessible label that describes the animated stage, not the topic alone.

## Article-specific brief (replace per article)

For `pages/blog/rpa-scaling.html`: a 24-second explanation of scheduling collision. Arc: ten flows run smoothly → fifty and then 200+ all target 06:00 → capacity saturates and the queue consumes timeout budgets → synchronized retries cascade → staggered starts, backoff with jitter, and circuit breakers restore bounded, stable throughput.
