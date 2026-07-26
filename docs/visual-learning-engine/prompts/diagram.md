# Diagram DSL generation prompt

Generate one JSON document that validates against `schemas/visuals/diagram.schema.json`.

Use only facts in the supplied article excerpt and only package learning-objective/concept IDs. Explain the operating architecture for more than 200 automation sources. Include scheduler, dependency orchestration, sessions, connectors, concurrency queue, retry with backoff and jitter, circuit breaker, validation, downstream pipeline, structured logs, heartbeat/validation/trend monitoring, operator dashboard, and distinct happy/failure/observability edges.

Use stable kebab-case IDs, concise labels, an accessible long description, and coordinates within the declared viewport. Do not output Markdown, HTML, code, URLs, callbacks, CSS, renderer scene JSON, or fields absent from the schema. Return JSON only.
