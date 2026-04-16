import { build } from "bun";
import { resolve } from "path";

await build({
  entrypoints: [resolve("./src/index.ts")],
  outdir: resolve("./dist"),
  format: "esm",
  target: "bun",
  minify: false,
});

console.log("Built: dist/index.js");
