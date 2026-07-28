# Narrative DSL generation prompt

Generate one JSON document that validates against `schemas/visuals/narrative.schema.json`. Return JSON only — no code, HTML, CSS, URLs, audio requirements, or unsupported fields.

## How the renderer uses your data (write for it)

Narratives compile to the same animated pipeline stage as motion visuals, rendered in the **journey variant**: instead of a clock, the gate shows a milestone rail with thresholds **10 → 50 → 100 → 200+**, and the chip matching the current beat's `metrics.sources` lights up. Design your beats so `sources` climbs through those brackets as the story escalates.

- Beat `metrics` (`sources`, `capacity`, `queued`, `failures`) animate the stage exactly as in motion visuals; the green output counter shows `max(0, sources − queued − failures)`. Values tween between beats — keep them continuous and let each beat's numbers restate its message (early beats calm, middle beats strained, closing beats recovered).
- `stage` sets the tone arc (calm → strain → critical → improving → stable) and where the focus ring glides; `emphasis: "strong"` marks turning-point beats. End on `conclusion`.
- `goal` doubles as the chapter-pill label (truncated around 16 characters) — front-load a distinguishing verb ("Recognize…", "Evaluate…", "Apply…").
- `displayText` is the caption headline (≤ 9 words); `narration` is the caption body (1–2 spoken-style sentences, ≤ 35 words).
- `rendererOptions.svgMotion`: set `clockLabel` to a scale word (e.g. "Scale") — it titles the milestone rail; `capacityLabel`/`sourceLabel` are short nouns that read naturally after a number.

## Structural requirements

- Duration 60–75 seconds; 5–7 contiguous beats of 8–14 seconds with explicit timing that exactly fills `durationSeconds`.
- Every beat carries a learning objective and concept references from the approved package IDs only.
- `captions` must tile [0, durationSeconds] exactly (continuous, non-overlapping); the `transcript` must contain every beat's narration **verbatim**.
- Diagram references (`visualReferences`) may point only to approved diagram node IDs.
- Use `viewport` 960×440. The instructional arc must come from the supplied article excerpt — no invented facts, numbers, or claims.

## Article-specific brief (replace per article)

For `pages/blog/rpa-scaling.html`: a 66-second journey — ten manageable connectors; coordination replacing memory at fifty; operational reality beyond two hundred where error handling becomes the product; disproportionate maintenance in the final difficult sources; a conclusion covering what to automate, how to operate it, how failure is detected, and when to stop.
