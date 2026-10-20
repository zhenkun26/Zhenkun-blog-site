# Security repair review — 2026-10-20

Status: local substantive checks complete; clean-source live audit, final renewal decision and exact remote delivery pending.

The resumed shell runs on the same Mac (Darwin25.5 arm64), Node24.20.0 and corepack pnpm11.22.0. Original checkout and historical writer were read only. Baseline main is5d96deb5ab45043d5a2cafae08c8c9c6a767382b; existing CLI authentication initially returned401 and later a read-only user lookup confirmed zhenkun26 after the owner restored the connection. No credential or global configuration was created or changed.

## Official review and bounded change

The41 retained global GHSA records and publisher CVE-2026-93750 were freshly read. Severity, alias, range and withdrawal semantics are unchanged. Cache4.3.0 official tarball integrity and full source hash remain identical to the reviewed source. Repository security advisories independently publish GHSA-98hj-9722-w3j8 (medium, fixed7.3.2) and GHSA-mpr7-6m5w-76rw (low, fixed7.3.3). Both global API404 responses are retained locally; repository advisories and release changelog establish the missing identities. The policy now retains44 rows and continues to fail all known affected instances. Other observed repository advisories concern fixed versions or adapters absent from this static deployment; they do not waive these two findings.

Choose exact Astro7.3.3, MDX8.0.1 and markdown-satteri0.4.1. Both framework/integration publish the same satteri version; peers pass. Merman and all unrelated root declarations stay unchanged. Official Astro7.3.8 was read for comparison but not installed: it expands compiler/bundler changes beyond the two fixes. PR37 remains closed/unmerged; its combined updates and failures are not accepted.

Generated graph has892packages/895snapshots,8added/5removed, no changed retained package/integrity records. All27 prior exact guards remain (two follow the new Astro owner); one new exact Astro→cache4.2.0 guard prevents automatic selection of unproven4.3.0. Regeneration also propagates three existing-parent patch edges: starlight→mdast-util-directive3.1.1 (with to-markdown2.2.0), Svelte Vite plugin→magic-string1.2.3, p-queue→p-timeout7.0.2. All are in the package-manager-produced reviewed delta and full compatibility tests. No manual lock editing. See graph-delta.json.

## Actual proof

The7.3.3 generator still trusts persistent remote expiry/revalidation and stale fallback. Port the same local-image-only cache restriction. Existing cache/yaml patch bytes are unchanged; old Astro patch is retained as history and only the7.3.3 patch is active. Actual installed source, installed lock and every audit parent resolve to one patched Astro instance/eight paths/three reachable cache links. The same-run cache proof passes62 positives, four official cache-policy counterexamples and six frozen missing/corrupt patch negatives; the official7.3.3 generator has15expected assertion failures and2positive controls. This is behavior proof, not a hash-only renewal.

New rendering tests cover dynamic script/style strings and arrays, trusted literals, all six transition animation string properties, and legitimate CSS functions/numeric times. Actual old7.2.10 yields8expected security failures/3controls; new7.3.3 passes all11. MDX publication fixtures now use the current configured unified().createMdxRenderer API instead of the removed internal factory. All publication assertions remain. An initial assertion wrongly demanded HTML encoding where style uses CSS encoding; the final assertion verifies both safe encodings and still rejects literal element breakout. Original failed logs remain locally.

Fresh full native:408pass/0fail/0skip. Astro:291files/0errors/0warnings (15retained hints); TypeScript, strict Swup/five-parent declarations, source/security Biome and peer checks pass. Both complete root and project builds, Pagefind, deployment artifacts and16-page locale audits pass. Each language has0formal posts, Pagefind indexes the2About pages, draft publication is unchanged. These are new runs, not historical397tests.

Raw npm audits remain to be collected on a clean new commit. The existing review deadline2026-10-20T12:22:05Z is still unchanged at this checkpoint. No PR/merge/deployment is claimed.

Public logs replace the local home prefix; original bytes remain in the private local control directory.

## Substantive decision and clean proof

Clean implementation77e2e4c independently passes the live gate at the actual clock, with raw prod/full each1high/exit1 and two VERIFIED_LOCAL_REPAIR identities, no unresolved/blocked. New sources and behaviors justify the actual2026-10-20T06:27:50Z decision through2026-10-27T06:27:50Z. Both current review records now contain that seven-day window and scope-bearing provenance. See clean-source-proof/ and review-decision.json. This changes no upstream CVE status or raw finding. Final renewed candidate and exact remote checks remain separate.

Actual project preview HTTP verifies73requests; the retained root artifact is served read-only for the same73checks. Edge desktop1462x839 confirms Chinese Home, English navigation and About; mobile390x844 confirms English About and a real Pagefind meteorology result linking to English About. Screenshots retain the actual current content. Initial mismatched-base404 was diagnostic only and is excluded from acceptance.

Final candidate adds two explicit ledger regressions: a clear synthetic npm audit cannot conceal affected Astro7.2.10, while7.3.3 is outside both new ranges. These extend the native total to410; final exact execution is recorded separately.

Final renewed implementation f5a3687ec48497869169da4c15e39ed2974246cf independently completes16checks, including410/410native per base, frozen/peers/all quality gates and both full build/Pagefind/artifact/locale chains. Its separate current-clock live collection also passes with the same two verified cache repairs and raw each1high/exit1. No test or prior run is reassigned to this head. The first native screenshot wrapper produced a scaled desktop canvas for the mobile viewport; the retained mobile image is replaced with a direct browser screenshot after confirming the real English Pagefind result at390x844 (encoded375x812). The original capture stays diagnostic in local history. This evidence-only follow-up changes no review input or deployed byte.
