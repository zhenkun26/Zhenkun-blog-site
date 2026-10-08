/** Actual configured unified/MDX pipeline; a removed final hook must restore the old leak. */
import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import { pathToFileURL } from "node:url";
import { unified } from "@astrojs/markdown-remark";
import { pluginCollapsibleSections } from "@expressive-code/plugin-collapsible-sections";
import { pluginLineNumbers } from "@expressive-code/plugin-line-numbers";
import expressiveCode from "astro-expressive-code";
import { pluginLanguageLogo } from "ec-lang-logo";

import { pluginLanguageBadge } from "expressive-code-language-badge";
import ts from "typescript";
import "./zhenkun-native-locale-loader.mjs";

const { expressiveCodeConfig } = await import(
	"../src/config/expressiveCodeConfig.ts"
);
const { default: I18nKey } = await import("../src/i18n/i18nKey.ts");
const { i18n } = await import("../src/i18n/translation.ts");
const { getCodeBlockLocale, pluginCodeLocale, registerCodeLocaleTexts } =
	await import("../src/plugins/expressive-code-locale.ts");
const { pluginCollapsibleWithLifecycle } = await import(
	"../src/plugins/expressive-code-lifecycle.ts"
);
const require = createRequire(import.meta.url);
const astroPackage = require.resolve("astro/package.json");
const { loadConfigWithVite } = await import(
	pathToFileURL(
		astroPackage.replace(/package\.json$/, "dist/core/config/vite-load.js"),
	)
);
const actual = await loadConfigWithVite({
	configPath: process.cwd() + "/astro.config.mjs",
	root: process.cwd(),
	fs,
});
assert.equal(actual.markdown.processor.name, "unified");
const source = fs.readFileSync("astro.config.mjs", "utf8");
const ast = ts.createSourceFile(
	"astro.config.mjs",
	source,
	ts.ScriptTarget.Latest,
	true,
	ts.ScriptKind.JS,
);
let expression;
function find(node) {
	if (
		ts.isCallExpression(node) &&
		node.expression.getText(ast) === "expressiveCode"
	)
		expression = node.arguments[0].getText(ast);
	ts.forEachChild(node, find);
}
find(ast);
assert.ok(expression);
const imports = {
	expressiveCodeConfig,
	I18nKey,
	i18n,
	pluginCollapsibleSections,
	pluginLineNumbers,
	pluginCollapsibleWithLifecycle,
	pluginLanguageBadge,
	pluginLanguageLogo,
	getCodeBlockLocale,
	pluginCodeLocale,
};
registerCodeLocaleTexts();
const fence = String.fromCharCode(96).repeat(3);
const lines = Array.from(
	{ length: 20 },
	(_, i) => `const value${i} = ${i};`,
).join("\n");
const fixture = [
	fence + 'js title="sample.js"',
	lines,
	fence,
	"",
	fence + 'js title="sections.js" collapse={2-4}',
	lines,
	fence,
	"",
	fence + 'bash frame="terminal"',
	"echo sample",
	fence,
].join("\n");
async function renderer(base, removeHook = false) {
	const options = new Function(
		...Object.keys(imports),
		"return (" + expression + ")",
	)(...Object.values(imports));
	assert.equal(options.plugins.at(-1).name, "Zhenkun code locale");
	if (removeHook) options.plugins.pop();
	const processor = unified(actual.markdown.processor.options);
	const integration = expressiveCode(options);
	const config = {
		root: pathToFileURL(process.cwd() + "/"),
		srcDir: pathToFileURL(process.cwd() + "/src/"),
		base,
		integrations: [integration],
		markdown: { ...actual.markdown, processor },
	};
	await integration.hooks["astro:config:setup"]({
		command: "build",
		config,
		updateConfig: (delta) => {
			if (delta.markdown) Object.assign(config.markdown, delta.markdown);
		},
		addWatchFile: () => {},
		logger: {
			warn: (message) => {
				throw Error(message);
			},
			info: () => {},
			debug: () => {},
			error: (message) => {
				throw Error(message);
			},
		},
	});
	return {
		processor,
		markdown: await processor.createRenderer({ syntaxHighlight: false }),
	};
}
for (const base of ["/", "/Zhenkun-blog-site/"])
	test(
		base + ": concurrent actual Markdown/MDX code UI has document locale",
		async () => {
			const { markdown, processor } = await renderer(base);
			await Promise.all(
				["zh-CN", "en", "en", "zh-CN"].map(async (lang) => {
					const { code } = await markdown.render(fixture, {
						fileURL: new URL("../tmp/code-" + lang + ".md", import.meta.url),
						frontmatter: { lang },
					});
					const expected =
						lang === "en"
							? [
									"Copy to clipboard",
									"Copied!",
									"Show more",
									"Show less",
									"Code block expanded",
									"Code block collapsed",
									"Terminal window",
									"3 collapsed lines",
								]
							: [
									"复制到剪贴板",
									"已复制！",
									"展开",
									"收起",
									"代码块已展开",
									"代码块已折叠",
									"终端窗口",
									"已折叠 3 行",
								];
					for (const text of expected) assert.ok(code.includes(text), text);
					if (lang === "en") assert.ok(!/\p{Script=Han}/u.test(code));
					else
						assert.ok(
							!/Copy to clipboard|Copied!|Show more|Terminal window|collapsed lines/.test(
								code,
							),
						);
					assert.ok(code.includes('data-code="const value0 = 0;'));
				}),
			);
			const mdx = await processor.createMdxRenderer(
				{ syntaxHighlight: false },
				{
					srcDir: new URL("../src/", import.meta.url),
					sourcemap: false,
					optimize: false,
				},
			);
			for (const lang of ["en", "zh-CN"]) {
				const compiled = await mdx.process(
					fixture,
					new URL("../tmp/code-" + lang + ".mdx", import.meta.url).pathname,
					{ lang },
				);
				assert.ok(
					compiled.code.includes(
						lang === "en" ? "Code block expanded" : "代码块已展开",
					),
				);
			}
		},
	);
test("removing the adapter restores the original English collapse-language leak", async () => {
	const { markdown } = await renderer("/", true);
	const { code } = await markdown.render(fixture, {
		fileURL: new URL("../tmp/code-negative.md", import.meta.url),
		frontmatter: { lang: "en" },
	});
	assert.ok(code.includes("代码块已展开"));
	assert.ok(!code.includes("Code block expanded"));
});
test("code context and document language fail closed", () => {
	for (const lang of ["fr", null, [], 8])
		assert.throws(() =>
			getCodeBlockLocale({
				file: { data: { astro: { frontmatter: { lang } } } },
			}),
		);
	assert.throws(
		() => getCodeBlockLocale({ file: { data: {} } }),
		/frontmatter context missing/,
	);
	assert.equal(
		getCodeBlockLocale({ file: { data: { astro: { frontmatter: {} } } } }),
		"zh-CN",
	);
});
