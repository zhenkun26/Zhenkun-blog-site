# P4 feature measurements — 2026-10-02

Measured application source: `a353c2ee800bbff2865541288ea04308c245cdc5`, based on canonical `d8eb0cb3ca6eb2c2fa0b703a47721d2a9f6146f1`. This is evidence about resolved settings, source guards and emitted output. [Canonical ROADMAP](../../docs/ROADMAP.md) alone owns current task status; this file does not authorize activation or publication.

All ten resolved `siteConfig.pages` flags are false. No `PUBLIC_PAGES_*` or `PUBLIC_DISPLAY_SETTINGS` override was present in the recorded inventory. All 27 files in `src/config` match the canonical baseline byte for byte; see [config inventory](config-inventory.json).

| Capability / actual key | Navigation and direct output at both bases | Discovery / data / assets | Setup and evidence limit |
|---|---|---|---|
| Friends / `friends` | Hidden; `/friends/` emits redirect stub | Absent from sitemap and Pagefind | Public friend configuration retained; enabled content not exercised |
| Guestbook / `guestbook` | Hidden; `/guestbook/` emits redirect stub | No guestbook comment script in emitted stub/index | Provider selection remains giscus; no real guestbook interaction exercised |
| Dynamic / `dynamic` | Hidden; `/dynamic/` and `/dynamic/comments/` emit stubs; `latest-dynamics` sidebar absent | JSON endpoint is `[]`; parent/child absent from sitemap and Pagefind | Actual GET regressions exercise disabled sentinel and unreadable source, enabled Markdown/image/sorting/schema, and enabled empty collection |
| Gallery / `gallery` | Hidden; gallery index and two configured albums emit stubs | Four public gallery files remain emitted; sampled root media 200 and all four subpath files 200 | `getStaticPaths` still enumerates albums; no privacy promise or asset removal; enabled album/password flow not exercised |
| Bookmarks / `booknav` | Hidden; `/booknav/` emits stub | Absent from sitemap/Pagefind | Retained owner-fillable template; enabled empty/populated views not exercised |
| Sponsor / `sponsor` | Hidden; `/sponsor/` emits stub | Absent from sitemap/Pagefind | Existing cleaned template remains; no payment data or method enabled by this packet |
| Bilibili / `bilibili` | Hidden; `/bilibili/` emits stub | Page guard precedes provider call; no integration script in stub | Owner UID required when enabled; provider response/error states not exercised |
| Bangumi / `bangumi` | Hidden; `/bangumi/` emits stub | Guard precedes account/mode fetch logic; absent from discovery | Source has account/configuration and mode-specific fallback; enabled/unconfigured and remote errors not exercised |
| VNDB / `vndb` | Hidden; `/vndb/` emits stub | Route guard precedes fetch; cover generator logs page-disabled skip | Account/mode/cover settings retained; provider and enabled/unconfigured behavior not exercised |
| MyAnimeList / `mal` | Hidden; `/myanimelist/` emits stub | Sitemap maps route name to existing `mal` flag; guard precedes fetch | Username/client settings required; enabled/unconfigured and remote errors not exercised |

The 13 disabled HTML artifacts are HTTP 200 with a two-second meta refresh and fallback link to the emitted base-relative `404.html`. The v2 subpath HTTP audit separately verifies an unknown path returns HTTP 404 with exactly that 404 body. Direct `/404.html` itself is an ordinary static HTTP 200 file. These outcomes must remain distinct.

The retained public gallery files are `gallery/encrypted-test/urls.txt`, `gallery/firefly-2026/1.avif`, `gallery/firefly-2026/cover.avif`, and `gallery/firefly-2026/urls.txt`. Disabling pages, hiding navigation, omitting sitemap entries, and HTML encryption do not remove or protect them.

| Ancillary setting owner | Resolved configuration | Source/output evidence | Unexercised boundary |
|---|---|---|---|
| Comment / `commentConfig` | giscus selected and already enabled under ADR-XB-005 | No giscus external script in current empty-production routes or disabled stubs; settings unchanged | Real approved public article, login, submit, discussion mapping, availability |
| Dynamic Memos / `dynamicConfig.memos` | `enable:false`, local JSON mode | Dynamic parent guard suppresses view/sidebar; no Memos activation | Remote Memos protocol, sanitation, errors and content publication |
| Music / `musicPlayerConfig` | Navbar/sidebar on; `mode:"local"`; lyrics off | Source keeps existing persistent manager; both configured local MP3/cover files present and HTTP 200 in subpath audit | Playback controls, device/browser audio and lifecycle not re-exercised by P4; Meting not activated |
| Analytics / `analyticsConfig` | Google/Clarity/Umami/51.la IDs empty | Conditional Layout source and emitted external-script checks | No real provider integration or telemetry acceptance |
| Character / `pioConfig` | Spine and Live2D off | Source flags unchanged; final `dist/pio` absent after declared prune stage | Character activation/resource/browser behavior |
| Sakura / `effectsConfig` | Off | Resolved config unchanged | Browser request or animation profiling not performed |
| Display settings / `displaySettingsConfig` | Global toggle and all 12 sub-controls off | Resolved inventory; existing total-switch evaluator retained | Persistence, focus and controls not exercised |
| Sidebar / `sidebarConfig` | Sidebar and announcement component on | Configuration retained; dynamic component separately gates on parent | Announcement replacement and visual selection remain outside this packet |
| PlantUML / `plantumlConfig` | Enabled in existing config | No public article or diagram workload; no current diagram request claimed | Approved article diagram requests, endpoint availability and runtime |
| Mermaid / `mermaidConfig` | Existing configuration retained | No diagram-bearing public article emitted | Article diagram rendering not exercised |

The actual production library contains zero public articles; the existing `blog-launch.md` remains `draft:true`. Both data APIs are empty, RSS has zero items, and Pagefind indexes only About. Eight emitted URLs are in sitemap; nine regular HTML files include `404.html` alongside the ordinary routes. These measurements are not empty-state or article/comment browser acceptance.

Pagefind stores a raw `/about/` fragment at both bases. Its bundle/result resolution adds the deployment path. The first audit wrongly expected the stored fragment itself to be prefixed and failed; the original checker and failure remain unchanged. [Corrected subpath audit](artifacts-v2-subpath.json) separates raw and resolved routes. [Runtime probe](pagefind-runtime-subpath.json) uses the actual emitted Pagefind 1.5.2 module, index and WASM over local HTTP, with explicit bundle basePath in Node; “Zhenkun” resolves to `/Zhenkun-blog-site/about/`. Default browser import inference and browser search interaction are not measured by that probe.

Root full build/28 HTTP measurements are preserved handoff evidence on the exact same application source, with a fresh root deployment-artifact checker and a hashed archive of the original `dist`. Fresh successor execution covers 151 native, static diagnostics, all eight deployment-base stages, 33 HTTP byte comparisons plus the true-404 negative case, and real Pagefind result resolution. [Report](report.md) and manifests retain these different scopes.
