# Zhenkun-blog-site remediation plan — 2026-10-01

## Decision and delivery boundary

Keep the existing Firefly/Astro framework and the owner's approved content. Remove upstream personal profile, contact, payment, and account data from the reusable templates; leave their fields and feature switches available for later owner configuration. Retain LICENSE, framework source credits, documentation links, and upstream remote history.

This plan derives from [the review](report.md). The review and its original evidence remain a record of the earlier state. Only the author-data cleanup below is authorized for implementation in this increment. The other packets are evaluated proposals, not completed fixes or publication authorization.

Working branch: `codex/remove-upstream-profile-data`, based on `bc21bfd`. No dependency declarations, lockfile, draft-publication flags, remote settings, or deployment workflows changed.

## A. Author-data cleanup — local patch prepared

| Area | Implemented change | Framework retained |
| --- | --- | --- |
| Hero links | Clear GitHub, Email, and Sponsor destinations; hide blank destinations; retain the owner's RSS path | Link slots, names, icons, and overlay component |
| Donations | Clear all QR references and payment links; disable four methods and post donation buttons; remove demonstration donor records | Method fields, donor-list type, page and components |
| Friends | Clear the upstream personal friend record and disable it; clear the MDX site's name, description, URL, avatar, and email | Friend record shape, application instructions, page layout, and framework documentation links |
| Bookmarks | Clear and disable the upstream personal bookmark | Group/item structure and framework resources |
| Third-party accounts | Clear Bilibili, Bangumi, VNDB, MyAnimeList, MAL client ID, and Memos creator identifiers | API integration fields and disabled optional-page switches |
| Background video | Clear the upstream media URL and disable playback | Video configuration and player implementation |
| Remaining contact examples | Remove the upstream email from two source headers; replace personal Memos examples; use the owner's configured site as the RSS fallback | Source author credit and RSS framework metadata |

The owner's existing sidebar profile and contact configuration remain intact. Wallpaper illustrations remain theme assets pending the separate visual choice. The first article still has `draft: true`; dev mode renders drafts for local review, so the screenshots below are not publication evidence.

### Remaining asset boundary

Two original payment-code images remain on disk:

- `public/assets/images/sponsor/alipay.png`
- `public/assets/images/sponsor/wechat.png`

Their configuration references are cleared, but `public` files are copied into static output even when donation UI is disabled. Full asset removal is therefore still pending. The active no-filesystem-deletion instruction prevents deleting them. Do not overwrite them with empty data or conceal this gap as a completed purge. A narrowly scoped exception or owner removal is needed before this cleanup is treated as ready to publish.

Git history and historical review evidence are retained. This is current-template cleanup, not history rewriting. The live site remains unchanged until a separately authorized delivery.

### Refill checklist

1. Hero: fill each approved destination in `backgroundWallpaper.common.homeText.links`; only nonblank entries render. Use an explicit `mailto:` value for email.
2. Donations: add owner payment destinations/owner QR assets, usage text, and only real donor records; then enable the intended method, page, and post button. Verify recipient identity before publication.
3. Friends: fill the disabled record and all five MDX `site` values, including an approved avatar, before enabling the page. Review the retained application rules rather than treating template text as an owner commitment.
4. Bookmarks: fill the disabled item, then enable it and its optional page if wanted.
5. Third-party lists: fill the owner's public account identifiers before enabling the relevant page. Never put private API tokens into public client configuration. Fill both the Memos instance and creator identifier before enabling its data source.
6. Video: supply approved reachable media, verify loading on desktop/mobile, then enable playback. The original remote video is not a default fallback.

## B. Deployment paths and feed correctness — recommended next packet

These fixes address multiple externally visible defects without changing the visual direction. Their primary acceptance evidence must come from production output built with `DEPLOY_BASE=/Zhenkun-blog-site/`.

| Finding | Proposed solution | Acceptance evidence | Main implementation risk |
| --- | --- | --- | --- |
| F04: duplicate image base | Resolve Astro-generated image URLs once against the site origin; distinguish already based `img.src` values from unprefixed public paths. Inspect the dormant generated-OG path too before enabling it | Home/About/Archive OG image and local structured image URLs contain one base prefix and return 200; absolute external images remain unchanged | A global URL rewrite could break mailto, external, or intentionally root-relative paths; keep the fix in image resolution |
| F05: closed routes in sitemap | Remove only the configured leading deployment base before matching route flags; make child routes, including dynamic comments and gallery albums, follow their parent's enable state | Parse the emitted sitemap at root and project bases; no disabled route or descendant appears, enabled routes remain | A broad substring replacement could accidentally strip a genuine route segment |
| F06: redirects leave project | Point closed-route stubs to the actual emitted base-aware error artifact. `url("/404.html")` is a candidate for Pages, subject to checking the generated artifact and host behavior | Generated redirect HTML remains within the blog; the final error page displays blog recovery navigation on the target host; error destinations are not advertised in the sitemap | Do not assume a `/404/` directory exists just because `/404.html` exists; static refresh HTML does not prove runtime HTTP 302 behavior |
| F07: localized feed date | Use protocol date serialization, such as `new Date().toUTCString()`, for `lastBuildDate`; keep localized display dates in HTML | XML parses; an RFC email-date parser accepts `lastBuildDate`; owner site/channel links are correct; drafts remain excluded from production feed | A feed-only change must not change UI date formatting or publish a draft |

RSS dates must use RFC date syntax under the [RSS 2.0 specification](https://www.rssboard.org/rss-specification). Reader-specific subscription behavior should be tested separately; syntax acceptance alone does not prove every reader works.

## C. Search and keyboard interaction — separate focused increments

### F02: first-query initialization

Use one active query source for each search interaction. During Pagefind readiness, schedule only that active query; an inactive empty input must not cancel its request. A shared bound keyword with one scheduling path is a candidate, but the change must retain mobile panel behavior, request-ID stale-result protection, debouncing, and close/Escape cancellation. Avoid adding another independent readiness timer.

Acceptance: first query from a fresh production tab; deliberately slow Pagefind initialization; clearing and re-entering; pasting; desktop/mobile switching; a late response after closing; and subsequent About/archive result navigation. Dev mode does not supply proof of the generated Pagefind index. Do not use the unpublished article as a required production search result.

### F03: mobile modal drawer

On opening the drawer, move focus inside it, contain Tab/Shift+Tab, and make the obscured background unavailable to keyboard/pointer interaction. On close, restore prior background `inert` state and return focus to a visible trigger. Escape should close the active modal even if focus has become displaced. Clean up state when Swup replaces the page or the drawer disappears at a breakpoint.

Limit modal behavior to the actual modal drawer; search popovers and music controls must retain their intended interaction model. Do not mark an ancestor inert if it also contains the drawer. Acceptance covers keyboard opening, both Tab directions, Escape, outside click, navigation close, breakpoint changes, and focus restoration with no stale scroll lock. Visual styling can remain unchanged.

## D. Dependency and delivery assessment — before release approval

The official-registry scan captured in this review reports 50 advisories across nine modules; this is not a count of independently exploitable browser vulnerabilities. Use [the raw scan](dependency-audit-npm.json) to trace each installed version and parent path, then inspect the actual call sites and input trust boundaries. No upgrade was performed in this increment.

| Group | Current evidence | Proposed action |
| --- | --- | --- |
| js-yaml 3.15.1 | Comes through gray-matter; the wiki-link plugin imports gray-matter for repository content | Assess frontmatter input ownership, then prefer the compatible 3.x patched release rather than changing the content parser's major version |
| devalue 5.9.2 | Comes through Astro/Svelte; installed Astro uses it in content stores and actions/session runtime | Check which serialization paths run in this static site and whether pooled Buffer/typed-array data reaches them; evaluate the patched 5.9.3 release with framework compatibility checks |
| undici 8.10.1 / 7.29.0 | 8.x comes through Astro/unifont; configured remote fonts make build-time network handling relevant. 7.x comes through Miniflare/Cloudflare tooling | Review build-time remote input and the inactive Cloudflare adapter separately; resolve compatible patched versions through the appropriate parents |
| sharp, svgo | The flagged sharp 0.35.2 is under Miniflare, distinct from the declared direct sharp range; svgo has both astro-icon and Swup/microbundle paths | Inspect actual image/icon build inputs and update the affected parent path; do not declare the direct image processor vulnerable solely from the Miniflare finding |
| fast-uri, brace-expansion, colord, serialize-javascript | Paths include language-server, glob, CSS minifier, and Swup's microbundle/Terser tooling | Separate installed tooling from executed tooling. For serialize-javascript, a forced 4.x-to-7.x override needs parent compatibility evaluation; prefer a supported parent update if available |

Primary advisory checks establish the relevant conditions: [js-yaml's empty-merge CPU issue](https://github.com/advisories/GHSA-2883-xcg3-v3hh) has a patched 3.15.2 release; [devalue's backing-buffer serialization issue](https://github.com/advisories/GHSA-j22f-vq7h-c4qm) is patched in 5.9.3; [serialize-javascript's code-injection issue](https://github.com/advisories/GHSA-5c6j-r48x-rmvq) requires controlled serialized objects and later evaluation, and is patched in 7.0.3. These conditions do not establish exploitability of this blog. Check all advisories for a chosen package, not just the example linked here.

After approval for specific dependency changes, update only the necessary dependency path, inspect lockfile changes, run content/interaction regressions and a fresh official-registry audit, and record residual advisories with their assessed exposure. Do not run a blanket forced audit fix.

For delivery, change deployment installation to frozen resolution and make deployment depend on diagnostics and the exact verified artifact. Keep branch roles and Pages settings intact. This requires a separate workflow increment; push and deployment remain separately authorized actions.

## E. Reader experience — after correctness fixes

Proceed one visual variable at a time under `docs/PROCESS.md`:

1. Add a deliberate production homepage empty state with About/RSS paths while article publication is pending. Disable or replace the example announcement and decide which zero-count widgets remain useful.
2. Add explicit search labels and visible focus styles, reconcile About's two H1 headings, and make the typewriter respect reduced-motion preferences.
3. Resume approved wallpaper/favicon/sidebar choices using before/after screenshots. Keep the parked logo task parked. Publishing the first article requires owner review; appearance work is not publication permission.

## Current verification and delivery ledger

| Check | Result | Evidence / limitation |
| --- | --- | --- |
| `pnpm check` | PASS | 253 files, 0 diagnostic errors/warnings/hints; content synchronization separately reports the intentionally empty dynamic collection |
| `pnpm type-check` | PASS | Exit 0 after the final source edits |
| Configuration acceptance probe | PASS | [cleanup-config.json](cleanup-config.json): retained blank slots, four inactive payment methods, no donor examples, cleared third-party identifiers, optional pages still disabled |
| Personal-identifier text scan | PASS for known identifiers | No matches in `src`/`public`; binary image content, Git history, and historical evidence are outside this text scan |
| Desktop render | PASS | [cleanup-home-desktop.jpg](cleanup-home-desktop.jpg), [cleanup-desktop.json](cleanup-desktop.json): default 1280×720 viewport, RSS-only hero, no video entry, no empty hero href, no horizontal overflow |
| Mobile render | PASS | [cleanup-home-mobile.jpg](cleanup-home-mobile.jpg), [cleanup-mobile.json](cleanup-mobile.json): 390×844 requested viewport, same link/overflow checks; temporary viewport override reset |
| Provenance and draft preservation | PASS | LICENSE, README, About provenance, and draft file unchanged by this increment |
| Full payment-asset removal | BLOCKED | Two original images remain under the explicit no-deletion rule |
| `pnpm build` | BLOCKED, not run | Astro empties output and removes generated staging directories; `prune-pio-assets.ts:50` removes output models/chunks; `subset-fonts.ts:363` removes output font files |
| Fresh production/Pages validation | BLOCKED | Cannot be substituted by dev screenshots or September build runs |
| Local commit, push, deployment | NOT_PERFORMED | Completion is not yet supported by full asset removal and required build verification; no remote delivery authorization |

The initial one-off configuration probe incorrectly treated `booknavConfig` as an object with `groups`. It failed before producing evidence. Inspection confirmed the export is a `BooknavGroup[]`; the corrected probe passed and wrote the JSON above. This was a verification-script mistake, not an application defect.

## Concrete remaining approval boundary

To close packet A, authorize only removal of the two named upstream payment-code images and the normal generated-output/staging/cache cleanup performed by this repository's `pnpm build`. This does not authorize deleting other source material, history rewriting, dependency installation/upgrades, push, or deployment. If a build encounters deletion outside that described scope, stop and reassess rather than extending the exception implicitly.

After that boundary is resolved: perform the scoped cleanup, run the required production build, verify the final output contains no original payment assets or upstream personal entry points, update ROADMAP with the actual result, review the final diff, and commit the completed local increment. Roll back a committed increment with `git revert`; do not reset or rewrite published history. Packets B–E remain proposals until selected for implementation.
