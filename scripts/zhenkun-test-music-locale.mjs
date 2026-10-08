/** Exercise the actual manager error event and view callback without media/network. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import "./zhenkun-native-locale-loader.mjs";
import test from "node:test";
import { createContext, runInContext } from "node:vm";
import { transformSync } from "esbuild";
import ts from "typescript";

const { musicPlayerConfig } = await import("../src/config/musicConfig.ts");
const { default: I18nKey } = await import("../src/i18n/i18nKey.ts");
const { getPageLocale } = await import("../src/utils/deployment-contract.ts");
const { withDeploymentBase } = await import("../src/utils/post-contract.ts");

const { createTranslator, getTranslation } = await import(
	"../src/i18n/translation.ts"
);

const manager = readFileSync(
	new URL("../src/components/features/MusicManager.astro", import.meta.url),
	"utf8",
);
const frontmatter = manager.match(/^---\n([\s\S]*?)\n---/)?.[1];
const managerScript = manager.match(/<script[^>]*>([\s\S]*?)<\/script>/)?.[1];
assert.ok(frontmatter && managerScript);
const parsed = ts.createSourceFile(
	"manager.ts",
	frontmatter,
	ts.ScriptTarget.Latest,
	true,
);
let withoutImports = frontmatter;
for (const statement of [...parsed.statements].reverse()) {
	if (ts.isImportDeclaration(statement))
		withoutImports =
			withoutImports.slice(0, statement.pos) +
			withoutImports.slice(statement.end);
}
const view = readFileSync(
	new URL("../src/components/features/MusicPlayerView.astro", import.meta.url),
	"utf8",
);
const viewScript = view.match(/<script[^>]*>([\s\S]*?)<\/script>/)?.[1];
const parsedView = ts.createSourceFile(
	"view.js",
	viewScript,
	ts.ScriptTarget.Latest,
	true,
	ts.ScriptKind.JS,
);
let consumer;
function findConsumer(node) {
	if (
		ts.isCallExpression(node) &&
		node.expression.getText(parsedView) === "on" &&
		node.arguments[0]?.text === "fm:error"
	)
		consumer = node.arguments[1].getText(parsedView);
	ts.forEachChild(node, findConsumer);
}
findConsumer(parsedView);
assert.ok(consumer, "the real view fm:error callback exists");

for (const base of ["/", "/Zhenkun-blog-site/"]) {
	for (const [locale, route, expected] of [
		["zh_CN", "/", "播放失败，即将自动跳过..."],
		["en", "/en/", "Playback failed. Skipping to the next track..."],
	]) {
		test(`${base} ${locale}: real music failure keeps event, visible title and restored state in locale`, () => {
			const handlers = new Map();
			const emitted = [];
			const timers = new Map();
			let timerId = 0;
			let playCalls = 0;
			const audio = {
				style: {},
				paused: true,
				duration: 0,
				currentTime: 0,
				pause() {},
				play() {
					playCalls++;
					throw Error("Media playback is prohibited in this fixture");
				},
				addEventListener(name, handler) {
					const list = handlers.get(name) ?? [];
					list.push(handler);
					handlers.set(name, list);
				},
			};
			const window = {
__zhenkunStorage: {getItem: () => null, setItem() {}, removeItem() {}},
				dispatchEvent(event) {
					emitted.push(event);
				},
			};
			const context = createContext({
				window,
				document: {
					createElement(name) {
						assert.equal(name, "audio");
						return audio;
					},
					body: {
						appendChild(node) {
							assert.equal(node, audio);
						},
					},
				},
				localStorage: {
					getItem() {
						return null;
					},
				},
				CustomEvent: class {
					constructor(type, init) {
						this.type = type;
						this.detail = init.detail;
					}
				},
				setTimeout(callback, milliseconds) {
					const id = ++timerId;
					timers.set(id, { callback, milliseconds });
					return id;
				},
				clearTimeout(id) {
					timers.delete(id);
				},
				fetch() {
					throw Error("No remote fetch is permitted");
				},
				musicPlayerConfig,
				I18nKey,
				createTranslator,
				getPageLocale,
				getTranslation,
				url: (path) => withDeploymentBase(path, base),
				Astro: {
					url: new URL(withDeploymentBase(route, base), "https://example.test"),
				},
				console,
			});
			const renderedConfig = transformSync(
				`${withoutImports}\nwindow.fixtureConfig = managerConfigStr;`,
				{
					loader: "ts",
					format: "iife",
					define: { "import.meta.env.BASE_URL": JSON.stringify(base) },
				},
			).code;
			runInContext(renderedConfig, context);
			context.managerConfigStr = window.fixtureConfig;
			runInContext(managerScript, context);
			runInContext(managerScript, context);
			assert.equal(
				handlers.get("error").length,
				1,
				"singleton does not duplicate media handlers",
			);
			handlers.get("error")[0]();
			const error = emitted.find((event) => event.type === "fm:error");
			assert.equal(error.detail.message, expected);
			context.ui = { title: { innerText: "" } };
			context.cfg = JSON.parse(window.fixtureConfig);
			runInContext(
				`(${consumer})(${JSON.stringify({ detail: error.detail })})`,
				context,
			);
			assert.equal(
				context.ui.title.innerText,
				expected,
				"actual view renders the producer's localized message",
			);
			assert.equal(
				window.__fireflyMusic.getState().error,
				expected,
				"state restoration cannot reintroduce another language",
			);
			assert.equal(
				[...timers.values()][0].milliseconds,
				2000,
				"automatic skip timing is preserved",
			);
			assert.equal(playCalls, 0);
		});
	}
}
