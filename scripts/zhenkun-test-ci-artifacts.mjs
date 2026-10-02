import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { inspectCiArtifacts } from "./zhenkun-verify-ci-artifacts.mjs";

function fixture(t, options = {}) {
	const root = mkdtempSync(join(tmpdir(), "zhenkun-ci-artifacts-"));
	t.after(() => rmSync(root, { recursive: true }));
	mkdirSync(join(root, "api"));
	mkdirSync(join(root, "pagefind"));
	writeFileSync(
		join(root, "api/allPostMeta.json"),
		JSON.stringify(options.posts ?? []),
	);
	if (!options.missingModule)
		writeFileSync(join(root, "pagefind/pagefind.js"), "module");
	writeFileSync(
		join(root, "pagefind/pagefind-entry.json"),
		JSON.stringify({
			languages: options.languages ?? {
				en: { hash: "en_sample", page_count: 1 },
			},
		}),
	);
	writeFileSync(join(root, "pagefind/pagefind.en_sample.pf_meta"), "metadata");
	return root;
}

test("CI accepts an empty public corpus with a searchable About page", (t) => {
	assert.deepEqual(inspectCiArtifacts(fixture(t), "/Zhenkun-blog-site/"), {
		publicPosts: 0,
		indexedLanguages: 1,
	});
});

test("CI follows public metadata count when approved articles are added", (t) => {
	const root = fixture(t, {
		posts: [{ id: "approved", url: "/posts/approved/" }],
	});
	assert.equal(inspectCiArtifacts(root, "/").publicPosts, 1);
});

test("CI rejects Astro-only output without the Pagefind module", (t) => {
	assert.throws(
		() => inspectCiArtifacts(fixture(t, { missingModule: true }), "/"),
		/ENOENT/,
	);
});

test("CI rejects a module without any indexed language", (t) => {
	assert.throws(
		() => inspectCiArtifacts(fixture(t, { languages: {} }), "/"),
		/no indexed languages/,
	);
});

test("CI rejects an empty Pagefind language", (t) => {
	assert.throws(
		() =>
			inspectCiArtifacts(
				fixture(t, { languages: { en: { hash: "en_sample", page_count: 0 } } }),
				"/",
			),
		/no pages/,
	);
});

test("CI rejects a public post URL that lost the deployment base", (t) => {
	const root = fixture(t, {
		posts: [{ id: "approved", url: "/posts/approved/" }],
	});
	assert.throws(
		() => inspectCiArtifacts(root, "/Zhenkun-blog-site/"),
		/leaves CI base/,
	);
});

test("CI rejects duplicate public IDs", (t) => {
	const post = { id: "approved", url: "/posts/approved/" };
	assert.throws(
		() => inspectCiArtifacts(fixture(t, { posts: [post, post] }), "/"),
		/Duplicate/,
	);
});
