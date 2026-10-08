import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

/** Fail if an Astro-only build skipped Pagefind; derive public count from metadata. */
export function inspectCiArtifacts(root, base) {
	assert.ok(
		base === "/" || base === "/Zhenkun-blog-site/",
		"Unsupported CI base",
	);
	const directory = resolve(root);
	const chinesePosts = JSON.parse(
		readFileSync(resolve(directory, "api/allPostMeta.json"), "utf8"),
	);
	const englishPosts = JSON.parse(
		readFileSync(resolve(directory, "en/api/allPostMeta.json"), "utf8"),
	);
	const ids = new Set();
	for (const [locale, posts, prefix] of [
		["zh_CN", chinesePosts, base + "posts/"],
		["en", englishPosts, base + "en/posts/"],
	]) {
		assert.ok(Array.isArray(posts), "Public post metadata must be an array");
		for (const post of posts) {
			assert.equal(typeof post.id, "string", "Public post ID must be a string");
			assert.ok(!ids.has(post.id), "Duplicate public post ID");
			ids.add(post.id);
			assert.equal(post.lang, locale, "Metadata language does not match route");
			assert.ok(post.url.startsWith(prefix), "Post URL leaves CI base/locale");
		}
	}
	assert.ok(
		statSync(resolve(directory, "pagefind/pagefind.js")).size > 0,
		"Pagefind module is empty",
	);
	const entry = JSON.parse(
		readFileSync(resolve(directory, "pagefind/pagefind-entry.json"), "utf8"),
	);
	const languages = Object.values(entry.languages ?? {});
	assert.ok(languages.length > 0, "Pagefind has no indexed languages");
	for (const language of languages) {
		assert.ok(language.page_count > 0, "Pagefind language has no pages");
		assert.ok(
			statSync(resolve(directory, `pagefind/pagefind.${language.hash}.pf_meta`))
				.size > 0,
			"Pagefind metadata is empty",
		);
	}
	return {
		publicPosts: chinesePosts.length + englishPosts.length,
		publicPostsByLocale: {
			zh_CN: chinesePosts.length,
			en: englishPosts.length,
		},
		indexedLanguages: languages.length,
	};
}

if (
	process.argv[1] &&
	import.meta.url === pathToFileURL(process.argv[1]).href
) {
	const args = process.argv.slice(2);
	const base = args[args.indexOf("--base") + 1];
	const root = args.includes("--root")
		? args[args.indexOf("--root") + 1]
		: "dist";
	const { publicPostsByLocale } = inspectCiArtifacts(root, base);
	const checked = spawnSync(
		"python3",
		[
			"scripts/zhenkun-verify-deployment.py",
			"--root",
			root,
			"--base",
			base,
			"--expected-posts",
			String(publicPostsByLocale.zh_CN),
 "--expected-english-posts", String(publicPostsByLocale.en),
		],
		{ stdio: "inherit" },
	);
	if (checked.error) throw checked.error;
	process.exitCode = checked.status ?? 1;
}
