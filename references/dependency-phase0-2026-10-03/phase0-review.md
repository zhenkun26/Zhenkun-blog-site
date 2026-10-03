# Dependency remediation phase 0 — 2026-10-03

This is a static compatibility decision and evidence packet. Task status belongs only to `docs/ROADMAP.md`. No dependency candidate has been installed or tested. No application, dependency declaration, lockfile or CI workflow was changed.

## Baseline and provenance

- Source checkout: `codex/plan-dependency-remediation` at `b6c3e39b2bf7ea73ec60234dc42f8240e0e8695f`; tracked/index clean, preexisting `.workbuddy/` untracked. Source and user files retained.
- Isolated local clone: `codex/dependency-phase0-20261003`, same base, no shared `node_modules`. Its origin is the local source checkout, not permission to push back to it. No integration into the source branch or main.
- Application/configuration/scripts/dependency/CI tree is identical to deployed source `43c21ad305876a197e02ed7830991af8575c5485`. Dependency hashes match the October 2 baseline; [local baseline](local-baseline.json) records hashes, importer and 46 immediate lockfile parent edges for target and connecting packages. Installed parent manifests were read from the original checkout, not executed.
- Related source and bilingual engineering chats were idle at phase-0 entry. P8-I1 remains outside this baseline. No other project work was resumed.
- Requested execution setting: Astra xhigh. Available runtime tools do not attest the active model/reasoning setting; it is recorded as UNVERIFIED. No claim of a model switch is made.

## Advisory reconciliation

[Fresh production](audit-prod.json) and [full](audit-full.json) pnpm 11.22.0 audits each returned 51 records / 33 GHSA / 10 packages: 25 high, 19 moderate and 7 low. Both exited 1 for vulnerabilities, not network failure or PASS. The [receipt](audit-receipt.json) preserves commands, time and exit codes. Existing pnpm CLI was invoked directly, avoiding package-manager download; no install or `audit --fix` was run.

The reviewed union is **36 GHSA**: 32 historical, the sharp maintainer advisory, two serializer candidate guards, and one new cache advisory. **34 match a locked version**; the two serializer guard advisories do not match installed 4.0.0. Full ranges, every current target version, all immediate parent edges and available audit paths are in [JSON](advisory-matrix.json) and the [readable ledger](advisory-matrix.md). A version match is distinct from a demonstrated exploit. The scope is the current and selected candidate graph, not an unbounded search of unrelated packages.

1. `sharp`: the old libheif advisory is fixed at 0.35.4, but [GHSA-wq5f-xc86-pv6w](https://github.com/lovell/sharp/security/advisories/GHSA-wq5f-xc86-pv6w) affects **both 0.35.2 and 0.35.4**. Evaluate 0.35.5 for root, Astro optional and Miniflare edges. Published metadata confirms Node >=20.9.0 and platform-specific packages. The maintainer identifies librsvg >=2.63.2. Global libvips/librsvg builds need separate version verification; package version alone is insufficient there. The database endpoint returned 404; the maintainer repository API succeeded. The current npm audit omits this advisory, so audit-zero alone cannot close it.
2. `serialize-javascript`: 7.0.3 resolves the historical RCE range but is within [GHSA-qj8w-gfj5-8c6v](https://github.com/advisories/GHSA-qj8w-gfj5-8c6v). Evaluate **7.0.5 only as fallback**; its npm package is published, CommonJS callable export retained, Node >=20.0.0. [GHSA-gfhx-hw2g-v5hg](https://github.com/advisories/GHSA-gfhx-hw2g-v5hg) affects >=7.1.1 <7.1.2, not 7.0.5. Do not blindly select latest or claim Node compatibility proves caller compatibility.
3. `http-cache-semantics@4.2.0`: [GHSA-ch52-4w7c-c8xp](https://github.com/advisories/GHSA-ch52-4w7c-c8xp) is high severity. Audit says `>=4.2.1` is patched, but the official advisory has no first patched version, npm `/4.2.1` returns 404 and `latest` is 4.2.0. **No verified published repair exists in this packet.** Do not issue an update command for 4.2.1, invent a patched fork, delete the dependency or hide it with audit-ignore. Recheck for an upstream/parent repair; otherwise report a remaining high-severity blocker. No exception has been approved.

## Swup: preferred bounded removal of the old build chain

Registry latest values remain `@swup/astro 1.8.0`, `parallel-plugin 0.4.0`, `route-name-plugin 4.1.0`, `microbundle 0.15.1`, and `rollup-plugin-terser 7.0.2`. Both old plugins declare **`@swup/plugin ^3.0.0`**, resolving 3.0.1. Its runtime dependency list includes microbundle. Consequently a normal same-range refresh does not remove the chain.

The official [plugin 4.0.0 release](https://github.com/swup/plugin/releases/tag/4.0.0) moves package bundling to `@swup/cli`. Registry tarballs for 3.0.1 and 4.0.0 were downloaded into memory, SHA512 checked against registry integrity, and selected files inspected without executing package code. [Package inspection](package-source-review.json) records hashes and manifests:

- ESM `dist/index.modern.js` and `dist/index.d.ts` are byte-identical.
- CommonJS `dist/index.cjs` differs in the version-requirement lookup expression. Static reading suggests equivalent lookup semantics; this is not a runtime proof.
- Version 3 exports a `swup-plugin` CLI and carries build dependencies. Version 4 drops that bin and has only `swup ^4.0.0` as runtime dependency. Project scripts invoke Astro and do not call `swup-plugin` or microbundle.

**Selected experiment:** two exact-parent overrides, `@swup/parallel-plugin@0.4.0>@swup/plugin: 4.0.0` and `@swup/route-name-plugin@4.1.0>@swup/plugin: 4.0.0`. This is explicitly a **cross-major override outside each parent's declared range**, not natural semver resolution. Do not override every `@swup/plugin` or alias the removed CLI.

Exit requires both parents resolving 4.0.0, exported ESM/CJS/type compatibility, requirement checks and mount/unmount hook cleanup, actual parent-plugin behavior, no project CLI dependency, full Swup browser lifecycle and no remaining path to the old microbundle/terser/serializer chain. Official bytes support selecting the experiment; they do not close these gates. The snapshot suggests other v2 SVGO/colord/brace instances may disappear too; recompute their parents after the graph change.

Installed `@swup/astro/src/script.ts` defaults both `parallel` and `routes` to false; current site options do not enable them. Thus ordinary production navigation alone cannot exercise these optional parent-plugin APIs. Future regression fixtures must explicitly instantiate/activate each real parent without changing production feature switches. [Source inspection hashes and anchors](source-inspection.json) identify the files behind these static conclusions.

Rejected alternatives: deleting `microbundle` through `overrides: '-'` leaves the old published CLI contract broken; replacing `rollup-plugin-terser` with `@rollup/plugin-terser` is not a drop-in name/export guarantee; a global serializer override crosses a major range unnecessarily; moving packages to devDependencies only changes audit classification. If the selected experiment fails, stop it and return for review before applying the narrow `rollup-plugin-terser@7.0.2>serialize-javascript: 7.0.5` fallback. The fallback requires actual serialization and worker parameter tests, not only an Astro build.

## Cloudflare and native dependencies

Latest metadata checked: `@astrojs/cloudflare 14.3.3`, `@cloudflare/vite-plugin 1.62.5`, `wrangler 4.147.0`, `miniflare 5.20261001.0-alpha`. They introduce a new workerd/prerelease combination and still pin **sharp 0.35.4**; only undici 7.29.1 is naturally repaired. Broad parent updates therefore do not fully solve the present target.

Keep existing parent versions for the first native candidate: update root/Astro sharp within `^0.35.4`, and evaluate exact Miniflare edges `miniflare@5.20260828.0-alpha>sharp: 0.35.5` and `...>undici: 7.29.1`. These override exact pins and require Linux binary loading/image output and actual used Miniflare API compatibility. Preserve `allowBuilds` and platform capability scope. No CF_WORKERS activation or platform migration is part of remediation. If this candidate fails, investigate a coherent parent combination rather than silently expanding overrides.

## Exposure boundaries and corresponding gates

| Boundary | Source-confirmed facts | Limits and required validation |
| --- | --- | --- |
| Static Pages | `deploy.yml` uploads dist; no Node/Worker service or upload endpoint. `CF_WORKERS` absent from workflows. | Matching installed vulnerabilities remain maintenance work. Generated malicious assets remain a possible input/supply-chain issue; no visitor exploit demonstrated. |
| Astro dev | package scripts use `astro dev`, config does not set host. Installed Astro defaults `host:false`, `allowedHosts:[]`. | Default is local scope; runtime flags, process environment, proxy forwarding and listening sockets were not inspected. Do not claim every running server is private. Before future dev smoke tests use explicit loopback and inspect actual bind; no PoC. |
| Astro preview | Static preview uses `getResolvedHostForHttpServer(false) -> localhost`. | A local static HTTP server differs from Astro dev/SSR. Enabling `--host`, a proxy or adapter needs a new exposure assessment. |
| Linux build | Ubuntu runner + Node 24.20.0; scripts process local images and configured remote fonts. sharp detects bytes, so filename extensions are insufficient to exclude SVG. | Verify actual Linux prebuilt/global native stack; no inference from Mac success. Never execute an RCE PoC. Safe decode/size fixtures and upstream patched versions are appropriate gates. |
| Conditional CF | `astro.config.mjs:72` activates adapter when `CF_WORKERS` is any nonempty string, including `"0"`/`"false"`. | Require the variable to be absent in Pages validation. Configuration still imports Cloudflare at module load; absence of adapter use is not proof of zero import-time activity. No capability removal approved. |
| Remote cover tool | `siteConfig.ts` has VNDB false, empty userId, downloadCovers false; script 100–118 exits before download. | Latent `fetch -> Buffer -> sharp` path becomes relevant if enabled. Document enablement as reassessment event. |
| Cache package | Astro `dist/assets/build/remote.js` creates image Requests, calls `storable()`/`timeToLive()`, and revalidation uses its own conditional headers; no forwarding of visitor max-stale is evident in this call site. | Advisory requires shared user responses and adversarial max-stale. The reviewed path does not establish those conditions, but no dynamic proof or overall dependency closure is claimed. Published repair unavailable. |
| Content / tooling | Frontmatter source-controlled; icon packages declared; glob patterns checked in; fast-uri belongs to check/schema tooling. | Future remote manuscript/SVG input changes assumptions. No arbitrary uploaded content or dangerous examples are required for tests. |

## Delivery, review and remaining blockers

The next executable batch is R3 alone; its intended lockfile shrink comes before updates to surviving legacy children. Subsequent packets and precise gates are in the revised plan. Phase 0 can complete despite unresolved implementation gates, because it has produced an honest bounded decision and handoff; it cannot be recorded as vulnerability remediation complete.

Remaining blockers: no verified cache-package fix; untested Swup cross-major edges; untested Miniflare exact-pin overrides and Linux native combination; no current dev listener observation; all future candidate tests/build/browser checks. No temporary exception is granted. A proposed exception must specify owner, exact GHSA/versions/parents, protected input boundary and a maximum seven-day review date (first proposal: 2026-10-10), with immediate expiry when exposure changes or a repair becomes available. Expiry means a failing release gate, not silent renewal. Any waiver leaves overall remediation partial.

Historical 151/165 test counts remain historical. Current monolingual tests, formal TypeScript declaration gate, full builds on both bases, Pagefind artifacts and browser behavior must run for the implemented candidate. Bilingual acceptance is a separate future coordination point, not part of this packet.
