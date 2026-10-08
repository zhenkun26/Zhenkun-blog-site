import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
	mkdirSync,
	mkdtempSync,
	readdirSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import { join, relative, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const require = createRequire(import.meta.url);
mkdirSync(join(root, "tmp"), { recursive: true });
const owned = mkdtempSync(join(root, "tmp/five-parent-types-"));
try {
	const prefix = "micromark-extension-math@3.1.0";
	const slot = readdirSync(join(root, "node_modules/.pnpm")).find(
		(value) => value === prefix || value.startsWith(`${prefix}_`),
	);
	assert.ok(slot, "actual micromark math parent is installed");
	const math = join(
		root,
		"node_modules/.pnpm",
		slot,
		"node_modules/micromark-extension-math/index.js",
	);
	const rehype = require.resolve("rehype-katex");
	const modulePath = (file) =>
		`./${relative(owned, file).split("\\").join("/")}`;
	const fixture = join(owned, "actual-parents.mts");
	writeFileSync(
		fixture,
		[
			"import rehypeKatex, {type Options} from " +
				JSON.stringify(modulePath(rehype)) +
				";",
			"import {mathHtml, type HtmlOptions} from " +
				JSON.stringify(modulePath(math)) +
				";",
			'const options: Options = {trust: context => context.command === "\\\\href", strict: "warn", maxExpand: 1000, macros: {"\\\\RR": "\\\\mathbb{R}"}};',
			"rehypeKatex(options);",
			"const htmlOptions: HtmlOptions = {...options, throwOnError: false};",
			"mathHtml(htmlOptions);",
			"// @ts-expect-error actual parent declarations do not support renderer injection",
			"const invalid: Options = {katex: {}};",
			"void invalid;",
		].join("\n"),
	);
	const args = [
		"exec",
		"tsc",
		"--ignoreConfig",
		"--noEmit",
		"--strict",
		"--skipLibCheck",
		"false",
		"--module",
		"NodeNext",
		"--moduleResolution",
		"NodeNext",
		"--target",
		"ES2022",
		fixture,
	];
	const result = spawnSync("pnpm", args, { cwd: root, stdio: "inherit" });
	assert.ifError(result.error);
	process.exitCode = result.status ?? 1;
	if (!result.status)
		console.log(
			"PASS actual rehype-katex and micromark math declarations; strict, skipLibCheck=false",
		);
} finally {
	rmSync(owned, { recursive: true, force: true });
}
