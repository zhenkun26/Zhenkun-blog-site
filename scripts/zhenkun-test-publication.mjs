/**
 * Publication/Wiki regressions using authored, in-memory Markdown/MDX fixtures.
 * Run with: node --test scripts/zhenkun-test-publication.mjs
 * Exercises the installed Astro Markdown/MDX processors and the real scanner
 * against a controlled in-memory filesystem. Native fs mocks run synchronously
 * and restore in finally; no disk fixtures, builds, installs or network calls.
 * Relative-image optimization, route emission and heading existence need separate
 * production-artifact acceptance. MDX compilation is not a full page/SSR build.
 */
import assert from "node:assert/strict";
import nativeFs from "node:fs";
import { createRequire, syncBuiltinESMExports } from "node:module";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createMarkdownProcessor } from "@astrojs/markdown-remark";
import { fromHtml } from "hast-util-from-html";
import { remarkWikiLink } from "../src/plugins/remark-wiki-link.js";
import {
	assertProductionBuild,
	getPostId,
	getPostPath,
	withDeploymentBase,
} from "../src/utils/post-contract.ts";
import { readWikiPosts, WikiPostIndex } from "../src/utils/wiki-link-index.ts";

const require = createRequire(import.meta.url);
const astroPackage = pathToFileURL(require.resolve("astro/package.json"));
const { getContentEntryIdAndSlug } = await import(
	new URL("./dist/content/utils.js", astroPackage).href
);
const { getRouteGenerator } = await import(
	new URL("./dist/core/routing/generator.js", astroPackage).href
);
const mdxPackage = pathToFileURL(require.resolve("@astrojs/mdx/package.json"));
const { createMdxProcessor } = await import(
	new URL("./dist/plugins.js", mdxPackage).href
);
// Synthetic files live under an approved source root but never exist on disk.
const fixtureRoot = fileURLToPath(
	new URL(
		"../src/content/posts/__zhenkun_publication_fixtures__/",
		import.meta.url,
	),
);
const sourceURL = pathToFileURL(`${fixtureRoot}/reader/source.md`);
const generatedRoute = getRouteGenerator(
	[
		[{ content: "posts", dynamic: false, spread: false }],
		[{ content: "...slug", dynamic: true, spread: true }],
	],
	"always",
);

function post(
	id,
	contentPath,
	data = {},
	body = "## Install Guide\n\nTARGET_BODY_SENTINEL",
) {
	return {
		id,
		contentPath,
		filePath: path.join(fixtureRoot, `${contentPath}.md`),
		data: {
			title: "PUBLIC_TITLE",
			description: "PUBLIC_DESCRIPTION",
			published: "2026-10-01",
			category: "Engineering",
			tags: ["Astro"],
			...data,
		},
		body,
	};
}

const publicPost = post("published/stable", "guide/source", {
	slug: "published/stable",
});
const privatePost = post(
	"draft-route",
	"drafts/secret",
	{
		draft: true,
		title: "PRIVATE_TITLE_SENTINEL",
		description: "PRIVATE_DESCRIPTION_SENTINEL",
		image: "/PRIVATE_COVER_SENTINEL.png",
		category: "PRIVATE_CATEGORY_SENTINEL",
		tags: ["PRIVATE_TAG_SENTINEL"],
	},
	"PRIVATE_BODY_SENTINEL",
);
const defaultIndex = new WikiPostIndex([publicPost, privatePost]);

// Processor errors are logged by Astro before rejection; capture both channels
// so expected failures stay quiet and disclosure checks cover diagnostics too.
async function render(markdown, options = {}, frontmatter = {}) {
	const messages = [];
	const originalWarn = console.warn;
	const originalError = console.error;
	console.warn = (...values) => messages.push(values.map(String).join(" "));
	console.error = (...values) => messages.push(values.map(String).join(" "));
	try {
		const processor = await createMarkdownProcessor({
			syntaxHighlight: false,
			smartypants: false,
			remarkPlugins: [
				[
					remarkWikiLink,
					{
						base: "/",
						production: true,
						postIndex: defaultIndex,
						...options,
					},
				],
			],
			rehypePlugins: [],
		});
		return {
			result: await processor.render(markdown, {
				fileURL: sourceURL,
				frontmatter,
			}),
			messages,
		};
	} catch (error) {
		return { error, messages };
	} finally {
		console.warn = originalWarn;
		console.error = originalError;
	}
}

// This is the same installed MDX processor factory used by the Astro integration.
// Observe its actual HAST without replacing parsing or the Wiki transformer.
async function compileMdx(source, options = {}, frontmatter = {}) {
	const messages = [];
	let observedTree;
	const originalWarn = console.warn;
	console.warn = (...values) => messages.push(values.map(String).join(" "));
	try {
		const processor = createMdxProcessor(
			{
				syntaxHighlight: false,
				smartypants: false,
				gfm: true,
				optimize: false,
				recmaPlugins: [],
				remarkRehype: {},
				remarkPlugins: [
					[
						remarkWikiLink,
						{
							base: "/",
							production: true,
							postIndex: defaultIndex,
							...options,
						},
					],
				],
				rehypePlugins: [
					() => (tree) => {
						observedTree = structuredClone(tree);
					},
				],
			},
			{ sourcemap: false },
		);
		const compiled = await processor.process({
			value: source,
			path: fileURLToPath(sourceURL).replace(/\.md$/, ".mdx"),
			data: { astro: { frontmatter } },
		});
		return {
			result: { code: String(compiled.value), tree: observedTree },
			messages,
		};
	} catch (error) {
		return { error, messages };
	} finally {
		console.warn = originalWarn;
	}
}

function nodesMatching(tree, predicate) {
	const matches = [];
	function visit(node) {
		if (predicate(node)) matches.push(node);
		for (const child of node.children ?? []) visit(child);
	}
	visit(tree);
	return matches;
}

function dirent(name, kind = "file") {
	return {
		name,
		isDirectory: () => kind === "directory",
		isFile: () => kind === "file",
		isSymbolicLink: () => kind === "symlink",
	};
}

// Standard Node live-binding synchronization lets the unmodified scanner use
// controlled read operations. No implementation is copied and no real I/O falls
// through. The callback must be synchronous; all processors run after restoration.
function scanMemory({
	directories,
	files = {},
	resolvedRoot = path.resolve(fixtureRoot),
}) {
	const originals = {
		readdirSync: nativeFs.readdirSync,
		readFileSync: nativeFs.readFileSync,
		realpathSync: nativeFs.realpathSync,
	};
	const reads = [];
	const visited = [];
	try {
		nativeFs.realpathSync = (directory) => {
			assert.equal(directory, fixtureRoot);
			return resolvedRoot;
		};
		nativeFs.readdirSync = (directory, options) => {
			assert.deepEqual(options, { withFileTypes: true });
			const relative = path.relative(fixtureRoot, directory);
			assert.ok(
				Object.hasOwn(directories, relative),
				`Unexpected directory read: ${relative}`,
			);
			visited.push(relative);
			return [...directories[relative]];
		};
		nativeFs.readFileSync = (filePath, encoding) => {
			assert.equal(encoding, "utf8");
			const relative = path.relative(fixtureRoot, filePath);
			assert.ok(
				Object.hasOwn(files, relative),
				`Unexpected file read: ${relative}`,
			);
			reads.push(relative);
			return files[relative];
		};
		syncBuiltinESMExports();
		return { posts: readWikiPosts(fixtureRoot), reads, visited };
	} catch (error) {
		return { error, reads, visited };
	} finally {
		Object.assign(nativeFs, originals);
		syncBuiltinESMExports();
		for (const [name, original] of Object.entries(originals)) {
			assert.equal(nativeFs[name], original, `${name} must be restored.`);
		}
	}
}

function successful(outcome) {
	assert.ifError(outcome.error);
	assert.ok(outcome.result);
	return outcome.result.code;
}

function assertNoPrivateDisclosure(outcome) {
	assert.doesNotMatch(
		JSON.stringify({
			html: outcome.result?.code,
			error: String(outcome.error ?? ""),
			messages: outcome.messages,
		}),
		/PRIVATE_/,
	);
}

function assertRejected(outcome, reason) {
	assert.ok(
		outcome.error instanceof Error,
		"Production must reject the source.",
	);
	assert.match(String(outcome.error), reason);
	assert.equal(
		outcome.result,
		undefined,
		"No successful rendered output on rejection.",
	);
	assertNoPrivateDisclosure(outcome);
	assert.doesNotMatch(
		outcome.messages.join("\n"),
		/card-wiki-link|<a\b|<img\b/,
	);
}

function assertDevelopmentGap(outcome, source, reason) {
	const html = successful(outcome);
	assert.ok(
		html.includes(source),
		"The unresolved Wiki syntax must stay visible.",
	);
	assert.doesNotMatch(html, /<a\b|<img\b|card-wiki-link/);
	assert.match(outcome.messages.join("\n"), reason);
	assertNoPrivateDisclosure(outcome);
}

for (const [label, base, prefix] of [
	["root", "/", ""],
	["subpath", "/Zhenkun-blog-site/", "/Zhenkun-blog-site"],
]) {
	await test(`${label}: inline and standalone links use the same public route`, async () => {
		const inline = successful(
			await render("Read [[guide/source]] now.", { base }),
		);
		assert.match(
			inline,
			new RegExp(
				`Read <a href="${prefix}/posts/published/stable/">PUBLIC_TITLE</a> now\\.`,
			),
		);
		assert.doesNotMatch(inline, /card-wiki-link/);
		const card = successful(await render("[[published/stable]]", { base }));
		assert.match(card, /class="card-wiki-link no-styling"/);
		assert.ok(card.includes(`href="${prefix}/posts/published/stable/"`));
		for (const expected of [
			"PUBLIC_TITLE",
			"PUBLIC_DESCRIPTION",
			"2026-10-01",
			"Engineering",
			"#Astro",
		]) {
			assert.ok(card.includes(expected));
		}
		assert.doesNotMatch(card, /TARGET_BODY_SENTINEL|PRIVATE_/);
	});

	await test(`${label}: aliases, Obsidian automatic aliases and multiple references`, async () => {
		const alias = successful(
			await render("[[guide/source|Read this]]", { base }),
		);
		assert.match(alias, /class="wlc-title">Read this<\/div>/);
		const automatic = successful(
			await render("[[guide/source|source]]", { base }),
		);
		assert.match(automatic, /class="wlc-title">PUBLIC_TITLE<\/div>/);
		const multiple = successful(
			await render(
				"Before [[guide/source|First]] between [[published/stable|Second]] after.",
				{ base },
			),
		);
		assert.equal((multiple.match(/<a /g) ?? []).length, 2);
		assert.ok(multiple.includes(">First</a> between <a "));
		assert.ok(multiple.startsWith("<p>Before "));
		assert.ok(multiple.endsWith(" after.</p>"));
	});

	await test(`${label}: compatible heading links retain anchors and avoid cards`, async () => {
		const cross = successful(
			await render("[[guide/source#Install Guide|Setup]]", { base }),
		);
		assert.ok(
			cross.includes(
				`href="${prefix}/posts/published/stable/#install-guide">Setup</a>`,
			),
		);
		assert.doesNotMatch(cross, /card-wiki-link/);
		const own = await render("## Install Guide\n\n[[#Install Guide]]", {
			base,
		});
		const ownHTML = successful(own);
		assert.ok(ownHTML.includes('href="#install-guide"'));
		assert.ok(ownHTML.includes('id="install-guide"'));
		assert.deepEqual(own.result.metadata.headings, [
			{ depth: 2, slug: "install-guide", text: "Install Guide" },
		]);
		const unicode = successful(
			await render("## 中文标题\n\n[[#中文标题]]", { base }),
		);
		assert.ok(unicode.includes('href="#%E4%B8%AD%E6%96%87%E6%A0%87%E9%A2%98"'));
		assert.ok(unicode.includes('id="中文标题"'));
	});

	for (const [kind, target] of [
		["slug", "draft-route"],
		["path", "drafts/secret"],
		["basename", "secret"],
	]) {
		await test(`${label}: production rejects draft target by ${kind} without metadata disclosure`, async () => {
			for (const source of [`Read [[${target}]].`, `[[${target}]]`]) {
				assertRejected(await render(source, { base }), /is hidden/);
			}
		});
	}

	await test(`${label}: production rejects missing targets and development leaves actionable text`, async () => {
		for (const source of ["Read [[missing]].", "[[missing]]"]) {
			assertRejected(await render(source, { base }), /is missing/);
			assertDevelopmentGap(
				await render(source, { base, production: false }),
				"[[missing]]",
				/is missing/,
			);
		}
	});

	await test(`${label}: unsupported embeds and block references do not become links`, async () => {
		for (const source of [
			"![[guide/source]]",
			"![[image.png]]",
			"[[guide/source#^block]]",
			"[[guide/source#one#two]]",
		]) {
			assertRejected(await render(source, { base }), /unsupported/);
			assertDevelopmentGap(
				await render(source, { base, production: false }),
				source,
				/unsupported/,
			);
		}
	});
}

await test("source drafts skip production Wiki conversion before resolving targets", async () => {
	const source = "[[draft-route]]\n\n[[missing]]\n\n![[image.png]]";
	const outcome = await render(source, {}, { draft: true });
	const html = successful(outcome);
	assert.equal(outcome.messages.length, 0);
	assert.doesNotMatch(html, /<a\b|<img\b|card-wiki-link/);
	for (const literal of ["[[draft-route]]", "[[missing]]", "![[image.png]]"])
		assert.ok(html.includes(literal));
	assertNoPrivateDisclosure(outcome);
});

await test("development can deliberately preview draft metadata", async () => {
	const html = successful(
		await render("[[draft-route]]", { production: false }),
	);
	assert.ok(html.includes('href="/posts/draft-route/"'));
	assert.ok(html.includes("PRIVATE_TITLE_SENTINEL"));
	assert.ok(html.includes("PRIVATE_DESCRIPTION_SENTINEL"));
	assert.doesNotMatch(html, /PRIVATE_BODY_SENTINEL/);
});

const ambiguousPosts = [
	post("one/public", "one/note"),
	post("two/public", "two/note"),
];
for (const posts of [ambiguousPosts, [...ambiguousPosts].reverse()]) {
	await test(`duplicate basename is ambiguous regardless of enumeration order (${posts[0].id})`, async () => {
		const postIndex = new WikiPostIndex(posts);
		assertRejected(await render("[[note]]", { postIndex }), /is ambiguous/);
		assertDevelopmentGap(
			await render("[[note]]", { postIndex, production: false }),
			"[[note]]",
			/is ambiguous/,
		);
		const exact = successful(await render("[[one/note]]", { postIndex }));
		assert.ok(exact.includes('href="/posts/one/public/"'));
	});
}

await test("a hidden exact path cannot fall back to another public basename", async () => {
	const postIndex = new WikiPostIndex([
		post("visible-note", "public/secret"),
		privatePost,
	]);
	assertRejected(await render("[[drafts/secret]]", { postIndex }), /is hidden/);
	const visible = successful(await render("[[secret]]", { postIndex }));
	assert.ok(visible.includes('href="/posts/visible-note/"'));
	assert.doesNotMatch(visible, /PRIVATE_/);
});

await test("duplicate article IDs reject the index instead of selecting the first entry", () => {
	for (const posts of [
		[post("shared", "one/a"), post("shared", "two/b", privatePost.data)],
		[
			post("same-stem", "one/same"),
			{
				...post("same-stem", "one/same"),
				filePath: `${fixtureRoot}/one/same.mdx`,
			},
		],
	]) {
		assert.throws(
			() => new WikiPostIndex(posts),
			(error) => {
				assert.match(String(error), /Duplicate post ID/);
				assert.doesNotMatch(String(error), /PRIVATE_/);
				return true;
			},
		);
	}
});

for (const target of [
	"../secret",
	"/drafts/secret",
	"guide/../../secret",
	"guide\\source",
	"guide//source",
	"guide/source.markdown",
]) {
	await test(`invalid or unsupported source target is not a ghost link: ${target}`, async () => {
		const source = `[[${target}]]`;
		assertRejected(await render(source), /is (invalid|missing)/);
		assertDevelopmentGap(
			await render(source, { production: false }),
			source,
			/is (invalid|missing)/,
		);
	});
}

for (const id of [
	"../secret",
	"/secret",
	"a//b",
	"a\\b",
	"a%2fb",
	"a?b",
	"a#b",
	"https:note",
	"a\u0000b",
	"e\u0301",
	" padded",
	"a/ padded",
]) {
	await test(`unsafe article ID fails before metadata can render: ${JSON.stringify(id)}`, () => {
		assert.throws(
			() => new WikiPostIndex([post(id, "invalid/source", privatePost.data)]),
			(error) => {
				assert.match(String(error), /Post ID/);
				assert.doesNotMatch(String(error), /PRIVATE_/);
				return true;
			},
		);
	});
}

for (const fixture of [
	{
		entry: "Topic Folder/My Note.md",
		id: "topic-folder/my-note",
		href: "/posts/topic-folder/my-note/",
	},
	{ entry: "section/index.md", id: "section", href: "/posts/section/" },
	{
		entry: "中文/文章.md",
		id: "中文/文章",
		href: "/posts/%E4%B8%AD%E6%96%87/%E6%96%87%E7%AB%A0/",
	},
	{
		entry: "source/a.md",
		slug: "custom/index",
		id: "custom/index",
		href: "/posts/custom/index/",
	},
	{
		entry: "source/b.md",
		slug: "custom/article.md",
		id: "custom/article.md",
		href: "/posts/custom/article.md/",
	},
	{
		entry: "source/c.md",
		slug: "Case/Space Note",
		id: "Case/Space Note",
		href: "/posts/Case/Space%20Note/",
	},
]) {
	await test(`article identity agrees with installed Astro and literal route: ${fixture.id}`, async () => {
		const data = fixture.slug === undefined ? {} : { slug: fixture.slug };
		const contentDir = pathToFileURL(`${fixtureRoot}/`);
		// Astro's glob loader uses a truthy explicit slug unchanged; otherwise this
		// installed utility supplies its default generated identity.
		const astroId =
			fixture.slug ??
			getContentEntryIdAndSlug({
				entry: new URL(`./${encodeURI(fixture.entry)}`, contentDir),
				contentDir,
				collection: "",
			}).slug;
		assert.equal(astroId, fixture.id);
		assert.equal(getPostId(fixture.entry, data), fixture.id);
		assert.equal(
			new URL(generatedRoute({ slug: astroId }), "https://fixture.invalid")
				.pathname,
			fixture.href,
		);
		const contentPath = fixture.entry.replace(/\.(md|mdx)$/, "");
		const postIndex = new WikiPostIndex([post(fixture.id, contentPath, data)]);
		for (const target of [contentPath, fixture.id]) {
			for (const [base, prefix] of [
				["/", ""],
				["/Zhenkun-blog-site/", "/Zhenkun-blog-site"],
			]) {
				const html = successful(
					await render(`Read [[${target}]].`, { postIndex, base }),
				);
				assert.ok(html.includes(`href="${prefix}${fixture.href}"`));
			}
		}
	});
}

await test("source extension aliases resolve while explicit .md article IDs stay literal", async () => {
	for (const target of [
		"guide/source.md",
		"./guide/source",
		"posts/guide/source",
	]) {
		const html = successful(await render(`[[${target}]]`));
		assert.ok(html.includes('href="/posts/published/stable/"'));
	}
	assert.throws(() => getPostId("source.md", { slug: 42 }), /must be a string/);
});

for (const [image, base, expected] of [
	["/assets/cover.webp", "/", "/assets/cover.webp"],
	[
		"/assets/cover.webp",
		"/Zhenkun-blog-site/",
		"/Zhenkun-blog-site/assets/cover.webp",
	],
	[
		"/Zhenkun-blog-site/assets/cover.webp",
		"/Zhenkun-blog-site/",
		"/Zhenkun-blog-site/assets/cover.webp",
	],
	[
		"/assets/cover.webp?version=2#preview",
		"/Zhenkun-blog-site/",
		"/Zhenkun-blog-site/assets/cover.webp?version=2#preview",
	],
	[
		"https://images.example.invalid/cover.webp",
		"/Zhenkun-blog-site/",
		"https://images.example.invalid/cover.webp",
	],
	[
		"//images.example.invalid/cover.webp",
		"/Zhenkun-blog-site/",
		"//images.example.invalid/cover.webp",
	],
]) {
	await test(`public/remote card cover uses its correct URL: ${image} at ${base}`, async () => {
		const postIndex = new WikiPostIndex([
			post("cover", "public/cover", { image }),
		]);
		const html = successful(await render("[[cover]]", { postIndex, base }));
		assert.ok(html.includes(`<img src="${expected}"`));
		assert.equal((html.match(/<img /g) ?? []).length, 1);
		assert.doesNotMatch(html, /Zhenkun-blog-site\/Zhenkun-blog-site/);
	});
}

await test("missing relative cover omits the image without failing the reference", async () => {
	const postIndex = new WikiPostIndex([
		post("cover", "public/cover", { image: "./absent-cover.png" }),
	]);
	const html = successful(await render("[[cover]]", { postIndex }));
	assert.ok(html.includes('href="/posts/cover/"'));
	assert.doesNotMatch(html, /<img\b|absent-cover/);
});

await test("relative cover outside approved source roots rejects publication", async () => {
	const outside = {
		...post("outside-cover", "public/outside", { image: "./cover.png" }),
		filePath: "/__zhenkun_outside_source_roots__/post.md",
	};
	const postIndex = new WikiPostIndex([outside]);
	assertRejected(
		await render("[[outside-cover]]", { postIndex }),
		/outside approved source asset roots/,
	);
	const development = await render("[[outside-cover]]", {
		postIndex,
		production: false,
	});
	assert.match(successful(development), /card-wiki-link/);
	assert.doesNotMatch(
		development.result.code,
		/<img\b|__zhenkun_outside_source_roots__/,
	);
	assert.match(
		development.messages.join("\n"),
		/outside approved source asset roots/,
	);
});

await test("API card cover uses injected deterministic URLs and the literal article ID", async () => {
	const calls = [];
	const coverApi = {
		processCoverImageSync(image, seed) {
			calls.push(["cover", image, seed]);
			return "https://images.example.invalid/first.webp";
		},
		getApiUrlList(image, seed) {
			calls.push(["list", image, seed]);
			return [
				"https://images.example.invalid/first.webp",
				"https://images.example.invalid/second.webp",
			];
		},
	};
	const postIndex = new WikiPostIndex([
		post("api/index", "public/api", { image: "api" }),
	]);
	const html = successful(
		await render("[[api/index]]", { postIndex, coverApi }),
	);
	assert.deepEqual(calls, [
		["cover", "api", "api/index"],
		["list", "api", "api/index"],
	]);
	assert.ok(
		html.includes('<img src="https://images.example.invalid/first.webp"'),
	);
	assert.ok(html.includes("data-api-urls="));
	assert.ok(html.includes("second.webp"));
});

await test("protected public cards expose allowed metadata but never password or target body", async () => {
	const postIndex = new WikiPostIndex([
		post("protected", "public/protected", { password: "PASSWORD_SENTINEL" }),
	]);
	const html = successful(await render("[[protected]]", { postIndex }));
	assert.match(html, /wlc-encrypted/);
	assert.ok(html.includes("PUBLIC_TITLE"));
	assert.doesNotMatch(html, /PASSWORD_SENTINEL|TARGET_BODY_SENTINEL/);
});

await test("Wiki syntax inside code and existing Markdown links remains unchanged", async () => {
	const html = successful(
		await render(
			"`[[missing]]`\n\n```text\n![[missing]]\n```\n\n[Text [[missing]]](https://example.invalid/)",
		),
	);
	assert.ok(html.includes("<code>[[missing]]</code>"));
	assert.ok(html.includes("![[missing]]"));
	assert.ok(
		html.includes('href="https://example.invalid/">Text [[missing]]</a>'),
	);
	assert.equal((html.match(/<a /g) ?? []).length, 1);
	assert.doesNotMatch(html, /card-wiki-link/);
});

await test("native MDX compiles public inline references and metadata cards", async () => {
	const outcome = await compileMdx(
		"Read [[guide/source|Setup]].\n\n[[guide/source]]",
		{
			base: "/Zhenkun-blog-site/",
		},
	);
	const code = successful(outcome);
	assert.match(code, /astro\/jsx-runtime/);
	const links = nodesMatching(
		outcome.result.tree,
		(node) => node.type === "element" && node.tagName === "a",
	);
	assert.equal(links.length, 2);
	assert.deepEqual(
		links.map((node) => node.properties.href),
		[
			"/Zhenkun-blog-site/posts/published/stable/",
			"/Zhenkun-blog-site/posts/published/stable/",
		],
	);
	assert.equal(links[0].children[0].value, "Setup");
	assert.ok(links[1].properties.className.includes("card-wiki-link"));
	assert.doesNotMatch(code, /PRIVATE_|TARGET_BODY_SENTINEL/);
});

await test("native MDX leaves JSX attributes, JSX children, expressions and ESM untouched", async () => {
	const outcome = await compileMdx(
		'export const raw = "[[missing]]";\n\n<Component title="[[missing]]">[[missing]]</Component>\n\n{"[[missing]]"}\n\nOutside [[guide/source]].',
	);
	const code = successful(outcome);
	const links = nodesMatching(
		outcome.result.tree,
		(node) => node.type === "element" && node.tagName === "a",
	);
	assert.equal(links.length, 1);
	assert.equal(links[0].properties.href, "/posts/published/stable/");
	const component = nodesMatching(
		outcome.result.tree,
		(node) => node.type === "mdxJsxFlowElement" && node.name === "Component",
	);
	assert.equal(component.length, 1);
	assert.equal(
		component[0].attributes.find((attribute) => attribute.name === "title")
			.value,
		"[[missing]]",
	);
	assert.equal(
		nodesMatching(
			component[0],
			(node) => node.type === "element" && node.tagName === "a",
		).length,
		0,
	);
	assert.ok(
		nodesMatching(component[0], (node) => node.type === "text").some(
			(node) => node.value === "[[missing]]",
		),
	);
	assert.match(code, /export const raw = "\[\[missing\]\]"/);
	assert.equal(outcome.messages.length, 0);
});

await test("native MDX applies production rejection and development diagnostics", async () => {
	for (const source of [
		"[[draft-route]]",
		"[[missing]]",
		"![[guide/source]]",
	]) {
		assertRejected(await compileMdx(source), /hidden|missing|unsupported/);
		const development = await compileMdx(source, { production: false });
		const code = successful(development);
		if (source !== "[[draft-route]]") {
			assert.ok(code.includes(source));
			assert.equal(
				nodesMatching(
					development.result.tree,
					(node) => node.type === "element" && node.tagName === "a",
				).length,
				0,
			);
			assert.match(development.messages.join("\n"), /missing|unsupported/);
			assertNoPrivateDisclosure(development);
		}
	}
	const draft = await compileMdx(
		"[[draft-route]]\n\n[[missing]]",
		{},
		{ draft: true },
	);
	const code = successful(draft);
	assert.ok(code.includes("[[draft-route]]"));
	assert.equal(draft.messages.length, 0);
	assertNoPrivateDisclosure(draft);
});

await test("real scanner admits lowercase Markdown/MDX, skips dotfiles and excluded extensions", async () => {
	const scanned = scanMemory({
		directories: {
			"": [
				dirent("Z.mdx"),
				dirent(".hidden.md"),
				dirent("Ignored.markdown"),
				dirent("Upper.MD"),
				dirent("photo.png"),
				dirent(".private", "directory"),
				dirent("Guide", "directory"),
				dirent("draft.md"),
			],
			Guide: [dirent("My Note.md")],
		},
		files: {
			"Guide/My Note.md":
				"---\ntitle: Public note\npublished: 2026-10-01\n---\nPUBLIC_SCANNER_BODY",
			"Z.mdx":
				"---\ntitle: MDX note\nslug: display/article.md\n---\n<Component />",
			"draft.md":
				"---\ntitle: PRIVATE_SCANNER_TITLE\ndraft: true\n---\nPRIVATE_SCANNER_BODY",
		},
	});
	assert.ifError(scanned.error);
	assert.deepEqual(
		scanned.reads.toSorted(),
		["Guide/My Note.md", "Z.mdx", "draft.md"].toSorted(),
	);
	assert.deepEqual(scanned.visited.toSorted(), ["", "Guide"].toSorted());
	assert.deepEqual(
		scanned.posts.map((entry) => entry.id).toSorted(),
		["guide/my-note", "display/article.md", "draft"].toSorted(),
	);
	const publicNote = scanned.posts.find(
		(entry) => entry.id === "guide/my-note",
	);
	assert.equal(publicNote.filePath, path.join(fixtureRoot, "Guide/My Note.md"));
	assert.equal(publicNote.contentPath, "Guide/My Note");
	assert.equal(publicNote.body.trim(), "PUBLIC_SCANNER_BODY");
	const postIndex = new WikiPostIndex(scanned.posts);
	assertRejected(await render("[[draft]]", { postIndex }), /is hidden/);
	assertRejected(
		await render("[[Ignored.markdown]]", { postIndex }),
		/is missing/,
	);
	const html = successful(await render("[[Guide/My Note]]", { postIndex }));
	assert.ok(html.includes('href="/posts/guide/my-note/"'));
	assert.doesNotMatch(html, /PRIVATE_SCANNER_|PUBLIC_SCANNER_BODY/);
});

await test("real scanner rejects visible symlinks without following file or directory targets", () => {
	for (const name of ["linked.md", "linked-directory"]) {
		const scanned = scanMemory({
			directories: { "": [dirent(name, "symlink")] },
		});
		assert.match(String(scanned.error), /Symlinks are not publishing inputs/);
		assert.deepEqual(scanned.reads, []);
		assert.deepEqual(scanned.visited, [""]);
	}
	const hidden = scanMemory({
		directories: { "": [dirent(".hidden-link", "symlink")] },
	});
	assert.ifError(hidden.error);
	assert.deepEqual(hidden.posts, []);
});

await test("real scanner rejects a source root that passes through a symlink", () => {
	const scanned = scanMemory({
		directories: {},
		resolvedRoot: "/__different_resolved_root__",
	});
	assert.match(String(scanned.error), /must not pass through symlinks/);
	assert.deepEqual(scanned.visited, []);
	assert.deepEqual(scanned.reads, []);
});

await test("real scanner fails malformed frontmatter and invalid draft/slug data without disclosure", () => {
	for (const [contents, reason] of [
		[
			"---\ntitle: [broken\nsecret: PRIVATE_FRONTMATTER\n---\n",
			/Invalid Markdown frontmatter/,
		],
		[
			'---\ntitle: PRIVATE_TITLE\ndraft: "true"\n---\n',
			/draft field must be boolean/,
		],
		[
			"---\ntitle: PRIVATE_TITLE\ndraft: 1\n---\n",
			/draft field must be boolean/,
		],
		["---\ntitle: PRIVATE_TITLE\nslug: 42\n---\n", /slug must be a string/],
		["---\ntitle: PRIVATE_TITLE\nslug: ../escape\n---\n", /Post ID/],
	]) {
		const scanned = scanMemory({
			directories: { "": [dirent("bad.md")] },
			files: { "bad.md": contents },
		});
		assert.match(String(scanned.error), reason);
		assert.doesNotMatch(String(scanned.error), /PRIVATE_/);
	}
});

await test("real scanner duplicate .md/.mdx identities fail index construction", () => {
	const scanned = scanMemory({
		directories: { "": [dirent("same.mdx"), dirent("same.md")] },
		files: {
			"same.md": "---\ntitle: One\n---\n",
			"same.mdx": "---\ntitle: Two\n---\n",
		},
	});
	assert.ifError(scanned.error);
	assert.deepEqual(
		scanned.posts.map((entry) => entry.id),
		["same", "same"],
	);
	assert.throws(() => new WikiPostIndex(scanned.posts), /Duplicate post ID/);
});

await test("logical routes always get their base while explicit public-asset deduplication is bounded", async () => {
	assert.equal(
		withDeploymentBase("/posts/foo/", "/posts/"),
		"/posts/posts/foo/",
	);
	assert.equal(
		withDeploymentBase("/Zhenkun-blog-site/posts/foo/", "/Zhenkun-blog-site/"),
		"/Zhenkun-blog-site/Zhenkun-blog-site/posts/foo/",
	);
	assert.equal(
		withDeploymentBase(
			"/Zhenkun-blog-site/assets/cover.webp",
			"/Zhenkun-blog-site/",
			{
				allowExistingBase: true,
			},
		),
		"/Zhenkun-blog-site/assets/cover.webp",
	);
	assert.equal(
		withDeploymentBase(
			"/Zhenkun-blog-siteger/cover.webp",
			"/Zhenkun-blog-site/",
			{
				allowExistingBase: true,
			},
		),
		"/Zhenkun-blog-site/Zhenkun-blog-siteger/cover.webp",
	);
	assert.equal(
		withDeploymentBase(
			"/assets/cover.webp?url=https://images.example.invalid/#preview",
			"/Zhenkun-blog-site/",
		),
		"/Zhenkun-blog-site/assets/cover.webp?url=https://images.example.invalid/#preview",
	);
	const html = successful(
		await render("[[guide/source]]", { base: "/posts/" }),
	);
	assert.ok(html.includes('href="/posts/posts/published/stable/"'));
});

await test("deployment configuration rejects authority, traversal and control-character bases", () => {
	for (const base of [
		"//outside.invalid/",
		"https://outside.invalid/",
		"relative/",
		"/bad?query/",
		"/bad#fragment/",
		"/bad\\path/",
		" /space/",
		"/../",
		"/base/../",
		"/%2e%2e/",
		"/base\npath/",
	]) {
		assert.throws(
			() => withDeploymentBase("/posts/public/", base),
			`Unsafe deployment base: ${JSON.stringify(base)}`,
		);
	}
});

await test("internal URL input rejects browser authority reinterpretation and path traversal", () => {
	for (const rootedPath of [
		"//outside.invalid/image",
		"https://outside.invalid/image",
		"relative/image",
		"/\\outside.invalid/image",
		"/\n/outside.invalid/image",
		"/assets/../../outside",
		"/%2e%2e/outside",
	]) {
		for (const base of ["/", "/Zhenkun-blog-site/"]) {
			assert.throws(
				() => withDeploymentBase(rootedPath, base),
				`Unsafe internal path: ${JSON.stringify(rootedPath)}`,
			);
		}
	}
});

for (const [id, expectedHref] of [
	['quote/"double"', "/posts/quote/%22double%22/"],
	["quote/'single'", "/posts/quote/'single'/"],
	[
		"html/<svg onload='run()'>&",
		"/posts/html/%3Csvg%20onload%3D'run()'%3E%26/",
	],
]) {
	await test(`explicit nonstandard slug is safely encoded without changing identity: ${id}`, async () => {
		const scanned = scanMemory({
			directories: { "": [dirent("safe-source.md")] },
			files: {
				"safe-source.md": `---\ntitle: Public source\nslug: ${JSON.stringify(id)}\n---\n`,
			},
		});
		assert.ifError(scanned.error);
		assert.equal(scanned.posts[0].id, id);
		assert.equal(getPostPath(id), expectedHref);
		const postIndex = new WikiPostIndex(scanned.posts);
		const html = successful(
			await render("Read [[safe-source]].", { postIndex }),
		);
		const parsedLinks = nodesMatching(
			fromHtml(html, { fragment: true }),
			(node) => node.type === "element" && node.tagName === "a",
		);
		assert.equal(parsedLinks.length, 1);
		const href = parsedLinks[0].properties.href;
		assert.equal(href, expectedHref);
		assert.equal(
			decodeURIComponent(new URL(href, "https://fixture.invalid").pathname),
			`/posts/${id}/`,
		);
		assert.equal(
			new URL(href, "https://fixture.invalid").origin,
			"https://fixture.invalid",
		);
		assert.equal((html.match(/<a /g) ?? []).length, 1);
		assert.doesNotMatch(html, /<svg|<script|onload="|onerror="/);
		const mdx = await compileMdx("Read [[safe-source]].", { postIndex });
		successful(mdx);
		const links = nodesMatching(
			mdx.result.tree,
			(node) => node.type === "element" && node.tagName === "a",
		);
		assert.equal(links.length, 1);
		assert.equal(links[0].properties.href, expectedHref);
	});
}

await test("publication build gate permits only the production environment", () => {
	assert.doesNotThrow(() => assertProductionBuild("build", "production"));
	for (const environment of ["development", "test", "", undefined]) {
		assert.throws(
			() => assertProductionBuild("build", environment),
			/require NODE_ENV=production/,
		);
	}
});

await test("draft preview and synchronization commands do not trigger the build gate", () => {
	for (const command of ["dev", "sync", "preview"]) {
		for (const environment of [
			"production",
			"development",
			"test",
			"",
			undefined,
		]) {
			assert.doesNotThrow(() => assertProductionBuild(command, environment));
		}
	}
});
