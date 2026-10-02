/** Exercise the real endpoint with in-memory content and the real Markdown processor. */
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import test from "node:test";

const markdownModule = import.meta.resolve("@astrojs/markdown-remark");
const dynamicUtils = new URL("../src/utils/dynamic-utils.ts", import.meta.url)
	.href;
const modules = {
	"astro:content": `
		export async function getCollection(name) {
			const state = globalThis.__zhenkunCapabilityTest;
			state.collectionCalls.push(name);
			if (state.rejectContentRead) throw new Error("disabled content must not be read");
			return state.entries;
		}
	`,
	"@/config/siteConfig": `
		export const siteConfig = {
			get pages() { return { dynamic: globalThis.__zhenkunCapabilityTest.enabled }; }
		};
	`,
	"@astrojs/markdown-remark": `
		import { createMarkdownProcessor as realProcessor } from ${JSON.stringify(markdownModule)};
		export async function createMarkdownProcessor(...args) {
			globalThis.__zhenkunCapabilityTest.processorCalls++;
			return realProcessor(...args);
		}
	`,
};
const hooks = registerHooks({
	resolve(specifier, context, nextResolve) {
		if (Object.hasOwn(modules, specifier)) {
			return {
				url: `data:text/javascript,${encodeURIComponent(modules[specifier])}`,
				shortCircuit: true,
			};
		}
		if (specifier === "@/utils/dynamic-utils") {
			return { url: dynamicUtils, shortCircuit: true };
		}
		return nextResolve(specifier, context);
	},
});
const { GET } = await import("../src/pages/api/dynamic.json.ts");

function fixture(id, body, published, pinned = false) {
	return {
		id,
		body,
		data: {
			published: new Date(published),
			pinned,
			location: " Test Location ",
		},
	};
}

function scenario(enabled, entries, rejectContentRead = false) {
	const state = {
		enabled,
		entries,
		rejectContentRead,
		collectionCalls: [],
		processorCalls: 0,
	};
	globalThis.__zhenkunCapabilityTest = state;
	return state;
}

test("disabled dynamic endpoint returns no configured content and performs no work", async () => {
	const state = scenario(false, [
		fixture("sentinel.md", "DISABLED_DYNAMIC_SENTINEL", "2026-01-01"),
	]);
	const response = await GET();
	assert.equal(response.status, 200);
	assert.equal(
		response.headers.get("content-type"),
		"application/json; charset=utf-8",
	);
	assert.equal(await response.text(), "[]");
	assert.deepEqual(state.collectionCalls, []);
	assert.equal(state.processorCalls, 0);
});

test("disabled dynamic endpoint succeeds without even loading a failing content source", async () => {
	const state = scenario(false, [], true);
	assert.deepEqual(await (await GET()).json(), []);
	assert.deepEqual(state.collectionCalls, []);
	assert.equal(state.processorCalls, 0);
});

test("enabled dynamic endpoint preserves real Markdown, image metadata, sorting and JSON schema", async () => {
	const state = scenario(true, [
		fixture(
			"old.md",
			'Old **note** ![alt](/image.avif "Image title")',
			"2026-01-01",
		),
		fixture("new.mdx", "New note", "2026-02-01"),
		fixture("pinned.md", "Pinned note", "2025-01-01", true),
	]);
	const response = await GET();
	assert.equal(response.status, 200);
	assert.equal(
		response.headers.get("content-type"),
		"application/json; charset=utf-8",
	);
	const result = await response.json();
	assert.deepEqual(
		result.map((entry) => entry.id),
		["pinned", "new", "old"],
	);
	assert.deepEqual(Object.keys(result[2]).sort(), [
		"html",
		"id",
		"images",
		"location",
		"pinned",
		"published",
		"searchText",
	]);
	assert.equal(result[0].pinned, true);
	assert.equal(result[2].published, Date.parse("2026-01-01"));
	assert.equal(result[2].location, "Test Location");
	assert.match(result[2].html, /<strong>note<\/strong>/);
	assert.ok(!result[2].html.includes("<img"));
	assert.deepEqual(result[2].images, [
		{ alt: "alt", src: "/image.avif", title: "Image title" },
	]);
	assert.equal(result[2].searchText, "old note  test location ");
	assert.deepEqual(state.collectionCalls, ["dynamic"]);
	assert.equal(state.processorCalls, 1);
});

test("enabled dynamic endpoint retains a valid empty collection response", async () => {
	const state = scenario(true, []);
	assert.deepEqual(await (await GET()).json(), []);
	assert.deepEqual(state.collectionCalls, ["dynamic"]);
	assert.equal(state.processorCalls, 1);
});

test.after(() => {
	hooks.deregister();
	delete globalThis.__zhenkunCapabilityTest;
});
