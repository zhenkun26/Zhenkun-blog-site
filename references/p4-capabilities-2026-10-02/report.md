# P4 bounded capability candidate — 2026-10-02

Application source `a353c2ee800bbff2865541288ea04308c245cdc5` fixes one mismatch: switching off the dynamic page now also suppresses its local JSON content. GET returns `[]` with JSON Content-Type before processor initialization or collection access. The change keeps enabled Markdown, image metadata, ordering, schema and empty collection behavior. The source commit contains only `src/pages/api/dynamic.json.ts` and four native regressions in `scripts/zhenkun-test-capabilities.mjs`.

This successor continued that exact source after the old implementation task ended. Canonical original `d8eb0cb` was tracked-clean; original main remained `bc21bfd92dd7081f2cf0acbec80d446f9d02c7de`. No `.agents` directory or ancestor AGENTS file was found in the inspected repository/ancestor locations; the repository AGENTS, PROCESS, ROADMAP, relevant ADRs and ERROR_MEMORY governed the work.

## Verification and exact scope

| Layer | Result | Evidence and limit |
|---|---|---|
| Handoff/source protection | PASS | Exact heads, branch/clean tracked state, 50 old P3 files and user `.workbuddy` hash checked before work and at checkpoints; source/config and initial evidence manifests |
| Environment | Existing runtime only | Node `v24.20.0`, macOS arm64, declared pnpm `11.22.0`; direct existing tools/tsx import loader. No pnpm invocation, dependency setup, install, lock mutation or clean Linux result |
| Regression | PASS, fresh 151/151 | `native-tests-fresh-151.log`; actual GET plus real Markdown processor, in-memory content only. Historical before snapshot is 2/4 FAIL; original after log preserved |
| Static | PASS, fresh | `type-check-fresh.log`: `tsc --noEmit --isolatedDeclarations`; `astro-check-fresh.log`: 257 files, 0 errors/0 warnings/12 retained hints; `biome-fresh.log`: 299 files including 298 source files plus new regression, no fixes |
| Root complete build/HTTP | Preserved exact-source snapshot | Original eight-stage/28 HTTP logs and JSON kept byte-for-byte; no root full rerun. Fresh root checker in `deployment-artifacts-root-fresh.json`; original 252-file dist archived locally with hashes |
| Deployment complete build | PASS, fresh eight stages | `build-subpath.log` and `build-stages-subpath.json`; runs all exact declared stages, including source generators, Astro, prune, fonts, inline minifier and Pagefind through existing direct binaries |
| Deployment artifact/HTTP | PASS, fresh | `deployment-artifacts-subpath.json`, `artifacts-v2-subpath.json`: 33 response/file byte comparisons, JSON Content-Type, 13 HTTP 200 stubs, unknown path true HTTP 404/body, all four public gallery files and both local music assets |
| Pagefind result resolution | PASS, fresh Node probe | Actual emitted module/index/WASM, query “Zhenkun”, result `/Zhenkun-blog-site/about/`; explicit basePath/language. This is not browser UI/default import inference acceptance |
| Browser/real article/comment | 未执行 | No visual source change. Existing P3/identity browser evidence remains its original snapshot; zero public articles, draft unchanged |
| Linux/hosted/release | 未执行 | Frozen clean install, hosted Actions, required-check compatibility, independent P4 acceptance and production delivery remain separately recorded in ROADMAP |

Fresh commands ran from the P4 worktree:

```sh
node --import tsx --test scripts/zhenkun-test-*.mjs
./node_modules/.bin/tsc --noEmit --isolatedDeclarations
./node_modules/.bin/astro check
./node_modules/.bin/biome check ./src scripts/zhenkun-test-capabilities.mjs
node scripts/zhenkun-verify-ci-artifacts.mjs --base /
node references/p4-capabilities-2026-10-02/run-declared-build.mjs /Zhenkun-blog-site/
node scripts/zhenkun-verify-ci-artifacts.mjs --base /Zhenkun-blog-site/
NODE_ENV=production DEPLOY_BASE=/Zhenkun-blog-site/ ./node_modules/.bin/astro preview --background --port 4343 --host 127.0.0.1 --json
python3 references/p4-capabilities-2026-10-02/artifact-audit-v2.py --base /Zhenkun-blog-site/ --http http://127.0.0.1:4343
node references/p4-capabilities-2026-10-02/pagefind-probe.mjs
```

The preview PID was verified against its exact command/port, stopped in `finally`, and the listener absence confirmed; first and corrected-audit cleanups are separate JSON evidence. Build side effects used the existing authorized generated-output/cache cleanup scope. No source, public asset, dependency, private draft or historical evidence was deleted.

## Measured contracts and correction

The [feature matrix](feature-matrix.md) distinguishes all ten page flags from comment, music, Memos, analytics, characters, Sakura, display settings, sidebar and diagrams. All 27 configuration files equal the canonical baseline. giscus remains selected under ADR-XB-005; no feature/service setup changed. Site brand and author remain Zhenkun with the accepted profile; repository/domain, attribution and draft are retained.

There are 13 disabled HTTP 200 redirect placeholders; public gallery assets remain reachable. These are explicit visibility limits. Both metadata APIs and RSS are empty, Pagefind has only About, and sitemap has eight ordinary URLs. Enabled/unconfigured provider failures, real article/comment/browser/device behavior and production privacy were not inferred from this empty build.

The first subpath audit failed at a mistaken Pagefind raw-URL assertion before HTTP checks. `artifact-audit-subpath.log` remains FAIL and the original `artifact-audit.py` is preserved. Additive v2 checks the raw `/about/` separately from the deployed route, expands public asset HTTP coverage and records the true-404 negative case. The real emitted Pagefind probe independently verifies URL resolution; application source did not need another change or build.

A read-only exec transport interruption recovered with unchanged HEAD/no listener. A checkpoint guard's unsupported Git `ls-tree` exclude pathspec failed before mutation; exact line filtering recovered after all guards reran. These lessons are appended to ERROR_MEMORY. They are verification failures/recovery, not product PASS evidence.

## Documentation and preservation

Canonical ROADMAP has a documentation-only checkpoint `795e7d1d3e0cd4ea4de1dd41c83e40d3f5ca647c`. Original receives no P4 source. Candidate sync `259bc9a9d07441893eccb81bdfd7081265dd3520` merges only that canonical ROADMAP checkpoint into the candidate, making canonical an ancestor without rewriting tested `a353c2e` or overwriting status. [Checkpoint evidence](canonical-checkpoint.json) records this distinction.

Candidate ARCHITECTURE reconciles the old P2 path/sitemap defects, P1/P3 boundaries and P2.5 workflow definitions, and adds the capability contract matrix. DECISIONS adds bounded ADR-XB-013 while retaining Zhenkun and bilingual feasibility decisions. ROADMAP remains the sole task state; candidate documents are review revisions until integration, and this report/matrix are dated measurements.

The original 17 evidence files remain byte-for-byte unchanged. Root `dist` was archived before the subpath build at `/Users/zhenkun/Documents/Codex/2026-10-02/task-4/tmp/p4-root-dist-a353c2e.tar.gz`; its SHA and 252 file hashes are recorded in `successor-validation.json`. The live ignored P4 `dist` now contains the verified subpath build. `node_modules` remains the original untracked symlink; no installation occurred. The protected old checkout and historical profile review tree are untouched.

`source-snapshot.json` records exact source blobs/modes/hashes and the two-file implementation delta. `evidence-sha256.json` covers all candidate measurement files except itself. Subsequent documentation/evidence commits preserve the tested source bytes. The final handoff manifest identifies the exact review candidate and preservation checks without rewriting measurements to its new SHA.

The next operation is independent review of the exact final candidate. Source integration/acceptance, G2 acceptance of retained stubs, Linux/hosted quality execution, real article/comments and any push/main merge/deployment or publication are separate gates. This packet performs none of those operations. P8 remains a future feasibility investigation with ADR before implementation.
