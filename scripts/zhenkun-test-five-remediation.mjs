import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
	mkdtempSync,
	readdirSync,
	readFileSync,
	realpathSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { performance } from "node:perf_hooks";
import test from "node:test";
import { pathToFileURL } from "node:url";
import { runInNewContext } from "node:vm";
import katex from "katex";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";

const root = resolve(import.meta.dirname, "..");
const require = createRequire(import.meta.url);
const astro = createRequire(require.resolve("astro"));
const yaml = astro("js-yaml");
const evidence = join(
	root,
	"references/s1-five-remediation-2026-10-08/analysis",
);
function packageDir(name, version) {
	const prefix = `${name.replace("/", "+")}@${version}`;
	const slot = readdirSync(join(root, "node_modules/.pnpm")).find(
		(value) => value === prefix || value.startsWith(`${prefix}_`),
	);
	assert.ok(slot, `${name}@${version} installed`);
	const dir = join(root, "node_modules/.pnpm", slot, "node_modules", name);
	assert.equal(
		JSON.parse(readFileSync(join(dir, "package.json"))).version,
		version,
	);
	return dir;
}
function parent(name, version) {
	return createRequire(join(packageDir(name, version), "package.json"));
}
function manifestAt(entry) {
	let dir = dirname(entry);
	for (;;) {
		try {
			return JSON.parse(readFileSync(join(dir, "package.json")));
		} catch {}
		const next = dirname(dir);
		assert.notEqual(next, dir);
		dir = next;
	}
}
function owned(t) {
	const dir = mkdtempSync(join(tmpdir(), "zhenkun-five-test-"));
	t.after(() => rmSync(dir, { recursive: true, force: true }));
	return dir;
}
const edges = [
	["js-yaml", "3.15.2", "argparse", "2.0.1"],
	["rehype-katex", "7.0.1", "katex", "0.18.5"],
	["micromark-extension-math", "3.1.0", "katex", "0.18.5"],
	["@tailwindcss/typography", "0.5.20", "postcss-selector-parser", "7.1.6"],
	["postcss-nested", "6.2.0", "postcss-selector-parser", "7.1.6"],
	["postcss-nesting", "14.0.1", "postcss-selector-parser", "7.1.6"],
	[
		"@csstools/selector-resolve-nested",
		"4.0.1",
		"postcss-selector-parser",
		"7.1.6",
	],
	[
		"@csstools/selector-specificity",
		"6.0.0",
		"postcss-selector-parser",
		"7.1.6",
	],
	["astro", "7.2.10", "smol-toml", "1.9.0"],
	["@astrojs/internal-helpers", "0.10.4", "smol-toml", "1.9.0"],
	["@astrojs/internal-helpers", "0.11.0", "smol-toml", "1.9.0"],
	["postcss", "8.5.26", "source-map-js", "1.2.2"],
	["@tailwindcss/node", "4.3.3", "source-map-js", "1.2.2"],
	["css-tree", "2.2.1", "source-map-js", "1.2.2"],
	["css-tree", "3.2.1", "source-map-js", "1.2.2"],
	["magicast", "0.5.4", "source-map-js", "1.2.2"],
];

test("five fixes: actual parent/peer resolvers and physical old-chain removal", () => {
	const lock = yaml.load(readFileSync(join(root, "pnpm-lock.yaml"), "utf8"));
	const installed = yaml.load(
		readFileSync(join(root, "node_modules/.pnpm/lock.yaml"), "utf8"),
	);
	assert.deepEqual(installed.packages, lock.packages);
	assert.deepEqual(installed.snapshots, lock.snapshots);
	for (const [name, expected] of [
		["argparse", "2.0.1"],
		["katex", "0.18.5"],
		["postcss-selector-parser", "7.1.6"],
		["smol-toml", "1.9.0"],
		["source-map-js", "1.2.2"],
	]) {
		assert.deepEqual(
			Object.keys(lock.packages).filter((key) => key.startsWith(`${name}@`)),
			[`${name}@${expected}`],
		);
	}
	assert.equal(
		Object.keys(lock.packages).some((key) => key.startsWith("sprintf-js@")),
		false,
	);
	assert.equal(
		readdirSync(join(root, "node_modules/.pnpm")).some((key) =>
			key.startsWith("sprintf-js@"),
		),
		false,
	);
	for (const [owner, version, child, expected] of edges)
		assert.equal(
			manifestAt(parent(owner, version).resolve(child)).version,
			expected,
			`${owner}>${child}`,
		);
	for (const [owner, version] of [
		["rehype-katex", "7.0.1"],
		["micromark-extension-math", "3.1.0"],
	]) {
		assert.equal(
			realpathSync(parent(owner, version).resolve("katex")),
			realpathSync(require.resolve("katex")),
		);
	}
});

test("YAML: unchanged library and actual patched CLI inputs, diagnostics and exits", (t) => {
	const dir = dirname(parent("gray-matter", "4.0.3").resolve("js-yaml"));
	const cli = join(dir, "bin/js-yaml.js");
	const baseline = JSON.parse(
		readFileSync(join(evidence, "yaml-library-baseline.json")),
	);
	assert.equal(Object.keys(baseline).length, 29);
	for (const [file, hash] of Object.entries(baseline))
		assert.equal(
			createHash("sha256")
				.update(readFileSync(join(dir, file)))
				.digest("hex"),
			hash,
			file,
		);
	assert.equal(
		createHash("sha256").update(readFileSync(cli)).digest("hex"),
		"9c8a8e8320bbba581c49876237ab97ad9caeb77ff6accd1f686a18c390e4ae6a",
	);
	const temp = owned(t);
	const file = join(temp, "data.yaml");
	const input =
		"title: 气象\npublished: 2026-10-08\ndraft: true\nalias: &a [一, 二]\ncopy: *a\n";
	writeFileSync(file, input);
	function run(args, stdin = "") {
		const result = spawnSync(process.execPath, [cli, ...args], {
			input: stdin,
			encoding: "utf8",
			timeout: 5000,
		});
		assert.ifError(result.error);
		assert.doesNotMatch(result.stderr, /DeprecationWarning/);
		return result;
	}
	for (const args of [[], [file], ["--to-json", file]]) {
		const result = run(args, input);
		assert.equal(result.status, 0);
		const data = JSON.parse(result.stdout);
		assert.equal(data.title, "气象");
		assert.equal(data.draft, true);
		assert.equal(data.published, "2026-10-08T00:00:00.000Z");
		assert.deepEqual(data.alias, data.copy);
	}
	for (const flag of ["-v", "--version"]) {
		const result = run([flag]);
		assert.equal(result.status, 0);
		assert.equal(result.stdout.trim(), "3.15.2");
	}
	const help = run(["--help"]);
	assert.equal(help.status, 0);
	for (const flag of ["--compact", "--trace", "--version"])
		assert.ok(help.stdout.includes(flag));
	assert.doesNotMatch(help.stdout, /--to-json/);
	const reverse = run([], '{"title":"气象","draft":true}');
	assert.equal(reverse.status, 0);
	assert.match(reverse.stdout, /title: 气象/);
	const multiple = run([], "a: 1\n---\nb: 2\n");
	assert.equal(multiple.status, 0);
	assert.deepEqual(JSON.parse(multiple.stdout), [{ a: 1 }, { b: 2 }]);
	for (const args of [[], ["--compact"], ["--trace"]]) {
		const bad = run(args, "a: [unterminated");
		assert.equal(bad.status, 1);
		assert.match(bad.stderr, /YAMLException|unexpected end/);
		if (args[0] === "--trace") assert.match(bad.stderr, /at /);
	}
	const unknown = run(["--not-a-real-flag"]);
	assert.equal(unknown.status, 2);
	assert.equal(unknown.stdout, "");
	assert.match(unknown.stderr, /usage:|unrecognized arguments/);
	assert.equal(run([join(temp, "missing.yaml")]).status, 2);
});

function mathTree(value, options = {}) {
	const tree = {
		type: "root",
		children: [
			{
				type: "element",
				tagName: "span",
				properties: { className: ["math", "math-inline"] },
				children: [{ type: "text", value }],
			},
		],
	};
	rehypeKatex(options)(tree, { message() {} });
	return tree;
}
function anchors(tree) {
	return (
		(tree.tagName === "a" ? 1 : 0) +
		(tree.children ?? []).reduce((count, child) => count + anchors(child), 0)
	);
}
test("KaTeX: inherited/default/processor trust, namespaces and group restoration", () => {
	const link = "\\href{https://example.invalid/}{x}";
	assert.equal(anchors(mathTree(link)), 0);
	assert.equal(anchors(mathTree(link, { trust: true })), 1);
	for (const [key, value] of [["trust", true]]) {
		const descriptor = Object.getOwnPropertyDescriptor(Object.prototype, key);
		Object.defineProperty(Object.prototype, key, {
			value,
			configurable: true,
			writable: true,
		});
		try {
			if (key === "trust") {
				assert.equal(anchors(mathTree(link)), 0);
				assert.doesNotMatch(
					katex.renderToString(link, Object.create({ trust: true })),
					/<a /,
				);
			}
		} finally {
			if (descriptor) Object.defineProperty(Object.prototype, key, descriptor);
			else delete Object.prototype[key];
		}
	}
	// Inherited macros target Namespace.has/get without also polluting the
	// independent function-handler table through Object.prototype.
	const macros = Object.create({ "\\protofixture": "x" });
	assert.throws(
		() => katex.renderToString("\\protofixture", { macros }),
		/Undefined control sequence/,
	);
	assert.match(
		katex.renderToString("{\\def\\protofixture{x}\\protofixture}", { macros }),
		/katex/,
	);
	assert.equal(Object.hasOwn(macros, "\\protofixture"), false);
	assert.equal(Object.getPrototypeOf(macros)["\\protofixture"], "x");
	assert.throws(
		() =>
			katex.renderToString(
				"{\\def\\protofixture{x}\\protofixture}\\protofixture",
				{ macros },
			),
		/Undefined control sequence/,
	);
	assert.match(
		katex.renderToString("\\protofixture", {
			macros: { "\\protofixture": "x" },
		}),
		/katex/,
	);
	assert.doesNotMatch(
		katex.renderToString(link, {
			default: { trust: true },
			processor: { trust: true },
		}),
		/<a /,
	);
	assert.throws(
		() =>
			katex.renderToString("\\loop", {
				macros: { "\\loop": "\\loop" },
				maxExpand: 20,
			}),
		/Too many expansions/,
	);
	assert.throws(
		() => katex.renderToString("气象", { strict: "error" }),
		/strict|Unicode/i,
	);
});

test("KaTeX: actual Astro Markdown and micromark math HTML, mhchem and fallback", async () => {
	await import("katex/contrib/mhchem");
	const { createMarkdownProcessor } = await import("@astrojs/markdown-remark");
	const processor = await createMarkdownProcessor({
		remarkPlugins: [remarkMath],
		rehypePlugins: [rehypeKatex],
		syntaxHighlight: false,
	});
	const fence = String.fromCharCode(96).repeat(3);
	const markdown =
		"Inline $x^2$ and $\\ce{CO2 + H2O}$.\n\n$$\n\\begin{aligned}a&=b+c\\\\d&=e\\end{aligned}\n$$\n\nBad $\\frac{$.\n\n" +
		fence +
		"js\nconst value = 1;\n" +
		fence;
	const result = await processor.render(markdown);
	for (const expression of [
		/katex-display/,
		/<math/,
		/katex-error/,
		/const value = 1/,
	])
		assert.match(result.code, expression);
	assert.doesNotMatch(result.code, /Undefined control sequence: \\ce/);
	const { mathHtml } = await import(
		pathToFileURL(
			join(packageDir("micromark-extension-math", "3.1.0"), "lib/html.js"),
		)
	);
	const output = [];
	mathHtml({ trust: false }).exit.mathText.call({
		resume: () => "\\href{https://example.invalid/}{x}",
		tag: (value) => output.push(value),
	});
	assert.match(output.join(""), /katex/);
	assert.doesNotMatch(output.join(""), /<a /);
});

test("CSS: actual typography, nested, nesting and both Expressive Code owners", async () => {
	const utils = parent("@tailwindcss/typography", "0.5.20")("./src/utils.js");
	assert.deepEqual(utils.commonTrailingPseudos(".a::before, .b::before"), [
		"::before",
		".a, .b",
	]);
	assert.deepEqual(utils.commonTrailingPseudos(".a:hover, .b:hover"), [
		null,
		".a:hover, .b:hover",
	]);
	const postcss = parent("postcss-nested", "6.2.0")("postcss");
	const source = ".fixture { & > code { color: red } &:hover { color: blue } }";
	const transformed = await postcss([
		parent("postcss-nested", "6.2.0")("postcss-nested"),
	]).process(source, { from: undefined });
	assert.match(transformed.css, /\.fixture > code/);
	assert.match(transformed.css, /\.fixture:hover/);
	const nesting = await import(
		pathToFileURL(
			parent("postcss-nesting", "14.0.1").resolve("postcss-nesting"),
		)
	);
	assert.match(
		(
			await postcss([nesting.default()]).process(
				".a { &:hover { color: red } }",
				{ from: undefined },
			)
		).css,
		/\.a:hover/,
	);
	for (const version of ["0.41.7", "0.44.2"]) {
		const { ExpressiveCodeEngine } = await import(
			pathToFileURL(
				parent("@expressive-code/core", version).resolve(
					"@expressive-code/core",
				),
			)
		);
		const engine = new ExpressiveCodeEngine({
			plugins: [{ name: "bounded-nested-fixture", baseStyles: source }],
		});
		assert.match(await engine.getBaseStyles(), /\.fixture\s*>\s*code/);
		assert.ok((await engine.getThemeStyles()).length > 0);
		assert.equal(
			(await engine.render({ code: "const value = 1;", language: "js" }))
				.renderedGroupAst.type,
			"element",
		);
	}
});

test("CSS: official flat-complexity controls, pseudos, escapes and AST clone", {
	timeout: 20000,
}, () => {
	const parser = parent("postcss-nested", "6.2.0")("postcss-selector-parser");
	const text = ".气象\\+AI:is(.a,.b)::before";
	const original = parser().astSync(text);
	const clone = original.clone();
	let visited = 0;
	clone.walk((node) => {
		visited++;
		if (node.type === "class" && node.value === "a") node.value = "changed";
	});
	assert.ok(visited > 5);
	assert.equal(original.toString(), text);
	assert.match(clone.toString(), /changed/);
	for (const atom of [".a", "#a", "#{a}"]) {
		function fastest(input) {
			const times = [];
			for (let iteration = 0; iteration < 3; iteration++) {
				const start = performance.now();
				parser().astSync(input);
				times.push(performance.now() - start);
			}
			return Math.min(...times);
		}
		const normal = fastest(`${atom} `.repeat(60000));
		const adversarial = fastest(atom.repeat(60000));
		assert.ok(
			adversarial / normal < 2,
			`${atom} same-size ratio ${adversarial / normal}`,
		);
	}
});

test("TOML: actual helpers/schema/ID accept null tables, Unicode, Date, BigInt and errors", async () => {
	const toml = astro("smol-toml");
	const input =
		'title = "气象"\npublished = 2026-10-08T00:00:00Z\ndraft = true\n"quoted.key" = "值"\n[a.b]\nvalue = 1\n[[items]]\nname = "一"\n[[items]]\nname = "二"\n';
	const data = toml.parse(input);
	assert.equal(Object.getPrototypeOf(data), null);
	assert.equal(Object.getPrototypeOf(data.a.b), null);
	assert.equal(data["quoted.key"], "值");
	assert.equal(data.published.toISOString(), "2026-10-08T00:00:00.000Z");
	assert.deepEqual(
		data.items.map((item) => item.name),
		["一", "二"],
	);
	assert.equal(
		toml.parse("big = 9007199254740993", { integersAsBigInt: true }).big,
		9007199254740993n,
	);
	for (const invalid of [
		"a = 1\na = 2",
		"bad key = 1",
		"[a]\nb = 1\n[a.b]\nx = 2",
	])
		assert.throws(
			() => toml.parse(invalid),
			(error) => error instanceof toml.TomlError,
		);
	for (const version of ["0.10.4", "0.11.0"]) {
		const { parseFrontmatter } = await import(
			pathToFileURL(
				join(
					packageDir("@astrojs/internal-helpers", version),
					"dist/frontmatter.js",
				),
			)
		);
		const parsed = parseFrontmatter(`+++\n${input}+++\nBody`);
		assert.equal(parsed.frontmatter.title, "气象");
		assert.equal(parsed.frontmatter.draft, true);
		assert.equal(
			parsed.frontmatter.published.toISOString(),
			data.published.toISOString(),
		);
		assert.equal(
			parseFrontmatter("---\ntitle: 气象\ndraft: true\n---\nBody").frontmatter
				.draft,
			true,
		);
	}
	const expression = readFileSync(
		join(root, "src/content.config.ts"),
		"utf8",
	).match(/schema:\s*(z\.object\(\{[\s\S]*?\}\)),\n\}\);/);
	assert.ok(expression, "actual posts schema");
	const parsed = runInNewContext(
		expression[1],
		{
			z: astro("zod").z,
			normalizeContentLocale: (await import("../src/utils/locale-contract.ts"))
				.normalizeContentLocale,
		},
		{ timeout: 1000 },
	).parse(data);
	assert.equal(parsed.published instanceof Date, true);
	assert.equal(parsed.draft, true);
	assert.deepEqual(parsed.tags, []);
	const { getPostId, isPostVisible } = await import(
		"../src/utils/post-contract.ts"
	);
	assert.equal(getPostId("fixture/index.md", parsed), "fixture");
	assert.equal(isPostVisible(parsed), false);
	assert.equal(isPostVisible(parsed, false), true);
});

test("TOML: actual Astro data-entry/file loader and bounded dot-free parser", async (t) => {
	const temp = owned(t);
	const astroDir = packageDir("astro", "7.2.10");
	const { createBaseSettings } = await import(
		pathToFileURL(join(astroDir, "dist/core/config/settings.js"))
	);
	const config = {
		root: pathToFileURL(`${temp}/`),
		srcDir: pathToFileURL(`${temp}/src/`),
		cacheDir: pathToFileURL(`${temp}/cache/`),
		integrations: [],
		prerenderConflictBehavior: "error",
	};
	const settings = createBaseSettings(config, "silent");
	const type = settings.dataEntryTypes.find(({ extensions }) =>
		extensions.includes(".toml"),
	);
	const entry = await type.getEntryInfo({
		contents: 'title = "气象"\ndraft = true\npublished = 2026-10-08T00:00:00Z',
		fileUrl: pathToFileURL(join(temp, "data.toml")),
	});
	assert.equal(entry.data.title, "气象");
	assert.equal(Object.getPrototypeOf(entry.data), null);
	assert.equal(entry.data.published instanceof Date, true);
	assert.throws(
		() =>
			type.getEntryInfo({
				contents: "a = 1\na = 2",
				fileUrl: pathToFileURL(join(temp, "bad.toml")),
			}),
		(error) => {
			assert.ok(error instanceof Error);
			assert.equal(error.type, "AstroError");
			assert.equal(error.name, "DataCollectionEntryParseError");
			assert.equal(
				error.message,
				"**../../bad.toml** failed to parse: contains invalid TOML.",
			);
			assert.equal(
				error.loc?.file,
				pathToFileURL(join(temp, "bad.toml")).pathname,
			);
			return true;
		},
	);
	const { file } = await import(
		pathToFileURL(join(astroDir, "dist/content/loaders/file.js"))
	);
	const stored = new Map();
	const errors = [];
	const diagnostics = [];
	const context = {
		config,
		collection: "fixture",
		logger: {
			debug: (value) => diagnostics.push(value),
			error: (value) => errors.push(value),
			warn() {},
		},
		parseData: async ({ data }) => data,
		store: {
			clear: () => stored.clear(),
			set: (value) => stored.set(value.id, value),
		},
	};
	writeFileSync(
		join(temp, "entries.toml"),
		'[first]\ntitle = "气象"\ndraft = true\npublished = 2026-10-08T00:00:00Z\n',
	);
	await file("entries.toml").load(context);
	assert.equal(stored.size, 1);
	assert.equal(stored.get("first").data.draft, true);
	assert.equal(stored.get("first").data.published instanceof Date, true);
	writeFileSync(join(temp, "entries.toml"), "a = 1\na = 2");
	await file("entries.toml").load(context);
	assert.deepEqual(errors, ["Error reading data from entries.toml"]);
	// The real parser exposes line/column as fields and a numbered codeblock
	// in its message; the loader logs that message rather than field labels.
	assert.ok(
		diagnostics.some(
			(value) =>
				/Invalid TOML document:/.test(value) &&
				/2:\s+a = 2/.test(value) &&
				/\^/.test(value),
		),
	);
	assert.throws(
		() => astro("smol-toml").parse("a = 1\na = 2"),
		(error) => {
			assert.ok(error instanceof astro("smol-toml").TomlError);
			assert.equal(error.line, 2);
			assert.equal(error.column, 1);
			assert.equal(error.codeblock, "1:  a = 1\n2:  a = 2\n    ^\n");
			assert.equal(
				error.message,
				[
					"Invalid TOML document: trying to redefine an already defined table or value\n\n",
					error.codeblock,
				].join(""),
			);
			return true;
		},
	);
	assert.equal(
		astro("smol-toml").parse('title = "气象"\r\ndraft = true\r\n').draft,
		true,
	);
	assert.throws(
		() => astro("smol-toml").parse("a = 1\r\na = 2"),
		(error) => {
			assert.equal(error.line, 2);
			assert.equal(error.column, 1);
			assert.equal(error.codeblock, "1:  a = 1\n2:  a = 2\n    ^\n");
			return true;
		},
	);
	assert.equal(stored.size, 1);
	const text = Array.from(
		{ length: 4000 },
		(_, index) => `key${index} = ${index}`,
	).join("\n");
	const original = String.prototype.indexOf;
	let globalScans = 0;
	String.prototype.indexOf = function (search, ...args) {
		if (search === "." && this.length === text.length) globalScans++;
		return original.call(this, search, ...args);
	};
	try {
		assert.equal(Object.keys(astro("smol-toml").parse(text)).length, 4000);
		assert.equal(globalScans, 0);
	} finally {
		String.prototype.indexOf = original;
	}
});

test("source maps: offset limits, exhaustion and linear nested sources traversal", () => {
	const { SourceMapConsumer, SourceMapGenerator, SourceNode } = parent(
		"postcss",
		"8.5.26",
	)("source-map-js");
	const basic = {
		version: 3,
		sources: ["气象.js"],
		names: [],
		mappings: "AAAA",
		sourcesContent: ["const Ω = 1;"],
	};
	const indexed = (line, column = 0, map = basic) => ({
		version: 3,
		sections: [{ offset: { line, column }, map }],
	});
	for (const invalid of [
		-1,
		0.5,
		Number.NaN,
		Number.POSITIVE_INFINITY,
		Number.MAX_SAFE_INTEGER + 1,
		"1",
		null,
	]) {
		assert.throws(() => new SourceMapConsumer(indexed(invalid)));
		assert.throws(() => new SourceMapConsumer(indexed(0, invalid)));
	}
	assert.throws(() => new SourceMapConsumer(indexed(10000001)));
	assert.throws(
		() => new SourceMapConsumer(indexed(6000000, 0, indexed(6000000))),
	);
	assert.equal(
		SourceNode.fromStringWithSourceMap(
			"Ω",
			new SourceMapConsumer(indexed(10000000)),
		).toString(),
		"Ω",
	);
	let nested = basic;
	for (let depth = 0; depth < 12; depth++) nested = indexed(0, 0, nested);
	const consumer = new SourceMapConsumer(nested);
	let inner = consumer;
	while (inner._sections) inner = inner._sections[0].consumer;
	let calls = 0;
	const original = Object.getOwnPropertyDescriptor(
		Object.getPrototypeOf(inner),
		"sources",
	);
	Object.defineProperty(inner, "sources", {
		get() {
			calls++;
			return original.get.call(this);
		},
	});
	assert.deepEqual(consumer.sources, ["气象.js"]);
	assert.equal(calls, 1);
	const generator = new SourceMapGenerator();
	generator.addMapping({
		generated: { line: 100003, column: 0 },
		original: { line: 1, column: 0 },
		source: "气象.js",
	});
	assert.equal(generator.toJSON().mappings.length, 100006);
});

test("source maps: actual PostCSS/css-tree/Tailwind/magicast preserve Unicode content", async () => {
	const postcss = parent("postcss", "8.5.26")("postcss");
	const css = ".气象 { content: 'Ω'; color: red }";
	const result = await postcss([
		{
			postcssPlugin: "fixture",
			Declaration(node) {
				if (node.prop === "color") node.value = "blue";
			},
		},
	]).process(css, {
		from: "fixture.css",
		to: "output.css",
		map: { inline: false, annotation: false },
	});
	assert.deepEqual(result.map.toJSON().sourcesContent, [css]);
	assert.match(result.css, /blue/);
	for (const version of ["2.2.1", "3.2.1"]) {
		const tree = parent("css-tree", version)("css-tree");
		const generated = tree.generate(
			tree.parse(css, { positions: true, filename: "fixture.css" }),
			{ sourceMap: true },
		);
		assert.match(generated.css, /Ω/);
		assert.ok(generated.map.toJSON().sources.includes("fixture.css"));
	}
	const tailwind = await import(
		pathToFileURL(
			parent("@tailwindcss/node", "4.3.3").resolve("@tailwindcss/node"),
		)
	);
	const source = {
		version: 3,
		sources: ["气象.js"],
		names: [],
		mappings: "AAAA",
		sourcesContent: ["const Ω = 1;"],
	};
	const map = tailwind.toSourceMap(JSON.stringify(source));
	assert.deepEqual(JSON.parse(map.raw).sourcesContent, source.sourcesContent);
	assert.match(map.inline, /base64/);
	assert.match(map.comment("fixture.map"), /fixture.map/);
	const magicast = await import(
		pathToFileURL(parent("magicast", "0.5.4").resolve("magicast"))
	);
	const module = magicast.parseModule(
		'export default { title: "Ω", count: 1 };',
		{ sourceFileName: "气象.js" },
	);
	module.exports.default.count = 2;
	const generated = magicast.generateCode(module, {
		sourceMapName: "fixture.map",
	});
	assert.match(generated.code, /count: 2/);
	assert.ok(generated.map.mappings.length > 0);
	assert.ok(generated.map.sources.includes("气象.js"));
	assert.match(generated.map.sourcesContent[0], /Ω/);
});
