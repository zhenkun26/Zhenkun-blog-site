import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";
import { runInNewContext } from "node:vm";
import { compile } from "svelte/compiler";
import { render } from "svelte/server";

const require = createRequire(import.meta.url);
const astroRequire = createRequire(require.resolve("astro"));
const svelteRequire = createRequire(require.resolve("svelte"));
const matter = require("gray-matter");
const matterRequire = createRequire(require.resolve("gray-matter"));
const astroDir = dirname(astroRequire.resolve("astro/package.json"));
const svelteDir = dirname(svelteRequire.resolve("svelte/package.json"));
const devalue = await import(
	pathToFileURL(astroRequire.resolve("devalue")).href
);

function manifestForEntry(entry) {
	let dir = dirname(entry);
	while (!readable(join(dir, "package.json"))) dir = dirname(dir);
	return JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
}
function readable(file) {
	try {
		readFileSync(file);
		return true;
	} catch {
		return false;
	}
}

function sample() {
	const shared = { title: "中文气象 🛰️", marker: "<span>safe fixture</span>" };
	return {
		shared,
		again: shared,
		published: new Date("2026-10-03T08:00:00Z"),
		labels: new Set(["天气", "科学"]),
		mapping: new Map([["station", shared]]),
		bytes: new Uint8Array([0, 1, 254]),
		count: 42n,
		missing: undefined,
	};
}

function assertRestored(value) {
	assert.equal(value.shared.title, "中文气象 🛰️");
	assert.equal(value.shared, value.again);
	assert.equal(value.mapping.get("station"), value.shared);
	assert.equal(value.published.toISOString(), "2026-10-03T08:00:00.000Z");
	assert.deepEqual([...value.labels], ["天气", "科学"]);
	assert.deepEqual([...value.bytes], [0, 1, 254]);
	assert.equal(value.count, 42n);
	assert.equal(value.missing, undefined);
}

test("R1a exact real-parent versions and unaffected YAML4", () => {
	assert.equal(
		manifestForEntry(astroRequire.resolve("devalue")).version,
		"5.9.3",
	);
	assert.equal(
		manifestForEntry(svelteRequire.resolve("devalue")).version,
		"5.9.3",
	);
	assert.equal(
		astroRequire.resolve("devalue"),
		svelteRequire.resolve("devalue"),
	);
	assert.equal(
		manifestForEntry(matterRequire.resolve("js-yaml")).version,
		"3.15.2",
	);
	assert.equal(
		manifestForEntry(astroRequire.resolve("js-yaml")).version,
		"4.3.2",
	);
});

test("devalue stringify/parse preserves supported rich data, identity and cycles", () => {
	const payload = sample();
	payload.self = payload;
	const serialized = devalue.stringify(payload);
	const restored = devalue.parse(serialized);
	assertRestored(restored);
	assert.equal(restored.self, restored);
	assert.equal({}.marker, undefined);
});

test("devalue uneval escapes harmless HTML data and reconstructs its value", () => {
	const payload = sample();
	const serialized = devalue.uneval(payload);
	assert.ok(!serialized.includes("<span>"));
	// Only generated code for this trusted, bounded data-only fixture is run.
	assertRestored(runInNewContext(`(${serialized})`, {}, { timeout: 1000 }));
});

test("devalue serializes only the visible bytes of a bounded owned Buffer view", () => {
	const owned = Buffer.from([17, 23, 42, 99]);
	const visible = owned.subarray(1, 3);
	const parsed = devalue.parse(devalue.stringify({ visible })).visible;
	assert.deepEqual([...parsed], [23, 42]);
	assert.equal(parsed.buffer.byteLength, 2);
	const unevaluated = runInNewContext(
		`(${devalue.uneval({ visible })})`,
		{},
		{
			timeout: 1000,
		},
	).visible;
	assert.deepEqual([...unevaluated], [23, 42]);
	assert.equal(unevaluated.buffer.byteLength, 2);
});

test("actual Astro store serialization and chunk parser round-trip Unicode/date data", async () => {
	const { serializeDataStore, chunkString } = await import(
		pathToFileURL(join(astroDir, "dist/content/data-store-writer.js")).href
	);
	const { ImmutableDataStore, ChunkedCollectionParser } = await import(
		pathToFileURL(join(astroDir, "dist/content/data-store.js")).href
	);
	const entry = { id: "fixture", data: sample(), body: "未公开的安全夹具" };
	const collections = new Map([["blog", new Map([["fixture", entry]])]]);
	const stored = devalue.parse(serializeDataStore(collections));
	const store = await ImmutableDataStore.fromMap(stored);
	assertRestored(store.get("blog", "fixture").data);
	const record = `${devalue.stringify(["fixture", entry])}\n`;
	const chunks = chunkString(record, 17);
	assert.equal(chunks.join(""), record);
	const parser = new ChunkedCollectionParser();
	for (const part of chunks) parser.add(part);
	assertRestored(parser.finish().get("fixture").data);
	const map = ImmutableDataStore.manifestToMap({ blog: chunks });
	assert.equal(map.get("blog").get("fixture").body, entry.body);
});

test("actual Svelte server payload and client hydratable data handoff", async () => {
	const fixtureDir = new URL("../tmp/r1a-runtime/", import.meta.url);
	mkdirSync(fixtureDir, { recursive: true });
	const compiled = compile(
		`<script>
			import { hydratable } from 'svelte';
			let { payload } = $props();
			const state = hydratable('r1a-fixture', () => payload);
		</script><p>{state.shared.title}</p>`,
		{
			generate: "server",
			filename: "R1aFixture.svelte",
			experimental: { async: true },
		},
	);
	const moduleUrl = new URL("fixture-server.mjs", fixtureDir);
	writeFileSync(moduleUrl, compiled.js.code);
	const { default: Component } = await import(moduleUrl.href);
	const output = await render(Component, { props: { payload: sample() } });
	assert.ok(output.body.includes("中文气象 🛰️"));
	const script = output.head.match(/<script[^>]*>([\s\S]*?)<\/script>/)?.[1];
	assert.ok(script?.includes("__svelte"));
	const windowFixture = {};
	// Execute only the actual trusted renderer's bounded fixture bootstrap.
	runInNewContext(script, { window: windowFixture }, { timeout: 1000 });
	assertRestored(windowFixture.__svelte.h.get("r1a-fixture"));
	const { set_hydrating } = await import(
		pathToFileURL(join(svelteDir, "src/internal/client/dom/hydration.js")).href
	);
	const { hydratable } = await import(
		pathToFileURL(join(svelteDir, "src/internal/client/hydratable.js")).href
	);
	const previousWindow = globalThis.window;
	globalThis.window = windowFixture;
	set_hydrating(true);
	try {
		let fallbackCalls = 0;
		const hydrated = hydratable("r1a-fixture", () => {
			fallbackCalls++;
			return null;
		});
		assertRestored(hydrated);
		assert.equal(fallbackCalls, 0);
	} finally {
		set_hydrating(false);
		globalThis.window = previousWindow;
	}
	// This checks the actual data handoff, not browser DOM/component hydration.
});

test("actual gray-matter frontmatter preserves dates, Unicode tags and aliases", () => {
	const result = matter(
		`---
 title: 中文气象 🛰️
 published: 2026-10-03T08:00:00Z
 draft: true
 tags: &labels [天气, 科学, "Unicode Ω"]
 aliasTags: *labels
 summary: |
   多行摘要
   第二行
 ---
# Private synthetic body
`.replace(/^ /gm, ""),
	);
	assert.equal(result.data.title, "中文气象 🛰️");
	assert.equal(result.data.published.toISOString(), "2026-10-03T08:00:00.000Z");
	assert.equal(result.data.draft, true);
	assert.deepEqual(result.data.tags, ["天气", "科学", "Unicode Ω"]);
	assert.equal(result.data.tags, result.data.aliasTags);
	assert.ok(result.content.includes("Private synthetic body"));
	const roundTrip = matter(matter.stringify(result.content, result.data));
	assert.equal(roundTrip.data.title, result.data.title);
	assert.equal(
		roundTrip.data.published.toISOString(),
		result.data.published.toISOString(),
	);
	assert.deepEqual(roundTrip.data.tags, result.data.tags);
	assert.equal({}.marker, undefined);
});
