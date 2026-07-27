import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  base: "./",
  resolve: {
    alias: {
      "@excalidraw/mermaid-to-excalidraw": resolve(import.meta.dirname, "src/visual-engine/excalidraw-mermaid-disabled.ts")
    }
  },
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.ts"],
    coverage: { reporter: ["text", "html"] }
  },
  build: {
    outDir: "assets/visual-engine",
    emptyOutDir: true,
    sourcemap: false,
    modulePreload: false,
    rollupOptions: {
      input: "src/visual-engine/index.ts",
      output: {
        entryFileNames: "visual-engine.js",
        chunkFileNames: "[name]-[hash].js",
        assetFileNames: "visual-engine.[ext]"
      }
    }
  }
});
