import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const source = "a353c2ee800bbff2865541288ea04308c245cdc5";
const origin = "http://127.0.0.1:4343";
const base = "/Zhenkun-blog-site/";
const { createInstance } = await import(pathToFileURL(`${process.cwd()}/dist/pagefind/pagefind.js`).href);
const instance = createInstance({ basePath: `${origin}${base}pagefind/`, language: "zh-cn" });
await instance.init();
const response = await instance.search("Zhenkun");
assert.ok(response.results.length > 0);
const results = await Promise.all(response.results.map((result) => result.data()));
assert.ok(results.every((result) => result.url === `${origin}${base}about/`));
const proof = {
  status: "PASS", source, base,
  module: "dist/pagefind/pagefind.js",
  version: JSON.parse(readFileSync("dist/pagefind/pagefind-entry.json", "utf8")).version,
  query: "Zhenkun",
  results: results.map(({ url, meta }) => ({ url, title: meta.title })),
  boundary: "Real emitted Pagefind module and real index/WASM via local HTTP in Node, with explicit deployment bundle basePath and zh-cn language. This verifies result URL resolution, not browser UI or default browser import inference."
};
writeFileSync("references/p4-capabilities-2026-10-02/pagefind-runtime-subpath.json", JSON.stringify(proof, null, 2) + "\n");
console.log(JSON.stringify(proof));
await instance.destroy();
