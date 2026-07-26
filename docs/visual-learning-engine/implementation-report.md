# Visual Learning Engine proof-of-concept report

## What was implemented

The RPA scaling article now contains exactly three validated learning experiences:

1. An editable operating-architecture diagram with a static SVG preview, structured text description, lazy Excalidraw editor, reset, and SVG/PNG/`.excalidraw` downloads.
2. A 24-second SVG scheduling-collision explanation with play, pause, replay, seek, speed, progress, keyboard controls, captions, visibility pausing, and reduced-motion steps.
3. A 66-second “Automation becomes operations” narrative with scene goals, synchronized captions, complete transcript, and compilation into the same normalized motion timeline.

The isolated subsystem adds JSON Schemas, TypeScript contracts, Ajv structural validation, semantic/security validation, narrative compilation, SVG/Web Animations rendering, tests, static fallbacks, AI prompt/evaluation tooling, and portability documentation. Existing site files remain handwritten static HTML/CSS/JavaScript.

## Architecture rationale

The implementation preserves the approved boundary:

`learning semantics → validated definition → normalization/compilation → renderer`

A small package-level learning model is shared while diagram, motion, and narrative remain specialized. JSON Schema is the external contract. React exists only in the lazy Excalidraw island; validation, compilation, motion rendering, and hosts do not depend on React.

## What each format demonstrated

- **Diagram:** spatial relationships and editable architecture are valuable when readers need to inspect boundaries, paths, and operational ownership.
- **Motion:** queue growth and cascading retries become clearer as changes over time than as a static architecture.
- **Narrative:** the article’s central lesson needs instructional pacing, goals, and a conclusion rather than more diagram animation.

The formats cover different article concepts rather than repeating one explanation.

## Offline AI-generation findings

No approved model workflow exists in this repository, so no external model was called. Three strict prompt templates and an offline evaluator were added. Expected weak points are invented IDs, unsupported presentation fields, invalid timing, incomplete caption coverage, and educationally plausible output that does not satisfy the selected learning objective. Before HubsTime integration, run a measured sample set and record first-pass validity, repair count, token size, and human educational ratings.

## HubsTime reuse

Reusable as-is: schema-validation boundary, security limits, semantic reference checks, normalized timeline, narrative compiler, SVG motion renderer, and evaluation harness.

Reusable with extension: package/specialized schemas, capability declarations, diagram adapter, and provenance.

Portfolio-specific: relative file loading, static article hosts/fallback markup, theme styles, and committed GitHub Pages build assets.

HubsTime still needs persistence, tenant authorization, source citations, localization, asset storage, review state, generation jobs, analytics, and course-editor integration.

## Technical debt and known limitations

- Excalidraw brings a large optional dependency graph, including chunks not exercised by this proof of concept.
- Excalidraw free-form edits do not round-trip to the compact Diagram DSL.
- Diagram layout is intentionally explicit rather than handled by a general layout engine.
- Motion visuals are a bounded domain renderer, not a universal element/track system.
- Runtime JSON is fetched three times because each host independently loads the package; browser caching prevents repeated transfers, but a shared in-memory promise would be a future optimization.
- No real browser automation suite existed before this change; interaction tests use jsdom and deployment verification uses the static build/server.
- There is no persistent edit storage, audio, video rendering, localization, branching narrative, or runtime AI.

## Performance

Measured production output:

| Asset | Raw | Gzip |
|---|---:|---:|
| Initial visual runtime JavaScript | 151,499 bytes | 43,705 bytes |
| Initial visual runtime CSS | 3,945 bytes | 1,320 bytes |
| Lazy diagram-editor entry | 761,850 bytes | 231,181 bytes |

The complete lazy Excalidraw output is approximately 8.3 MB across 179 generated files on disk. None of the Excalidraw JavaScript or CSS is requested until “Open interactive diagram” is selected. Static preview dimensions prevent layout shift. Motion renders at most 20 representative SVG flow markers rather than one marker per source.

## Accessibility

- Static text alternatives survive disabled or failed JavaScript.
- The diagram has SVG title/description, image alt text, and a structured written description.
- Controls have accessible names, visible focus, and keyboard support.
- Narrative captions cover the full duration and the complete transcript remains in HTML.
- Reduced-motion users receive step-based equivalents without animated SVG.
- Failure states combine symbols, text, and color.
- No lesson depends on audio.

## Security and validation

Build-time and runtime validation enforce file size, nesting, schema version, strict fields, ID/reference integrity, timeline bounds, caption/transcript coverage, same-origin fetching, and allowlisted capabilities/presets/easing/types. Tests cover unsafe URLs, raw HTML, executable fields, excessive content, broken references, and invalid timing. Renderers do not use `eval`, `Function`, `innerHTML`, dynamic module paths from data, or arbitrary CSS.

## Deployment

The repository remains a static site. GitHub reports the dynamic `pages-build-deployment` workflow publishing successful builds from `main`, confirming branch-based Pages deployment rather than a tracked Actions workflow. Deployment configuration was not changed. Vite writes committed static assets into `assets/visual-engine/`, so legacy Pages can publish them with the existing routes.

Rollback point before implementation: `a0c4b3e862529dabe28a22c00a935915156cceab`.

Public routes preserved include `/`, `/pages/blog.html`, `/pages/projects.html`, `/pages/add-me.html`, and all existing `/pages/blog/*.html` routes. Final public verification occurs after merge to `main`; this feature branch cannot replace the live site.

## Recommended next experiment

After owner approval, ingest this package as one read-only HubsTime lesson content block and run an offline generation evaluation over at least 20 grounded samples per format. Do not start with an editor or automated publishing.

Current stage recommendations:

- More visual types: **not yet**.
- Remotion/video export: **not yet**.
- TTS: **not yet**.
- Course-editor integration: **only after read-only ingestion succeeds**.
- AI visual-block generation: **proceed only as an offline, human-reviewed experiment after explicit approval**.

## Verification commands

- `npm run validate:visuals`
- `npx tsc --noEmit`
- `npm test`
- `npm run build`
- `npm run evaluate:ai -- /absolute/path/to/candidate-directory`
