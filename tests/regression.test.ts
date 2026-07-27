import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("portfolio integration", () => {
  const root = process.cwd();
  const article = readFileSync(resolve(root, "pages/blog/rpa-scaling.html"), "utf8");

  it("keeps current public routes present", () => {
    [
      "index.html",
      "pages/blog.html",
      "pages/projects.html",
      "pages/add-me.html",
      "pages/blog/rpa-scaling.html",
      "pages/blog/ai-agents-before-hype.html",
      "pages/blog/teaching-math-to-machines.html"
    ].forEach((route) => expect(existsSync(resolve(root, route)), route).toBe(true));
  });

  it("preserves the article and integrates exactly three declarative hosts", () => {
    expect(article).toContain("Scaling RPA: From Proof-of-Concept to 200+ Data Sources");
    expect(article.match(/class="visual-learning-host"/g)).toHaveLength(3);
    expect(article).toContain("The most important lesson was the simplest");
    expect(article).toContain("<noscript>");
  });

  it("loads Excalidraw through a dynamic import only", () => {
    const entry = readFileSync(resolve(root, "src/visual-engine/index.ts"), "utf8");
    expect(entry).toContain('await import("./diagram-editor")');
    expect(entry).not.toContain('from "@excalidraw/excalidraw"');
  });

  it("keeps article fallbacks outside the runtime mount", () => {
    expect(article).toContain("visual-static-fallback");
    expect(article).toContain("Structured diagram description");
    expect(article).toContain("Read the complete transcript");
  });
});
