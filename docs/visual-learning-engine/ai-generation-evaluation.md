# Offline AI-generation evaluation

No approved model integration or credentials are present in this repository, so no external model was called. Three prompt templates and `scripts/evaluate-ai-candidates.ts` provide the requested offline experiment boundary.

## Procedure

1. Give a model one prompt from `docs/visual-learning-engine/prompts/` plus the selected article excerpt and the referenced JSON Schemas.
2. Save only the returned JSON as `diagram.json`, `motion.json`, or `narrative.json` in a temporary candidate directory outside tracked content.
3. Run `npm run evaluate:ai -- /absolute/path/to/candidates`.
4. Record structural and semantic errors, missing references, unsupported fields, repair iterations, approximate token size, and a human educational-quality review.
5. Compare with the manually reviewed canonical definition.

The harness reports approximate tokens using four characters per token when provider usage is unavailable. Repair iterations remain `null` until an actual model workflow supplies them.

## Expected failure patterns

- Invented objective, concept, node, or visual IDs.
- Unallowlisted animation names and easing.
- Scene timing that exceeds the declared duration.
- Captions that do not cover the full narrative.
- Rendering details or executable expressions leaking into semantic data.
- Visually plausible output that omits the educational objective or article grounding.
- Excessive verbosity and duplicated content across formats.

## Canonical comparison criteria

- **Diagram:** complete operating architecture, distinct happy/failure/observability paths, readable grouping.
- **Motion:** scheduling collision is temporally clear in 15–30 seconds and has an equivalent reduced-motion sequence.
- **Narrative:** clear instructional arc, objective on every scene, complete captions/transcript, and compilation to shared motion.

Before HubsTime generation, run at least 20 grounded samples per visual type and quantify first-pass validity, median repairs, reference-error frequency, token size, and human-rated educational usefulness.
