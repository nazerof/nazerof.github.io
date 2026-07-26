# HubsTime portability mapping

| Portfolio package | Future HubsTime model |
|---|---|
| Source article | Source grounding record |
| Visual package | Lesson visual-content package |
| Audience level and roles | Course audience/learner profile |
| Learning objective | Lesson learning objective |
| Concept | Course concept/knowledge-node reference |
| Diagram, motion, narrative | Typed interactive content block |
| Duration | Estimated learning time |
| Visual references | Reuse between lesson content blocks |
| Schema/semantic result | Validation status and diagnostics |
| Provenance extension | Generation model, prompt, source, review status |
| Renderer capability | Renderer selection/capability negotiation |
| Exported scene or media | Generated asset |

## Reusable as-is

- JSON Schema validation boundary and conservative input limits.
- Framework-agnostic TypeScript types, semantic validation, and normalized motion timeline.
- Narrative-to-motion compiler.
- SVG/DOM motion renderer and accessible controls.
- Diagram semantic adapter boundary.
- Prompt/evaluation workflow.

## Reusable with extension

- Package schema needs course/module/lesson IDs, source citations, localization, and tenant-safe asset IDs.
- Narrative needs richer assessment and learner-controlled branching.
- Renderer capabilities need version negotiation.
- Provenance needs model, prompt version, repair history, human approval, and policy status.

## Portfolio-specific

- Relative file URLs, static HTML hosts, portfolio theme, article-specific fallback markup, and GitHub Pages build output.

## HubsTime-specific work

- Database persistence, tenant authorization, asset service/CDN, generation jobs, review workflow, localization, analytics, course-editor UX, and content-block lifecycle.

The first HubsTime experiment should ingest one validated visual package as a lesson content block and render it read-only. It should not begin with generation or editing.
