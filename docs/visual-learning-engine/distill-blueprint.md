# Distill-class explorables: research digest and JSON engine blueprint

Research date: 2026-07-28. Sources: distill.pub article corpus (momentum, augmented-rnns, feature-visualization, visual-exploration-gaussian-processes, growing-ca, gnn-intro, misread-tsne), the distillpub/template repository and per-article repos, distill.pub/guide, and Distill's own retrospectives (2021 hiatus note, "Communicating with Interactive Articles").

**Goal:** evolve this repo's visual learning engine so that a validated JSON definition can produce figures with the interaction quality of a Distill article — starting with one new article package (see § Target article).

---

## 1. How Distill actually built their graphics (digest)

- **The shared template solved publication, not graphics.** One script tag provided custom elements for scholarly apparatus: `d-article` (layout grid), `d-figure` (lazy lifecycle), `d-math` (KaTeX), `d-cite`/`d-footnote` (hover popovers), bibliography, TOC. There was **no chart, slider, or graph component** — every interactive figure was hand-built per article, each article its own repo with its own stack (D3 v4/v5 always; Svelte for stateful figures from 2017; tfjs for live models; raw WebGL/twgl when performance demanded; heavy compute done offline in Python and shipped as .npy/JSON/weight textures).
- **`d-figure` lifecycle** is the engineering gem: two IntersectionObservers (one with ~2-viewport rootMargin, one exact) drive a rAF-drained init queue sorted by proximity to the viewport, and dispatch `ready` (build the figure), `onscreen` (start loops), `offscreen` (pause loops). This is how pages full of WebGL stayed smooth. Our engine already has the pause-offscreen half; the blueprint adopts the full three-event contract.
- **Layout is one CSS grid with named lines.** Prose lives in a ~700px `text` track; a figure "breaks out" solely by carrying one width class: `l-body`, `l-body-outset`, `l-page`, `l-page-outset`, `l-screen`, `l-screen-inset`, plus `l-gutter` for margin notes. A figure's only layout property is one named width.
- **Why they stopped:** each article took enormous bespoke effort ("closer to building a website than writing a blog post"), 50+ hours of editor mentorship, volunteer burnout, and bit-rot of one-off stacks. **This is precisely the argument for our approach**: a validated JSON DSL + one maintained renderer means the figure quality is engineered once and every article gets it for the cost of authoring data.

## 2. The Distill look (constants to encode as design tokens)

- Serif prose at ~80% black in a narrow column; **everything inside figures is small sans-serif**; captions ~12–13px at ~60% black, long and interpretive, with a bold lead-in — captions carry claims and interaction instructions ("The training points can be activated by clicking on them").
- Thin strokes (1–1.5px), small solid dots, no drop shadows, no boxed figures, gridlines faint or absent, generous whitespace.
- Muted color families, ≤ 4 hues per figure. Semantic constants: blue = model/mean, warm red = data/error, gray = structure. Diverging red-blue only for signed matrices. **Color follows the entity across every panel** (the t-SNE rule) — the single most load-bearing convention.
- Interactive-state grammar: default muted → hovered/selected saturated and enlarged → siblings dimmed.
- Controls sit inside the figure block: minimal sliders with "symbol = value" live labels, preset chips, small icon transport buttons (play/pause/refresh + step counter), optional "share this view" URL state.
- Figures are unnumbered; prose points positionally or via anchors; equations sit adjacent to the figure and share its notation and colors.

## 3. Component archetype catalog (what the DSL must express)

Eleven recurring archetypes across the corpus; the closed set below is the target component library. Interaction vocabulary is closed: hover (highlight/readout), click (toggle/select/damage/sample), drag (handle/slider/scrub), play/pause/refresh/step, preset-select, checkbox-compose. Motion has exactly three classes: continuous simulation, discrete recompute-on-input (with short tween), and checkpoint replay.

| # | Archetype | Teaches | Defining example |
|---|-----------|---------|------------------|
| A1 | Parameter playground (sliders → live recompute) | cause/effect, regimes | momentum |
| A2 | Annotated system diagram | architecture, data flow | augmented-rnns |
| A3 | Progressive reveal walkthrough (same diagram elaborated N times, stable positions) | mechanisms | augmented-rnns ACT |
| A4 | Small-multiples grid, one swept variable, labels above panels, "Original" first | sensitivity, robustness | misread-tsne |
| A5 | Live simulation canvas you can perturb | emergent behavior | growing-ca |
| A6 | Hover-linked multi-view (shared entity IDs across panels) | correspondence | gnn-intro |
| A7 | Draggable-handle function/distribution plot | constraints reshaping a continuous object | gaussian-processes |
| A8 | Preset gallery / example selector | taxonomy of a space | feature-visualization |
| A9 | In-place matrix/tensor visual (values printed, blocks annotated) | what the math object contains | augmented-rnns, GP |
| A10 | Regime map / annotated phase diagram with live operating-point marker | qualitative regions | momentum (α,β) |
| A11 | Checkpoint filmstrip / scrubbable timeline with transport controls | process evolution | misread-tsne, growing-ca |

Cross-cutting grammar (engine invariants):

1. **Figure = { widthClass, views[], controls[], annotations[], caption }.**
2. **One state object per figure; every view is a pure function of it.** Sliders, presets, hover selection, drag handles, and simulation ticks all write the same state; linked views never own private state; "share view" = serialize the state.
3. **Annotations are data**, addressable in data coordinates (labeled regions, swoopy arrows + text, dimension labels on edges).
4. Small multiples: one variable per row, condition labeled above each panel, entity colors held constant.
5. Progressive reveal = a sequence of figure instances diffed from one base spec, element positions stable across stages.

## 4. Blueprint: the `explorable` visual kind

Extend the engine with a fourth kind, `explorable` (alongside diagram/motion/narrative), rendered by a new figure runtime. The DSL stays declarative and validated; no code ever appears in content JSON.

### 4.1 Schema shape (to become `schemas/visuals/explorable.schema.json`)

```json
{
  "kind": "explorable",
  "figures": [{
    "id": "silent-success-timeline",
    "archetype": "scrub-timeline",
    "widthClass": "body-outset",
    "caption": { "lead": "Two weeks of green checkmarks.", "text": "Scrub the playhead...", "instructions": "Hover any run to inspect it." },
    "state": {
      "playhead": { "type": "number", "min": 0, "max": 13, "initial": 13 },
      "selectedRun": { "type": "entity", "initial": null },
      "lens": { "type": "enum", "options": ["process", "outcome"], "initial": "process" }
    },
    "data": { "series": [...], "entities": [...], "checkpoints": [...] },
    "views": [
      { "type": "event-track", "bind": {...} },
      { "type": "line-chart", "bind": {...} },
      { "type": "inspector-card", "bind": {...} }
    ],
    "controls": [
      { "type": "scrubber", "writes": "playhead", "transport": true },
      { "type": "toggle", "writes": "lens", "labels": {...} }
    ],
    "annotations": [
      { "type": "region", "view": "line-chart", "x0": 5, "x1": 13, "label": "silent degradation" },
      { "type": "swoopy", "view": "event-track", "at": {...}, "text": "still green" }
    ]
  }]
}
```

Key decisions:

- **`state` is a typed dictionary** (number ranges, enums, entity refs, booleans). Controls declare which key they write; views declare which keys they read. The renderer wires it — this reproduces the post--building-blocks shared-store pattern declaratively.
- **`views` come from a fixed library** of ~10 view primitives that compose into all 11 archetypes: `line-chart`, `event-track`, `bar/meter`, `heatmap-matrix`, `node-link diagram` (reusing the diagram DSL), `slot/particle sim stage` (reusing today's motion stage), `small-multiples` (a layout view wrapping another view over a swept condition), `inspector-card`, `preset-row`, `scatter`. Each has a `bind` block mapping data + state into its channels.
- **`data` is inline, precomputed series** — the growing-ca/feature-viz lesson: compute offline, ship artifacts. For simulated figures (playgrounds), the schema allows a `simulate` block naming one of a few **whitelisted, engine-implemented models** (e.g. `run-stream` for the monitoring article: parameters → synthetic run outcomes) — the model lives in the renderer, versioned and tested; JSON only sets its parameters and seeds. Never executable content in JSON.
- **`entities`** give stable IDs + a palette slot to everything hover-linkable, enforcing color-follows-entity across views.
- **Validation additions:** every control writes a declared state key; every bind reads declared keys/data; annotation coordinates fall inside their view's domain; ≤ 4 entity hues per figure; captions non-empty; a `reducedMotion` block per figure (static final-state summary + text steps) stays mandatory.

### 4.2 Renderer architecture (`src/visual-engine/`)

- `figure-runtime.ts` — d-figure-style lifecycle: proximity-sorted init queue, `ready`/`onscreen`/`offscreen`, one rAF loop per page (not per figure), pausing offscreen/hidden figures (generalizes what MotionPlayer does today).
- `figure-state.ts` — the typed store: `set(key, value)` → dirty-marks subscribed views; URL-serializable for "share this view".
- `views/*.ts` — the view primitives, each a pure `(data, state) => scene` render onto SVG (charts/diagrams) or Canvas (particle/sim stages), with the mark specs we already validated (thin strokes, 2px surface gaps, ≥ 8px markers, direct labels).
- `controls/*.ts` — slider ("symbol = value" label), scrubber + transport, toggle, preset row, checkbox group. Keyboard-operable, focus-visible, hit targets ≥ 24px.
- `models/*.ts` — the whitelisted simulation models (start: `run-stream`).
- Design tokens in `styles.css`: extend the existing `--v-*` palette with `--fig-*` tokens for the Distill constants (caption inks, hairlines, hover grammar). Width classes `f-body | f-body-outset | f-page` mapped to the blog column (we have no full grid; `f-page` = 100% article container, `f-body-outset` ≈ 112%-clamped breakout).

### 4.3 Phasing

- **Phase 1 (target article, 3 figures):** view primitives `event-track`, `line-chart`, `meter`, `inspector-card`; controls `scrubber`, `slider`, `toggle`; model `run-stream`; archetypes A11 + A6 (figure 1), A1 (figure 2), A6 + A10 (figure 3). Schema, validation, tests, docs, prompts.
- **Phase 2:** `heatmap-matrix`, `small-multiples`, `preset-row`, drag handles (A7), progressive-reveal diffs (A3) — unlocks ML-topic articles (teaching-math-to-machines is the natural candidate: feature-importance and evaluation figures are A1/A4/A9 territory).
- **Phase 3:** authoring niceties — per-figure "share this view", margin-note asides, KaTeX via a `d-math`-style component if an article needs equations.

## 5. Target article: Monitoring for Silent Failure

Chosen because its core ideas are temporal and quantitative — the strongest Distill-fit in the blog (runner-up: teaching-math-to-machines, deferred to Phase 2 archetypes).

- **Figure 1 — "The cheerful lie" (A11 scrub-timeline + A6 linked inspector), after "The Category Without a Good Name."** Dual tracks over 14 days: process track (all runs ✓ green) above outcome track (record volume + data freshness lines quietly degrading from day 6 — stale upstream). Scrub the playhead; hover/select a run → inspector card shows exit code 0 vs record count/timestamp/sentinel. Annotation region marks the week of silent damage. Lens toggle: "what the dashboard saw" vs "what was true".
- **Figure 2 — Alert-threshold playground (A1), after "Monitor Outcomes, Not Just Processes."** `run-stream` model: 60 simulated runs with injected silent failures and benign variance. Sliders: volume-baseline band (±%), freshness tolerance (h), heartbeat window (h). Live outputs: caught silent failures, missed ones, false alarms, and an "alert trust" meter that decays with false-alarm rate. Teaches the precision/trust tradeoff the prose argues.
- **Figure 3 — Alert on absence (A6 + A10), after "Alert on the Absence of Good."** Same event stream under two alerting philosophies side by side: "alert on bad" (error spikes only) vs "alert on missing good" (dead-man's switch). The job that silently stops running at day 9 fires nothing on the left, fires on the right. Hover links the same events across both panels; regime labels annotate what each philosophy can and cannot see.

Each figure ships the mandatory reduced-motion equivalent (final-state static render + ordered text steps) and a static fallback list in the article HTML, exactly like the rpa-scaling package.

## 6. What we deliberately do differently from Distill

Distill's per-article bespoke stacks produced brilliance and burnout. We invert the tradeoff: **the renderer is the product, articles are data.** The archetype library is smaller than what a bespoke Svelte figure could do, but every figure is validated, accessible, reduced-motion-safe, testable, and immune to per-article bit-rot — the same engine philosophy already shipped for diagram/motion/narrative, extended to explorables.
