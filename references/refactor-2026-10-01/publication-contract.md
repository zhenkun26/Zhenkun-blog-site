# P1 article/Wiki source acceptance record

Snapshot: 2026-10-01, America/New_York. Repository: Zhenkun-blog-site. Branch: `codex/refactor-publication-contracts`, starting HEAD `366f636f8663cf3fef6d3905f0d5a0598e627ee5`. This records accepted local P0/P1 source/build/artifact behavior for the current corpus; it is not deployment or overall-release acceptance. Current task state belongs only to [ROADMAP](../../docs/ROADMAP.md).

Local delivery was finalized on 2026-10-02. P0's original author-cleanup hunks are committed separately as `059d228`; the P1 commit carries this record, its contracts and the completed tracking update.

[source-snapshot.json](source-snapshot.json) pins changed/new source bytes and the unchanged lockfile for the composed final tree. It excludes dated evidence and docs, which can be completed after application verification without changing the verified implementation.

## Implemented scope

- Shared production visibility, loader-compatible identities, safe article paths and explicit deployment prefixes. Legal explicit `.md` and `/index` slugs retain their identity. Non-production publication builds fail before collection loading.
- Startup source admission rejects symlinks, malformed declarations and duplicate IDs before Astro can follow its default glob inputs. Production text preflight uses the installed Markdown/MDX parser and a fresh source index; it does not depend on the loader propagating early-render errors.
- Wiki lookup resolves exact ID, source path, then unique eligible basename. Hidden/missing/ambiguous references and unsupported embeds/block syntax fail production conversion; development emits diagnostics and preserves unresolved text. Source drafts skip production conversion.
- Article routes/OG selection, RSS article links, metadata API, calendar and recommendations consume shared identity/selection/URL contracts. The API adds `url` without replacing raw `id`; clients refresh old caches missing that field. Calendar post titles use text nodes, and random-recommendation exclusions use a dictionary without inherited keys.
- Existing cards remain. Remote covers retain their behavior, public covers explicitly accept an existing base, and relative Wiki covers require both lexical and real-file containment in article/source asset roots.

The prior twelve-file author cleanup is preserved separately. The Wiki header-email and RSS site-fallback hunks overlap P1 in those two files; they must be reviewed/staged separately. The launch draft, owner avatar/wallpaper originals, provenance/license and retained feature templates were not changed or deleted by this increment. No vault read/export/configuration, Space creation/upload, dependency change or remote action occurred.

## Verification

| Check | Result | What it establishes |
|---|---|---|
| `node --test --test-reporter=dot scripts/zhenkun-test-publication.mjs` | PASS, 74 tests | Pure contracts, installed-Astro identity/route oracle, actual Markdown/MDX conversion and controlled scanner behavior |
| `node scripts/zhenkun-check-content.mjs` | PASS: 1 source, 0 public, base `/` | Actual source/frontmatter/ID admission and a valid empty public cohort |
| `DEPLOY_BASE=/Zhenkun-blog-site/ node scripts/zhenkun-check-content.mjs` | PASS: 1 source, 0 public | Same real input under the deployment base; no synthetic public fixture was written into the repository |
| Targeted Biome check, 12 changed JS/TS/MJS files | PASS | Formatting/import/lint checks for the touched supported file types |
| `pnpm type-check` | PASS | No-emit TypeScript diagnostics; not Astro output acceptance |
| `pnpm exec astro check --noSync` | PASS: 255 files, 0 errors/warnings/hints | Limited Astro diagnostics using existing generated types, without fresh collection sync |
| Independent source/lifecycle review | PASS within P1 | Early hook order, schema/selection consumers, duplicate-ID behavior, cover containment and environment consistency inspected against installed source |
| Actual inline-script VM/API/DOM controlled fixtures | PASS: 8 URL/DOM and 2 API scenarios | Client syntax, field preservation, encoded URLs and text-node title assignment; no browser or actual content engine |
| Final `pnpm check` | PASS: 255 files, 0 diagnostic errors/warnings/hints | Fresh content sync and source diagnostics; [log](check.log) |
| Complete `pnpm build` under `/` and `/Zhenkun-blog-site/` | PASS, both exit 0 | Entire declared build chain, including Pagefind; [root](build-root.log), [subpath](build-subpath.log) |
| Scoped static artifact and HTTP acceptance under both bases | PASS within P0/P1 | No published draft route/OG/metadata/feed/search content; payment assets absent; actual server requests recorded |
| Production browser acceptance | PASS within P0/P1 | Desktop/mobile, RSS page, matching titles/viewport, no post links, no overflow, RSS-only hero and loaded sampled images; [manifest](browser-observations.json) |

The retained native suite covers public/draft targets and source drafts; missing/ambiguous/invalid targets; duplicate and unsafe identities; source path versus explicit ID; literal aliases, cards, headings and password/body non-disclosure; root/subpath/logical-base overlap; public/remote/API covers and outside-root rejection; native MDX prose versus ESM/JSX/code; scanner dotfiles/extensions/symlink admission; invalid frontmatter/draft/slug; quotes/HTML attribute semantics; and publication environment gates. Expectations include literal URLs, sentinel non-disclosure assertions and installed Astro oracles rather than restating the implementation.

Scanner tests run the actual scanner with controlled in-memory Node filesystem reads and restore built-ins in `finally`. They do not establish native OS symlink semantics or live watcher behavior. MDX imports are compiled without execution. No disk fixtures, framework install, runtime network, build output or cleanup is needed for these checks.

## Limits and deferred work

- The actual repository contains only the existing unapproved `draft:true` launch article. The public cohort is empty; synthetic fixtures establish conversion behavior, not final page/RSS/OG/Pagefind artifacts with a real approved article.
- Full fresh check/build and scoped production browser acceptance passed after the owner's exact exception. `--noSync` remains a limited diagnostic and is not used as the final check. The actual public cohort is empty, so real optimized Wiki relative-image output still needs an approved article pilot; fixture placeholders are not that proof.
- Source admission runs at startup/build. The installed dev watcher can later follow a newly added/replaced symlink without re-running that admission; do not change link structure during dev, and restart/revalidate after structural changes. This is not continuous filesystem isolation or private note protection.
- Actual heading existence/duplicate anchors, complete Obsidian compatibility, MDX module resolution and arbitrary Markdown asset contracts remain separate checks. Draft flags are publication policy, never confidentiality.
- The existing generated-OG meta root/base address, RSS date, global image/canonical and disabled-route output defects belong to P2. P1 does not claim these existing protocol issues are fixed.
- The owner explicitly approved deletion of the two original upstream payment images; their paths/before hashes are recorded in [payment-asset-removal.json](payment-asset-removal.json). Both source/artifact files are absent, and corresponding preview URLs return 404 under both bases. Existing remote content/history has not been rewritten or deployed by this work.

## Verification permission boundary

The applicable [AGENTS](../../AGENTS.md) rule says: “Do not perform filesystem-level deletion.” Normal check/build/dev/preview can clean tool-managed files, so those commands required a specific exception before execution. The owner approved the following exact tool and two-image exceptions on 2026-10-01; the broader rule remains in force.

The concrete verification scope is normal tool cleanup within `dist/`, generated `.astro/`, `node_modules/.astro/`, `node_modules/.vite/`, and the tsx IPC/cache files created or expired by the declared build scripts under the system temporary directory (`tsx-501` and legacy `tsx`). A filesystem-case probe created by the tool may also be removed by that tool. Exclude source/content/public/docs/references, raw intake/private manuscripts, Git data, dependency packages and lockfiles. Do not substitute another output directory or deletion wrapper.

The separate exact two-file exception covers only `public/assets/images/sponsor/alipay.png` and `public/assets/images/sponsor/wechat.png`. Push, main integration, deployment and draft publication remain distinct actions. Local P0/P1 acceptance is complete; known P2/P3/pilot limits prevent an overall-release claim.

## Independent review and artifact details

Installed Astro hook dispatch was tested with the actual configuration integration extracted in memory: development build rejects before source admission, production setup calls source validation, build:start awaits native text preflight, and a preflight rejection propagates. This controlled dispatch is distinct from an invalid CLI build or a real private-note isolation test.

Root artifact inspection scanned 252 files (109 public text files), found no draft markers, and decoded Pagefind's single `/about/` fragment. The final [subpath artifact](artifact-subpath.json) confirms the same eligible set, 9 complete HTML pages, 13 redirect stubs, 135 valid nonempty direct media references and no payment-file copies. Remaining P2 findings are explicit: 18 broken OG/Twitter and 4 JSON-LD image addresses, 13 closed sitemap routes/root `/404/` stubs, and a localized non-RFC RSS date. They are not P1 regressions or release acceptance. [Root](http-root.json) and [subpath](http-subpath.json) HTTP records establish actual local 200/404 behavior. Source declarations, lock, owner images, launch article and license were independently compared to the starting state; only the approved QR images are deleted, and only their LQIP entries changed. Build warnings/notices remain visible in full logs rather than being counted as failed P1 publication behavior.

Two first captures were rejected because opacity transitions still obscured content. Stable replacements were inspected and accepted; the rejected images remain marked in the manifest. No screenshot during a transition is used as successful visual evidence.

Git source/document whitespace checks pass. Raw terminal logs retain the tools' original trailing whitespace and are explicitly excluded from formatting-only diff checks; their diagnostics/results are preserved without normalization. This exception applies to dated captured logs, not application code.
