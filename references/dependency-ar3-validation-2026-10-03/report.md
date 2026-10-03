# A/R3 v2.1 validation — PARTIAL / browser BLOCKED

Dependency input: `84ee2bcf6b1d955537425407f695e12706f005dc`.
Final candidate source: `d39b89677c11bef3fbad9d5e94fc6e89601674a6`.
Branch/worktree: `codex/dependency-ar3-20261003`, `/Users/zhenkun/Documents/Codex/2026-10-03/task-3/zhenkun-ar3`.
Runtime: Node v24.20.0, pnpm 11.22.0, macOS arm64. Actual model configuration UNVERIFIED.

## Change and scope

Resumed only after confirming the exact handoff HEAD and clean tracked/index state. The approved two cross-major parent overrides and Vite 8.2.2→rolldown 1.2.4 guard remain byte-identical to the v2.1 input. The only new candidate source consists of `scripts/zhenkun-test-swup-parents.mjs` and `scripts/zhenkun-swup-parent-types.ts`. No dependency version, production configuration, bilingual, feature, content, CI or security-setting changes were made in this validation increment. Guard review remains due 2026-10-17 under the approved decision.

The candidate has **not** completed acceptance: GUI and Linux results remain unavailable, inherited advisories remain open, and the inherited peer warning requires independent judgment. This is not overall dependency-security closure.

## Actual checks

[Validation receipt](validation-receipt.json) records each command and exit file. Final commands were run against the candidate files; source hashes identify the final test files. Both production builds use unchanged application/build scripts, and CF_WORKERS is absent.

| Gate | Current result and evidence |
| --- | --- |
| Frozen official-registry installation | PASS, exit 0; resolution skipped, 737 installed packages on this platform; [log](install.log). Lock SHA256 remains `a214c80c3a120501007ff385c28b47a7d9f224c7d6b8f97d9ae2acdb9e6d4a87`. Existing allowBuilds is unchanged. |
| Actual ESM/CJS parent resolution and requirements | PASS, both actual parent entrypoints construct the installed base4 class; declared base ranges remain ^3.0.0. Legal/illegal Swup requirements and named-plugin version ranges/missing-plugin cases exercised for both formats. [Installed file/entry hashes](installed-graph.json), [test source](../../scripts/zhenkun-test-swup-parents.mjs). |
| Actual published Swup hooks and plugin lifecycle | PASS in native bounded fixture: real Swup use/unuse/createVisit/hooks execute both parents; two mount/unmount cycles have five handlers per mount and zero afterward; unregister arrays empty; detached route handlers no longer run. Eight parent tests total, included in final full suite. |
| Route/parallel behavior | PASS in native fixture: route matching/sanitized naming/history/from-to classes, parallel marking/wait/skip, insertion/removal, temporary exclusion and restoration of visit containers, disabled parallel visit and post-visit cleanup. This is **not actual-browser DOM acceptance**. |
| Parent declarations | PASS, TypeScript strict NodeNext compiler without skipLibCheck, including Swup module augmentations and two expected-invalid API assertions; [strict log](parent-types-strict.log). Separate fixture compile with skipLibCheck also passed. |
| Formal TypeScript | PASS, `pnpm type-check` retains `tsc --noEmit --isolatedDeclarations`; [log](type-check.log). |
| Astro/content diagnostics | PASS, 258 files, 0 errors/warnings, 12 retained hints; [log](check.log). |
| Source/new-test Biome | PASS, 298 source files and 2 added test files; [source](biome-src.log), [final new files](biome-new-final.log). |
| Final complete native suite | PASS, **159/159**, 0 failed/skipped; [log](native.log). Includes 151 existing tests plus 8 new parent cases; this is a new actual run, not historical acceptance. |
| Full root/project builds | PASS, both `pnpm build` execute the entire declared generator/Astro/font/minifier/Pagefind chain; [root](build-root.log), [project](build-project.log). Existing expected disabled-page Pagefind exclusions and zh-cn stemming notices retained. |
| Artifacts/Pagefind | PASS after each full build; [root contract](artifacts-root.log), [project contract](artifacts-project.log). Each indexes 1 zh-cn page; no public article. Complete saved file manifests: [root](artifact-root-manifest.json), [project](artifact-project-manifest.json). |
| Local HTTP/byte/path contracts | PASS on approved loopback-only static servers; [root](http-root.json), [project](http-project.json). These are HTTP/artifact checks, not GUI checks. |
| Peer check | FAIL, inherited mdx7.0.8 wants markdown-satteri ^0.3.1 while 0.4.0 is installed; [log](peers.log), [exact baseline/candidate pairing comparison](peer-equivalence.json). No new peer pairing or waiver; independent reviewer must judge the existing warning. |
| Linux candidate | NOT_RUN on this macOS host. No historical Linux success reused. |
| Real browser | BLOCKED; see below. |

The native fixture subclasses actual published Swup only to suppress automatic `enable()` browser-listener installation and supplies explicit DOM/history stand-ins. Actual published hook registry, visit construction, parent entrypoints, use/unuse and plugin behavior run unmodified. It cannot prove enable/destroy listener lifecycle, CSS animation/reflow, DOMParser, browser history, real focus/inert/scroll or interrupted navigation. Those remain part of the blocked GUI gate.

Initial tooling diagnostics were corrected without changing production code: TypeScript 6 file-mode compilation needed `--ignoreConfig` (initial TS5112); first Biome found two returning forEach callbacks in the DOM stand-in, then final checks passed. An initial advisory computation used raw comma-separated GitHub ranges as npm semver and was rejected; normalized conjunctions produce the verified 32 current affected count. These are documented in ERROR_MEMORY and reconciliation, not passed initial attempts.

## Browser blocker and access handling

First IAB tab creation targeted `http://127.0.0.1:4321` before a server was running and returned ERR_CONNECTION_REFUSED. Starting the exact loopback server initially produced sandbox `PermissionError: [Errno 1] Operation not permitted`; the same server command then started after reviewed escalation. No address/security setting was changed.

After server startup, retrieving tab 1 through the IAB client failed with **“Blocked browser navigation by Browser Use URL policy: data:text/html;charset=utf-8,<encoded connection-error document>”**. The intended target `goto` was never reached. No successful candidate GUI page, viewport, screenshot or browser version was obtained. No alternate browser, new tab route or network route was used after policy refusal. [Structured blocker](browser-blocker.json).

Home/About repeat navigation, interrupted navigation, back/forward, first/replacement/clear/reopen search, mobile menu keyboard/focus, scroll/inert cleanup and an optional-feature actual DOM fixture are all **BLOCKED / NOT_RUN**. Artifact/native/HTTP success and historical GUI results do not substitute for them.

## Current graph and audits

[Installed graph](installed-graph.json) confirms both real parents resolve plugin **4.0.0**, and all three Vite snapshots retain rolldown **1.2.4**. Corrected lock contains **925 package records**, versus phase-0 1350: **425 removed**, zero added or modified existing package records per the v2.1 structural gate. The frozen installation preserves that lock; actual virtual directories also lack the old chain.

No plugin3, microbundle, rollup-plugin-terser, serialize-javascript or colord remains. SVGO2 and brace-expansion1 are absent. Remaining target instances are SVGO **4.0.2/4.1.0** and brace-expansion **2.1.4/5.0.9**. No serializer fallback/global override was added.

Fresh installed-candidate [production audit](audit-prod.json) and [full audit](audit-full.json) each exit **1**: **44 records / 31 GHSA / 8 packages**, **21 high, 16 moderate, 7 low, 0 critical**, versus original phase-0 51/33/10 (25/19/7). Registry is `https://registry.npmjs.org`; stderr and exit files retained. These are fresh v2.1 results; the old rejected candidate audits are not used as current evidence.

The complete residual IDs and installed affected versions are in [advisory reconciliation](advisory-reconciliation.json). The 36-GHSA official bounded ledger, re-evaluated against final versions with raw and normalized ranges retained, has **32 current affected GHSA**. All 31 audit GHSA are in that ledger; official-only **GHSA-wq5f-xc86-pv6w** still affects sharp **0.35.2/0.35.4**. This uses the retained same-day official source snapshot, not a claim of new exhaustive advisory discovery. Audit absent IDs are **GHSA-2wm5-q62r-hmrv** (colord) and **GHSA-5c6j-r48x-rmvq** (serializer); other surviving IDs may lose old-chain version instances without closing the advisory.

Residual packages are brace-expansion, devalue, fast-uri, http-cache-semantics, js-yaml, sharp, svgo and undici. **http-cache-semantics4.2.0 remains affected**, no verified published repair or exception; phase-0 4.2.1 official 404 evidence is retained. No R1/R2/R1b or policy work was attempted.

P3's three brace-expansion path-union corrections remain in the prior commits with original audit bytes retained. They are not rewritten as candidate audit paths.

## Protection, deliverables and next owner

[Protection receipt](protection.json): original repository remains `b6c3e39b2bf7ea73ec60234dc42f8240e0e8695f`, tracked/index clean, only existing `.workbuddy/` untracked. Its current per-file hashes equal the prior worker capture. No user data was written/copied into this candidate. Phase-0 checkout remains clean at 96b7b89. No merge, push or deployment.

Both temporary server commands were inspected as this task's Python loopback servers and terminated. Saved complete outputs remain ignored at `tmp/ar3-root/dist` and `tmp/ar3-project/Zhenkun-blog-site`; evidence manifests identify their bytes. No broad cleanup/deletion was performed. node_modules is isolated and retained for review.

Candidate source is d39b896; the following evidence commit changes only documentation and dated evidence. Production application/dependency/build files are unchanged after the tested v2.1 input. Worker stops writing after evidence commit. Independent review must inspect exact three-override scope, actual parent-test limits, inherited peer warning and unavailable browser/Linux gates. No compatibility failure has triggered rollback; candidate remains isolated, partial and unaccepted. Coordinator handles the next decision.
