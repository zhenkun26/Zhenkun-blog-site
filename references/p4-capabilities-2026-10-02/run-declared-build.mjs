import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const base = process.argv[2];
assert.ok(base === "/" || base === "/Zhenkun-blog-site/");
const label = base === "/" ? "root" : "subpath";
const source = spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).stdout.trim();
assert.equal(source, "a353c2ee800bbff2865541288ea04308c245cdc5");
const declared = JSON.parse(readFileSync("package.json", "utf8")).scripts.build;
const stages = declared.split("&&").map((command) => command.trim());
assert.deepEqual(stages, [
	"pnpm exec tsx scripts/generate-github-card-data.ts",
	"pnpm exec tsx scripts/generate-lqips.ts",
	"pnpm exec tsx scripts/generate-vndb-covers.ts",
	"astro build",
	"pnpm exec tsx scripts/prune-pio-assets.ts",
	"pnpm exec tsx scripts/subset-fonts.ts",
	"pnpm exec tsx scripts/minify-inline-scripts.ts",
	"pnpm exec tsx scripts/run-pagefind.ts",
]);
const env = {
	...process.env,
	NODE_ENV: "production",
	DEPLOY_BASE: base,
	PATH: `${resolve("node_modules/.bin")}:${process.env.PATH}`,
};
const results = [];
for (const declaredStage of stages) {
	const [command, args] = declaredStage === "astro build"
		? [resolve("node_modules/.bin/astro"), ["build"]]
		: [process.execPath, ["--import", "tsx", declaredStage.slice("pnpm exec tsx ".length)]];
	const result = spawnSync(command, args, { env, stdio: "inherit" });
	results.push({ declaredStage, actualCommand: command, actualArgs: args, exitCode: result.status });
	writeFileSync(`references/p4-capabilities-2026-10-02/build-stages-${label}.json`, JSON.stringify({ source, node: process.version, base, results, boundary: "All eight declared stages via existing direct binaries/tsx import loader; not literal pnpm or clean Linux/hosted execution" }, null, 2) + "\n");
	if (result.error) throw result.error;
	if (result.status !== 0) {
		process.exitCode = result.status ?? 1;
		break;
	}
}
