import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import { createRequire } from "node:module";

// Pure YAML parser from the candidate Astro parent; no extra top-level package.
const source = createRequire(`${process.cwd()}/package.json`);
const yaml = createRequire(source.resolve("astro/package.json"))("js-yaml");
const initial = JSON.parse(fs.readFileSync("references/dependency-r2-native-2026-10-03/lock-base.json"));
assert.deepEqual(initial, yaml.load(execFileSync("git", ["show", "d12dd98abf383d4c47bf9bf987516b953baf2904:pnpm-lock.yaml"], {encoding:"utf8"})));
const accepted = JSON.parse(fs.readFileSync("references/dependency-r2-native-2026-10-03/lock-stage1.json"));
assert.deepEqual(accepted, yaml.load(fs.readFileSync("references/dependency-r2-native-2026-10-03/lock-stage1.yaml", "utf8")));
const final = yaml.load(fs.readFileSync("pnpm-lock.yaml", "utf8"));
const stage1 = JSON.parse(fs.readFileSync("references/dependency-r2-native-2026-10-03/lock-stage1-review.json"));
const differences = (prev, next) => ({
	added: Object.keys(next).filter((key) => !prev[key]),
	removed: Object.keys(prev).filter((key) => !next[key]),
	changed: Object.keys(next).filter((key) => prev[key] && JSON.stringify(prev[key]) !== JSON.stringify(next[key])),
});
const packages = differences(accepted.packages, final.packages);
assert.deepEqual(packages.added, []);
assert.deepEqual(packages.changed, []);
assert.equal(packages.removed.length, 27);
assert.ok(packages.removed.every((key) => key === "sharp@0.35.4" || (key.startsWith("@img/sharp-") && (key.endsWith("@0.35.4") || key.endsWith("@1.3.3")))));
assert.deepEqual(final.settings, accepted.settings);
assert.deepEqual(final.overrides, accepted.overrides);
assert.equal(final.lockfileVersion, accepted.lockfileVersion);
const importer = structuredClone(accepted.importers);
assert.equal(importer["."].dependencies.sharp.specifier, "^0.35.4");
assert.equal(importer["."].dependencies.sharp.version, "0.35.4(@types/node@26.4.1)");
importer["."].dependencies.sharp.version = "0.35.5(@types/node@26.4.1)";
assert.deepEqual(final.importers, importer);
const snapshots = differences(accepted.snapshots, final.snapshots);
assert.deepEqual(snapshots.added, []);
assert.equal(snapshots.removed.length, 27);
assert.ok(snapshots.removed.every((key) => key.startsWith("sharp@0.35.4") || (key.startsWith("@img/sharp-") && (key.endsWith("@0.35.4") || key.endsWith("@1.3.3")))));
assert.equal(snapshots.changed.length, 1);
assert.ok(snapshots.changed[0].startsWith("astro@7.2.10("));
for (const [key, value] of Object.entries(final.snapshots)) {
	const expected = structuredClone(accepted.snapshots[key]);
	if (key.startsWith("astro@7.2.10(")) {
		assert.equal(expected.optionalDependencies.sharp, "0.35.4(@types/node@26.4.1)");
		expected.optionalDependencies.sharp = "0.35.5(@types/node@26.4.1)";
	}
	assert.deepEqual(value, expected, key);
}
const metadata = {};
for (const file of fs.readdirSync("references/dependency-r2-native-2026-10-03")) {
	if (!file.startsWith("approved-") || !file.endsWith(".json") || file === "approved-query-receipt.json") continue;
	const item = JSON.parse(fs.readFileSync(`references/dependency-r2-native-2026-10-03/${file}`));
	metadata[`${item.name}@${item.version}`] = item;
}
const sharp = JSON.parse(fs.readFileSync("references/dependency-r2-native-2026-10-03/sharp-target-approved.json"));
metadata["sharp@0.35.5"] = sharp;
for (const [key, item] of Object.entries(metadata)) {
	assert.equal(final.packages[key].resolution.integrity, item.dist.integrity, key);
	for (const field of ["engines", "os", "cpu", "libc", "peerDependenciesMeta"]) {
		if (item[field]) assert.deepEqual(final.packages[key][field], item[field], `${key}:${field}`);
	}
}
const wasm = "@img/sharp-wasm32@0.35.5";
assert.ok(final.packages[wasm]);
for (const platform of ["freebsd", "webcontainers"]) {
	assert.equal(metadata[`@img/sharp-${platform}-wasm32@0.35.5`].dependencies["@img/sharp-wasm32"], "0.35.5");
	assert.equal(final.snapshots[`@img/sharp-${platform}-wasm32@0.35.5`].dependencies["@img/sharp-wasm32"], "0.35.5");
}
let referenceCount = 0;
for (const [key, item] of Object.entries(final.snapshots)) {
	for (const field of ["dependencies", "optionalDependencies"]) {
		for (const [name, version] of Object.entries(item[field] ?? {})) {
			const direct = `${name}@${version}`;
			if (!final.snapshots[direct]) {
				// pnpm records npm aliases as the actual package-name@version.
				assert.equal(accepted.snapshots[key]?.[field]?.[name], version, "Alias must be inherited unchanged");
				assert.ok(final.snapshots[version], `${key} -> alias ${name}:${version}`);
			}
			referenceCount++;
		}
	}
}
const contexts = stage1.removedNonTargetPeerVariants.map((from) => {
	const base = from.split("(")[0];
	const to = stage1.nonTargetSnapshotDifferences.find((item) => item.key.split("(")[0] === base)?.key;
	assert.ok(to);
	assert.ok(final.snapshots[to]);
	assert.ok(!final.snapshots[from]);
	return { from, to };
});
const total = differences(initial.packages, final.packages);
assert.deepEqual(total.changed, []);
assert.equal(total.added.length, 28);
assert.equal(total.removed.length, 55);
assert.equal(Object.keys(final.packages).length, 895);
assert.equal(Object.keys(final.snapshots).length, 899);
for (const key of Object.keys(final.packages)) assert.ok(!/^sharp@0\.35\.[24]$/.test(key));
const report = {
	state: "PASS_FINAL_GRAPH_SCOPE",
	basis: "Stage1 supplied independent Astra HIGH scope acceptance plus exhaustive stage2 comparison; no global peer suffix normalization",
	counts: { packages: [922, 895], snapshots: [926, 899], references: referenceCount },
	stage2: { packages, snapshots, rootRangeUnchanged: true, rootAndAstroOnlyRealEdgeChanges: true },
	wholePacket: total,
	approvedExactPeerContextMappings: contexts,
	registryIntegrityAndPlatformMetadataMatches: Object.keys(metadata),
	sharedWasmChild: { key: wasm, introducedBy: ["freebsd", "webcontainers"], source: "Both verified wrapper metadata declare exact dependency; resolver supplies official integrity; native runtime must not fall back to WASM" },
	noOtherSurvivingPackageOrSnapshotChanges: true,
	lockSha256: createHash("sha256").update(fs.readFileSync("pnpm-lock.yaml")).digest("hex"),
};
fs.writeFileSync("references/dependency-r2-native-2026-10-03/final-lock-graph.json", `${JSON.stringify(report, null, 2)}\n`);
fs.writeFileSync("tmp/r2/final.json", JSON.stringify(final));
fs.writeFileSync("references/dependency-r2-native-2026-10-03/dependencies.diff", execFileSync("git", ["diff", "d12dd98", "--", "package.json", "pnpm-workspace.yaml", "pnpm-lock.yaml"]));
console.log(JSON.stringify({ state: report.state, counts: report.counts, stage2RealParentChanges: snapshots.changed, lockSha256: report.lockSha256 }));
