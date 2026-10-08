import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { TextDecoder } from "node:util";

import {
	contractPath,
	proveCacheRepair,
	repairIds,
} from "./zhenkun-cache-remediation.mjs";

const REGISTRY = "https://registry.npmjs.org";
const LEVELS = ["info", "low", "moderate", "high", "critical"];
// GitHub's "medium" and pnpm's "moderate" name the same severity tier.
const sourceLevel = (value) => (value === "medium" ? "moderate" : value);
const ID =
	/^(GHSA-[23456789cfghjmpqrvwx]{4}(?:-[23456789cfghjmpqrvwx]{4}){2}|CVE-\d{4}-\d{4,})$/;
const POLICY = "scripts/zhenkun-security-policy.json";
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const object = (x) => x !== null && typeof x === "object" && !Array.isArray(x);
const text = (x) => typeof x === "string" && x.length > 0;
function demand(ok, code) {
	if (!ok) throw new Error(code);
}
function strings(xs) {
	return Array.isArray(xs) && xs.length > 0 && xs.every(text);
}
function range(value, semver) {
	demand(text(value), "INVALID_RANGE");
	const normalized = value.replaceAll(",", " ");
	demand(semver.validRange(normalized) !== null, "INVALID_RANGE");
	return normalized;
}

export function validatePolicy(policy, semver, now = new Date()) {
	demand(object(policy) && policy.schemaVersion === 1, "POLICY_SCHEMA");
	demand(
		Object.keys(policy).every((key) =>
			[
				"schemaVersion",
				"reviewedAt",
				"reviewBy",
				"owner",
				"scope",
				"knownAdvisories",
				"expectedPatches",
			].includes(key),
		),
		"UNSUPPORTED_POLICY_OPTION",
	);
	const start = Date.parse(policy.reviewedAt);
	const end = Date.parse(policy.reviewBy);
	demand(
		Number.isFinite(start) &&
			Number.isFinite(end) &&
			end > start &&
			end - start <= 7 * 86400000 &&
			now.getTime() >= start &&
			now.getTime() < end,
		"POLICY_REVIEW_DUE_OR_INVALID_CLOCK",
	);
	demand(text(policy.owner) && text(policy.scope), "POLICY_PROVENANCE");
	demand(
		Array.isArray(policy.knownAdvisories) &&
			policy.knownAdvisories.length >= 42,
		"POLICY_LEDGER_INCOMPLETE",
	);
	const aliases = new Map();
	for (const row of policy.knownAdvisories) {
		demand(
			object(row) &&
				ID.test(row.id) &&
				strings(row.aliases) &&
				row.aliases.includes(row.id),
			"POLICY_ID",
		);
		demand(
			text(row.package) &&
				LEVELS.includes(row.severity) &&
				strings(row.affectedRanges),
			"POLICY_ADVISORY",
		);
		for (const value of row.affectedRanges) range(value, semver);
		demand(
			Array.isArray(row.sources) && row.sources.length > 0,
			"POLICY_SOURCES",
		);
		for (const source of row.sources) {
			demand(
				object(source) &&
					/^https:\/\//.test(source.url) &&
					LEVELS.includes(sourceLevel(source.severity)) &&
					strings(source.affectedRanges),
				"POLICY_SOURCE_SCHEMA",
			);
			demand(source.withdrawnAt === null, "WITHDRAWAL_REQUIRES_REVIEW");
			demand(
				LEVELS.indexOf(row.severity) >=
					LEVELS.indexOf(sourceLevel(source.severity)),
				"POLICY_SEVERITY_DOWNGRADE",
			);
			for (const value of source.affectedRanges) range(value, semver);
		}
		for (const alias of row.aliases) {
			demand(ID.test(alias) && !aliases.has(alias), "POLICY_ALIAS_COLLISION");
			aliases.set(alias, row);
		}
	}
	demand(object(policy.expectedPatches), "POLICY_PATCHES");
	for (const [key, patch] of Object.entries(policy.expectedPatches)) {
		demand(
			text(key) && object(patch) && text(patch.parent) && text(patch.module),
			"POLICY_PATCH_SCHEMA",
		);
		demand(
			/^scripts\/patches\/[^/]+\.patch$/.test(patch.path),
			"POLICY_PATCH_PATH",
		);
		demand(
			patch.sourceRelative === undefined ||
				(key === "astro@7.2.10" &&
					patch.sourceRelative === "assets/build/generate.js") ||
				(key === "js-yaml@3.15.2" &&
					patch.parent === "gray-matter" &&
					patch.module === "js-yaml" &&
					patch.sourceRelative === "bin/js-yaml.js"),
			"POLICY_PATCH_SOURCE_PATH",
		);
		demand(
			/^[a-f0-9]{64}$/.test(patch.sha256) &&
				/^[a-f0-9]{64}$/.test(patch.installedSourceSha256),
			"POLICY_PATCH_HASH",
		);
	}
	return aliases;
}

export function parseAudit(capture, semver) {
	demand(
		object(capture) &&
			!capture.error &&
			capture.signal === null &&
			[0, 1].includes(capture.exitCode),
		"AUDIT_TRANSPORT_OR_EXIT",
	);
	demand(!capture.decodingErrors?.length, "AUDIT_INVALID_UTF8");
	const data = JSON.parse(capture.stdout);
	demand(
		object(data) &&
			Object.keys(data).every((k) => ["advisories", "metadata"].includes(k)),
		"AUDIT_ERROR_OR_UNKNOWN_SCHEMA",
	);
	demand(
		object(data.advisories) &&
			object(data.metadata) &&
			object(data.metadata.vulnerabilities),
		"AUDIT_MISSING_FIELDS",
	);
	const counts = Object.fromEntries(LEVELS.map((s) => [s, 0]));
	for (const level of LEVELS)
		demand(
			Number.isSafeInteger(data.metadata.vulnerabilities[level]) &&
				data.metadata.vulnerabilities[level] >= 0,
			"AUDIT_COUNTS",
		);
	demand(
		Object.keys(data.metadata.vulnerabilities).length === LEVELS.length,
		"AUDIT_UNKNOWN_SEVERITY",
	);
	for (const key of [
		"dependencies",
		"devDependencies",
		"optionalDependencies",
		"totalDependencies",
	]) {
		demand(
			Number.isSafeInteger(data.metadata[key]) && data.metadata[key] >= 0,
			"AUDIT_DEPENDENCY_COUNTS",
		);
	}
	demand(data.metadata.totalDependencies > 0, "AUDIT_EMPTY_GRAPH");
	const records = [];
	for (const [key, row] of Object.entries(data.advisories)) {
		demand(
			object(row) &&
				String(row.id) === key &&
				text(row.module_name) &&
				text(row.title) &&
				text(row.url),
			"AUDIT_RECORD",
		);
		demand(LEVELS.includes(row.severity), "AUDIT_UNKNOWN_SEVERITY");
		demand(
			row.withdrawn_at == null && row.withdrawnAt == null,
			"WITHDRAWAL_REQUIRES_REVIEW",
		);
		range(row.vulnerable_versions, semver);
		demand(typeof row.patched_versions === "string", "AUDIT_PATCHED_RANGE");
		const ids = [];
		if (row.github_advisory_id !== undefined) ids.push(row.github_advisory_id);
		if (row.cves !== undefined) {
			demand(Array.isArray(row.cves), "AUDIT_ALIASES");
			ids.push(...row.cves);
		}
		demand(
			ids.length > 0 &&
				ids.every((id) => typeof id === "string" && ID.test(id)),
			"AUDIT_ALIASES",
		);
		demand(
			Array.isArray(row.findings) && row.findings.length > 0,
			"AUDIT_FINDINGS",
		);
		for (const finding of row.findings) {
			demand(
				object(finding) &&
					semver.valid(finding.version) &&
					strings(finding.paths),
				"AUDIT_FINDING_SCHEMA",
			);
			for (const flag of ["dev", "optional", "bundled"])
				demand(typeof finding[flag] === "boolean", "AUDIT_FINDING_FLAGS");
			demand(
				semver.satisfies(
					finding.version,
					range(row.vulnerable_versions, semver),
					{ includePrerelease: true },
				),
				"AUDIT_FINDING_RANGE_MISMATCH",
			);
		}
		counts[row.severity]++;
		records.push({
			ids: [...new Set(ids)],
			package: row.module_name,
			severity: row.severity,
			vulnerableRange: row.vulnerable_versions,
			patchedRange: row.patched_versions,
			findings: row.findings,
			rawId: key,
			title: row.title,
			url: row.url,
		});
	}
	demand(
		LEVELS.every((s) => counts[s] === data.metadata.vulnerabilities[s]),
		"AUDIT_COUNT_MISMATCH",
	);
	demand(
		capture.exitCode === (records.length === 0 ? 0 : 1),
		"AUDIT_EXIT_INCONSISTENT",
	);
	return { counts, records };
}

export function evaluate({
	captures,
	policy,
	versions,
	semver,
	problems = [],
	remediation,
	now = new Date(),
}) {
	const blocked = [...problems];
	const raw = {};
	const groups = new Map();
	const knownAffected = [];
	let aliases;
	try {
		aliases = validatePolicy(policy, semver, now);
		demand(
			object(versions) && Object.keys(versions).length > 0,
			"EMPTY_DEPENDENCY_GRAPH",
		);
		for (const list of Object.values(versions))
			demand(
				strings(list) && list.every((v) => semver.valid(v)),
				"INVALID_DEPENDENCY_VERSION",
			);
		for (const row of policy.knownAdvisories) {
			// Union every retained source: a narrower later annotation cannot suppress a match.
			const ranges = [
				...row.affectedRanges,
				...row.sources.flatMap((s) => s.affectedRanges),
			];
			const affected = (versions[row.package] ?? []).filter((version) =>
				ranges.some((r) =>
					semver.satisfies(version, range(r, semver), {
						includePrerelease: true,
					}),
				),
			);
			if (affected.length)
				knownAffected.push({
					id: row.id,
					aliases: row.aliases,
					package: row.package,
					severity: row.severity,
					versions: affected,
					ranges,
				});
		}
	} catch (error) {
		blocked.push({ code: error.message, scope: "policy-or-graph" });
	}
	for (const kind of ["prod", "full"]) {
		try {
			const parsed = parseAudit(captures[kind], semver);
			raw[kind] = {
				state: "VALID",
				recordCount: parsed.records.length,
				counts: parsed.counts,
			};
			for (const row of parsed.records) {
				const known = [
					...new Set(row.ids.map((id) => aliases?.get(id)).filter(Boolean)),
				];
				if (row.ids.some((id) => !aliases?.has(id)))
					blocked.push({
						code: "UNKNOWN_ADVISORY_OR_ALIAS",
						kind,
						ids: row.ids,
					});
				if (known.length > 1 || known.some((k) => k.package !== row.package))
					blocked.push({
						code: "ADVISORY_IDENTITY_CONFLICT",
						kind,
						ids: row.ids,
					});
				if (
					row.findings.some(
						(finding) => !versions?.[row.package]?.includes(finding.version),
					)
				)
					blocked.push({ code: "AUDIT_GRAPH_MISMATCH", kind, ids: row.ids });
				const canonical =
					known.length === 1 ? known[0].id : [...row.ids].sort()[0];
				const key = `${canonical}:${row.package}`;
				const related = [...groups.entries()].filter(
					([, group]) =>
						group.package === row.package &&
						group.aliases.some(
							(id) => row.ids.includes(id) || known[0]?.aliases.includes(id),
						),
				);
				const existing = {
					id: canonical,
					aliases: related.flatMap(([, group]) => group.aliases),
					package: row.package,
					severity: row.severity,
					observations: related.flatMap(([, group]) => group.observations),
				};
				for (const [oldKey] of related) groups.delete(oldKey);
				existing.aliases = [
					...new Set([
						...existing.aliases,
						...row.ids,
						...(known[0]?.aliases ?? []),
					]),
				].sort();
				existing.severity =
					LEVELS[
						Math.max(
							LEVELS.indexOf(existing.severity),
							LEVELS.indexOf(row.severity),
							...related.map(([, group]) => LEVELS.indexOf(group.severity)),
							...known.map((k) => LEVELS.indexOf(k.severity)),
						)
					];
				existing.observations.push({ kind, ...row });
				groups.set(key, existing);
			}
		} catch (error) {
			raw[kind] = { state: "BLOCKED", error: error.message };
			blocked.push({ code: error.message, scope: kind });
		}
	}
	const advisories = [...groups.values()];
	for (const group of advisories) {
		const tuples = (kind) =>
			group.observations
				.filter((o) => o.kind === kind)
				.flatMap((o) =>
					o.findings.flatMap((f) =>
						f.paths.map((path) => JSON.stringify([f.version, path])),
					),
				);
		const full = new Set(tuples("full"));
		if (tuples("prod").some((tuple) => !full.has(tuple)))
			blocked.push({ code: "AUDIT_SCOPE_MISMATCH", id: group.id });
	}
	// Version matches and raw observations remain visible even after a verified local repair.
	const verified = [];
	const contract = remediation?.inspection?.contract;
	if (remediation?.state === "VERIFIED_LOCAL_REPAIR" && !blocked.length) {
		const target = advisories.find((row) => row.id === repairIds[0]);
		const expected = contract?.auditObservation;
		const identity = ({
			ids,
			package: name,
			severity,
			vulnerableRange,
			patchedRange,
			findings,
			title,
			url,
		}) => ({
			ids,
			package: name,
			severity,
			vulnerableRange,
			patchedRange,
			findings,
			title,
			url,
		});
		const sameObservation = (row) =>
			expected && JSON.stringify(identity(row)) === JSON.stringify(expected);
		const exact =
			JSON.stringify(contract?.ids) === JSON.stringify(repairIds) &&
			target?.observations.length === 2 &&
			["prod", "full"].every((kind) =>
				target.observations.some(
					(row) => row.kind === kind && sameObservation(row),
				),
			) &&
			knownAffected.filter((row) => repairIds.includes(row.id)).length === 2 &&
			knownAffected
				.filter((row) => repairIds.includes(row.id))
				.every(
					(row) =>
						row.package === "http-cache-semantics" &&
						JSON.stringify(row.versions) === '["4.2.0"]',
				);
		if (exact) verified.push(...repairIds);
		else blocked.push({ code: "REPAIR_ADVISORY_OR_INSTANCE_CHANGED" });
	}
	for (const row of [...advisories, ...knownAffected])
		row.remediationStatus = verified.includes(row.id)
			? "VERIFIED_LOCAL_REPAIR"
			: "UNRESOLVED";
	const unresolved = [...advisories, ...knownAffected].filter(
		(row) => !verified.includes(row.id),
	);
	const state = blocked.length
		? "BLOCKED"
		: unresolved.length
			? "FAIL"
			: "PASS";
	return {
		schemaVersion: 1,
		state,
		exitCode: state === "PASS" ? 0 : state === "FAIL" ? 1 : 2,
		raw,
		effective: {
			advisories,
			knownAffected,
			verifiedLocalRepairs: verified,
			unresolved,
			mitigation: verified.length
				? "VERIFIED_LOCAL_REPAIR; raw version alerts and upstream CVEs retained; release acceptance is separate"
				: "NO_EXCEPTIONS; missing or failed repair evidence leaves findings unresolved",
		},
		repairEvidence: remediation
			? { state: remediation.state, error: remediation.error ?? null }
			: { state: "NOT_RUN" },
		blocked,
	};
}

export function inspectProject(cwd, policy) {
	const require = createRequire(resolve(cwd, "package.json"));
	const parent = createRequire(require.resolve("astro"));
	const yaml = parent("js-yaml");
	const semver = parent("semver");
	const lock = yaml.load(readFileSync(resolve(cwd, "pnpm-lock.yaml"), "utf8"));
	const workspace = yaml.load(
		readFileSync(resolve(cwd, "pnpm-workspace.yaml"), "utf8"),
	);
	demand(
		object(lock) &&
			lock.lockfileVersion === "9.0" &&
			object(lock.packages) &&
			object(lock.snapshots) &&
			object(lock.importers?.["."]),
		"LOCK_SCHEMA",
	);
	const versions = Object.create(null);
	for (const key of Object.keys(lock.packages)) {
		const at = key.lastIndexOf("@");
		const name = key.slice(0, at);
		const version = key.slice(at + 1);
		demand(at > 0 && semver.valid(version), "LOCK_PACKAGE_VERSION");
		versions[name] ??= [];
		versions[name].push(version);
	}
	const problems = [];
	try {
		demand(object(policy.expectedPatches), "POLICY_PATCHES");
		const expected = Object.keys(policy.expectedPatches).sort();
		demand(
			JSON.stringify(
				Object.keys(workspace.patchedDependencies ?? {}).sort(),
			) === JSON.stringify(expected) &&
				JSON.stringify(Object.keys(lock.patchedDependencies ?? {}).sort()) ===
					JSON.stringify(expected),
			"PATCH_REGISTRATION_SET",
		);
		for (const [key, patch] of Object.entries(policy.expectedPatches)) {
			demand(/^scripts\/patches\/[^/]+\.patch$/.test(patch.path), "PATCH_PATH");
			demand(
				workspace.patchedDependencies[key] === patch.path &&
					lock.patchedDependencies[key] === patch.sha256,
				"PATCH_REGISTRATION",
			);
			demand(
				hash(readFileSync(resolve(cwd, patch.path))) === patch.sha256,
				"PATCH_BYTES",
			);
			const actualParent = createRequire(require.resolve(patch.parent));
			demand(
				hash(
					readFileSync(
						patch.sourceRelative
							? resolve(
									dirname(actualParent.resolve(patch.module)),
									patch.sourceRelative,
								)
							: actualParent.resolve(patch.module),
					),
				) === patch.installedSourceSha256,
				"PATCH_INSTALLED_BYTES",
			);
		}
	} catch (error) {
		problems.push({ code: `PATCH_INTEGRITY:${error.code ?? error.message}` });
	}
	return { semver, versions, problems };
}

export function snapshot(cwd) {
	const files = {};
	for (const name of [
		"package.json",
		"pnpm-lock.yaml",
		"pnpm-workspace.yaml",
		POLICY,
		"scripts/zhenkun-security-audit.mjs",
		"scripts/patches/http-cache-semantics@4.2.0.patch",
		"scripts/patches/astro@7.2.10.patch",
		"scripts/zhenkun-cache-remediation.mjs",
		contractPath,
		"scripts/zhenkun-test-cache-policy.mjs",
		"scripts/zhenkun-test-astro-cache-generator.mjs",
	]) {
		try {
			files[name] = hash(readFileSync(resolve(cwd, name)));
		} catch (error) {
			files[name] = { error: error.code };
		}
	}
	const git = (...args) =>
		execFileSync("git", args, {
			cwd,
			encoding: "utf8",
			env: { ...process.env, GIT_OPTIONAL_LOCKS: "0" },
		}).trim();
	return {
		head: git("rev-parse", "HEAD"),
		trackedDirty: git("status", "--porcelain", "--untracked-files=no") !== "",
		files,
	};
}

// Inject only process execution for offline tests; CLI always uses spawnSync.
export function collect({
	cwd,
	output,
	runner = spawnSync,
	getSnapshot = snapshot,
	now = () => new Date(),
	expectedHead = process.env.GITHUB_SHA ?? null,
}) {
	mkdirSync(dirname(output), { recursive: true });
	mkdirSync(output); // Refuse to overwrite an earlier invocation's evidence.
	const save = (name, data) =>
		writeFileSync(resolve(output, name), `${JSON.stringify(data, null, 2)}\n`);
	const context = () => {
		try {
			return getSnapshot(cwd);
		} catch (error) {
			return { error: error.code ?? error.message };
		}
	};
	const before = context();
	const receipt = {
		schemaVersion: 1,
		executionMode: runner === spawnSync ? "LIVE" : "INJECTED_OFFLINE",
		registry: REGISTRY,
		node: process.version,
		expectedHead,
		startedAt: now().toISOString(),
		before,
		captures: {},
	};
	save("collection.json", receipt);
	const captures = {};
	for (const kind of ["prod", "full"]) {
		const args = [
			"audit",
			...(kind === "prod" ? ["--prod"] : []),
			`--registry=${REGISTRY}`,
			"--json",
		];
		const startedAt = now().toISOString();
		let result;
		try {
			result = runner("pnpm", args, {
				cwd,
				encoding: null,
				timeout: 120000,
				maxBuffer: 32 * 1024 * 1024,
			});
		} catch (error) {
			result = { error, status: null, signal: null };
		}
		const stdout = result.stdout ?? Buffer.alloc(0);
		const stderr = result.stderr ?? Buffer.alloc(0);
		writeFileSync(resolve(output, `${kind}.stdout.json`), stdout);
		writeFileSync(resolve(output, `${kind}.stderr.log`), stderr);
		const decodingErrors = [];
		const decode = (bytes, stream) => {
			try {
				// Keep raw files/hash untouched. Retain a BOM for JSON.parse to judge.
				return new TextDecoder("utf-8", {
					fatal: true,
					ignoreBOM: true,
				}).decode(bytes);
			} catch {
				decodingErrors.push(stream);
				return "";
			}
		};
		const decodedStdout = decode(stdout, "stdout");
		decode(stderr, "stderr");
		const item = {
			command: ["pnpm", ...args],
			startedAt,
			endedAt: now().toISOString(),
			exitCode: result.status ?? null,
			signal: result.signal ?? null,
			error: result.error
				? String(result.error.code ?? result.error.message)
				: null,
			stdoutSha256: hash(stdout),
			stderrSha256: hash(stderr),
			decodingErrors,
		};
		receipt.captures[kind] = item;
		captures[kind] = { ...item, stdout: decodedStdout };
		save("collection.json", receipt);
	}
	receipt.after = context();
	receipt.endedAt = now().toISOString();
	save("collection.json", receipt);
	return { captures, receipt };
}

export function runGate(options) {
	const { captures, receipt } = collect(options);
	const problems = [];
	if (
		receipt.before.error ||
		receipt.after.error ||
		JSON.stringify(receipt.before) !== JSON.stringify(receipt.after)
	)
		problems.push({ code: "SOURCE_CHANGED_OR_UNREADABLE" });
	if (
		!/^[a-f0-9]{40}$/.test(receipt.before.head ?? "") ||
		receipt.before.trackedDirty ||
		(receipt.expectedHead && receipt.expectedHead !== receipt.before.head)
	)
		problems.push({ code: "HEAD_MISMATCH_OR_DIRTY" });
	for (const value of Object.values(receipt.before.files ?? {}))
		if (typeof value !== "string")
			problems.push({ code: "MISSING_SOURCE_INPUT" });
	let report;
	try {
		const policy = JSON.parse(
			readFileSync(resolve(options.cwd, POLICY), "utf8"),
		);
		const inspected = inspectProject(options.cwd, policy);
		// Offline collector injection cannot manufacture runtime repair acceptance.
		const remediation =
			options.runner && options.runner !== spawnSync
				? undefined
				: proveCacheRepair({
						cwd: options.cwd,
						output: options.output,
						policy,
					});
		if (remediation && remediation.state !== "VERIFIED_LOCAL_REPAIR")
			problems.push({
				code: `REPAIR_EVIDENCE:${remediation.error ?? "MISSING"}`,
			});
		if (
			JSON.stringify((options.getSnapshot ?? snapshot)(options.cwd)) !==
			JSON.stringify(receipt.after)
		)
			problems.push({ code: "SOURCE_CHANGED_DURING_REPAIR" });
		report = evaluate({
			remediation,
			captures,
			policy,
			...inspected,
			problems: [...problems, ...inspected.problems],
			now: options.now?.() ?? new Date(),
		});
	} catch (error) {
		report = {
			schemaVersion: 1,
			state: "BLOCKED",
			exitCode: 2,
			blocked: [
				...problems,
				{ code: error.code ?? error.message, scope: "project-inspection" },
			],
		};
	}
	report.head = receipt.before.head ?? null;
	report.executionMode = receipt.executionMode;
	report.lockSha256 = receipt.before.files?.["pnpm-lock.yaml"] ?? null;
	report.collection = "collection.json";
	writeFileSync(
		resolve(options.output, "verdict.json"),
		`${JSON.stringify(report, null, 2)}\n`,
	);
	return report;
}

if (
	process.argv[1] &&
	resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
	try {
		const args = process.argv.slice(2);
		demand(
			args.length === 3 &&
				args[0] === "--live" &&
				args[1] === "--output" &&
				text(args[2]),
			"USAGE: --live --output tmp/security-audit (sends dependency metadata to npm)",
		);
		const cwd = process.cwd();
		const output = resolve(cwd, args[2]);
		const inside = relative(resolve(cwd, "tmp"), output);
		demand(
			inside !== "" && !inside.startsWith("..") && !isAbsolute(inside),
			"OUTPUT_MUST_BE_NEW_DIRECTORY_UNDER_TMP",
		);
		const report = runGate({ cwd, output });
		console.log(
			JSON.stringify({
				state: report.state,
				head: report.head,
				lockSha256: report.lockSha256,
				evidence: args[2],
			}),
		);
		process.exitCode = report.exitCode;
	} catch (error) {
		console.error(`Security gate BLOCKED: ${error.message}`);
		process.exitCode = 2;
	}
}
