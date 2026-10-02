# P8 bilingual feasibility measurements — 2026-10-02

This is dated evidence for ADR-XB-014, not another task board. Current state is only in `docs/ROADMAP.md`. Application baseline: `27e09c220e1ffe16817d5bf02e950a4fbf332b7b`, after locally accepted P4. Application source/config/content is unchanged. Both public brand and author remain Zhenkun; the approved Chinese profile and unpublished `blog-launch.md` are preserved.

## Source observations and counting method

`inventory.mjs` inventories Git-tracked source using installed TypeScript 6.0.3 AST, Astro 7.2.10's existing compiler-rs AST and Svelte compiler AST. Dictionary keys are literal computed enum members. Counts exclude comments/styles, dictionary values from the hardcoded scan, and all manuscript bodies. There were zero parser diagnostics. The Han-bearing scan finds occurrence candidates, not unique translation tasks or proven reader defects. Runtime config names, translation aliases, asset filenames, diagnostics and plugin text are included; CSS and other-language hardcodes are outside its scope. About prose and author-approved configuration need a separate editorial review, not machine-count conversion.

| Observed fact | Exact result | Implication |
|---|---|---|
| Typed `I18nKey` enum | 419 keys | Existing catalog is substantial and reusable |
| Six catalogs | en/zh_CN/zh_TW/ja/ko/ru: 419 unique keys each, no missing/extra/duplicate keys | Key coverage, not translation accuracy |
| English / Simplified Chinese | 0 empty values; 0 named `{placeholder}` differences | Reuse existing values after reader QA; regex checks only this placeholder syntax |
| Other catalog exception | Japanese `paginationPage` is empty | Outside proposed two-language scope; no catalog edits here |
| Direct `i18n(...)` calls | 510 occurrences in 81 files | Migration surface; not an estimate of 510 necessary edits |
| Scanned source files | 292 | `.astro/.svelte/.ts/.js/.mjs/.html`, tracked only |
| Han candidates | 146 occurrences in 30 files | 127 runtime strings, 9 diagnostics, 3 frontmatter/expression strings, 1 template text, 3 markup attributes, 3 markup texts |
| Page route source files | 27; 0 localized folder routes | Existing UI language does not imply bilingual routes |
| `hreflang` source matches | 0 | No current alternate-language metadata system |

Important manual triage examples: NavMenuPanel's navigation/close aria-labels are Chinese; the friends placeholder and Bangumi empty/setup text are Chinese on disabled pages; FooterConfig's HTML example is injection/demo copy. Config counts include 22 booknav, 18 navbar and 18 Pio occurrences; predefined navbar Chinese aliases already map to i18n keys, while custom names survive unchanged. Plugin/script counts include diagnostics and diagram button text. Do not translate approved author copy, music titles, public filenames or diagnostic messages merely because they appear in the scan. `inventory.json` contains exact paths/lines/hash bindings and full candidates.

Actual source contracts:

- `translation.ts` reads `siteConfig.lang` globally; it has no per-call locale. Unknown `getTranslation` input defaults to English; a missing English value falls back to Chinese. Direct `zh-CN` is not a dictionary-map alias, while the existing `resolveSiteLang` correctly normalizes that environment input to `zh_CN`. The future route adapter must distinguish UI enum codes from BCP47; the current resolver is not broken.
- `PUBLIC_SITE_LANG` is a real build-wide seam, also used by dates/config. `Layout` accepts `lang` and emits HTML language / OG locale, but UI strings remain build-wide. Article `lang` is metadata; real `getPostId` produces the same ID regardless of that field. Schema has no translation-pair key. Home pagination and post routes read all eligible posts; About reads one fixed spec entry.
- Existing publication preflight/draft/private eligibility and stable IDs remain authorities. A new locale view must filter after eligibility, rather than declaring everything with an English filename published.
- Real P2 helpers suppress `/gallery/` and strip `/search/?q=x#test` under both bases. Hypothetical `/en/gallery/` is indexable and `/en/search/` retains the query/hash today. This is a future prefix scope gap with no emitted English routes now. Both options must enforce capability/discovery policy in their own logical-path domain before generating routes.
- Installed `@swup/astro` 1.8.0 emits `data-no-swup` ignore handling. Installed Head plugin 2.3.1 defaults to updating HTML `lang`/`dir`; asserting that Swup cannot update language would be incorrect. The actual navbar caches `window.pagefind` / `__pagefindLoading` and does not reinitialize it for a locale change. Default same-language P3 search/session behavior must be retained.
- Expressive Code collapsible labels are fixed by `i18n(...)` in `astro.config.mjs` at config time. Per-page labels in a single mixed-language build need an integration probe; existing core localized text APIs do not prove that this third-party collapsible plugin supports it. Option B avoids this specific global-config seam by separate language builds.

`existing-contract-probe.mjs` invokes the actual existing translation, config, deployment and post functions. A config import seam and temporary in-memory English-value mutation are restored in `finally`. No file/service mutation. Raw observations are in its JSON/log.

## Synthetic static route / search probe

`astro-locale-fixture.mjs` writes a minimal, ignored `tmp/p8-astro-locale-fixture`, with existing installed Astro/Pagefind and dedicated local cache directories. Its saved recipe is the deliverable; generated files are not application changes. Two paired routes (home/about), a Chinese-only route, and their own synthetic copy are used. No real manuscript is translated or made public.

1. Raw compatibility builds use the existing site URL containing `/Zhenkun-blog-site/`. Astro 7.2.10's absolute locale helper gives `https://zhenkun26.github.io/Zhenkun-blog-site/` under root base and `https://zhenkun26.github.io/Zhenkun-blog-site/Zhenkun-blog-site/` under the deployment base. Logs/HTML retain this observed mismatch. The helper joins `site` and its already-based relative path; it cannot blindly replace the P2 URL contract.
2. Separate successful builds use origin-only `site` plus explicit `/` or `/Zhenkun-blog-site/` in synthetic config. Each emits five pages with exact once-only base, self canonical, expected `Astro.currentLocale` / `<html lang>`, and reciprocal absolute Chinese/English alternates only for existing pairs. Each has six HTTP checks: five byte-matched 200s and missing `/en/solo/` 404. This custom fixture HTTP server maps only existing files; it does not prove a GitHub Pages server's status or Astro middleware response.
3. Astro's helper can construct `/en/solo/` even when that translation does not exist. The fixture pair policy omits its link and `hreflang` and displays unavailable status. URL construction is not publication/translation availability.
4. Pagefind 1.5.2 discovers two indices (3 zh-cn, 2 en pages). Real emitted JS/index/WASM, fetched over temporary loopback HTTP, returns exactly 3 Chinese or 2 English results for `Capability`, and zero for the other language's unique sentinel, under both bases. Fresh Worker JS/WASM contexts use a minimal `document.querySelector('html').getAttribute('lang')` seam. This validates index selection and resolved URLs at initialization, not a real browser.
5. Public `createInstance({language:'en'})` is overridden by its internal `detectLanguage()`. Without a document, detection is `unknown`; this fixture picks the larger Chinese index (3 results), despite the option. Reusing differing language indices in one Node module context gave 0 English results after Chinese initialization; no browser defect is asserted from that experiment. Successful tests deliberately use fresh contexts, corresponding to the proposed initial full-document cross-language navigation.

Clarification of older evidence: the P4 Node probe passed `language:'zh-cn'`, but 1.5.2 ignores that public option. P4's single-language index and actual About result URL checks remain valid; its explicit-language wording does **not** establish forced locale selection. Historical P4 hashes/logs are preserved. The current fixture supplies positive and negative multilingual evidence instead of broadening P4 acceptance.

The successful JSON binds fixture recipes, every emitted file hash, commands, five-page metadata, 12 HTTP checks, six initialization/search cases and both `serverClosed:true` records. No listener persists. No browser screenshot/interaction, P3 focus/menu/resize regression, full Firefly bilingual build, Linux/hosted CI, crawl or public release is claimed. Existing production tests/builds were not repeated for a docs/analysis-only delta.

## Probe recovery record

- Direct old Astro CLI filename and compiler-package assumptions were invalid for this installed version; discovered the actual `astro/bin/astro.mjs` / compiler-rs without installation.
- Initial fixture build tried the shared symlinked dependency Vite cache and hit sandbox EPERM. Dedicated fixture Vite/Astro caches corrected the fixture. Existing dependency files, lock and protected source were untouched.
- Initial locale-helper canonical expectation failed; retained raw logs/HTML, reproduced both bases, and tested origin/base adaptation separately. No production fix was attempted.
- Loopback listen hit sandbox EPERM; authorized local-only reviewed execution succeeded. No dependency-setup denial was retried.
- Explicit-language and shared-context Pagefind expectations failed; retained both logs, read actual emitted implementation, and tested detected HTML language in fresh workers. All temporary servers close in `finally` on failure as well as success.

## Primary references (consulted 2026-10-02)

[Astro internationalization guide](https://docs.astro.build/en/guides/internationalization/) documents default-unprefixed and other-prefixed routing with explicit localized files and optional fallback behavior. This does not provide translations or pair availability. [Astro i18n module reference](https://docs.astro.build/en/reference/modules/astro-i18n/) describes locale URL helpers; installed 7.2.10 behavior above takes precedence for this project.

[Pagefind multilingual documentation](https://pagefind.app/docs/multilingual/) describes language-separated indexing from HTML `lang` and selection on initialization. Installed 1.5.2 was measured locally; current documentation alone is not API compatibility evidence.

[Google localized-page guidance](https://developers.google.com/search/docs/specialty/international/localized-versions) requires absolute alternate URLs including self and reciprocal variants. Local artifact assertions test that structure; they do not prove search-engine indexing. Proposed self canonicals are a project URL policy, not a result of a crawl.
