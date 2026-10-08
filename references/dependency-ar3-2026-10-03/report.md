# A/R3 candidate — BLOCKED at lock acceptance

> 2026-10-03 correction: this report describes the rejected `e9d0b25` lock. Its statement that rolldown 1.2.4 disappeared was incorrect: Vite 8.2.1 still referenced it. The later precise Vite guard and package-manager regeneration restore both Vite 8.2.2 peer variants to 1.2.4. See [correction report](../dependency-ar3-rolldown-2026-10-03/report.md). The [original report bytes](../dependency-ar3-rolldown-2026-10-03/report-original-14a0d7c.md), raw lock diff and audits remain preserved; original audit/test states are not fresh evidence for the corrected candidate.

Base: `96b7b899dbe80aadd68f83a7ba1482bf386d0eb1`.
Dependency candidate: `e9d0b25f791eb1e0c88fc7845d3d181672036d34`.
Branch: `codex/dependency-ar3-20261003`.
Runtime: Node v24.20.0, pnpm 11.22.0; active model configuration UNVERIFIED.

Only the exact two parent overrides were added. The generated lockfile is retained as a **rejected-for-acceptance diagnostic candidate**, not a validated remediation. No application, bilingual, feature, CI or package.json edit. No install scripts executed, no frozen installation, no node_modules, no merge/push/deploy.

## Lock review and stop

`pnpm install --lockfile-only --ignore-scripts --registry=https://registry.npmjs.org` initially failed opening the default store database under sandbox. The same command succeeded after reviewed escalation; no alternate route/store/security settings were used. Logs and full `lock.diff` are retained. Local pnpm help was checked for the three install flags before execution.

Ruby's built-in YAML parser was used to compare actual lock structures (rather than line-diff counts). `graph-package-diff.json`, `graph-review.json` and `candidate-graph.json` preserve the results. Package records fall **1350→942**; **408** removed, none added and no existing package record changed. Every removed package is reachable from the old plugin-3 snapshot. Both target parents resolve plugin 4.0.0. Existing other plugin-4 users remain at 4.0.0. Importer specifiers/direct versions remain unchanged; Swup's importer loses the obsolete peer suffix.

Removed target versions: plugin 3.0.1, microbundle 0.15.1, rollup-plugin-terser 7.0.2, serialize-javascript 4.0.0, SVGO 2.8.3, colord 2.9.3, brace-expansion 1.1.18. Remaining target versions: plugin 4.0.0; SVGO 4.0.2/4.1.0; brace-expansion 2.1.4/5.0.9.

**Unexpected drift:** both Vite 8.2.2 snapshots (with @types/node 26.2.0 and 26.4.1) change their direct `rolldown` dependency **1.2.4→1.2.7**. Rolldown 1.2.4 disappears. This is outside the intended two Swup parent edges; cause and acceptability require Astra judgment. Optional flags also change for existing terser/source-map and rolldown/oxc nodes. The packet requires stopping on unexplained drift, so frozen installation was not attempted. No manual integrity/lock editing or serializer fallback was used.

The generated lock's peer check reports mdx 7.0.8 wanting markdown-satteri ^0.3.1 while 0.4.0 is installed. Candidate and baseline importer already have that version pairing; candidate installation/peer equivalence is unverified, so this is not a claimed peer PASS.

## Audit evidence

Official-registry read-only lock audits were run after stopping mutation, only to document this generated graph. Both production and full audit exit **1**, with **44 records / 31 GHSA / 8 packages**, severity **21 high, 16 moderate, 7 low, 0 critical**. Historical phase-0 audits each have 51 / 33 / 10. Raw JSON, stderr, exit files and `audit-summary.json` preserve all residual IDs and changes. No successful security gate is claimed.

The audit IDs absent from the candidate are GHSA-2wm5-q62r-hmrv and GHSA-5c6j-r48x-rmvq. Some other existing GHSA lose version records but retain affected surviving versions. The official-only sharp advisory in the phase-0 union remains affected (sharp versions are unchanged), giving 32 affected current GHSA in that bounded official union, including 31 audit GHSA. No new official advisory research was performed and no exhaustive current discovery is claimed. The two serializer candidate guards stay candidate-only and no serializer fallback is installed.

`http-cache-semantics@4.2.0` remains open. Phase-0 official 4.2.1 404/no verified published repair evidence is retained; no waiver exists. Overall remediation cannot close.

## P3 correction

The three brace-expansion rows in phase-0 `advisory-matrix.json` now use the complete production/full path union, each 32→33 paths, adding `.>@tailwindcss/vite>vite>stylus>glob>minimatch>brace-expansion`. Original path order and audit files are preserved. The matrix hash/bytes in `verification.json` are refreshed and a dated post-review correction is appended; the old phase-0 checks remain explicitly historical. `p3-correction.json` provides old/new hashes and exact path-union checks.

## Validation states and protection

- PASS: exact baseline/source heads, isolated worktree, runtime pins, two override selectors, no added/changed package records, old-chain reachability, JSON/P3 path union and hash checks, unchanged original tracked/index state.
- BLOCKED: lock acceptance due to Vite/rolldown drift; security audit (affected versions remain).
- NOT_RUN because lock gate stopped execution: frozen install; actual parent ESM/CJS/types, valid/invalid requirements, mount/unmount/hooks/repeated mounting, route naming and parallel visit/container behavior; Astro check; formal isolatedDeclarations type-check; source/new-script Biome; full native suite; both complete builds and Pagefind/artifact validation; real browser Home/About/repeat/interrupted/back/forward/search/mobile-keyboard/focus/scroll/inert checks. No candidate test count and no historical test reuse.
- Linux candidate validation NOT_RUN; this host is macOS and no candidate Linux run was requested or available through this stopped packet.

Original source remains b6c3e39b2bf7ea73ec60234dc42f8240e0e8695f, clean tracked/index with retained untracked `.workbuddy/`. Phase-0 remains 96b7b89 and clean. `source-protection.json` records current private-file hashes without copying private content. This work never wrote those files; a fresh pre-work byte hash was not captured, so no independent before/after private hash equality claim is made.

Next action: coordinator/Astra reviews `graph-review.json` and full lock diff, determines whether a revised bounded resolution method is allowed, then schedules all actual candidate gates. Worker stops writing after evidence commit. Candidate must not be merged or treated as PASS.
