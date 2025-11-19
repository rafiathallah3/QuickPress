import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    background: "src/background.ts",
    content: "src/content.ts",
    popup: "src/popup.ts"
  },
  format: ["esm"],
  target: "chrome114",
  splitting: false,
  sourcemap: true,
  minify: false,
  clean: false,
  outDir: "dist",
  dts: false,
  outExtension() {
    return {
      js: ".js"
    };
  }
});

