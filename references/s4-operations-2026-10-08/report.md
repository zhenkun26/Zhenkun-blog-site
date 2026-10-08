# S4 operations documentation and isolated learning exercises

The reviewed base is public main `6445ddb40012eed1d51b0d12de6c24b451b64c3e`. This batch supplies a daily entry and an on-demand operations guide in `docs/OPERATIONS.md`, links it from README, updates the accepted locale/article identity contract, and corrects stale announcement/review-gate text in canonical ROADMAP. It changes documentation only. Progress remains exclusively in ROADMAP; this report records measurements and limits.

## Document checks

New runbook/README file links resolve. Commands were compared against package scripts, the actual build/deploy workflows and existing CLI entry points. Node is 24.20.0, pnpm is 11.22.0; frozen offline installation used the unchanged lockfile. A sandbox store-access failure and an unsuitable owned dependency symlink were retained locally; the standard pnpm installation succeeded with its normal store access, and the learning clone then used its own frozen dependencies. No package, lock, patch or security deadline changed.

The generator's existing `draft:false` default is explicitly documented: set true before writing/building/submitting. `pnpm lint` is documented as a write operation; the suggested read check is `pnpm exec biome ci ./src`. The locale audit takes an optional output filename and reads current dist; it has no `--base` option. Complete builds and the artifact verifier retain both supported bases.

## Performed local exercises

| Exercise | Observation | Limit |
|---|---|---|
| One bilingual home label | Actual catalogs temporarily changed to “首页练习” / “Home exercise”; locale checks pass. | No visual/source change delivered by this batch; owner reading/keyboard exercise NOT_RUN. |
| Safe paired drafts | Existing generator run for `owner-lab-zh` / `owner-lab-en`; both set draft:true before checks, unique slug/lang and shared `translationKey: owner-lab`. Locale/publication native checks: 87 passed, 0 failed/skipped. Real scanner and helpers show dev eligibility 2, production eligibility 0, public pairs 0, equal comment term, production Wiki targets hidden. | Source-contract evidence only; no new full-build claim, no real manuscript approval, no network comment simulation or send. |
| Real dependency diff | Read `f33ff92 → 57264e7` workspace/lock diff and existing S1 security receipt: exact Astro/internal-helper smol-toml 1.9.0 overrides and locked repair, retained patch/integrity, raw finding versus effective verdict. | Historical source-bound evidence, not a fresh current security verdict. |
| Commit/revert | Only the two owned catalog changes committed and reverted. Original catalog SHA256 values restored; tracked tree matches the base; post-revert locale checks: 13 passed, 0 failed/skipped. | Two local commits and safe untracked drafts remain in the isolated learning clone. No push, production rollback, reset or deletion. |

Original project/private state, prior security candidate and prior P8 candidate are protected. No original user file, extra reviewer, DSH resource, service setting, credential or account permission was changed. No preview/browser process was started for these source exercises. Owner learning acceptance remains separate.

## Current source facts and human boundary

The actual article comment wrapper already passes locale and shared term to Giscus, and an article-derived term cannot be replaced by query path. The approved repository/category remain unchanged. A read-only GitHub GraphQL query returned zero Discussions. This proves the observed repository state; it does not prove third-party loading, login, submission or persistence. No Discussion/comment/reply/email was sent and no OAuth setup was changed.

The launch manuscript stays byte-identical and draft:true; its old naming, date/category and final public intent require owner review. Its local review packet was not uploaded. No English manuscript was created. The homepage has the accepted construction notice and same-locale empty state; the three directions are described in About, while a clear homepage direction display remains a subsequent S3 information-organization scope. No fake categories, counts or articles were introduced.

Both time-bound security contracts still end `2026-10-14T14:27:22Z`. Pre-upload source equality and the unchanged 522-file bound hash were verified; no boundary rebind was needed. Existing S2 whole-site GUI evidence is retained rather than rerun for unchanged UI. Human next steps are the small reading/local-revert exercise, exact manuscript review and, after article approval, the real comment workflow.

## Actual remote delivery

[PR30](https://github.com/zhenkun26/Zhenkun-blog-site/pull/30) head `392951cf18cf104f3d0790c80c7f6099d03af624`, tested merge `04c720bc21262447b0ad39e01347fb40c437f415` and ordinary squash main `c9d356bf7e060a35ec5e0cc3913b3d77f1829685` have identical trees. Fresh [PR quality](https://github.com/zhenkun26/Zhenkun-blog-site/actions/runs/37756090398), [PR Biome](https://github.com/zhenkun26/Zhenkun-blog-site/actions/runs/37756090458), [main quality](https://github.com/zhenkun26/Zhenkun-blog-site/actions/runs/37756588638), [main Biome](https://github.com/zhenkun26/Zhenkun-blog-site/actions/runs/37756588667) and [Pages](https://github.com/zhenkun26/Zhenkun-blog-site/actions/runs/37756588957) succeed. Both full quality bases run 397 native tests with 0 failure/skip, complete builds, artifact and monolingual audits; peers and current live security succeed separately.

The actual uploaded artifact has 274 files including .nojekyll. Eight real production responses match its bytes: Chinese/English Home/About, both article metadata files, Pagefind entry and one stylesheet. Home/About document language and canonical agree with their URLs; both formal article lists remain empty, Pagefind has two About pages and no launch article route exists. No failed/mismatched transport attempt occurred. Executable/dependency/test/workflow source remains exactly S2's deployed `29cde48`; no new GUI acceptance is claimed. [Receipt](receipt.json) is an explicit public-safe projection; raw local logs, learning clone and manuscript packet remain local. A following documentation-only receipt can advance main without changing the deployed source bytes or reusing old checks as newly executed ones.
