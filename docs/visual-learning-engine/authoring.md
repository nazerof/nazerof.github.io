# Visual Learning Engine authoring

## Content flow

`Learning semantics → validated JSON definition → normalization/compilation → renderer`

The JSON files in `content/visuals/rpa-scaling/` are canonical. Excalidraw scene data and rendered SVG are derivatives. Never place JavaScript, JSX, HTML, CSS, callbacks, imports, or remote URLs in a visual definition.

## Package

`package.json` links one source article to its audience, learning objectives, concepts, and exactly three visual definitions. Every visual and every timed scene references package-level learning objectives and concepts by stable ID.

## Definitions

- `diagram.json` contains semantic nodes, edges, groups, notes, positions, and accessible labels.
- `motion.json` contains a seconds-based sequence compiled directly to a normalized timeline.
- `narrative.json` contains educational story beats, narration, captions, and transcript; it compiles to the same normalized timeline.
- Motion and narrative may provide optional, renderer-namespaced `rendererOptions.svgMotion` labels. Learning objectives, concepts, timing, and metrics remain independent of these presentation hints.

External contracts are JSON Schemas in `schemas/visuals/`. Internal renderer contracts are TypeScript types in `src/visual-engine/types.ts`.

## Explorable figures

The fourth kind, `explorable` (`explorable.json`, `schemas/visuals/explorable.schema.json`), holds one or more Distill-class interactive figures. Article hosts select a figure with `data-visual-figure="<figureId>"`, so one definition serves several positions in the article. Three archetypes exist (see `docs/visual-learning-engine/distill-blueprint.md` for the research behind them):

- **`scrub-timeline`** — a dual-track process-vs-outcome timeline with play/scrub, a truth lens toggle, hover-linked inspector, and region/callout annotations. Data is inline runs (`records`, `freshnessHours`, `sentinel`); each series gets one chart and one y-scale (never a dual axis) with an optional healthy band.
- **`parameter-playground`** — sliders drive the engine-implemented, seeded `run-stream` model; the run grid, counters, and alert-trust meter all recompute from the same figure state. Content JSON supplies only model parameters — never code.
- **`absence-compare`** — one event stream judged by two alerting rules in aligned panels with hover-linked explanation.

Every figure requires a `caption` (bold lead + interpretive text + interaction instructions, Distill-style) and a `reducedMotion` block (summary + ordered steps) that replaces the interactive under `prefers-reduced-motion`. Figures follow the shared grammar: one typed state store per figure, every view a pure function of it, entity color constant across views, and a closed interaction vocabulary (hover, click, drag, play/pause).

## Timeline renderer

`MotionPlayer` renders both motion and narrative definitions as an animated pipeline stage (sources → schedule gate → execution slots → validated output, with a queue lane and failure badge). Scene `metrics` are tweened continuously, so values glide between scenes instead of jumping. The scene `stage` drives presentation through two lookup tables: a tone (`calm`, `strain`, `critical`, `improving`, `stable`) that colors the focus ring and pulses, and a focus zone that the guided-attention ring glides to. Narrative definitions render as the `journey` variant (a 10 → 50 → 100 → 200+ milestone rail replaces the clock gate); motion definitions render as `schedule` (a clock chip that fans out into staggered start times during `stagger`/`recovery`/`conclusion` stages). Chrome around the SVG — poster overlay, play/replay/seek with chapter ticks, chapter rail, and an `aria-live` caption that updates once per scene — is plain HTML. The reduced-motion fallback replaces the whole player with the ordered `reducedMotionSteps` list.

## Authoring workflow

1. Add or update package-level learning semantics.
2. Author one specialized definition using only allowlisted values.
3. Run `npm run validate:visuals`.
4. Run `npm test` and `npm run build`.
5. Review the static fallback, reduced-motion sequence, keyboard controls, captions, and transcript.
6. Treat editor changes as a derivative: download `.excalidraw`, SVG, or PNG. Reset returns to the canonical JSON.

Schema version `1.0` is strict. A future breaking change must use a new version and an explicit migration rather than silently changing existing meaning.
