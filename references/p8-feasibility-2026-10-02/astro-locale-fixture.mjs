import { verifySourceBaseline } from "./source-baseline.mjs";
import assert from "node:assert/strict";
import { spawnSync, execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, symlinkSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

// Synthetic capability probe only; never imports application content/config.
const baseCommit = "27e09c220e1ffe16817d5bf02e950a4fbf332b7b";
verifySourceBaseline();
const repo = process.cwd();
const evidence = join(repo, "references/p8-feasibility-2026-10-02");
const fixture = join(repo, "tmp/p8-astro-locale-fixture");
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const sourceFiles = {
  "package.json": JSON.stringify({ name: "p8-synthetic-capability-fixture", private: true, type: "module" }, null, 2),
  "astro.config.mjs": `import { defineConfig } from "astro/config";
export default defineConfig({
  site: process.env.P8_FIXTURE_SITE || "https://zhenkun26.github.io",
  base: process.env.P8_FIXTURE_BASE,
  outDir: process.env.P8_FIXTURE_OUT,
  cacheDir: new URL("./.astro-cache/", import.meta.url).pathname,
  vite: { cacheDir: new URL("./.vite-cache/", import.meta.url).pathname },
  trailingSlash: "always", output: "static",
  i18n: { locales: ["zh-cn", "en"], defaultLocale: "zh-cn", routing: { prefixDefaultLocale: false } }
});`,
  "src/layouts/Probe.astro": `---
import { getRelativeLocaleUrl, getAbsoluteLocaleUrl } from "astro:i18n";
const { locale, path = "", paired = true, title, token } = Astro.props;
const canonical = getAbsoluteLocaleUrl(locale, path);
const expectedLocale = Astro.currentLocale;
const links = paired ? ["zh-cn", "en"].map(lang => ({ lang, href: getAbsoluteLocaleUrl(lang, path) })) : [];
const forbiddenHelper = getAbsoluteLocaleUrl("en", "solo");
---
<!DOCTYPE html><html lang={locale}><head><meta charset="utf-8" /><title>{title}</title>
<link rel="canonical" href={canonical} />
{links.map(({lang, href}) => <link rel="alternate" hreflang={lang} href={href} />)}
</head><body data-astro-locale={expectedLocale} data-helper-unpaired-url={forbiddenHelper}>
<nav data-pagefind-ignore>
<a data-no-swup href={getRelativeLocaleUrl("zh-cn", path)}>中文</a>
{paired ? <a data-no-swup href={getRelativeLocaleUrl("en", path)}>EN</a> : <span aria-disabled="true">EN translation unavailable</span>}
</nav><main data-pagefind-body><h1 data-pagefind-meta="title">{title}</h1><p>Capability {token}</p><slot /></main>
</body></html>`,
  "src/pages/index.astro": `---
import Probe from "../layouts/Probe.astro";
---
<Probe locale="zh-cn" title="中文能力样例" token="ZXHanProbe"><p>仅测试中文首页。</p></Probe>`,
  "src/pages/about.astro": `---
import Probe from "../layouts/Probe.astro";
---
<Probe locale="zh-cn" path="about" title="中文说明样例" token="ZXHanProbe"><p>仅测试中文说明。</p></Probe>`,
  "src/pages/solo.astro": `---
import Probe from "../layouts/Probe.astro";
---
<Probe locale="zh-cn" path="solo" paired={false} title="仅中文样例" token="ZXHanProbe"><p>此样例没有英文版本。</p></Probe>`,
  "src/pages/en/index.astro": `---
import Probe from "../../layouts/Probe.astro";
---
<Probe locale="en" title="English capability sample" token="ENOnlyProbe"><p>Synthetic English home only.</p></Probe>`,
  "src/pages/en/about.astro": `---
import Probe from "../../layouts/Probe.astro";
---
<Probe locale="en" path="about" title="English about sample" token="ENOnlyProbe"><p>Synthetic English about only.</p></Probe>`,
};
for (const [relative, source] of Object.entries(sourceFiles)) {
  const target = join(fixture, relative);
  mkdirSync(resolve(target, ".."), { recursive: true });
  writeFileSync(target, `${source}\n`, "utf8");
}
if (!existsSync(join(fixture, "node_modules"))) symlinkSync(join(repo, "node_modules"), join(fixture, "node_modules"));
function filesUnder(dir, prefix = "") {
  return readdirSync(dir).sort().flatMap(name => {
    const rel = prefix + name;
    return statSync(join(dir, name)).isDirectory() ? filesUnder(join(dir, name), rel + "/") : [rel];
  });
}
function runTool(name, args, env, log) {
  const started = new Date().toISOString();
  const result = spawnSync(process.execPath, args, { cwd: fixture, env: { ...process.env, ASTRO_TELEMETRY_DISABLED: "1", ...env }, encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
  writeFileSync(join(evidence, log), `${result.stdout || ""}${result.stderr || ""}`);
  assert.equal(result.status, 0, `${name}: ${result.error || result.stderr}; see ${log}`);
  return { name, command: [process.execPath, ...args], started, exitCode: result.status, log };
}
const cases = [];
const rawSiteCases = [];
for (const [name, base] of [["root", "/"], ["subpath", "/Zhenkun-blog-site/"]]) {
  const dist = join(fixture, `dist-raw-site-${name}`);
  const stage = runTool("Astro existing site URL compatibility probe", [join(repo, "node_modules/astro/bin/astro.mjs"), "build"], { P8_FIXTURE_BASE: base, P8_FIXTURE_OUT: dist, P8_FIXTURE_SITE: "https://zhenkun26.github.io/Zhenkun-blog-site/" }, `fixture-raw-site-build-${name}.log`);
  const html = readFileSync(join(dist, "index.html"), "utf8");
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  assert.equal(canonical, "https://zhenkun26.github.io/Zhenkun-blog-site/" + (base === "/" ? "" : "Zhenkun-blog-site/"));
  rawSiteCases.push({ base, stage, canonical, expectedCorrectCanonical: "https://zhenkun26.github.io" + base, compatibleWithoutAdapter: false });
  writeFileSync(join(evidence, `fixture-raw-site-${name}.html`), html);
}
for (const [name, base] of [["root", "/"], ["subpath", "/Zhenkun-blog-site/"]]) {
  const dist = join(fixture, `dist-${name}`);
  const stages = [runTool("Astro minimal static locale build", [join(repo, "node_modules/astro/bin/astro.mjs"), "build"], { P8_FIXTURE_BASE: base, P8_FIXTURE_OUT: dist }, `fixture-build-${name}.log`)];
  stages.push(runTool("Pagefind on synthetic localized HTML", [join(repo, "node_modules/pagefind/lib/runner/bin.cjs"), "--site", dist], {}, `fixture-pagefind-${name}.log`));
  const expected = { "index.html": ["zh-cn", ""], "about/index.html": ["zh-cn", "about/"], "solo/index.html": ["zh-cn", "solo/"], "en/index.html": ["en", "en/"], "en/about/index.html": ["en", "en/about/"] };
  const metadata = [];
  for (const [relative, [locale, route]] of Object.entries(expected)) {
    const html = readFileSync(join(dist, relative), "utf8");
    const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
    assert.equal(canonical, "https://zhenkun26.github.io" + base + route);
    assert.ok(html.includes(`<html lang="${locale}">`));
    assert.ok(html.includes(`data-astro-locale="${locale}"`));
    const alternates = [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)].map(m => ({ lang: m[1], url: m[2] }));
    const logical = route.replace(/^en\//, "");
    const paired = !route.includes("solo");
    assert.deepEqual(alternates, paired ? [{ lang: "zh-cn", url: "https://zhenkun26.github.io" + base + logical }, { lang: "en", url: "https://zhenkun26.github.io" + base + "en/" + logical }] : []);
    assert.ok(!html.includes(base + "Zhenkun-blog-site/"));
    if (!paired) {
      assert.ok(html.includes('aria-disabled="true"'));
      assert.ok(!html.includes(`href="${base}en/solo/"`));
      assert.ok(html.includes(`data-helper-unpaired-url="https://zhenkun26.github.io${base}en/solo/"`));
    }
    metadata.push({ relative, locale, canonical, alternates, sha256: sha(html) });
  }
  assert.equal(existsSync(join(dist, "en/solo/index.html")), false);
  const entry = JSON.parse(readFileSync(join(dist, "pagefind/pagefind-entry.json"), "utf8"));
  assert.deepEqual(Object.keys(entry.languages).sort(), ["en", "zh-cn"]);
  const server = createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    if (!pathname.startsWith(base)) { response.writeHead(404); response.end("Outside fixture base"); return; }
    const relative = pathname.slice(base.length) || "index.html";
    const candidate = resolve(dist, relative.endsWith("/") ? relative + "index.html" : relative);
    if (!candidate.startsWith(dist + "/") || !existsSync(candidate) || !statSync(candidate).isFile()) { response.writeHead(404); response.end("No synthetic translation"); return; }
    response.writeHead(200, { "Content-Type": candidate.endsWith(".wasm") ? "application/wasm" : candidate.endsWith(".js") ? "text/javascript" : candidate.endsWith(".html") ? "text/html; charset=utf-8" : "application/octet-stream" });
    response.end(readFileSync(candidate));
  });
  const checks = [], search = [];
  let serverClosed = false;
  try {
    await new Promise((ok, fail) => { server.once("error", fail); server.listen(0, "127.0.0.1", ok); });
    const origin = `http://127.0.0.1:${server.address().port}`;
    for (const [relative, [, route]] of Object.entries(expected)) {
      const response = await fetch(origin + base + route);
      assert.equal(response.status, 200);
      const bytes = Buffer.from(await response.arrayBuffer());
      assert.equal(sha(bytes), sha(readFileSync(join(dist, relative))));
      checks.push({ url: origin + base + route, status: response.status, sha256: sha(bytes) });
    }
    const missing = await fetch(origin + base + "en/solo/");
    assert.equal(missing.status, 404);
    checks.push({ url: origin + base + "en/solo/", status: missing.status });
    for (const [locale, count, wrongToken] of [[null, 3, "ENOnlyProbe"], ["zh-cn", 3, "ENOnlyProbe"], ["en", 2, "ZXHanProbe"]]) {
      const { Worker } = await import("node:worker_threads");
      const result = await new Promise((ok, fail) => {
        let message;
        const worker = new Worker(join(evidence, "pagefind-fixture-worker.mjs"), { workerData: { moduleUrl: pathToFileURL(join(dist, "pagefind/pagefind.js")).href, basePath: origin + base + "pagefind/", locale, count, wrongToken } });
        worker.once("message", value => { message = value; });
        worker.once("error", fail);
        worker.once("exit", code => code === 0 && message ? ok(message) : fail(new Error(`Worker exited ${code} without a result`)));
      });
      search.push(result);
    }
  } finally {
    if (server.listening) await new Promise((ok, fail) => server.close(error => error ? fail(error) : ok()));
    serverClosed = !server.listening;
  }
  assert.equal(serverClosed, true);
  cases.push({ name, base, stages, metadata, pagefind: { version: entry.version, languages: Object.keys(entry.languages), search }, httpChecks: checks, serverClosed,
    emitted: Object.fromEntries(filesUnder(dist).map(relative => [relative, sha(readFileSync(join(dist, relative)))])) });
}
const proof = { status: "PASS_SYNTHETIC_ASTRO_DUAL_BASE_LOCALES", baseCommit, node: process.version,
  fixtureSources: Object.fromEntries(Object.keys(sourceFiles).map(relative => [relative, sha(readFileSync(join(fixture, relative)))])), rawSiteCases, cases,
  boundaries: ["Installed Astro 7.2.10/Pagefind 1.5.2 only; no dependency setup or production source/config/content changes.", "Static explicit pages and per-page locale props. Raw existing site URL reproduces path retention/duplication; successful cases use origin-only site plus deployment base, a proposed adapter in the synthetic config only.", "No fallback rewrite or generated missing translation. Astro locale URL helper can construct a nonexistent target; available-pair registry must guard links/hreflang.", "Real emitted Pagefind JS/index/WASM over temporary loopback HTTP in Node with explicit basePath and a minimal html-lang detection seam; the public createInstance language option is empirically ignored in 1.5.2. Browser initial inference, language toggle DOM/focus/persistence/Swup and full theme integration remain untested.", "Five synthetic pages only. Not a production full build, publication-filter proof, translated owner content, screenshots, SEO crawl, Linux/hosted CI or release acceptance."] };
writeFileSync(join(evidence, "astro-locale-fixture.json"), JSON.stringify(proof, null, 2) + "\n");
console.log(JSON.stringify({ status: proof.status, cases: cases.map(c => ({ base: c.base, pages: c.metadata.length, http: c.httpChecks.length, search: c.pagefind.search.map(s => [s.locale, s.count]), serverClosed: c.serverClosed })) }));
