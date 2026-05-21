import { build } from "esbuild";
import { copyFile, mkdir } from "node:fs/promises";

await mkdir("dist", { recursive: true });
await mkdir("examples/shiny/www", { recursive: true });

for (const minify of [false, true]) {
  const suffix = minify ? ".min" : "";
  await build({
    entryPoints: ["src/browser-global.js"],
    bundle: true,
    format: "iife",
    globalName: "IncCSV",
    legalComments: "eof",
    minify,
    outfile: `dist/inccsv.browser${suffix}.js`,
    sourcemap: true,
    target: ["es2020"],
  });
}

await copyFile("dist/inccsv.browser.js", "examples/shiny/www/inccsv.browser.js");
await copyFile("dist/inccsv.browser.js.map", "examples/shiny/www/inccsv.browser.js.map");

console.log("Built dist/inccsv.browser.js and dist/inccsv.browser.min.js");
console.log("Copied dist/inccsv.browser.js into examples/shiny/www/");
