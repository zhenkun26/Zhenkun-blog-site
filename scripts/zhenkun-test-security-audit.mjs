import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
	copyFileSync,
	mkdirSync,
	mkdtempSync,
	readdirSync,
	readFileSync,
	rmSync,
	symlinkSync,
	writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import {
	boundaryFiles,
	inspectCacheBoundary,
	primaryProjection,
	verifyPrimaryRecords,
} from "./zhenkun-cache-remediation.mjs";
import {
	collect,
	evaluate,
	inspectProject,
	parseAudit,
	runGate,
	snapshot,
	validatePolicy,
} from "./zhenkun-security-audit.mjs";

const cwd = process.cwd();
const require = createRequire(import.meta.url);
const parent = createRequire(require.resolve("astro"));
const semver = parent("semver");
const yaml = parent("js-yaml");
const policy = JSON.parse(
	readFileSync("scripts/zhenkun-security-policy.json", "utf8"),
);
// Synthetic verdict fixtures stay within the policy's current bounded review.
// The live CLI continues to use the actual clock and rejects expiration.
const now = () => new Date(Date.parse(policy.reviewedAt) + 60000);
const clone = (x) => structuredClone(x);
const sha = (x) => createHash("sha256").update(x).digest("hex");
const raw = JSON.parse(
	readFileSync(
		"references/dependency-cache-patch-2026-10-03/audit-full.json",
		"utf8",
	),
);
const original = Object.values(raw.advisories)[0];
function payload(rows = []) {
	const data = clone(raw);
	data.advisories = Object.fromEntries(
		rows.map((row) => [String(row.id), row]),
	);
	data.metadata.vulnerabilities = {
		info: 0,
		low: 0,
		moderate: 0,
		high: 0,
		critical: 0,
	};
	for (const row of rows) data.metadata.vulnerabilities[row.severity]++;
	return data;
}
function capture(data = payload(), overrides = {}) {
	return {
		stdout: JSON.stringify(data),
		signal: null,
		error: null,
		exitCode: Object.keys(data.advisories ?? {}).length ? 1 : 0,
		...overrides,
	};
}
function verdict({
	data = payload(),
	versions = { "http-cache-semantics": ["5.0.0"] },
	captures,
	...rest
} = {}) {
	return evaluate({
		captures: captures ?? { prod: capture(data), full: capture(data) },
		policy: clone(policy),
		versions,
		semver,
		now: now(),
		...rest,
	});
}
function blocked(result, code) {
	assert.equal(result.state, "BLOCKED");
	assert.equal(result.exitCode, 2);
	assert.ok(
		result.blocked.some((r) => r.code.includes(code)),
		JSON.stringify(result.blocked),
	);
}
function owned(t) {
	const dir = mkdtempSync(join(tmpdir(), "zhenkun-security-fixture-"));
	t.after(() => rmSync(dir, { recursive: true, force: true }));
	return dir;
}
function runnerFor(data, calls, result = {}) {
	return (command, args, options) => {
		calls.push({ command, args, options });
		return {
			status: Object.keys(data.advisories).length ? 1 : 0,
			signal: null,
			...result,
			stdout: Buffer.from(result.stdout ?? JSON.stringify(data)),
			stderr: Buffer.from(result.stderr ?? "owned diagnostic\n"),
		};
	};
}
const cleanContext = () => ({
	head: "a".repeat(40),
	trackedDirty: false,
	files: { "pnpm-lock.yaml": "b".repeat(64) },
});

test("security: valid empty audits and no known affected versions pass", () => {
	const result = verdict();
	assert.equal(result.state, "PASS");
	assert.equal(result.exitCode, 0);
	assert.equal(result.raw.full.recordCount, 0);
	assert.deepEqual(result.effective.knownAffected, []);
});
test("security: known42 ledger includes verified aliases and preserves CVE93750 source disagreement", () => {
	const aliases = validatePolicy(policy, semver, now());
	assert.equal(policy.knownAdvisories.length, 42);
	assert.equal(aliases.get("CVE-2026-93748").id, "GHSA-ch52-4w7c-c8xp");
	const row = aliases.get("CVE-2026-93750");
	assert.equal(row.severity, "high");
	assert.deepEqual(
		row.sources.map((s) => [s.severity, s.affectedRanges]),
		[
			["high", ["<=4.2.0"]],
			["moderate", ["<=4.1.1"]],
		],
	);
});
for (const severity of ["info", "low", "moderate", "high", "critical"]) {
	test(`security: every raw ${severity} finding blocks without a severity downgrade`, () => {
		const row = { ...clone(original), severity };
		const result = verdict({
			data: payload([row]),
			versions: { "http-cache-semantics": ["4.2.0"] },
		});
		assert.equal(result.state, "FAIL");
		assert.equal(result.exitCode, 1);
		assert.equal(result.raw.prod.counts[severity], 1);
		assert.equal(
			result.effective.advisories[0].severity,
			severity === "critical" ? "critical" : "high",
		);
	});
}
test("security: GHSA and CVE duplicates retain each raw version/path and highest severity", () => {
	const a = clone(original);
	a.findings[0].version = "4.1.1";
	a.severity = "critical";
	const b = {
		...clone(original),
		id: 2,
		cves: ["CVE-2026-93748"],
		severity: "low",
	};
	delete b.github_advisory_id;
	const result = verdict({
		data: payload([a, b]),
		versions: { "http-cache-semantics": ["4.1.1", "4.2.0"] },
	});
	assert.equal(result.raw.full.recordCount, 2);
	assert.equal(result.effective.advisories.length, 1);
	const group = result.effective.advisories[0];
	assert.equal(group.observations.length, 4);
	assert.equal(group.severity, "critical");
	assert.deepEqual(
		new Set(
			group.observations.flatMap((o) => o.findings.map((f) => f.version)),
		),
		new Set(["4.1.1", "4.2.0"]),
	);
	assert.equal(
		group.observations[0].findings[0].paths.length,
		original.findings[0].paths.length,
	);
});
test("security: full audit cannot silently lose a prod finding", () => {
	blocked(
		verdict({
			captures: { prod: capture(payload([original])), full: capture() },
			versions: { "http-cache-semantics": ["4.2.0"] },
		}),
		"AUDIT_SCOPE_MISMATCH",
	);
});
test("security: one affected version still fails when another is repaired", () => {
	const result = verdict({
		versions: { "http-cache-semantics": ["4.2.0", "5.0.0"] },
	});
	assert.equal(result.state, "FAIL");
	assert.equal(result.effective.knownAffected.length, 2);
	assert.ok(
		result.effective.knownAffected.every((r) => r.versions.join() === "4.2.0"),
	);
});
test("security: official-only cache CVE and sharp still fail an empty registry report", () => {
	const result = verdict({
		versions: { sharp: ["0.35.4"], "http-cache-semantics": ["4.2.0"] },
	});
	assert.equal(result.state, "FAIL");
	assert.ok(
		result.effective.knownAffected.some((r) => r.id === "CVE-2026-93750"),
	);
	assert.ok(
		result.effective.knownAffected.some((r) => r.id === "GHSA-wq5f-xc86-pv6w"),
	);
});
test("security: commas in official ranges and prereleases cannot hide affected versions", () => {
	const result = verdict({
		versions: { "brace-expansion": ["5.0.9", "5.0.9-beta.1"] },
	});
	assert.equal(result.state, "FAIL");
	assert.ok(
		result.effective.knownAffected.some((r) =>
			r.versions.includes("5.0.9-beta.1"),
		),
	);
});
test("security: a narrower row cannot override the retained publisher affected range", () => {
	const p = clone(policy);
	p.knownAdvisories.find((r) => r.id === "CVE-2026-93750").affectedRanges = [
		"<=4.1.1",
	];
	assert.ok(
		verdict({
			policy: p,
			versions: { "http-cache-semantics": ["4.2.0"] },
		}).effective.knownAffected.some((r) => r.id === "CVE-2026-93750"),
	);
});
test("security: unknown extra advisory fails closed even with low severity", () => {
	const row = {
		...clone(original),
		github_advisory_id: "GHSA-2222-3333-4444",
		severity: "low",
	};
	blocked(
		verdict({
			data: payload([row]),
			versions: { "http-cache-semantics": ["4.2.0"] },
		}),
		"UNKNOWN_ADVISORY_OR_ALIAS",
	);
});
test("security: a new unverified alias of a known advisory requires review", () => {
	const row = { ...clone(original), cves: ["CVE-2026-999999"] };
	blocked(
		verdict({
			data: payload([row]),
			versions: { "http-cache-semantics": ["4.2.0"] },
		}),
		"UNKNOWN_ADVISORY_OR_ALIAS",
	);
});
test("security: unknown GHSA/CVE overlap is deduplicated but never accepted", () => {
	const a = { ...clone(original), github_advisory_id: "GHSA-2222-3333-4444" };
	const b = { ...a, id: 2, cves: ["CVE-2026-999999"] };
	const c = { ...b, id: 3 };
	delete c.github_advisory_id;
	const result = verdict({
		data: payload([a, b, c]),
		versions: { "http-cache-semantics": ["4.2.0"] },
	});
	blocked(result, "UNKNOWN_ADVISORY_OR_ALIAS");
	assert.equal(result.effective.advisories.length, 1);
	assert.equal(result.effective.advisories[0].observations.length, 6);
});
test("security: contradictory package identities and new withdrawal cannot pass", () => {
	blocked(
		verdict({
			data: payload([{ ...clone(original), module_name: "another-package" }]),
			versions: { "another-package": ["4.2.0"] },
		}),
		"ADVISORY_IDENTITY_CONFLICT",
	);
	blocked(
		verdict({
			data: payload([{ ...clone(original), withdrawn_at: "2026-10-03" }]),
		}),
		"WITHDRAWAL_REQUIRES_REVIEW",
	);
});
test("security: stale findings absent from the current graph are blocked", () => {
	blocked(verdict({ data: payload([original]) }), "AUDIT_GRAPH_MISMATCH");
});
for (const [label, change, code] of [
	[
		"HTML",
		(x) => {
			x.stdout = "<html>unavailable</html>";
		},
		"Unexpected token",
	],
	[
		"broken JSON",
		(x) => {
			x.stdout = "{";
		},
		"JSON",
	],
	[
		"empty stdout",
		(x) => {
			x.stdout = "";
		},
		"JSON",
	],
	[
		"zero-exit error object",
		(x) => {
			x.stdout = JSON.stringify({ error: { code: "ETIMEDOUT" } });
		},
		"AUDIT_ERROR",
	],
	[
		"missing metadata",
		(x) => {
			x.stdout = '{"advisories":{}}';
		},
		"AUDIT_MISSING",
	],
	[
		"missing severity count",
		(x) => {
			const d = payload();
			delete d.metadata.vulnerabilities.high;
			x.stdout = JSON.stringify(d);
		},
		"AUDIT_COUNTS",
	],
	[
		"nonzero count without records",
		(x) => {
			const d = payload();
			d.metadata.vulnerabilities.high = 1;
			x.stdout = JSON.stringify(d);
		},
		"AUDIT_COUNT_MISMATCH",
	],
	[
		"unknown severity count",
		(x) => {
			const d = payload();
			d.metadata.vulnerabilities.urgent = 1;
			x.stdout = JSON.stringify(d);
		},
		"AUDIT_UNKNOWN_SEVERITY",
	],
	[
		"missing dependency count",
		(x) => {
			const d = payload();
			delete d.metadata.totalDependencies;
			x.stdout = JSON.stringify(d);
		},
		"AUDIT_DEPENDENCY_COUNTS",
	],
	[
		"empty dependency graph",
		(x) => {
			const d = payload();
			d.metadata.totalDependencies = 0;
			x.stdout = JSON.stringify(d);
		},
		"AUDIT_EMPTY_GRAPH",
	],
	[
		"network exit",
		(x) => {
			x.exitCode = 42;
		},
		"AUDIT_TRANSPORT_OR_EXIT",
	],
	[
		"timeout with valid partial stdout",
		(x) => {
			x.error = "ETIMEDOUT";
		},
		"AUDIT_TRANSPORT_OR_EXIT",
	],
	[
		"signal with valid stdout",
		(x) => {
			x.signal = "SIGTERM";
		},
		"AUDIT_TRANSPORT_OR_EXIT",
	],
	[
		"nonzero empty report",
		(x) => {
			x.exitCode = 1;
		},
		"AUDIT_EXIT_INCONSISTENT",
	],
]) {
	test(`security parser: ${label} is BLOCKED`, () => {
		const bad = capture();
		change(bad);
		blocked(verdict({ captures: { prod: bad, full: capture() } }), code);
	});
}
test("security parser: alert exit zero and incomplete findings are invalid", () => {
	assert.throws(
		() => parseAudit(capture(payload([original]), { exitCode: 0 }), semver),
		/AUDIT_EXIT_INCONSISTENT/,
	);
	const row = clone(original);
	row.findings[0].paths = [];
	assert.throws(
		() => parseAudit(capture(payload([row])), semver),
		/AUDIT_FINDING_SCHEMA/,
	);
	row.findings = [{ ...original.findings[0], version: "9.0.0" }];
	assert.throws(
		() => parseAudit(capture(payload([row])), semver),
		/AUDIT_FINDING_RANGE_MISMATCH/,
	);
});
test("security policy: expiry is exact, unreviewed severity changes and invalid ranges fail closed", () => {
	blocked(verdict({ now: new Date(policy.reviewBy) }), "POLICY_REVIEW_DUE");
	blocked(
		verdict({ now: new Date(Date.parse(policy.reviewedAt) - 1) }),
		"POLICY_REVIEW_DUE",
	);
	const p = clone(policy);
	p.knownAdvisories[0].severity = "info";
	blocked(verdict({ policy: p }), "POLICY_SEVERITY_DOWNGRADE");
	p.knownAdvisories[0].affectedRanges = ["not-semver"];
	blocked(verdict({ policy: p }), "INVALID_RANGE");
});
test("security policy: ignore/waiver keys and missing ledger entries are not supported", () => {
	blocked(
		verdict({
			policy: { ...clone(policy), ignore: [original.github_advisory_id] },
		}),
		"UNSUPPORTED_POLICY_OPTION",
	);
	const p = clone(policy);
	p.knownAdvisories.pop();
	blocked(verdict({ policy: p }), "POLICY_LEDGER_INCOMPLETE");
});
test("security: installed approved patch integrity does not grant a cache exception", () => {
	const inspected = inspectProject(cwd, policy);
	assert.deepEqual(inspected.problems, []);
	assert.equal(inspected.versions["http-cache-semantics"][0], "4.2.0");
	const result = verdict({ ...inspected });
	assert.equal(result.state, "FAIL");
	assert.equal(result.effective.knownAffected.length, 2);
	assert.match(result.effective.mitigation, /NO_EXCEPTIONS/);
});
for (const variant of [
	"missing",
	"tampered",
	"registration",
	"installed hash",
]) {
	test(`security patch integrity: ${variant} is BLOCKED`, (t) => {
		const dir = owned(t);
		for (const file of [
			"package.json",
			"pnpm-lock.yaml",
			"pnpm-workspace.yaml",
		])
			copyFileSync(file, join(dir, file));
		symlinkSync(resolve("node_modules"), join(dir, "node_modules"), "dir");
		mkdirSync(join(dir, "scripts/patches"), { recursive: true });
		const name = "scripts/patches/http-cache-semantics@4.2.0.patch";
		for (const patch of Object.values(policy.expectedPatches)) {
			if (variant === "missing" && patch.path === name) continue;
			copyFileSync(patch.path, join(dir, patch.path));
		}
		if (variant === "tampered")
			writeFileSync(join(dir, name), "owned invalid patch\n");
		if (variant === "registration")
			writeFileSync(
				join(dir, "pnpm-workspace.yaml"),
				"patchedDependencies: {}\n",
			);
		const p = clone(policy);
		if (variant === "installed hash")
			p.expectedPatches["http-cache-semantics@4.2.0"].installedSourceSha256 =
				"0".repeat(64);
		blocked(
			verdict({ ...inspectProject(dir, p), policy: p }),
			"PATCH_INTEGRITY",
		);
	});
}
for (const variant of ["missing", "tampered", "installed hash"]) {
	test(
		[
			"security CLI patch integrity: ",
			variant,
			" is BLOCKED for the exact cause",
		].join(""),
		(t) => {
			const dir = owned(t);
			for (const file of [
				"package.json",
				"pnpm-lock.yaml",
				"pnpm-workspace.yaml",
			])
				copyFileSync(file, join(dir, file));
			symlinkSync(resolve("node_modules"), join(dir, "node_modules"), "dir");
			mkdirSync(join(dir, "scripts/patches"), { recursive: true });
			const key = "js-yaml@3.15.2";
			const p = clone(policy);
			for (const [name, patch] of Object.entries(p.expectedPatches)) {
				if (name === key && variant === "missing") continue;
				copyFileSync(patch.path, join(dir, patch.path));
			}
			if (variant === "tampered")
				writeFileSync(
					join(dir, p.expectedPatches[key].path),
					"owned invalid CLI patch\n",
				);
			if (variant === "installed hash")
				p.expectedPatches[key].installedSourceSha256 = "0".repeat(64);
			const inspection = inspectProject(dir, p);
			const cause = {
				missing: "ENOENT",
				tampered: "PATCH_BYTES",
				"installed hash": "PATCH_INSTALLED_BYTES",
			}[variant];
			const code = ["PATCH_INTEGRITY:", cause].join("");
			assert.deepEqual(inspection.problems, [{ code }]);
			blocked(verdict({ ...inspection, policy: p }), code);
		},
	);
}
test("security collector: exactly prod/full once, lossless raw output and bounded command arguments", (t) => {
	const dir = owned(t);
	const calls = [];
	const output = join(dir, "evidence");
	const stdout = `${JSON.stringify(payload())}\n`;
	const { receipt } = collect({
		cwd,
		output,
		runner: runnerFor(payload(), calls, { stdout }),
		getSnapshot: cleanContext,
		now,
	});
	assert.deepEqual(
		calls.map((r) => [r.command, r.args]),
		[
			[
				"pnpm",
				["audit", "--prod", "--registry=https://registry.npmjs.org", "--json"],
			],
			["pnpm", ["audit", "--registry=https://registry.npmjs.org", "--json"]],
		],
	);
	assert.ok(
		calls.every(
			(r) =>
				r.options.timeout === 120000 &&
				r.options.maxBuffer === 32 * 1024 * 1024,
		),
	);
	for (const kind of ["prod", "full"]) {
		assert.equal(
			readFileSync(join(output, `${kind}.stdout.json`), "utf8"),
			stdout,
		);
		assert.equal(receipt.captures[kind].stdoutSha256, sha(stdout));
		assert.equal(
			readFileSync(join(output, `${kind}.stderr.log`), "utf8"),
			"owned diagnostic\n",
		);
		assert.equal(receipt.captures[kind].exitCode, 0);
	}
	assert.deepEqual(receipt.before, receipt.after);
	assert.equal(receipt.executionMode, "INJECTED_OFFLINE");
	assert.throws(
		() => collect({ cwd, output, runner: runnerFor(payload(), calls) }),
		/EEXIST/,
	);
	assert.equal(calls.length, 2);
});
test("security collector: first transport failure still attempts full and saves both failures", (t) => {
	const dir = owned(t);
	let calls = 0;
	const result = collect({
		cwd,
		output: join(dir, "out"),
		now,
		getSnapshot: cleanContext,
		runner: () => {
			calls++;
			if (calls === 1)
				throw Object.assign(new Error("owned timeout"), { code: "ETIMEDOUT" });
			return {
				stdout: Buffer.from("{partial"),
				stderr: Buffer.from("owned network error"),
				status: 1,
				signal: null,
			};
		},
	});
	assert.equal(calls, 2);
	assert.equal(result.receipt.captures.prod.error, "ETIMEDOUT");
	assert.equal(
		result.receipt.captures.full.stderrSha256,
		sha("owned network error"),
	);
	blocked(verdict({ captures: result.captures }), "AUDIT_TRANSPORT");
});
test("security orchestration: retained current audit is FAIL, artifacts written without any live process", (t) => {
	const dir = owned(t);
	const calls = [];
	const result = runGate({
		expectedHead: null,
		cwd,
		output: join(dir, "out"),
		runner: runnerFor(raw, calls),
		getSnapshot: cleanContext,
		now,
	});
	assert.equal(calls.length, 2);
	assert.equal(result.state, "FAIL");
	assert.equal(result.effective.knownAffected.length, 2);
	assert.equal(
		JSON.parse(readFileSync(join(dir, "out/verdict.json"))).exitCode,
		1,
	);
	assert.equal(result.executionMode, "INJECTED_OFFLINE");
});
test("security orchestration: source mutation and dirty/mismatched HEAD block", (t) => {
	const dir = owned(t);
	let n = 0;
	const result = runGate({
		expectedHead: null,
		cwd,
		output: join(dir, "out"),
		runner: runnerFor(payload(), []),
		now,
		getSnapshot: () => ({
			...cleanContext(),
			head: (++n === 1 ? "a" : "b").repeat(40),
			trackedDirty: true,
		}),
	});
	blocked(result, "SOURCE_CHANGED");
	blocked(result, "HEAD_MISMATCH_OR_DIRTY");
});
test("security orchestration: missing project inputs still preserve both raw attempts and BLOCKED verdict", (t) => {
	const dir = owned(t);
	const calls = [];
	const result = runGate({
		expectedHead: null,
		cwd: dir,
		output: join(dir, "out"),
		runner: runnerFor(payload(), calls),
		getSnapshot: () => {
			throw new Error("owned context failure");
		},
		now,
	});
	assert.equal(calls.length, 2);
	blocked(result, "SOURCE_CHANGED_OR_UNREADABLE");
	assert.equal(
		JSON.parse(readFileSync(join(dir, "out/verdict.json"))).state,
		"BLOCKED",
	);
});
test("security snapshot binds actual checkout and exact source/lock bytes", () => {
	const context = snapshot(cwd);
	assert.equal(
		context.head,
		execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
	);
	assert.equal(
		context.files["pnpm-lock.yaml"],
		sha(readFileSync("pnpm-lock.yaml")),
	);
	assert.equal(
		context.files["scripts/zhenkun-security-audit.mjs"],
		sha(readFileSync("scripts/zhenkun-security-audit.mjs")),
	);
});
test("security orchestration: expected CI checkout SHA must match", (t) => {
	const dir = owned(t);
	const result = runGate({
		cwd,
		output: join(dir, "out"),
		expectedHead: "c".repeat(40),
		getSnapshot: cleanContext,
		runner: runnerFor(payload(), []),
		now,
	});
	blocked(result, "HEAD_MISMATCH_OR_DIRTY");
});
test("security CLI refuses an invocation without explicit live collection selection", () => {
	const result = spawnSync(
		process.execPath,
		["scripts/zhenkun-security-audit.mjs"],
		{ cwd, encoding: "utf8" },
	);
	assert.equal(result.status, 2);
	assert.match(result.stderr, /USAGE.*--live/);
	assert.equal(result.stdout, "");
});

function byteRunner(pairs, calls) {
	return (command, args, options) => {
		const [stdout, stderr] = pairs[Math.min(calls.length, pairs.length - 1)];
		calls.push({ command, args, options });
		// Execute only this owned byte writer, never the requested pnpm command.
		return spawnSync(
			process.execPath,
			[
				"-e",
				'process.stdout.write(Buffer.from(process.argv[1], "hex")); process.stderr.write(Buffer.from(process.argv[2], "hex"));',
				stdout.toString("hex"),
				stderr.toString("hex"),
			],
			options,
		);
	};
}
const jsonWithIllegalTitleByte = () => {
	const row = { ...clone(original), title: "OWNED_BYTE_MARKER" };
	const data = JSON.stringify(payload([row]));
	const at = data.indexOf("OWNED_BYTE_MARKER");
	return Buffer.concat([
		Buffer.from(data.slice(0, at)),
		Buffer.from([0xff]),
		Buffer.from(data.slice(at + "OWNED_BYTE_MARKER".length)),
	]);
};
for (const [label, stdout, stderr, invalidStreams] of [
	[
		"review bytes",
		Buffer.from("31ff0a", "hex"),
		Buffer.from("fe", "hex"),
		["stdout", "stderr"],
	],
	[
		"illegal byte inside otherwise parseable JSON",
		jsonWithIllegalTitleByte(),
		Buffer.alloc(0),
		["stdout"],
	],
	[
		"truncated multibyte sequences",
		Buffer.from("e282", "hex"),
		Buffer.from("f09f8c", "hex"),
		["stdout", "stderr"],
	],
	[
		"stderr-only malformed byte",
		Buffer.from(JSON.stringify(payload())),
		Buffer.from("fe", "hex"),
		["stderr"],
	],
]) {
	test(`security bytes: ${label} retained exactly and rejected before JSON interpretation`, (t) => {
		const output = join(owned(t), "out");
		const calls = [];
		const { captures, receipt } = collect({
			cwd,
			output,
			now,
			getSnapshot: cleanContext,
			runner: byteRunner([[stdout, stderr]], calls),
		});
		assert.equal(calls.length, 2);
		for (const kind of ["prod", "full"]) {
			assert.deepEqual(
				readFileSync(join(output, `${kind}.stdout.json`)),
				stdout,
			);
			assert.deepEqual(
				readFileSync(join(output, `${kind}.stderr.log`)),
				stderr,
			);
			assert.equal(receipt.captures[kind].stdoutSha256, sha(stdout));
			assert.equal(receipt.captures[kind].stderrSha256, sha(stderr));
			assert.deepEqual(receipt.captures[kind].decodingErrors, invalidStreams);
			assert.throws(
				() => parseAudit(captures[kind], semver),
				/AUDIT_INVALID_UTF8/,
			);
		}
		blocked(verdict({ captures }), "AUDIT_INVALID_UTF8");
		assert.ok(calls.every((c) => c.options.encoding === null));
	});
}
test("security bytes: valid multibyte UTF-8 and literal replacement character remain accepted", (t) => {
	const row = { ...clone(original), title: "中文🙂�" };
	const stdout = Buffer.from(JSON.stringify(payload([row])));
	const stderr = Buffer.from("合法诊断🙂�\n");
	const calls = [];
	const output = join(owned(t), "out");
	const { captures, receipt } = collect({
		cwd,
		output,
		now,
		getSnapshot: cleanContext,
		runner: (command, args, options) => ({
			...byteRunner([[stdout, stderr]], calls)(command, args, options),
			status: 1,
		}),
	});
	for (const kind of ["prod", "full"]) {
		assert.deepEqual(readFileSync(join(output, `${kind}.stdout.json`)), stdout);
		assert.deepEqual(readFileSync(join(output, `${kind}.stderr.log`)), stderr);
		assert.deepEqual(receipt.captures[kind].decodingErrors, []);
		assert.equal(parseAudit(captures[kind], semver).records.length, 1);
	}
	assert.equal(
		verdict({ captures, versions: { "http-cache-semantics": ["4.2.0"] } })
			.state,
		"FAIL",
	);
});
test("security bytes: invalid prod still collects and parses valid full independently", (t) => {
	const output = join(owned(t), "out");
	const calls = [];
	const { captures } = collect({
		cwd,
		output,
		now,
		getSnapshot: cleanContext,
		runner: byteRunner(
			[
				[Buffer.from("ff", "hex"), Buffer.alloc(0)],
				[Buffer.from(JSON.stringify(payload())), Buffer.alloc(0)],
			],
			calls,
		),
	});
	assert.equal(calls.length, 2);
	const result = verdict({ captures });
	blocked(result, "AUDIT_INVALID_UTF8");
	assert.equal(result.raw.prod.state, "BLOCKED");
	assert.equal(result.raw.full.state, "VALID");
});
test("security workflow: independent quality/peer/security jobs, immutable action and fail-closed upload", () => {
	const workflow = yaml.load(
		readFileSync(".github/workflows/build.yml", "utf8"),
	);
	const baseline = JSON.parse(
		readFileSync(
			"references/dependency-r4-2026-10-03/workflow-baseline.json",
			"utf8",
		),
	);
	const expectedQuality = clone(baseline.quality);
	const nativeIndex = expectedQuality.steps.findIndex(
		(step) => step.run === "node --test scripts/zhenkun-test-*.mjs",
	);
	assert.ok(nativeIndex > 0);
	expectedQuality.steps.splice(nativeIndex, 0, {
		name: "Check actual overridden parent declarations strictly",
		run: [
			"pnpm exec tsc --ignoreConfig --noEmit --strict --skipLibCheck false --module NodeNext --moduleResolution NodeNext --target ES2022 scripts/zhenkun-swup-parent-types.ts",
			"node scripts/zhenkun-five-parent-types.mjs",
			"",
		].join("\n"),
	});
	// Preserve the complete original quality job, plus only this exact gate.
	assert.deepEqual(workflow.jobs.quality, expectedQuality);
	assert.deepEqual(workflow.permissions, { contents: "read" });
	assert.deepEqual(workflow.on, baseline.on);
	for (const name of ["quality", "compatibility", "security"]) {
		assert.equal(workflow.jobs[name].needs, undefined);
		assert.equal(workflow.jobs[name]["continue-on-error"], undefined);
		for (const step of workflow.jobs[name].steps) {
			assert.equal(step["continue-on-error"], undefined);
			if (step.run)
				assert.doesNotMatch(
					step.run,
					/\|\|\s*true|ignore-registry-errors|audit.*--fix/,
				);
		}
	}
	const security = workflow.jobs.security.steps;
	const audit = security.filter((s) =>
		s.run?.startsWith("node scripts/zhenkun-security-audit.mjs --live"),
	);
	assert.equal(audit.length, 1);
	// biome-ignore lint/suspicious/noTemplateCurlyInString: GitHub expression literal.
	assert.equal(audit[0].if, "${{ always() && !cancelled() }}");
	assert.match(audit[0].run, /--live --output tmp\/security-audit$/);
	const upload = security.at(-1);
	// biome-ignore lint/suspicious/noTemplateCurlyInString: GitHub expression literal.
	assert.equal(upload.if, "${{ always() }}");
	assert.equal(
		upload.uses,
		"actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02",
	);
	assert.equal(upload.with.path, "tmp/security-audit/");
	assert.equal(upload.with["if-no-files-found"], "error");
	assert.ok(
		workflow.jobs.compatibility.steps.some((s) => s.run === "pnpm peers check"),
	);
	assert.equal(
		sha(readFileSync(".github/workflows/deploy.yml")),
		baseline.deploySha256,
	);
	const deploy = yaml.load(
		readFileSync(".github/workflows/deploy.yml", "utf8"),
	);
	assert.equal(deploy.jobs.quality.uses, "./.github/workflows/build.yml");
	assert.equal(deploy.jobs.build.needs, "quality");
	assert.equal(deploy.jobs.deploy.needs, "build");
});

// Synthetic verifier output only tests classification; the CLI constructs this proof itself.
function repairFixture() {
	return {
		state: "VERIFIED_LOCAL_REPAIR",
		inspection: {
			contract: JSON.parse(
				readFileSync("scripts/zhenkun-cache-repair-contract.json", "utf8"),
			),
		},
	};
}
function repaired(overrides = {}) {
	return verdict({
		data: raw,
		versions: { "http-cache-semantics": ["4.2.0"] },
		remediation: repairFixture(),
		...overrides,
	});
}
test("repair classification: raw high, both observations, version matches and publisher CVE remain visible", () => {
	const r = repaired();
	assert.equal(r.state, "PASS");
	assert.equal(r.raw.prod.counts.high, 1);
	assert.equal(r.raw.full.counts.high, 1);
	assert.equal(r.effective.advisories[0].observations.length, 2);
	assert.deepEqual(r.effective.verifiedLocalRepairs, [
		"GHSA-ch52-4w7c-c8xp",
		"CVE-2026-93750",
	]);
	assert.equal(r.effective.knownAffected.length, 2);
	assert.equal(r.effective.unresolved.length, 0);
	assert.equal(r.effective.advisories[0].severity, "high");
});
for (const remediation of [
	undefined,
	{ state: "UNVERIFIED" },
	{ state: "NOT_RUN" },
	{ state: "HASH_ONLY" },
]) {
	test(`repair classification: ${remediation?.state ?? "missing"} evidence cannot close findings`, () => {
		const r = repaired({ remediation });
		assert.equal(r.state, "FAIL");
		assert.equal(r.effective.verifiedLocalRepairs.length, 0);
		assert.ok(
			r.effective.unresolved.some((row) => row.id === "CVE-2026-93750"),
		);
	});
}
for (const field of [
	"title",
	"url",
	"severity",
	"vulnerable_versions",
	"patched_versions",
	"path",
	"alias",
]) {
	test(`repair classification: changed audit ${field} fails closed`, () => {
		const data = clone(raw);
		const row = Object.values(data.advisories)[0];
		if (field === "path")
			row.findings[0].paths.push(".>unknown>http-cache-semantics");
		else if (field === "alias") row.cves = ["CVE-2026-93748"];
		else if (field === "severity") {
			row.severity = "critical";
			data.metadata.vulnerabilities.high = 0;
			data.metadata.vulnerabilities.critical = 1;
		} else if (field === "vulnerable_versions") row[field] = "<4.2.1";
		else if (field === "patched_versions") row[field] = ">=4.2.2";
		else row[field] += "changed";
		blocked(repaired({ data }), "REPAIR_ADVISORY_OR_INSTANCE_CHANGED");
	});
}
test("repair classification: unknown advisory remains blocked alongside exact repaired finding", () => {
	const extra = {
		...clone(original),
		id: original.id + 1,
		github_advisory_id: "GHSA-2345-2345-2345",
	};
	blocked(
		repaired({ data: payload([clone(original), extra]) }),
		"UNKNOWN_ADVISORY_OR_ALIAS",
	);
});
test("repair classification: extra affected installed version cannot be covered", () => {
	blocked(
		repaired({ versions: { "http-cache-semantics": ["4.1.1", "4.2.0"] } }),
		"REPAIR_ADVISORY_OR_INSTANCE_CHANGED",
	);
});
test("repair classification: clean audit cannot conceal required version observations", () => {
	blocked(repaired({ data: payload() }), "REPAIR_ADVISORY_OR_INSTANCE_CHANGED");
});
test("repair classification: expiration still blocks with synthetic positive proof", () => {
	blocked(
		repaired({ now: new Date(policy.reviewBy) }),
		"POLICY_REVIEW_DUE_OR_INVALID_CLOCK",
	);
});
test("repair classification: other known affected packages remain unresolved", () => {
	const r = repaired({
		versions: { "http-cache-semantics": ["4.2.0"], sharp: ["0.35.4"] },
	});
	assert.equal(r.state, "FAIL");
	assert.equal(r.effective.verifiedLocalRepairs.length, 2);
	assert.ok(r.effective.unresolved.some((row) => row.package === "sharp"));
});
test("repair inspection: actual graph paths and installed source agree", () => {
	const r = inspectCacheBoundary(cwd, policy);
	assert.equal(r.owners.length, 1);
	assert.equal(r.resolutions.length, 8);
	assert.ok(r.links.length >= 1);
});
for (const key of [
	"CF_WORKERS",
	"NODE_OPTIONS",
	"ZHENKUN_CACHE_POLICY_BASELINE",
	"ZHENKUN_ASTRO_CACHE_BASELINE",
]) {
	test(`repair inspection: environment ${key} invalidates deployment proof`, () => {
		assert.throws(
			() => inspectCacheBoundary(cwd, policy, { [key]: "changed" }),
			/REPAIR_ENVIRONMENT_CHANGED/,
		);
	});
}
test("repair inspection: ledger and expected installed hashes cannot silently change", () => {
	const p = clone(policy);
	p.knownAdvisories[0].sources[0].url += "changed";
	assert.throws(
		() => inspectCacheBoundary(cwd, p, {}),
		/REPAIR_LEDGER_CHANGED/,
	);
	const q = clone(policy);
	q.expectedPatches["astro@7.2.10"].installedSourceSha256 = "0".repeat(64);
	assert.throws(
		() => inspectCacheBoundary(cwd, q, {}),
		/REPAIR_PATCH_POLICY_CHANGED/,
	);
});

for (const variant of [
	"application",
	"test",
	"parents",
	"installed lock",
	"extra installed cache",
]) {
	test(`repair inspection: actual owned ${variant} mutation fails closed`, (t) => {
		const dir = owned(t);
		const contract = JSON.parse(
			readFileSync("scripts/zhenkun-cache-repair-contract.json", "utf8"),
		);
		const files = new Set([
			...boundaryFiles(cwd),
			...Object.keys(contract.testFiles),
		]);
		for (const name of files) {
			mkdirSync(join(dir, name, ".."), { recursive: true });
			symlinkSync(resolve(name), join(dir, name));
		}
		execFileSync("git", ["init", "-q"], { cwd: dir });
		execFileSync("git", ["add", "--", ...boundaryFiles(cwd)], { cwd: dir });
		const config = join(dir, "scripts/zhenkun-cache-repair-contract.json");
		writeFileSync(config, JSON.stringify(contract));
		const replaceOwnedLink = (name, content) => {
			rmSync(join(dir, name));
			writeFileSync(join(dir, name), content);
		};
		let expected;
		if (variant === "application") {
			replaceOwnedLink("astro.config.mjs", "owned changed deployment\n");
			expected = /REPAIR_DEPLOYMENT_BOUNDARY_CHANGED/;
		}
		if (variant === "test") {
			replaceOwnedLink(
				"scripts/zhenkun-test-cache-policy.mjs",
				"owned invalid test\n",
			);
			expected = /REPAIR_TEST_CHANGED/;
		}
		if (variant === "parents") {
			contract.parents = [];
			writeFileSync(config, JSON.stringify(contract));
			expected = /REPAIR_PARENT_SET_CHANGED/;
		}
		if (["installed lock", "extra installed cache"].includes(variant)) {
			mkdirSync(join(dir, "node_modules/.pnpm"), { recursive: true });
			symlinkSync(
				resolve("node_modules/astro"),
				join(dir, "node_modules/astro"),
			);
			const lockFile = join(dir, "node_modules/.pnpm/lock.yaml");
			copyFileSync("node_modules/.pnpm/lock.yaml", lockFile);
			if (variant === "installed lock") {
				writeFileSync(lockFile, "lockfileVersion: '9.0'\n");
				expected = /REPAIR_INSTALLED_LOCK_MISMATCH/;
			} else {
				const fake = join(dir, "fake-cache");
				mkdirSync(fake);
				writeFileSync(
					join(fake, "package.json"),
					JSON.stringify({ name: "http-cache-semantics", version: "4.2.0" }),
				);
				writeFileSync(join(fake, "index.js"), "owned unpatched code\n");
				symlinkSync(fake, join(dir, "node_modules/extra-cache"));
				expected = /REPAIR_UNCOVERED_INSTALLED_INSTANCE/;
			}
		} else
			symlinkSync(resolve("node_modules"), join(dir, "node_modules"), "dir");
		assert.throws(() => inspectCacheBoundary(dir, policy, {}), expected);
	});
}

function primaryFixture() {
	return Object.fromEntries(
		["ghsa", "cve", "latest"].map((kind) => [
			kind,
			JSON.parse(
				readFileSync(
					`references/dependency-cache-final-2026-10-04/resumed/primary-baseline/${kind}.json`,
					"utf8",
				),
			),
		]),
	);
}
test("repair primary records: pinned exact source records validate", () => {
	verifyPrimaryRecords(primaryFixture(), repairFixture().inspection.contract);
});
for (const kind of ["ghsa", "cve", "latest"]) {
	test(`repair primary records: missing or changed ${kind} fails closed`, () => {
		const missing = primaryFixture();
		delete missing[kind];
		assert.throws(
			() => verifyPrimaryRecords(missing, repairFixture().inspection.contract),
			/REPAIR_PRIMARY_CHANGED|REPAIR_UPSTREAM_REVIEW_REQUIRED/,
		);
		const changed = primaryFixture();
		if (kind === "ghsa") changed.ghsa.severity = "critical";
		if (kind === "cve") changed.cve.containers.cna.affected = [];
		if (kind === "latest") changed.latest.version = "4.2.1";
		assert.throws(
			() => verifyPrimaryRecords(changed, repairFixture().inspection.contract),
			/REPAIR_PRIMARY_CHANGED|REPAIR_UPSTREAM_REVIEW_REQUIRED/,
		);
	});
}
test("repair primary records: withdrawal and CVE rejection invalidate evidence", () => {
	const ghsa = primaryFixture().ghsa;
	ghsa.withdrawn_at = "2026-10-04T00:00:00Z";
	assert.throws(
		() => primaryProjection("ghsa", ghsa),
		/REPAIR_PRIMARY_IDENTITY/,
	);
	const cve = primaryFixture().cve;
	cve.cveMetadata.state = "REJECTED";
	assert.throws(() => primaryProjection("cve", cve), /REPAIR_PRIMARY_IDENTITY/);
});
test("repair primary records: EPSS/comment counters do not change advisory scope", () => {
	const records = primaryFixture();
	records.ghsa.epss = { percentage: 0.99 };
	records.ghsa.comments = 999;
	verifyPrimaryRecords(records, repairFixture().inspection.contract);
});

test("repair primary records: reviewed upstream 4.3.0 is separate from installed patched 4.2.0", () => {
	const contract = repairFixture().inspection.contract;
	assert.equal(contract.installedVersions["http-cache-semantics"], "4.2.0");
	assert.equal(contract.reviewedUpstream.version, "4.3.0");
	verifyPrimaryRecords(primaryFixture(), contract);
	const future = primaryFixture();
	future.latest.version = "4.4.0";
	assert.throws(
		() => verifyPrimaryRecords(future, contract),
		/REPAIR_UPSTREAM_REVIEW_REQUIRED/,
	);
});
test("repair primary records: missing or expired upstream review cannot pass", () => {
	const contract = repairFixture().inspection.contract;
	for (const date of [
		new Date(Date.parse(contract.reviewedUpstream.reviewedAt) - 1),
		new Date(contract.reviewedUpstream.reviewBy),
	])
		assert.throws(
			() => verifyPrimaryRecords(primaryFixture(), contract, date),
			/REPAIR_UPSTREAM_REVIEW_MISSING_OR_EXPIRED/,
		);
	delete contract.reviewedUpstream;
	assert.throws(
		() => verifyPrimaryRecords(primaryFixture(), contract),
		/REPAIR_UPSTREAM_REVIEW_MISSING_OR_EXPIRED/,
	);
});

function nestedAstroFixture(t) {
	const dir = owned(t);
	const contract = repairFixture().inspection.contract;
	for (const name of new Set([
		...boundaryFiles(cwd),
		...Object.keys(contract.testFiles),
	])) {
		mkdirSync(join(dir, name, ".."), { recursive: true });
		symlinkSync(resolve(name), join(dir, name));
	}
	execFileSync("git", ["init", "-q"], { cwd: dir });
	execFileSync("git", ["add", "--", ...boundaryFiles(cwd)], { cwd: dir });
	writeFileSync(
		join(dir, "scripts/zhenkun-cache-repair-contract.json"),
		JSON.stringify(contract),
	);
	mkdirSync(join(dir, "node_modules/@astrojs"), { recursive: true });
	for (const name of readdirSync("node_modules")) {
		if (name !== "@astrojs")
			symlinkSync(
				resolve("node_modules", name),
				join(dir, "node_modules", name),
			);
	}
	for (const name of readdirSync("node_modules/@astrojs")) {
		if (name !== "mdx")
			symlinkSync(
				resolve("node_modules/@astrojs", name),
				join(dir, "node_modules/@astrojs", name),
			);
	}
	const mdx = join(dir, "node_modules/@astrojs/mdx");
	const nested = join(mdx, "node_modules/astro");
	mkdirSync(join(nested, "dist"), { recursive: true });
	writeFileSync(
		join(mdx, "package.json"),
		JSON.stringify({
			name: "@astrojs/mdx",
			version: "7.0.8",
			main: "index.cjs",
		}),
	);
	writeFileSync(join(mdx, "index.cjs"), "// resolution-only owned fixture\n");
	writeFileSync(
		join(nested, "package.json"),
		JSON.stringify({ name: "astro", version: "7.2.10", main: "dist/index.js" }),
	);
	writeFileSync(
		join(nested, "dist/index.js"),
		"// resolution-only owned fixture\n",
	);
	for (const file of Object.keys(contract.astroFiles)) {
		mkdirSync(join(nested, "dist", file, ".."), { recursive: true });
		copyFileSync(
			join(dirname(require.resolve("astro")), file),
			join(nested, "dist", file),
		);
	}
	mkdirSync(join(nested, "node_modules"));
	symlinkSync(
		dirname(parent.resolve("http-cache-semantics")),
		join(nested, "node_modules/http-cache-semantics"),
	);
	// Make a cache link visible to the normal installation scan despite the fixture's .pnpm directory symlink.
	symlinkSync(
		dirname(parent.resolve("http-cache-semantics")),
		join(dir, "node_modules/http-cache-semantics"),
	);
	return { dir, nested };
}
test("P2 nested Astro original generator fails even when root and cache endpoints are patched", (t) => {
	const { dir, nested } = nestedAstroFixture(t);
	copyFileSync(
		"references/dependency-cache-final-2026-10-04/astro-generator-official.js",
		join(nested, "dist/assets/build/generate.js"),
	);
	assert.throws(
		() => inspectCacheBoundary(dir, policy, {}),
		/REPAIR_ASTRO_SOURCE_CHANGED:assets\/build\/generate.js/,
	);
});

test("P2 nested Astro patched positive control inventories both real instances", (t) => {
	const { dir } = nestedAstroFixture(t);
	const result = inspectCacheBoundary(dir, policy, {});
	assert.equal(result.astroInstances.length, 2);
	assert.equal(result.resolutions.length, 8);
	assert.ok(
		result.astroInstances.some((instance) =>
			instance.paths.includes(".>@astrojs/mdx>astro>http-cache-semantics"),
		),
	);
	for (const instance of result.astroInstances)
		assert.equal(instance.version, "7.2.10");
});
test("P2 nested Astro changed version is rejected even with matching source files", (t) => {
	const { dir, nested } = nestedAstroFixture(t);
	writeFileSync(
		join(nested, "package.json"),
		JSON.stringify({ name: "astro", version: "7.2.11", main: "dist/index.js" }),
	);
	assert.throws(
		() => inspectCacheBoundary(dir, policy, {}),
		/REPAIR_ASTRO_VERSION_CHANGED/,
	);
});
