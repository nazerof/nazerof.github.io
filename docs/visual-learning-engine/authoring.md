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

External contracts are JSON Schemas in `schemas/visuals/`. Internal renderer contracts are TypeScript types in `src/visual-engine/types.ts`.

## Authoring workflow

1. Add or update package-level learning semantics.
2. Author one specialized definition using only allowlisted values.
3. Run `npm run validate:visuals`.
4. Run `npm test` and `npm run build`.
5. Review the static fallback, reduced-motion sequence, keyboard controls, captions, and transcript.
6. Treat editor changes as a derivative: download `.excalidraw`, SVG, or PNG. Reset returns to the canonical JSON.

Schema version `1.0` is strict. A future breaking change must use a new version and an explicit migration rather than silently changing existing meaning.
