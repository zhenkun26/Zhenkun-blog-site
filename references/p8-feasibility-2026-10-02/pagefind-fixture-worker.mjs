import assert from "node:assert/strict";
import { parentPort, workerData } from "node:worker_threads";

const { moduleUrl, basePath, locale, count, wrongToken } = workerData;
// Fresh JS/WASM context per language models initialization, not browser UI.
if (locale) globalThis.document = { currentScript: null, querySelector: () => ({ getAttribute: name => name === "lang" ? locale : null }) };
const { createInstance } = await import(moduleUrl);
const instance = createInstance({ basePath, ...(locale ? {} : { language: "en" }) });
try {
  await instance.init();
  const result = await instance.search("Capability");
  const data = await Promise.all(result.results.map(r => r.data()));
  assert.equal(result.results.length, count);
  const siteBase = basePath.replace(/pagefind\/$/, "");
  assert.ok(data.every(r => r.url.startsWith(siteBase)));
  assert.ok(data.every(r => r.url.includes(siteBase + "en/") === (locale === "en")));
  const crossLanguage = await instance.search(wrongToken);
  assert.equal(crossLanguage.results.length, 0);
  parentPort.postMessage({ locale: locale || "unknown", detection: locale ? "Minimal document html-lang seam in a fresh Worker JS/WASM context" : "No document: language=en option overridden by unknown detection; largest zh-cn index selected", passedLanguage: locale ? null : "en", query: "Capability", count, urls: data.map(r => r.url).sort(), crossLanguageQuery: wrongToken, crossLanguageCount: 0 });
} finally { await instance.destroy(); }
