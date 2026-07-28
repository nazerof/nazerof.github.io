# Diagram DSL generation prompt

Generate one JSON document that validates against `schemas/visuals/diagram.schema.json`. Return JSON only — no Markdown, HTML, code, URLs, callbacks, CSS, renderer scene JSON, or fields absent from the schema.

## Layout craft (the editor renders exactly what you position)

The Excalidraw adapter draws each node as a rounded rectangle at your `x/y/width/height` and routes each edge from border to border — straight, or with one elbow when a straight line would cross an unrelated node. Sloppy coordinates produce a sloppy diagram, so lay out like a designer:

- **Grid first.** Place nodes in aligned columns and rows on a 1200×720 viewport. Node sizes 150–230 wide × 58–110 tall; keep at least 30 px of clear space between any two nodes and never overlap them.
- **Reading order.** The happy path should form a left-to-right spine across the top (intake → gating → execution → validation → storage). Support systems sit above/below the spine; monitoring forms its own bottom band feeding a single dashboard on the right.
- **Route-friendly placement.** Prefer positions where connected nodes share a row (horizontal edge) or a column (vertical edge). Avoid geometries that force an edge to pass through a third node — the router can dodge with one elbow, not a maze.
- **Node kinds are the color system**: `boundary` renders amber (protective limits: queues, retries, breakers), `monitor`/`dashboard` purple, `storage` green, all others indigo. Pick kinds semantically — they are the legend.
- **Edge flows are the line system**: `happy` solid green, `failure` dashed red (loops back to a recovery point), `observability` dotted purple (converges on the dashboard). Every edge label is 1–3 lowercase words naming what moves along it ("planned runs", "valid session", "volume history").

## Content requirements

- Use only facts in the supplied article excerpt and only package learning-objective/concept IDs.
- Stable kebab-case IDs (other visuals reference them as `focusNodes` — treat renames as breaking).
- Concise node labels (≤ 4 words; they must fit the box), an `accessibilityLabel` per node stating its role in one sentence, and a long description that walks the happy path, then failure, then observability.
- Assign every node to a `group` that matches the band it sits in visually.
- Notes reference only existing node IDs.

A hand-authored preview SVG (`assets/visuals/<article>/…-preview.svg`) is the primary rendering readers see; it mirrors these coordinates with orthogonal routing, lane bands, icons, and a legend — keep the JSON layout clean enough that the preview can follow it 1:1.

## Article-specific brief (replace per article)

For `pages/blog/rpa-scaling.html`: the operating architecture for 200+ automation sources — scheduler, dependency-aware orchestration, concurrency queue, authentication/sessions, source connectors, retry + backoff + jitter, circuit breaker, data validation, downstream pipeline, structured logs, heartbeat/validation/trend monitoring, and an operator dashboard, with distinct happy/failure/observability paths.
