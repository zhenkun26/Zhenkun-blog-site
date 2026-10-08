import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const iconRequire = createRequire(require.resolve("astro-icon"));
const toolsManifest = iconRequire.resolve("@iconify/tools/package.json");
const toolsRequire = createRequire(toolsManifest);
const { SVG, runSVGO } = await import(
	pathToFileURL(join(dirname(toolsManifest), "lib/index.js")).href
);
const stylusRequire = createRequire(require.resolve("stylus"));
const legacyGlob = stylusRequire("glob");
const modernGlob = require("glob");
const legacyRequire = createRequire(stylusRequire.resolve("glob"));
const modernRequire = createRequire(require.resolve("glob"));
const fixture = resolve("tmp/r1-tail-discovery");
const fixtureFiles = [
	"home.zh.md",
	"home.en.md",
	"draft.zh.mdx",
	"avatar.avif",
	"ABOUT.md",
	"archive.zh.txt",
	"nested/about.en.md",
	".private.md",
];
for (const file of fixtureFiles) {
	mkdirSync(dirname(join(fixture, file)), { recursive: true });
	writeFileSync(join(fixture, file), "owned harmless discovery fixture\n");
}

test("actual Iconify parent resolves the already accepted SVGO 4.1.0", () => {
	assert.equal(JSON.parse(readFileSync(toolsManifest)).version, "5.0.12");
	assert.equal(toolsRequire("svgo").VERSION, "4.1.0");
	assert.equal(toolsRequire("./package.json").dependencies.svgo, "^4.0.1");
});

test("actual Iconify optimization preserves viewBox, paint refs and repeat stability", () => {
	const svg = new SVG(
		'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><defs><linearGradient id="paint"><stop stop-color="#ff0000"/><stop offset="1" stop-color="#0000ff"/></linearGradient></defs><path fill="url(#paint)" d="M0 0h24v24H0z"/></svg>',
	);
	runSVGO(svg);
	const first = svg.toString();
	assert.match(first, /viewBox="0 0 24 24"/);
	const id = first.match(/<linearGradient[^>]*id="([^"]+)"/)[1];
	assert.ok(first.includes(`url(#${id})`));
	assert.deepEqual([svg.getIcon().width, svg.getIcon().height], [24, 24]);
	runSVGO(svg);
	assert.equal(svg.toString(), first);
});

test("actual Iconify parser rejects a small non-SVG input", () => {
	assert.throws(() => new SVG("owned plain text"));
});

for (const [label, parentRequire, glob, major, brace] of [
	["Stylus/glob10", legacyRequire, legacyGlob, "9.0.9", "2.1.7"],
	["root/glob13", modernRequire, modernGlob, "10.2.6", "5.0.12"],
]) {
	const minimatchManifest = parentRequire.resolve("minimatch/package.json");
	const minimatchRequire = createRequire(minimatchManifest);
	const cjs = parentRequire("minimatch");
	const esm = await import(
		pathToFileURL(join(dirname(minimatchManifest), "dist/esm/index.js")).href
	);
	test(`${label}: actual minimatch loads its original-major brace patch`, () => {
		assert.equal(JSON.parse(readFileSync(minimatchManifest)).version, major);
		assert.equal(
			minimatchRequire("brace-expansion/package.json").version,
			brace,
		);
	});
	test(`${label}: ESM/CJS expand bounded nested/number ranges and match files`, () => {
		for (const api of [cjs, esm]) {
			assert.deepEqual(api.braceExpand("asset{01..03}.svg"), [
				"asset01.svg",
				"asset02.svg",
				"asset03.svg",
			]);
			assert.deepEqual(
				api.braceExpand("{home,{about,archive}}.{md,mdx}").sort(),
				[
					"home.md",
					"home.mdx",
					"about.md",
					"about.mdx",
					"archive.md",
					"archive.mdx",
				].sort(),
			);
			const matched = fixtureFiles.filter((file) =>
				api.minimatch(file, "{home,draft}.{zh,en}.{md,mdx}"),
			);
			assert.deepEqual(
				matched.sort(),
				["home.zh.md", "home.en.md", "draft.zh.mdx"].sort(),
			);
		}
	});
	test(`${label}: actual glob discovery returns the exact owned input set`, () => {
		const found = glob.globSync("**/*.{md,mdx}", { cwd: fixture }).sort();
		assert.deepEqual(
			found,
			[
				"ABOUT.md",
				"draft.zh.mdx",
				"home.en.md",
				"home.zh.md",
				"nested/about.en.md",
			].sort(),
		);
	});
}
