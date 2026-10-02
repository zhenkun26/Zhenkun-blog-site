# P2.5 — local CI candidate, 2026-10-02

## Changes

Original `/Users/zhenkun/GitHub/Zhenkun-blog-site`, branch `codex/refactor-publication-contracts`, accepted independently reviewed P3 `289cb6183d16b6cac62c18c84758c02bc8fb6289` by guarded local fast-forward from `cb667956b7785ad7f553768628907cb20e6d1693`, then recorded LOCAL acceptance in `c6118323cd7e82e03304eb391b5ea95db951019e`. That original HEAD remains unchanged and tracked-clean during this packet. Local main remains `bc21bfd92dd7081f2cf0acbec80d446f9d02c7de`; no production release acceptance is claimed.

Candidate branch `codex/review-p25-ci` in `/Users/zhenkun/Documents/Codex/2026-10-02/task/tmp/zhenkun-g1/review` starts from c611832. Three distinct implementation commits:

| Packet | Commit | Before → proposed behavior |
|---|---|---|
| A | `6242cc809095a1dfa50b971eb777f57be167284e` | Biome push/PR watches master → watches main. Only two branch literals change. |
| B | `ac96dcc9df8680788582cf41c1655e1e55041c1b` | Astro-only build/separate checks on Node 22/23 → reusable frozen quality matrix on the existing local Node 24.20.0/pnpm 11.22.0, source Biome, Astro, TypeScript, native regressions, formal complete build and generated artifact/Pagefind checks for `/` and `/Zhenkun-blog-site/`. |
| C | `13f8956e09ef1baa07ef855be4ffa774650b6675` | Independent non-frozen Pages build → same-commit reusable quality prerequisite, frozen install, complete build and verification of the actual artifact before upload. Both existing push/main and workflow_dispatch paths are gated. |

Implementation files are exactly `.github/workflows/{biome,build,deploy}.yml`, `scripts/zhenkun-verify-ci-artifacts.mjs`, and `scripts/zhenkun-test-ci-artifacts.mjs`. Source/content/config/assets/package/lock unchanged. ADR-XB-011 records the workflow tradeoff; candidate ROADMAP is a proposed canonical revision, not a second accepted task board.

## Evidence

`source-snapshot.json` binds the five implementation file hashes to C `13f8956e...`. A separate final docs/evidence commit does not change those bytes. The following are direct implementer observations; independent P2.5 review has not run.

| Check | Result and precise scope |
|---|---|
| `node --test scripts/zhenkun-test-*.mjs` | **PASS 147/147**, 0 failures/skips. Existing 140 plus seven meaningful artifact success/failure regressions. Final run occurred before B commit; its formatted source bytes are identical in B/C. `native-tests-accepted.log`. |
| `./node_modules/.bin/biome check scripts/zhenkun-verify-ci-artifacts.mjs scripts/zhenkun-test-ci-artifacts.mjs` | **PASS**, two new scripts only, after scoped formatting. `biome-new-scripts-pass.log`. |
| `./node_modules/.bin/tsc --noEmit --isolatedDeclarations` | **PASS**, empty `type-check-pass.log`; enclosing `set -e` command completed successfully and committed B. Existing installed TypeScript, no pnpm invocation. |
| `node scripts/zhenkun-verify-ci-artifacts.mjs --base /Zhenkun-blog-site/` | **PASS**, actual retained P3 production artifact built from `278165033a8ad422f6403ac07e02f7af19e6ab24`, not a new CI build. Confirms nonempty Pagefind module/language metadata with indexed pages, public count derived from metadata (0), and existing Python canonical/image/sitemap/RSS/stub contracts. `retained-subpath-artifacts-pass.json`; HTTP list is empty, so no fresh HTTP/browser claim. |
| Existing YAML 2.9.0 parser + `bash -n` | **PASS** three YAML documents/12 shell fragments and static assertions for triggers, matrix, runtime/package manager, frozen installs, formal build, artifact-before-upload order and default success-only needs graph. Existing Pages permissions/environment/concurrency equal baseline. `workflow-audit.mjs`/`workflow-audit.json`. Shell syntax checks execute no workflow command. |
| `./node_modules/.bin/biome ci ./src --max-diagnostics=0` | **FAIL**, 298 checked files, 15 reported errors, no fixes. Raw/readable baseline logs retained, including existing Astro import sorting diagnostics. Wrapper also failed on zsh's read-only `status` variable; no clean baseline or reliable isolated numeric process exit is claimed. No `src` bytes changed in this packet. |
| Source hygiene | **PASS** implementation/doc `git diff --check` (raw measurement logs excluded). |
| Preservation guards | **PASS** original c611832/branch/clean tracked tree/main, all 50 protected dirty P3 file hashes and original `.workbuddy` hash; old committed P3 evidence unchanged. `source-snapshot.json`. |

All completed checks use existing dependencies through an untracked `node_modules` symlink. No dependency setup, installation, package/lock mutation, pnpm relocation setting, or denied reviewer path was retried. Parser and native fixture work are local; new artifact test temporary folders contain only test-owned files and are cleaned by the test.

## Assumptions and risks

- The existing source Biome failure will stop proposed quality jobs and their dependent deployment. The checks remain enabled; this candidate is not release-ready. Fix the specific baseline diagnostics as a separate bounded packet after review.
- **UNRUN:** Linux clean frozen installation, hosted Actions expression/action validation, remote workflow runs, a new complete root/subpath build, new root artifact/HTTP/browser checks. The existing P3 dual-base build evidence remains bound to its historical source. Static YAML PASS cannot establish these runtime outcomes. actionlint/shellcheck are not installed; no tools were installed to fill the gap.
- Same-repo `./.github/workflows/build.yml` resolves to the caller's same commit under [GitHub's reusable workflow contract](https://docs.github.com/en/actions/how-tos/reuse-automations/reuse-workflows). The static audit checks local structure, not GitHub execution. Matrix completion must succeed before the default `needs` chain permits upload/deploy.
- Standalone quality plus deployment's reusable invocation can duplicate main-push work; deployment builds again to check exactly what is uploaded. Keep this clear gate first; optimization can be reviewed separately. New quality job names require G4 required-check review before any approved remote action; no settings changed here.
- Standalone Biome retains its existing floating `version: latest`; full quality uses the frozen project's Biome. No action/tool upgrade was added beyond aligning deployment's existing checkout/setup actions to the already present pinned quality SHAs.
- The Pagefind inspector derives future public count; the existing Python verifier still contains current-site expectations and a launch-title negative guard. P5 publication requires an explicit approved expectation review, not silent removal of that guard.
- P3's post-desktop-Escape/viewport-change locator first-click caveat remains recorded; physical resize/orientation, Chrome, actual mobile devices and production article/comment interaction are not accepted by this CI packet.

## Next action and authorization

Stop with this local candidate for independent exact-SHA review. Recommended next engineering milestone is a separate, narrow remediation of the 15 Biome diagnostics, followed by appropriately authorized Linux/frozen and hosted workflow verification. P7 confirmed owner data and P8 bilingual feasibility remain separate future packets.

No push, remote/main merge, deploy, article publication, GitHub permission/branch-rule change, dependency installation, profile/language edit or unrelated-project action occurred. Original canonical remains c611832; local P2.5 acceptance and later external activation are distinct decisions. Prior automatically rejected dependency setup remains unattempted; existing permitted checks were completed independently.
