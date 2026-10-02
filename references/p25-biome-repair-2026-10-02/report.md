# P2.5 Biome repair — bounded local candidate, 2026-10-02

## Changes

Parent task supplied independent acceptance of exact P2.5 CI candidate `decd04b084c917648163c44225451ad1ceb5ecbe` for local implementation: workflow graph/frozen/base/permissions and independent 147 native/static checks passed. That is reviewer evidence reported by the parent, not hosted CI execution. Its 15 preexisting source Biome errors were the remaining local quality blocker.

Separate branch `codex/review-p25-biome`, same isolated checkout `/Users/zhenkun/Documents/Codex/2026-10-02/task/tmp/zhenkun-g1/review`, starts from decd04b. Source repair commit **`6e0ca6122271042f1801701732c2ab678f372081`** changes exactly the requested 15 files, 15 insertions/19 deletions:

- Import order only: `src/components/widget/Announcement.astro`, `src/layouts/Layout.astro`, and `src/pages/{bangumi,bilibili,booknav,dynamic/comments,dynamic/index,friends,gallery/[album],gallery/index,guestbook,myanimelist,sponsor,vndb}.astro`.
- Array formatting only: `src/config/backgroundWallpaper.ts` subtitle values/order preserved, multiline array condensed with optional trailing comma removed.

The installed Biome binary was invoked with `--write` on these 15 explicit files only. No broad rewrite, suppression, rule, value, behavior logic, workflow, dependency, content, profile or language change. The final additional commit contains docs/evidence only; source hashes are bound to 6e0ca61 in `source-snapshot.json`. Candidate ROADMAP remains a proposed canonical revision; original repo is not updated by this repair.

## Evidence

Fresh implementer checks ran against the source bytes committed in 6e0ca61, using the already installed dependencies (untracked symlink, no pnpm invocation/install). Commands were separate so each numeric exit status was directly observed; no zsh read-only status-variable wrapper was used.

| Check | Direct result |
|---|---|
| `./node_modules/.bin/biome check --write` with the explicit 15-file list | Exit 0, fixed those 15 files only; `scoped-fix.log`. |
| `./node_modules/.bin/biome ci ./src --max-diagnostics=0` | **PASS, exit 0**, 298 files checked, no fixes applied/no remaining diagnostics. Baseline at decd04b was FAIL/15 errors. Raw and readable full-source logs saved. |
| `node --test scripts/zhenkun-test-*.mjs` | **PASS, exit 0**, 147/147, fail 0, skip 0; `native-tests-147.log`. |
| `./node_modules/.bin/tsc --noEmit --isolatedDeclarations` | **PASS, exit 0**, empty `type-check.log`. |
| `./node_modules/.bin/astro check` | **PASS, exit 0**, 257 files, 0 errors, 0 warnings, 12 existing hints; `astro-check.log`. Added because direct tsc does not fully check Astro frontmatter imports. |
| Semantic diff audit | **PASS, exit 0**, all 14 Astro templates/script/style suffixes exactly equal to decd04b; frontmatter line/import-token multisets and non-import statement order/tokens equal. Wallpaper full TypeScript AST equals baseline including property names/literals/array order, ignoring source positions/optional comma. `semantic-audit.mjs`/`.json`, plus exact `source.patch`. |
| `git diff --check -- src` | **PASS, exit 0**. |
| Protection guards | Original c611832/branch/clean tracked tree/main unchanged; all 50 old dirty P3 file hashes and original `.workbuddy` hash match. Prior P3 and P2.5 dated evidence unchanged. `source-snapshot.json`. |

The initial semantic audit incorrectly expected the TypeScript printer to erase source array layout. Its output retained line breaks/trailing comma, so byte equality failed and the enclosing `set -e` stopped before source staging/commit. Replaced that invalid evidence expectation with full parsed AST equality; the source repair was not changed to appease the audit. Do not claim emitted production byte equivalence from this result.

## Assumptions and remaining limits

No new full build is needed for this bounded formatting repair: the Astro suffixes and non-import code are byte/token equal, import names/paths are preserved, and the changed runtime utility imports expose functions rather than introducing a new initialization statement. `deployment-contract.ts` and its project `post-contract.ts` dependency contain only imports and function declarations. Source review and the added Astro check cover the affected import/format surface; this is not a runtime equivalence proof. No structural, route, template, asset, config-value or content change was made, so the PROCESS structural-build requirement is not triggered. Existing artifact evidence remains bound to its historical P3 source, not to the repaired commit.

**UNRUN:** a new complete build/root+subpath artifact check, Linux clean frozen installation, hosted GitHub Actions/actionlint execution, required-check-name/branch-rule review, fresh HTTP/browser/production behavior. Removing the local Biome failure does not prove clean-install or hosted workflow compatibility. Workflow and artifact-checker bytes remain exactly the already reviewed decd04b versions. Standalone Biome still has the previously recorded floating `latest` limitation; no tool/action upgrade was added here.

P3's emulated viewport locator-first-click caveat, physical resize/orientation and real article/comment publication limits remain unchanged. No dependencies were installed, no denied pnpm route/relocation workaround was retried, and no remote CI was triggered.

## Next action and boundaries

Return the exact final docs/evidence candidate SHA for independent bounded repair review. After review, guarded local integration is a separate action; original `/Users/zhenkun/GitHub/Zhenkun-blog-site` remains tracked-clean at `c6118323cd7e82e03304eb391b5ea95db951019e`, main `bc21bfd92dd7081f2cf0acbec80d446f9d02c7de`. Local quality preparation is green at the measured layers; hosted CI/deployment remains unexecuted.

No push, main merge, deploy, publication, GitHub settings/credential change, package/lock change, profile/language work or unrelated project modification occurred. Next external-validation milestone is an explicitly scoped Linux frozen/hosted/required-check-name verification; do not activate it merely because local checks pass.
