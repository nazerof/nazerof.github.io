# Distill.pub deep research — full findings

Research date: 2026-07-28. Method: two parallel investigations — one into the engineering stack (the distillpub/template repository, per-article GitHub repos, the authoring guide), one into the visual design language (figure-by-figure catalog of seven landmark articles). This file preserves the full findings; `distill-blueprint.md` is the synthesis and build plan derived from it.

## 1. How Distill was engineered

### Publication model

Distill (2016–2021, ISSN 2476-0757, now on indefinite hiatus) published each article as **one standalone GitHub repo** (`distillpub/post--<slug>`) building to static HTML in a `public/` folder. The only shared infrastructure was a single script tag: `template.v1.js` (2016–2018: `<dt-article>`, `<dt-cite>`, `<dt-fn>`, `<dt-code>`) and later `template.v2.js` from `github.com/distillpub/template`. Review happened on drafts.distill.pub; on publication the repo transferred to the distillpub org for preservation.

### What the shared template provided (v2, `src/components/`)

Scholarly apparatus only — **no chart, slider, or graph component existed in the template**:

| Element | Role |
| --- | --- |
| `d-article` | Root layout element: CSS grid + typography scope |
| `d-title`, `d-byline`, `d-abstract`, `d-front-matter` | Masthead and metadata |
| `d-figure` | Lazy lifecycle wrapper for interactive figures |
| `d-math` | KaTeX (inline by default, `block` for display mode) |
| `d-cite`, `d-bibliography`, `d-footnote`, `d-hover-box` | Numbered citations and footnotes with hover popover cards |
| `d-code`, `d-toc`, `d-interstitial`, `d-appendix` | Code, contents, draft gate, back matter |

A Node prerender pipeline (`src/transforms/`) baked citations, math, TOC, SEO metadata, and CrossRef DOI XML into static HTML.

### The `d-figure` lifecycle (the engineering gem)

Two IntersectionObservers per page: a **marginObserver** with ~2-viewport rootMargin queues figures for initialization as they approach; a **directObserver** with zero margin fires exact visibility transitions. The queue drains under `requestAnimationFrame`, sorted by proximity to the viewport, staggering expensive setup. Events on the element: `ready` (build now — near viewport), `onscreen` (start loops), `offscreen` (pause loops, free GPU). Late listeners replay already-fired events. This is how pages full of WebGL and tfjs stayed smooth.

### Per-article graphics stacks (from the actual repos)

- **post--momentum**: D3 v4.7 + numeric.js (in-browser eigendecomposition) + d3-swoopy-drag + d3-tip. No bundler — the build concatenates libraries with `cat`.
- **post--misread-tsne**: just D3 v4.2; live t-SNE in plain JS; a homemade HTML-include preprocessor.
- **post--feature-visualization** (2017): Svelte 1.38 + webpack 3 + D3 v4.9 + numpy-loader (`.npy` tensors from Python straight into the browser). Heavy compute offline; interaction over precomputed artifacts.
- **post--building-blocks** (2018): Svelte 1.50 + ndarray for in-browser tensor slicing. Canonical **cross-figure shared state**: one global Svelte store created in `index.js`, passed into every figure; linked views observe and write the same keys bidirectionally.
- **post--growing-ca** (2020): no npm at all — hand-written WebGL fragment shaders with twgl as the only helper; models trained in Colab and exported as quantized weight textures; direct-manipulation canvas (click to damage, double-click to reseed, speed slider, model-variant radio).
- **post--gnn-intro** (2021): TypeScript + Parcel + tfjs 2.0 (live in-browser GNN playground) + D3 v5.9 + Vega-Lite from CDN for statistical charts.
- **post--understanding-gnns**: repo contains only prebuilt `public/` — Distill's real contract was "give us a static folder".

Constants: D3 always; Svelte for stateful figures from 2017 (the official `post--example` starter ships webpack + Svelte); tfjs for live models; raw WebGL when performance demanded; **no React or Vue anywhere**; heavy training always offline with artifacts shipped as .npy/JSON/weight textures.

### Layout system

`d-article` is one CSS grid with named lines (`screen`, `page`, `middle`, `text`, `gutter`, `kicker`), breakpoints at 768/1000/1180px. Placement classes only set `grid-column`: `.l-body` (the ~700px prose measure), `.l-body-outset`, `.l-page`, `.l-page-outset`, `.l-screen`, `.l-screen-inset`, `.l-gutter` (margin notes; `d-article aside` maps there). A figure "breaks out" solely by carrying one width class — breakouts stay aligned to the global column rhythm.

### The Distill look (measured values)

- System font stack; body 16px+ at line-height 1.6–1.7; body ink `rgba(0,0,0,0.8)` — never pure black.
- h2 24–36px/600 with a 1px `rgba(0,0,0,0.1)` hairline underline; links carry a bottom border, not an underline.
- Captions 12–13px at `rgba(0,0,0,0.6)` with a **bold lead-in phrase in full black**; captions carry claims and interaction instructions, not descriptions.
- Figures with external framing get white background, 1px hairline border, subtle shadow, 18px padding.

### Why Distill stopped (their own retrospectives)

From the 2021 hiatus note and "Communicating with Interactive Articles": articles took enormous bespoke effort ("closer to building a website than writing a blog post"), some received 50+ hours of editor mentorship, volunteer burnout was the primary driver, and one-off stacks rot ("rapidly changing web technologies… could break interactive content after just a few years" — they archived WARC files as mitigation). Their recommended future was self-publication on the open template. **The lesson this repo acts on: keep one maintained renderer and make articles pure data.**

## 2. The visual design language (figure-by-figure synthesis)

### Article catalogs (abbreviated)

- **Why Momentum Really Works**: slider-driven contour-plot trajectories ("Step-size α =" with live readouts), eigenmode small multiples, an (α, β) convergence-rate heatmap with labeled regimes and a slider-bound operating point, damped-oscillator phase portraits, geometric annotations layered on live plots.
- **Attention and Augmented RNNs**: ~25 static annotated SVG schematics; the ACT section is the canonical **progressive reveal** — one diagram elaborated four times with element positions held stable; attention matrices as numeric heatmaps with values printed in cells.
- **Feature Visualization**: image walls and a recurring three-column comparison template; a literature review rendered as a 1D regime axis; captions carry the interpretive claim.
- **A Visual Exploration of Gaussian Processes**: the draggable-handle archetype — drag μ/Σ handles, linked marginal/conditional panels, kernel gallery with parameter sliders morphing a covariance heatmap, click-to-sample priors with old samples fading via opacity, toggleable training points.
- **Growing Neural Cellular Automata**: live WebGL simulation you can damage; model-variant radios, preset targets, speed slider, step counter; training-progress filmstrips as discrete checkpoint replays.
- **A Gentle Introduction to GNNs**: the richest interaction grammar — hover-propagation diagrams, editable pixel/text/graph inputs with synchronized representations (image ↔ node-link ↔ adjacency matrix), an embedded tfjs playground, empirical sweep scatterplots with hover tooltips.
- **How to Use t-SNE Effectively**: live small-multiples rows (each panel a running optimization with play/pause/refresh, step counter, "Share this view" URL state), one swept variable per row labeled above each panel, cluster hues held constant from the "Original" panel through every projection.

### The 11 component archetypes

| # | Archetype | Defining example |
| --- | --- | --- |
| A1 | Parameter playground (sliders → live recompute) | momentum |
| A2 | Annotated system diagram | augmented-rnns |
| A3 | Progressive reveal walkthrough | augmented-rnns (ACT) |
| A4 | Small-multiples grid, one swept variable | misread-tsne |
| A5 | Live simulation canvas you can perturb | growing-ca |
| A6 | Hover-linked multi-view | gnn-intro |
| A7 | Draggable-handle function/distribution plot | gaussian-processes |
| A8 | Preset gallery / example selector | feature-visualization |
| A9 | In-place matrix/tensor visual | augmented-rnns, GP |
| A10 | Regime map with live operating-point marker | momentum |
| A11 | Checkpoint filmstrip / scrubbable timeline | misread-tsne, growing-ca |

### Cross-cutting grammar (the invariants the engine implements)

1. Figure = { widthClass, canvas(es), controls, caption } — controls live inside the figure block, never a separate panel.
2. **One state object per figure; every view is a pure function of it**; "share view" = serialize that state.
3. Exactly **three motion classes**: continuous simulation, discrete recompute-on-input (short tween), checkpoint replay. No decorative animation.
4. Small multiples: one variable per row, value labeled above each panel, ground-truth panel first.
5. **Color follows the entity across every panel** — the most load-bearing rule. Muted families, ≤ 4 hues per figure; blue = model/mean, warm red = data/error, gray = structure; diverging red-blue only for signed matrices.
6. **Annotations are data** in plot coordinates: labeled regions, swoopy arrows, dimension labels.
7. Interaction vocabulary is closed: hover (highlight/readout), click (toggle/select/damage/sample), drag (handle/slider/scrub), play/pause/refresh/step, preset-select, checkbox-compose. No pan/zoom, no gestures.
8. Interactive-state grammar: default muted → hovered/selected saturated and enlarged → siblings dimmed.
9. Captions are instruction manuals ("The training points can be activated by clicking on them"); prose references figures positionally or by anchor — figures are unnumbered.
10. Equations sit adjacent to their figure and share its notation and colors.
