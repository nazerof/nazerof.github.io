# Validation and security

Visual definitions are untrusted data.

## Validation stages

1. Limit raw JSON to 100 KB.
2. Parse JSON and limit nesting to 16 levels.
3. Reject executable, raw-HTML, event-handler, import, arbitrary CSS, and unsafe URL patterns.
4. Validate schema version and the specialized JSON Schema.
5. Check stable/unique IDs, learning references, diagram references, node/edge references, timeline bounds, caption coverage, and transcript coverage.
6. Fetch runtime files only from the current origin.
7. Render strings through DOM/SVG text nodes or React text values; never use `innerHTML`.

Element types, stages, easing, animation entry presets, theme, locale, capabilities, node kinds, and flow kinds are closed enums. Renderers select modules in application code; data cannot select imports or callbacks.

Build validation is authoritative and runtime validation protects against stale or tampered static assets. Validation errors include definition ID, JSON path, and reason. Definitions are validated as one package, so an invalid definition disables all interactive package hosts; article HTML, static previews, fallbacks, and the transcript remain available.

## Current limits

The proof of concept has no remote assets in canonical definitions, no backend, no persistence, no authentication, no runtime AI, and no audio. Excalidraw is lazy-loaded only after explicit interaction.
