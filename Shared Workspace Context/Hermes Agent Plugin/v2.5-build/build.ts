/**
 * Build script for Hermes Agent Plugin v2.5
 */

import { build } from "bun";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

await build({
  entrypoints: [resolve(__dirname, "src/index.ts")],
  outdir: resolve(__dirname, "dist"),
  format: "esm",
  target: "node",
  splitting: true,
  minify: false,
  sourcemap: true,
  banner: `/**
 * Hermes Agent Plugin v2.5
 * Thread/Fork/Orchestration Skills
 * Built: ${new Date().toISOString()}
 */`,
});

console.log("Build complete: dist/index.js");
