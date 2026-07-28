# Explorable figures — Phase 1 implementation report

Date: 2026-07-28. Implements Phase 1 of `distill-blueprint.md` (research in `distill-research.md`): a fourth visual kind, `explorable`, rendering Distill-class interactive figures from validated JSON. First shipped package: `content/visuals/monitoring-silent-failure/` for `pages/blog/monitoring-for-silent-failure.html`.

## Architecture

```
content JSON ──▶ Ajv (explorable.schema.json) ──▶ semantic validation ──▶ figure runtime
                                                                        ├─ FigureState (typed store)
                                                                        ├─ view primitives (SVG)
                                                                        ├─ run-stream model (seeded)
                                                                        └─ archetype renderers ×3
```

- **`src/visual-engine/explorable/state.ts`** — `FigureState`: one typed store per figure. Controls write keys, views subscribe to keys, and every panel renders as a pure function of the store (the Distill shared-store pattern, wired declaratively). Notifications fire only on change.
- **`src/visual-engine/explorable/model.ts`** — the whitelisted `run-stream` simulation: deterministic LCG seeded from JSON, baseline volume with bell-ish jitter, three injected silent-failure kinds (stale upstream / partial result / missing run), and `classifyRuns` implementing the volume-band, freshness, and heartbeat checks with caught / missed / false-alarm verdicts and a trust score (`max(0, 1 − falseAlarms × 0.15)`). Partial failures span 40–90% of baseline and healthy jitter tails overlap the tightest band — the overlap is what makes the tradeoff teachable. **Simulation code lives in the engine, versioned and tested; content JSON supplies only parameters and a seed.**
- **`src/visual-engine/explorable/primitives.ts`** — SVG/HTML helpers: single-series line chart (one y-scale per chart — never a dual axis; faint full-series context line + colored line revealed through a clip rect for checkpoint-replay scrubbing; optional healthy band; `niceCeil` axis maxima), stat chips, trust meter, legend chips. Entity colors come from a fixed six-hue map (blue/green/amber/red/purple/gray) validated against the site palette.
- **Archetype renderers** (`scrub-timeline.ts`, `parameter-playground.ts`, `absence-compare.ts`) — see below.
- **`src/visual-engine/explorable/mount.ts`** — mounts one figure per article host. Hosts pick a figure with `data-visual-figure="<figureId>"`, so one validated definition serves several positions in an article. Builds the Distill-style caption (bold lead + interpretive text + imperative instructions) and swaps the whole figure for its `reducedMotion` summary + ordered steps under `prefers-reduced-motion`.
- **`src/visual-engine/index.ts`** — dispatches `kind: "explorable"` alongside diagram/motion/narrative.
- **Styles** — a `fig-*` layer in `styles.css`: hairline gridlines, thin strokes, muted fills, hover grammar (default muted → active saturated → siblings dimmed), width-class breakouts applied to the stage only so controls and captions keep the prose measure.

## The three archetypes

| Archetype | Distill lineage | Interaction | Motion class |
| --- | --- | --- | --- |
| `scrub-timeline` | A11 checkpoint replay + A6 linked views (misread-tsne, growing-ca) | play/scrub, hover/click a day, truth-lens toggle | checkpoint replay |
| `parameter-playground` | A1 (momentum, GP kernels) | 1–3 sliders with "symbol = value" readouts, hover a run | recompute-on-input |
| `absence-compare` | A6 + A10 (gnn-intro, momentum regimes) | hover a day across aligned panels | static + hover state |

Shared behaviors: hover columns are full-height hit targets (≥ 24px), annotations (regions, swoopy callouts) are data in day coordinates, `aria-live` only on the inspector/explainer elements, and figure stages scroll horizontally on narrow viewports rather than shrinking below legibility.

## Validation

Schema (`schemas/visuals/explorable.schema.json`, strict 2020 draft, `unevaluatedProperties: false`) plus semantic checks in `validation.ts`:

- runs/events reference days inside the timeline; no duplicate days, figure IDs, panel IDs, or parameter keys
- `healthyMin ≤ healthyMax`; region annotations ordered and in range
- parameter `min < max` and `initial ∈ [min, max]`; injected failures below half the run count
- `absence-of-good` panels require `windowDays`
- package rules generalized: any article path, 1–4 visuals, at most one per kind, and either the classic diagram/motion/narrative trio or at least one explorable
- the untrusted-JSON filter still applies (a key matching `on[a-z]+` is rejected — which is why the lens toggle uses `labelWhenOff`/`labelWhenOn`)

`npm run validate:visuals` now discovers and validates every package under `content/visuals/`.

## Testing and verification

- 14 new tests in `tests/explorable.test.ts` (45 total, all passing): package/semantic validation rejections, store change-notification, model determinism and exact failure-injection counts, the loose→balanced→paranoid classification gradient (more caught, then false alarms and falling trust), figure mounting per host, scrub→inspector linkage, slider reclassification, absence-panel hover explanation, reduced-motion fallback.
- Playwright verification (desktop 1280px + mobile 390px) of the live page: 3 hosts ready, zero console errors, screenshots reviewed for the initial, scrubbed, truth-lens, loose/tight/paranoid, and hover states. Three defects were found by looking and fixed: width-class breakout clipping text at the host card edge (breakout now applies to the stage only), a redundant hover sentence for healthy runs, and axis maxima wasting chart height (finer `niceCeil` steps).

## Known limitations / Phase 2

- Archetype configs are typed per archetype rather than the blueprint's fully generic `views[]`/`bind` composition; generalize when the archetype count grows.
- No URL "share this view" serialization yet (`FigureState` is designed for it).
- Figures initialize eagerly; adopt the `d-figure`-style proximity queue (`ready`/`onscreen`/`offscreen`) once pages carry many figures.
- Hover detail on playground runs is mouse-only (the counters and reduced-motion path carry the content); consider focusable cells.
- Phase 2 archetypes per the blueprint: heatmap-matrix, small-multiples, preset gallery, drag handles, progressive-reveal diffs — natural next article: teaching-math-to-machines.
