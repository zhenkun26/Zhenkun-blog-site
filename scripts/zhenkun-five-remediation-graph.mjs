import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const yaml = createRequire(require.resolve("astro"))("js-yaml");
const sha = (b) => createHash("sha256").update(b).digest("hex");
const base = "1bde54cb488cfae291efef528391da2d511fb73c";
function baselineFile(name, digest) {
	const bytes = readFileSync(
		`references/s1-five-remediation-2026-10-08/baseline-${name}`,
	);
	assert.equal(sha(bytes), digest, `immutable pre-remediation ${name}`);
	return yaml.load(bytes.toString("utf8"));
}
const before = baselineFile(
	"pnpm-lock.yaml",
	"14462544638481af75e4fb22587bcd143b99cbb3b73b1a01016cd78be888a895",
);
const priorWorkspace = baselineFile(
	"pnpm-workspace.yaml",
	"7a8f1cd67a3bca177b0898e65839905d7a8bebf0b9acff51c4a6feddeb31b6fd",
);
const after = yaml.load(readFileSync("pnpm-lock.yaml", "utf8"));
const workspace = yaml.load(readFileSync("pnpm-workspace.yaml", "utf8"));
const additions = [
	"postcss-selector-parser@7.1.6",
	"smol-toml@1.9.0",
	"source-map-js@1.2.2",
];
const removals = [
	"argparse@1.0.10",
	"commander@8.3.0",
	"katex@0.16.47",
	"postcss-selector-parser@6.0.10",
	"postcss-selector-parser@6.1.4",
	"postcss-selector-parser@7.1.5",
	"smol-toml@1.8.0",
	"source-map-js@1.2.1",
	"sprintf-js@1.0.3",
];
assert.deepEqual(
	Object.keys(after.packages)
		.filter((k) => !before.packages[k])
		.sort(),
	additions.sort(),
);
assert.deepEqual(
	Object.keys(before.packages)
		.filter((k) => !after.packages[k])
		.sort(),
	removals.sort(),
);
for (const [k, value] of Object.entries(before.packages))
	if (after.packages[k])
		assert.deepEqual(after.packages[k], value, `package/integrity drift ${k}`);
assert.deepEqual(after.importers, before.importers);
assert.deepEqual(workspace.allowBuilds, priorWorkspace.allowBuilds);
for (const [k, v] of Object.entries(priorWorkspace.overrides))
	assert.equal(
		workspace.overrides[k],
		k === "postcss@8.5.26>source-map-js" ? "1.2.2" : v,
		`existing guard ${k}`,
	);
assert.equal(Object.keys(workspace.overrides).length, 27);
for (const [key, digest] of Object.entries(before.patchedDependencies))
	assert.equal(after.patchedDependencies[key], digest);
const patchHash = sha(readFileSync("scripts/patches/js-yaml@3.15.2.patch"));
assert.equal(after.patchedDependencies["js-yaml@3.15.2"], patchHash);
const ownerBase = (k) => k.replace(/\(.*/, "");
const normalizedOwner = (k) =>
	k
		.replaceAll(
			"postcss-selector-parser@7.1.5",
			"postcss-selector-parser@7.1.6",
		)
		.replace(/^js-yaml@3\.15\.2$/, `js-yaml@3.15.2(patch_hash=${patchHash})`);
const rules = new Map([
	["js-yaml@3.15.2", { argparse: "2.0.1" }],
	["gray-matter@4.0.3", { "js-yaml": `3.15.2(patch_hash=${patchHash})` }],
	["rehype-katex@7.0.1", { katex: "0.18.5" }],
	["micromark-extension-math@3.1.0", { katex: "0.18.5" }],
	["@tailwindcss/typography@0.5.20", { "postcss-selector-parser": "7.1.6" }],
	["postcss-nested@6.2.0", { "postcss-selector-parser": "7.1.6" }],
	[
		"postcss-nesting@14.0.1",
		{
			"postcss-selector-parser": "7.1.6",
			"@csstools/selector-resolve-nested":
				"4.0.1(postcss-selector-parser@7.1.6)",
			"@csstools/selector-specificity": "6.0.0(postcss-selector-parser@7.1.6)",
		},
	],
	[
		"@csstools/selector-resolve-nested@4.0.1",
		{ "postcss-selector-parser": "7.1.6" },
	],
	[
		"@csstools/selector-specificity@6.0.0",
		{ "postcss-selector-parser": "7.1.6" },
	],
	["astro@7.2.10", { "smol-toml": "1.9.0" }],
	["@astrojs/internal-helpers@0.10.4", { "smol-toml": "1.9.0" }],
	["@astrojs/internal-helpers@0.11.0", { "smol-toml": "1.9.0" }],
	["postcss@8.5.26", { "source-map-js": "1.2.2" }],
	["@tailwindcss/node@4.3.3", { "source-map-js": "1.2.2" }],
	["css-tree@2.2.1", { "source-map-js": "1.2.2" }],
	["css-tree@3.2.1", { "source-map-js": "1.2.2" }],
	["magicast@0.5.4", { "source-map-js": "1.2.2" }],
]);
const consumed = new Set();
const edges = [];
for (const [k, v] of Object.entries(before.snapshots)) {
	if (removals.includes(ownerBase(k))) continue;
	const nk = normalizedOwner(k);
	const expected = structuredClone(v);
	const rule = rules.get(ownerBase(k));
	for (const [dep, version] of Object.entries(rule || {})) {
		assert.ok(
			expected.dependencies?.[dep],
			`missing original edge ${k}>${dep}`,
		);
		edges.push({
			owner: k,
			name: dep,
			before: expected.dependencies[dep],
			after: version,
		});
		expected.dependencies[dep] = version;
	}
	assert.deepEqual(
		after.snapshots[nk],
		expected,
		`unexpected snapshot drift ${k}`,
	);
	consumed.add(nk);
}
for (const k of additions) {
	const oldKey = k.startsWith("postcss-selector-parser")
		? "postcss-selector-parser@7.1.5"
		: k.startsWith("smol-toml")
			? "smol-toml@1.8.0"
			: "source-map-js@1.2.1";
	assert.deepEqual(
		after.snapshots[k],
		before.snapshots[oldKey],
		`new package dependencies ${k}`,
	);
	consumed.add(k);
}
assert.deepEqual([...consumed].sort(), Object.keys(after.snapshots).sort());
for (const key of additions) {
	const meta = JSON.parse(
		readFileSync(
			`references/s1-audit-refresh-2026-10-08/official/${key}.json`,
			"utf8",
		),
	);
	assert.equal(
		after.packages[key].resolution.integrity,
		meta.dist.integrity,
		`official integrity ${key}`,
	);
}
const result = {
	base,
	lockSha256: sha(readFileSync("pnpm-lock.yaml")),
	packages: Object.keys(after.packages).length,
	snapshots: Object.keys(after.snapshots).length,
	guards: 27,
	rootImportersUnchanged: true,
	retainedPackageRecordsUnchanged: true,
	existingPatchHashesUnchanged: true,
	additions,
	removals,
	edges,
	verdict: "PASS_EXACT_BOUNDED_GRAPH",
};
if (process.argv[2])
	writeFileSync(process.argv[2], `${JSON.stringify(result, null, 2)}\n`);
console.log(
	JSON.stringify({
		verdict: result.verdict,
		packages: result.packages,
		snapshots: result.snapshots,
		changedEdges: edges.length,
		lockSha256: result.lockSha256,
	}),
);
