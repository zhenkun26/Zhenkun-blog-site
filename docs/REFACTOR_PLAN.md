# Zhenkun-blog-site incremental refactor plan

The owner authorized local implementation on 2026-10-01. Keep Firefly, Astro, Svelte, the existing directory layout, and retained feature templates. This document defines work packets and acceptance contracts; [ROADMAP](ROADMAP.md) alone owns their current status. [ARCHITECTURE](ARCHITECTURE.md) defines responsibilities, [DECISIONS](DECISIONS.md) records choices, and [PROCESS](PROCESS.md) governs verification/recovery.

## Outcome and boundaries

Readers should receive consistent public articles, working deployment-aware links and assets, usable search/navigation, and deliberate empty states. The author should have one canonical manuscript with an explicit, reviewable publishing derivative. Optional integrations and decorative features remain independent choices.

| Boundary | Owner | Contract |
|---|---|---|
| Manuscripts and original attachments | Existing private Obsidian vault | One editable manuscript; selected Space changes are suggestions until adopted |
| Editorial work | Optional Blog Space | Only explicitly selected context; no publish authority or second engineering roadmap |
| Public eligibility | Content schema and shared publication policy | Development preview differs from production; drafts are not confidentiality |
| Article identity | Shared loader/Wiki contract | Stable ID distinct from source path and display title; no silent slug rewriting or ambiguous ID |
| Wiki conversion | Prepared source index and Markdown/MDX plugin | Only eligible, unique targets; diagnostics replace invented URLs |
| Route and asset URLs | Explicit deployment configuration and URL helpers | Logical routes, public assets, processed images, and absolute protocol URLs have distinct rules |
| Optional capability | Existing configuration and derived policy | One setting source; navigation/routes/indexing agree; disabled services make no requests |
| Browser state | Svelte islands and lifecycle utilities | Explicit focus, request, listener, observer, and cleanup ownership |
| Delivery | Build/acceptance and authorized remote action | Accepted artifact is distinct from source diagnostics; no implicit deployment |
| Project memory | ROADMAP, ADR, contracts, dated evidence, Git | One task-state source; no copied live boards or unverified PASS carryover |

Do not add a generic service/plugin framework, backend, event bus, dependency, whole-vault mirror, watcher, scheduler, or two-way sync for these packets. Do not import another author's content, credentials, payments, or imagery. Keep license/provenance attribution. No new top-level directory is needed.

## Packet dependency and acceptance

| Packet | Concrete scope | Acceptance before delivery |
|---|---|---|
| P0 — existing author cleanup | Preserve the current separate source changes and finish their production acceptance | Cleared identity/service/payment values with templates retained; direct output inspection still required for the two original public payment images |
| P1 — article/Wiki publication | Shared publication and identity; matching loader/index source set; deterministic lookup; base-aware Wiki URLs; explicit preflight; focused regression fixtures | Public/draft, ID/collision, path, card/alias, and failure behavior; no private metadata in rendered output/errors; source checks, full build and artifact acceptance |
| P2 — route/media/feed correctness | F04–F07: emitted image/OG paths, canonical logic, disabled-route redirects/sitemap, valid RSS dates | Final HTML, XML, image bytes and direct host requests under both deployment bases; same public article set |
| P3 — search and menu | F02/F03: first-query initialization, stale query state, modal focus/closing/restoration | Actual Pagefind output, first/rapid/empty queries, keyboard sequences, repeated navigation and desktop/mobile behavior |
| P4 — capability policy | Derive availability/indexing from existing page switches and required settings; migrate one optional module at a time | Navigation, descendants, static paths, endpoints, sitemap and empty states agree; disabled integrations do not fetch |
| P5 — selected article pilot | Explicit public-safe manuscript/asset selection and one manual publishing derivative | Stable ID, reviewed diff, supported links, approved dependencies, provenance/alt text; private notes stay outside Git |
| P6 — editorial and optional author tooling | Requested Blog Space and a tested article/context sample; one-way exporter only after repeated need | Text/asset/reference conversion and source/destination conflict detection; no unresolved authenticated references or automatic remote action |
| P7 — reading and optional presentation | Owner identity/reading improvements, followed by separately selected projects/friends/dynamics/gallery | Genuine owner material, accepted accessibility/reading behavior, and one visual variable per review |

P0's production cleanup blocker does not prevent local P1 code work. It still prevents claiming a clean release. P1, P2 and relevant dependency/delivery acceptance precede published manuscript pilots and feature activation. Packet IDs describe dependency and scope, not an additional status checklist. New failures or owner priorities may reorder independent local work; record the reason in ROADMAP/ADR.

## P1 implementation contract

- `src/utils/post-contract.ts` is pure: publication selection, loader-compatible IDs and rooted deployment paths. Environment/mode is supplied by the caller. Explicit legal slugs retain `.md` and `/index`; implicit IDs match the installed Astro default. Non-NFC, ambiguous route characters, traversal/empty segments and invalid declarations fail instead of silently changing identity. Logical routes always receive the deployment base; public assets explicitly allow an existing prefix. Browser-reinterpreted authority/traversal paths are rejected.
- `src/content.config.ts` delegates post ID generation to that contract. Article/OG routes, card hrefs and article comment identity consume the ID without treating it as a source filename. Existing spec-content filename handling remains separate.
- `src/utils/content-utils.ts` owns schema-validated collection selection. Public-only OG behavior is retained in development. RSS, metadata, lists, taxonomy, series and recommendations consume shared selection directly or through the existing helpers. A config-setup environment gate rejects non-production publication builds rather than allowing development selection to bypass production preflight.
- `src/utils/wiki-link-index.ts` admits lowercase `.md/.mdx`, non-hidden source files, rejects symlinks and identity collisions before draft filtering, and resolves exact ID → source path → unique eligible basename. It does not scan an external vault. Duplicate IDs fail even when one is a draft; exact hidden targets never fall back to another basename. A config-setup gate runs before initial Astro collection loading because the installed glob loader otherwise follows symlinks. This is startup/build admission, not continuous filesystem isolation: do not add/replace symlinks while a development watcher is running; restart and revalidate after input-structure changes.
- `remark-wiki-link.js` owns AST conversion and existing cards. In production, hidden/missing/ambiguous references and unsupported embeds/block syntax are errors; development keeps unresolved text and emits diagnostics. Production source drafts skip conversion because Astro can compile them before route filtering. Relative covers remain inside approved source asset roots; public covers receive the base once; remote URLs retain existing behavior without fetching.
- `scripts/zhenkun-check-content.mjs` provides config-setup source admission and validates production-eligible text using the matching Markdown/MDX parser and a fresh prepared index. An `astro:build:start` hook awaits the latter. The production text gate is required because the installed loader may catch an early Markdown error. These gates do not replace Astro schemas, full MDX compilation, optimized image output or final artifact acceptance.
- `scripts/zhenkun-test-publication.mjs` uses native Node and authored in-memory fixtures. Expectations use literal public URLs, sentinel non-disclosure checks, and the installed Astro identity algorithm. No dependency, private note, fixture directory, runtime network, output cleanup or test framework is required.
- The existing build steps use `pnpm exec tsx` for the declared local runner, preserving script order and behavior. No package installation fallback is needed for verification. This avoids a second package manager's unrelated log-cleanup surface; it does not expand filesystem cleanup permission or change dependency declarations.

Heading fragments retain existing slug behavior. Actual heading existence/duplicate-heading selection and a complete Obsidian compatibility layer are outside P1; do not mark them accepted by the link regression suite. Source-managed image placeholders are not delivered image bytes. The existing generated-OG meta address, XML date, global image/canonical/base handling and disabled-route output defects remain P2; P1's shared OG ID/eligibility does not assert complete OG protocol correctness. `.obsidian`, private provenance and unselected attachments are not publishing inputs.

## Verification and rollback

Inspect command filesystem/network effects before execution. Native Node checks and `pnpm type-check` can run within the no-delete boundary. `astro check --noSync` is a limited diagnostic using existing generated types, not a fresh full check. Standard check/build/dev/preview and tsx can clean tool-generated cache/output/locks; execution requires an exact owner exception recorded in ROADMAP. Do not bypass the rule with another output directory, a wrapper, monkey-patched deletion, or synthetic success.

Acceptance has distinct layers: pure/index behavior → real Markdown/MDX transform → source diagnostics → complete build → final artifact/protocol/media checks → production browser → authorized deployment. An empty production post set is valid; never publish the current draft to make verification look complete. Use synthetic public/draft fixtures for failure cases and record what the real repository's empty public cohort proves.

Preserve the 12 pre-existing author-cleanup changes as a separate working-tree scope. The Wiki header-email cleanup overlaps P1; do not stage that earlier hunk into P1 accidentally. Review generated constants after a permitted build. Commit a completed accepted packet with its tracking update; if material required checks remain blocked, retain a clearly identified working increment instead of calling it delivered. Revert completed commits through Git history, never destructive resets or deletion. Push, integration into main, article approval and deployment are separate actions.

## Recovery and memory

Recover through AGENTS → ROADMAP → the active packet's ADR/contracts/error records → current Git status/log/diff. Compare real source with dated evidence before reusing a result. ROADMAP records branch/base, scope/exclusions, verification, blockers and next action; ADR records why; dated references record what was measured. ERROR_MEMORY receives actual failures and prevention rules, rather than a duplicate risk list. Keep unrelated memory or Space content outside the publication gate.

For each handoff, report changes, evidence, assumptions/risks and pending actions. Distinguish PASS, FAIL, BLOCKED, NOT_APPLICABLE and unverified behavior. A user permission change applies only to its named files/tools/actions. No global Codex memory update, Space creation/context transfer, manuscript export, service activation or release follows implicitly from a local code refactor.
