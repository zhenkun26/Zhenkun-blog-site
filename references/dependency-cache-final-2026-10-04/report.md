# PUBLIC PRIVACY PROJECTION; original SHA256 90c0375f0d0a98069e932f53c5ecca10e3e6826ba0dc8ce8b622ed0067a81c18; local raw original retained.
# Cache final batch — stopped at lock graph drift

**BLOCKED; do not upload or integrate this experiment.** Source commit `d5acbda03883dd0a34c875cceb2c7981bf2ee9d4` from exact baseline `8f5e9488bb0fbd9b8255db2ed5773af4889ce69e`. Independent no-hardlinks checkout: `<local-home>/Documents/Codex/2026-10-03/task-6/zhenkun-cache-final`.

## Useful result

The actual Astro 7.2.10 generator bypasses response policy on fresh cache reuse and stale fallback after revalidation errors. The precise experiment restricts persistent cache reads/writes to local images. Remote images fetch current origin bytes and transform them during the build; errors and unsolicited 304 reject rather than publish prior cached bytes. Existing remote cache bytes are left untouched but no longer consumed through this entry. Local image cache remains usable.

Real installed generator tests: **14/14 PASS**. The same assertions, loading official unmodified generator source at the real module URL, give **13 expected failures / one local-cache control PASS**. Cases cover seven restrictive response combinations (no-store/private/no-cache/must-revalidate/s-maxage/set-cookie/vary-*), old unexpired entries, stale validators, network/304/404/500/503 failure, fresh output and no remote writes. These use synthetic fetch and a byte-observable transform, not real HTTP or native image decoding. Evidence is diagnostic because the lock graph was rejected immediately after these probes. New test formatting and complete quality acceptance were not run after the stop.

## Exact stop

Official pnpm 11.22.0 `patch-commit` with per-command ignore-scripts generated the exact patch registration **and unrelated graph changes**. After removing only the exact Astro patch suffix for comparison, package records grow **895→899**, snapshots **898→902**. New packages: `@ctrl/tinycolor@4.2.1`, `mdast-util-to-markdown@2.1.3`, `micromark-util-types@2.0.3`, `source-map-js@1.2.2`. Six existing parent dependency edges also change; full details are in [graph-stop.json](graph-stop.json) and [rejected-lock.diff](rejected-lock.diff). Existing package records were neither removed nor changed. Drift cause is not established by this turn; re-resolution is observed, not independently instrumented.

The rejected generated lock is committed **solely for reproducibility**. It is not an accepted dependency update. No hand-edited lock, extra override, alternate store, registry/security setting change or further resolver retry was attempted after discovering drift. Per explicit instruction, implementation stopped. Lifecycle scripts were disabled for these install/patch commands. The patch-commit log reports a deprecated glob warning and the resolver/install counts; it does not report an allowBuilds mismatch.

## Gate and remaining work

Fresh baseline official frozen install and cache/security suite **100/100** passed with reviewed escalation after sandbox store-access failures. Both failures and successful logs are retained. An unsupported `--ignore-scripts` argument for patch-commit failed before mutation; its supported per-command config spelling was then used.

Strict patch-aware security classification is only specified in ADR and **NOT IMPLEMENTED**. Existing security collector/policy/workflow are unchanged and cannot accept the extra Astro patch registration. No fresh audit, final native/check/types/build/Pagefind/HTTP/browser matrix, Linux, upload, merge or deployment was executed for this experiment. Parent reports browser tools now work; new-candidate GUI is NOT_RUN. No old native302/security55/Linux186 is claimed for the experiment.

The cache lock has one immediate declared parent: Astro7.2.10→http-cache-semantics4.2.0. The physical links found share approved cache source SHA256 `55eefdf582537830c28f1a17d02c9b476ac3a820cc2eb0211ffb57d163f71c89`; one old Astro physical directory remains after patch installation and is not treated as a newly reachable lock instance. Complete security-instance acceptance remains unfinished.

Official web read on 2026-10-04: [GitHub GHSA-ch52-4w7c-c8xp](https://github.com/advisories/GHSA-ch52-4w7c-c8xp) still lists affected <=4.2.0 and no patched version; [VulnCheck CVE-2026-93750](https://www.vulncheck.com/advisories/http-cache-semantics-through-4.2.0-cross-client-cache-disclosure-via-vary-wildcard) separately lists <=4.2.0/high. These observations do not replace raw live audits, refresh the entire ledger or imply CVE withdrawal.

## Protection and next action

R4 remains `8f5e9488bb0fbd9b8255db2ed5773af4889ce69e`; original source remains `b6c3e39b2bf7ea73ec60234dc42f8240e0e8695f`; both tracked/index states are clean. Original .workbuddy retained with end-state aggregate in receipt; there was no initial aggregate capture, so byte-for-byte before/after proof is not claimed. No command wrote to other repositories. Only the isolated experiment is changed.

Coordinator must review unexpected graph drift and resolve scope before a package-manager-generated baseline-preserving correction. Then finish strict evidence-aware security classification and one final local matrix; seal a new candidate for independent review and the separately authorized Standard Sol Linux/browser task. **Do not upload this rejected lock to PR22.**

[Machine receipt and exact hashes](receipt.json). The blocked-source commit and later documentation/evidence commit are deliberately separate.
