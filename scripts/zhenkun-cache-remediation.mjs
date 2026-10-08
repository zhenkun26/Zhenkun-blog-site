import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
	existsSync,
	readdirSync,
	readFileSync,
	realpathSync,
	writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, relative, resolve } from "node:path";
import { TextDecoder } from "node:util";

export const contractPath = "scripts/zhenkun-cache-repair-contract.json";
export const repairIds = ["GHSA-ch52-4w7c-c8xp", "CVE-2026-93750"];
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
function demand(ok, code) {
	if (!ok) throw new Error(code);
}
export const primarySources = {
	ghsa: "https://api.github.com/advisories/GHSA-ch52-4w7c-c8xp",
	cve: "https://cveawg.mitre.org/api/cve/CVE-2026-93750",
	latest: "https://registry.npmjs.org/http-cache-semantics/latest",
};
export function primaryProjection(kind, data) {
	if (kind === "ghsa") {
		demand(
			data.ghsa_id === repairIds[0] &&
				data.cve_id === "CVE-2026-93748" &&
				data.withdrawn_at === null,
			"REPAIR_PRIMARY_IDENTITY",
		);
		// Dynamic likelihood and discussion counts do not change advisory scope/severity.
		return Object.fromEntries(
			Object.entries(data).filter(
				([key]) => !["epss", "comments"].includes(key),
			),
		);
	}
	if (kind === "cve") {
		demand(
			data.cveMetadata?.cveId === repairIds[1] &&
				data.cveMetadata.state === "PUBLISHED",
			"REPAIR_PRIMARY_IDENTITY",
		);
		return data;
	}
	demand(
		kind === "latest" &&
			data.name === "http-cache-semantics" &&
			typeof data.version === "string" &&
			/^\d+\.\d+\.\d+$/.test(data.version),
		"REPAIR_UPSTREAM_METADATA_INVALID",
	);
	return { name: data.name, version: data.version, dist: data.dist };
}
export function verifyPrimaryRecords(records, contract, now = new Date()) {
	const review = contract.reviewedUpstream;
	demand(
		review?.decision === "retain-reviewed-local-patches" &&
			typeof review.reviewedBy === "string" &&
			review.reviewedBy.length > 0 &&
			typeof review.reason === "string" &&
			review.reason.length > 0 &&
			Date.parse(review.reviewedAt) <= now.getTime() &&
			now.getTime() < Date.parse(review.reviewBy),
		"REPAIR_UPSTREAM_REVIEW_MISSING_OR_EXPIRED",
	);
	demand(
		records.latest?.version === review.version &&
			records.latest?.dist?.integrity === review.integrity &&
			records.latest?.dist?.tarball === review.tarball,
		"REPAIR_UPSTREAM_REVIEW_REQUIRED",
	);
	for (const kind of Object.keys(primarySources)) {
		demand(
			records[kind] &&
				hash(JSON.stringify(primaryProjection(kind, records[kind]))) ===
					contract.primarySha256[kind],
			`REPAIR_PRIMARY_CHANGED:${kind}`,
		);
	}
}
function collectPrimaryRecords(cwd, output, contract, evidence) {
	const records = {};
	evidence.primary = [];
	for (const [kind, url] of Object.entries(primarySources)) {
		const body = resolve(output, `primary-${kind}.json`);
		const headers = resolve(output, `primary-${kind}.headers`);
		const result = spawnSync(
			"curl",
			[
				"--proto",
				"=https",
				"--silent",
				"--show-error",
				"--fail-with-body",
				"--max-time",
				"30",
				"--max-filesize",
				"2097152",
				"--output",
				body,
				"--dump-header",
				headers,
				url,
			],
			{ cwd, encoding: null, timeout: 35000, maxBuffer: 2097152 },
		);
		const stderr = result.stderr ?? Buffer.alloc(0);
		writeFileSync(resolve(output, `primary-${kind}.stderr.log`), stderr);
		const bytes = existsSync(body) ? readFileSync(body) : Buffer.alloc(0);
		evidence.primary.push({
			kind,
			url,
			exitCode: result.status,
			signal: result.signal,
			error: result.error?.code ?? null,
			stdoutSha256: hash(bytes),
			stderrSha256: hash(stderr),
			fetchedAt: new Date().toISOString(),
		});
		demand(
			!result.error && result.signal === null && result.status === 0,
			`REPAIR_PRIMARY_UNAVAILABLE:${kind}`,
		);
		records[kind] = JSON.parse(
			new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(bytes),
		);
	}
	verifyPrimaryRecords(records, contract);
}

export function boundaryFiles(cwd) {
	const tracked = execFileSync(
		"git",
		[
			"ls-files",
			"-z",
			"src",
			"public",
			"scripts",
			".github",
			"astro.config.mjs",
			"package.json",
			"pnpm-workspace.yaml",
			"pnpm-lock.yaml",
		],
		{ cwd, encoding: "utf8" },
	)
		.split("\0")
		.filter(Boolean);
	// Application/deployment/build behavior, excluding security implementation and test fixtures.
	return tracked
		.filter(
			(file) =>
				!file.startsWith("scripts/") ||
				(!/scripts\/zhenkun-(test-|security-|cache-)/.test(file) &&
					!file.startsWith("scripts/patches/")),
		)
		.sort();
}
export function boundaryHash(cwd) {
	return hash(
		JSON.stringify(
			boundaryFiles(cwd).map((file) => [
				file,
				hash(readFileSync(resolve(cwd, file))),
			]),
		),
	);
}
export function inspectCacheBoundary(cwd, policy, env = process.env) {
	const contract = JSON.parse(readFileSync(resolve(cwd, contractPath), "utf8"));
	demand(
		contract.schemaVersion === 1 &&
			JSON.stringify(contract.ids) === JSON.stringify(repairIds),
		"REPAIR_CONTRACT_IDENTITY",
	);
	demand(
		hash(JSON.stringify(policy.knownAdvisories)) === contract.ledgerSha256,
		"REPAIR_LEDGER_CHANGED",
	);
	demand(
		hash(JSON.stringify(policy.expectedPatches)) === contract.patchesSha256,
		"REPAIR_PATCH_POLICY_CHANGED",
	);
	demand(
		!env.CF_WORKERS &&
			!env.NODE_OPTIONS &&
			!env.ZHENKUN_CACHE_POLICY_BASELINE &&
			!env.ZHENKUN_ASTRO_CACHE_BASELINE,
		"REPAIR_ENVIRONMENT_CHANGED",
	);
	demand(
		boundaryHash(cwd) === contract.boundarySha256,
		"REPAIR_DEPLOYMENT_BOUNDARY_CHANGED",
	);
	for (const [file, digest] of Object.entries(contract.testFiles))
		demand(
			hash(readFileSync(resolve(cwd, file))) === digest,
			`REPAIR_TEST_CHANGED:${file}`,
		);
	demand(
		contract.installedVersions?.["http-cache-semantics"] === "4.2.0" &&
			contract.installedVersions?.astro === "7.2.10",
		"REPAIR_INSTALLED_CONTRACT_CHANGED",
	);
	const require = createRequire(resolve(cwd, "package.json"));
	const astro = require.resolve("astro");
	const parent = createRequire(astro);
	const yaml = parent("js-yaml");
	const lock = yaml.load(readFileSync(resolve(cwd, "pnpm-lock.yaml"), "utf8"));
	const installedLock = yaml.load(
		readFileSync(resolve(cwd, "node_modules/.pnpm/lock.yaml"), "utf8"),
	);
	assert.deepEqual(installedLock, lock, "REPAIR_INSTALLED_LOCK_MISMATCH");
	const cachePath = realpathSync(parent.resolve("http-cache-semantics"));
	const cacheHash =
		policy.expectedPatches["http-cache-semantics@4.2.0"].installedSourceSha256;
	demand(
		hash(readFileSync(cachePath)) === cacheHash,
		"REPAIR_INSTALLED_CACHE_CHANGED",
	);
	const astroInstances = new Map();
	function verifyAstro(entry, chain) {
		const realEntry = realpathSync(entry);
		let instance = astroInstances.get(realEntry);
		if (!instance) {
			const manifest = JSON.parse(
				readFileSync(resolve(dirname(realEntry), "../package.json"), "utf8"),
			);
			demand(
				manifest.name === "astro" &&
					manifest.version === contract.installedVersions.astro,
				"REPAIR_ASTRO_VERSION_CHANGED",
			);
			const sources = {};
			for (const [file, digest] of Object.entries(contract.astroFiles)) {
				sources[file] = hash(readFileSync(resolve(dirname(realEntry), file)));
				demand(sources[file] === digest, `REPAIR_ASTRO_SOURCE_CHANGED:${file}`);
			}
			instance = {
				entry: relative(cwd, realEntry),
				version: manifest.version,
				sources,
				paths: [],
			};
			astroInstances.set(realEntry, instance);
		}
		instance.paths.push(chain);
		return instance.entry;
	}
	verifyAstro(astro, "root");
	const owners = [];
	for (const [owner, value] of Object.entries(lock.snapshots))
		for (const kind of ["dependencies", "optionalDependencies"])
			for (const [name, version] of Object.entries(value[kind] ?? {})) {
				if (
					name === "http-cache-semantics" ||
					version.startsWith("http-cache-semantics@")
				)
					owners.push({ owner, name, version });
			}
	assert.deepEqual(owners, contract.parents, "REPAIR_PARENT_SET_CHANGED");
	const links = [];
	function scan(directory) {
		for (const item of readdirSync(directory, { withFileTypes: true })) {
			const file = join(directory, item.name);
			if (item.isDirectory()) scan(file);
			else if (item.isSymbolicLink()) {
				const target = realpathSync(file);
				const manifest = join(target, "package.json");
				if (
					existsSync(manifest) &&
					JSON.parse(readFileSync(manifest, "utf8")).name ===
						"http-cache-semantics"
				) {
					demand(
						JSON.parse(readFileSync(manifest, "utf8")).version === "4.2.0",
						"REPAIR_EXTRA_INSTALLED_VERSION",
					);
					demand(
						realpathSync(join(target, "index.js")) === cachePath &&
							hash(readFileSync(join(target, "index.js"))) === cacheHash,
						"REPAIR_UNCOVERED_INSTALLED_INSTANCE",
					);
					links.push(relative(cwd, file));
				}
			}
		}
	}
	scan(resolve(cwd, "node_modules"));
	demand(links.length > 0, "REPAIR_NO_INSTALLED_LINKS");
	// Actual resolution of every audit parent path, not just a root import or a lock hash.
	const resolutions = [];
	for (const chain of contract.auditObservation.findings.flatMap(
		(f) => f.paths,
	)) {
		let current = require;
		let entry;
		const astroEntries = [];
		for (const name of chain.split(">").slice(1)) {
			entry = current.resolve(name);
			if (name === "astro") astroEntries.push(verifyAstro(entry, chain));
			current = createRequire(entry);
		}
		demand(realpathSync(entry) === cachePath, "REPAIR_AUDIT_PATH_UNCOVERED");
		resolutions.push({
			chain,
			astroEntries,
			sourceSha256: hash(readFileSync(entry)),
		});
	}
	return {
		contract,
		owners,
		links: links.sort(),
		resolutions,
		astroInstances: [...astroInstances.values()],
		cacheSourceSha256: cacheHash,
		boundarySha256: boundaryHash(cwd),
	};
}

export function proveCacheRepair({ cwd, output, policy }) {
	const evidence = { state: "UNVERIFIED", ids: repairIds, executions: [] };
	try {
		const before = inspectCacheBoundary(cwd, policy);
		evidence.inspection = before;
		collectPrimaryRecords(cwd, output, before.contract, evidence);
		const run = (name, args, extraEnv = {}) => {
			const result = spawnSync(process.execPath, args, {
				cwd,
				encoding: null,
				env: { ...process.env, ...extraEnv },
				timeout: 120000,
				maxBuffer: 16 * 1024 * 1024,
			});
			const stdout = result.stdout ?? Buffer.alloc(0);
			const stderr = result.stderr ?? Buffer.alloc(0);
			writeFileSync(resolve(output, `${name}.stdout.tap`), stdout);
			writeFileSync(resolve(output, `${name}.stderr.log`), stderr);
			const item = {
				name,
				command: [process.execPath, ...args],
				exitCode: result.status,
				signal: result.signal,
				error: result.error?.code ?? null,
				stdoutSha256: hash(stdout),
				stderrSha256: hash(stderr),
			};
			evidence.executions.push(item);
			demand(
				!result.error && result.signal === null,
				`REPAIR_BEHAVIOR_TRANSPORT:${name}`,
			);
			return { ...item, stdout: stdout.toString("utf8") };
		};
		const positive = run("repair-positive", [
			"--test",
			"--test-reporter=tap",
			"scripts/zhenkun-test-cache-policy.mjs",
			"scripts/zhenkun-test-astro-cache-generator.mjs",
		]);
		demand(
			positive.exitCode === 0 &&
				/# tests 62\n/.test(positive.stdout) &&
				/# pass 62\n/.test(positive.stdout) &&
				/# fail 0\n/.test(positive.stdout) &&
				/# skipped 0\n/.test(positive.stdout),
			"REPAIR_POSITIVE_BEHAVIOR_FAILED",
		);
		for (const message of [
			"93748 cookie max-stale",
			"93748 no-cache direct SWR",
			"93750 wildcard OWS",
			"93750 own/inherited",
		])
			demand(
				positive.stdout.includes(
					`CACHE_BASELINE expected assertion failure: ${message}`,
				),
				"REPAIR_POLICY_COUNTEREXAMPLE_MISSING",
			);
		const negative = run(
			"repair-generator-original",
			[
				"--test",
				"--test-reporter=tap",
				"scripts/zhenkun-test-astro-cache-generator.mjs",
			],
			{ ZHENKUN_ASTRO_CACHE_BASELINE: "1" },
		);
		demand(
			negative.exitCode === 1 &&
				/# tests 17\n/.test(negative.stdout) &&
				/# pass 2\n/.test(negative.stdout) &&
				/# fail 15\n/.test(negative.stdout) &&
				/# skipped 0\n/.test(negative.stdout) &&
				(negative.stdout.match(/code: 'ERR_ASSERTION'/g) ?? []).length === 15,
			"REPAIR_GENERATOR_COUNTEREXAMPLE_FAILED",
		);
		const after = inspectCacheBoundary(cwd, policy);
		assert.deepEqual(after, before, "REPAIR_CHANGED_DURING_BEHAVIOR");
		evidence.state = "VERIFIED_LOCAL_REPAIR";
		evidence.upstreamStatus =
			"VERSION_MATCH_RETAINED; no upstream CVE withdrawal or release-wide acceptance";
	} catch (error) {
		evidence.error = error.message;
	}
	writeFileSync(
		resolve(output, "repair-evidence.json"),
		`${JSON.stringify(evidence, null, 2)}\n`,
	);
	return evidence;
}
