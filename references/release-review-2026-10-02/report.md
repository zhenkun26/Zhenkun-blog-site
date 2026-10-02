# Development release review — 2026-10-02

## Scope and decision

The request refers to 38 unpublished development commits, inventoried in `commits.json`, rather than 38 independent development branches. Review starts from `28e4b70` and compares the accepted development tree against deployed main receipt `ab26876`. The production identity update is retained. The separate bilingual implementation has not been accepted and is absent from this tree. The launch article remains a draft.

Static review and fresh local checks found no outstanding material regression introduced by this increment. Release remains conditional on hosted CI success for the exact candidate. This is not a claim of zero risk or a clean dependency audit. The inherited dependency advisories and validation boundaries below remain open maintenance work.

Main requires linear history, including for administrators. Preserve all original development branches and commits; create one tree-equivalent integration commit with current main as its parent. Do not weaken protection or rewrite published history. No new dependency, service, article publication, or feature activation is included. The two payment images are already absent following an earlier explicit owner exception; this review performs no filesystem deletion of them.

## Reviewed behavior

- Publication: one visibility/ID/URL contract feeds article routes, metadata, RSS, OG, calendar and recommendations. Drafts stay out of production outputs. Source discovery rejects symlinks and ambiguous/unsafe IDs. Native MD/MDX preflight does not execute authored imports. Wiki links enforce source confinement, publication visibility and unambiguous destinations; heading existence remains outside the current contract.
- Deployment: public and emitted media paths are distinguished from logical routes; canonical/OG/RSS/robots/sitemap paths use the project base. Disabled pages remain HTTP 200 redirect stubs to the base-local 404; they are excluded from the sitemap. They are not server-level 404 responses. Disabled feature endpoints do not expose data; existing public gallery assets remain public.
- Interactions: Pagefind initialization is awaited, stale searches are discarded, cleanup cancels pending sessions, and repeated opening preserves the query. Modal menus trap focus, restore focus and inert state, release scroll locks, close across the desktop breakpoint and Swup navigation, and avoid duplicate delegates.
- Identity/content: approved Zhenkun profile and contact values replace upstream demo identities; unused payment/contact values and hero links are empty; upstream license attribution remains. No private manuscript, `.workbuddy` content or unaccepted bilingual source is added.
- CI: full checks run on both deployment bases, with frozen dependency installation and artifact verification before Pages deployment. This review pins standalone Biome to the already-declared `2.5.11`, replacing `latest` and preventing disagreement with the full quality workflow. Package declarations and lockfile are unchanged; the earlier build command changes only `npx tsx` to installed `pnpm exec tsx`.

The focused credential-pattern scan covered 417 changed tracked text files and found no matches. It is not an exhaustive credential guarantee. Review also covers the changed evidence/documentation scope; source provenance and dated validation records are retained.

## Fresh validation

| Check | Result | Evidence |
| --- | --- | --- |
| Astro diagnostics | PASS: 257 files, 0 errors, 0 warnings, 12 retained hints | `astro.log` |
| TypeScript | PASS | `types.log` |
| Biome full source | PASS: 298 files | `biome.log` |
| Native regressions | PASS: 151 tests | `native-full.log` |
| Complete root build and artifact contract | PASS | `build-root.log`, `artifacts-root.json` |
| Complete project-base build and artifact contract | PASS | `build-site.log`, `artifacts-site.json` |
| Current project-base HTTP responses | PASS: 24 checks, byte comparison with current dist | `http-site.json` |
| New local browser session | BLOCKED by browser client before page access | No fresh local GUI PASS claimed |
| Prior accepted interaction source comparison | PASS: five relevant files identical after the identity-only window symbol substitution | `interaction-source-equivalence.json` |
| Hosted frozen-install Linux CI | Pending exact candidate | Record result after remote execution |
| Deployed-host acceptance | Pending deployment | Record result after release |

The local HTTP check used the existing no-fault artifact server on port 4340. A prior Astro preview process on 4335 had an outdated base and returned 404 for the current address; it was not counted as a product failure or used as evidence. It was left unchanged. Browser client refusal was not bypassed.

The owner explicitly permits the seven artifact tests to clean up only their own `zhenkun-ci-artifacts-*` temporary fixture directories locally and in CI. Existing standard build/cache cleanup exceptions remain bounded. All other temporary material is retained.

Prior accepted Edge interaction evidence is in `../p3-import-2026-10-02/browser-matrix.json` and associated screenshots. Source equivalence plus fresh regressions supports reuse of that evidence, but does not turn it into a fresh GUI run. Physical-device behavior, actual public article/comments, and heading-target existence are not established by an empty-content build.

## Dependency advisory reachability

`pnpm audit --prod --registry=https://registry.npmjs.org --json` exits 1: 50 advisory records across nine packages (24 high, 19 moderate, 7 low, 0 critical). Multiple installed versions account for some duplicate advisory IDs. The lockfile and all dependency declarations are identical to deployed main. These advisories are inherited, not fixed by this release. The deployment artifact is static HTML/assets; it does not deploy Node, a worker, an upload endpoint, or a public parser service.

| Package | Current path and relevant input boundary | Release assessment |
| --- | --- | --- |
| `serialize-javascript` 4.0.0 | Swup plugin → microbundle → rollup-plugin-terser. The project build invokes Astro/Rolldown, not microbundle. | Vulnerable transitive bundler is not an invoked production build step. |
| `colord` 2.9.3 | Same unused microbundle/PostCSS/cssnano chain. | No identified active execution path in this release. |
| `fast-uri` 3.1.5 | Astro check/language server → YAML schema tooling/AJV. | Development/check tooling; not shipped as a server. No visitor-controlled schema or URI input to this tooling. |
| `sharp` 0.35.2 | Cloudflare tooling → Miniflare. The actual direct image builder uses patched `sharp` 0.35.4. | Pages has no `CF_WORKERS` adapter or Miniflare deployment. |
| `js-yaml` 3.15.1 | gray-matter parses checked-in frontmatter during build. | Reachable build tool, but the current reviewed frontmatter is trusted and contains no hostile recursive merge input. No public YAML ingestion. Future untrusted content needs reassessment. |
| `svgo` 2.8.3 / 4.0.2 | Unused microbundle chain and active astro-icon/Iconify tooling. | Icon sources are checked-in or declared package data. No SVG upload or reliance on SVGO as a security sanitizer. A compromised future icon source remains a supply-chain risk. |
| `undici` 7.29.0 / 8.10.1 | Cloudflare/Miniflare and Astro/unifont. Unifont fetches configured font-provider resources; its optional proxy dispatcher uses Agent/EnvHttpProxyAgent. | No cache/retry/dump interceptor, BalancedPool, WebSocket or shared visitor request service is configured here. Remote font data remains build-time supply-chain exposure; malicious compressed responses could affect build availability. |
| `brace-expansion` 1.1.18 / 2.1.4 / 5.0.9 | Build/lint globbing dependencies. | Fixed repository-controlled glob patterns; no public glob expression input. |
| `devalue` 5.9.2 | Astro/Svelte serialization. Reviewed active islands use strings, numbers and plain configuration data. Buffer use is confined to build-time image/encryption helpers which return bounded image bytes/base64 strings, not island Buffer props. | No current Buffer/backing-memory island serialization, hydratable call, public deserialization endpoint, hostile sparse array or visitor-supplied object serialization identified. |

Primary advisory references: [js-yaml merge CPU exhaustion](https://github.com/advisories/GHSA-2883-xcg3-v3hh), [devalue shared backing-memory serialization](https://github.com/advisories/GHSA-j22f-vq7h-c4qm), [SVGO executable-link sanitization](https://github.com/advisories/GHSA-w27v-7q3p-w38r), [serialize-javascript code execution](https://github.com/advisories/GHSA-5c6j-r48x-rmvq). The full audit preserves each advisory and dependency path in `dependency-audit.json`.

The decision is limited to this reviewed, trusted-input static-site release: no identified visitor-controlled production exploit or new material release risk from these commits. Dependency upgrades remain necessary maintenance and require their own version/lockfile review and validation. Enabling SSR, Cloudflare services, uploads, external manuscript ingestion or Buffer-valued island props invalidates this assessment. A successful CI run does not resolve the advisories.
