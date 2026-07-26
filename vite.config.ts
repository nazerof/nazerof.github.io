import { defineConfig } from "vitest/config";

export default defineConfig({
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
