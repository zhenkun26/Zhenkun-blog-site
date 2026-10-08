# Phase 0 advisory and version ledger

Machine-readable details, exact version instances, all immediate lockfile parent edges, original declared ranges, available audit root paths and exposure conditions are in [advisory-matrix.json](advisory-matrix.json). Source snapshots: [GitHub database](advisory-sources.json), [sharp maintainer advisory](additional-sources.json), [npm metadata](registry-sources.json). No row is closed by this planning increment.

Historical: 50 records / 32 GHSA. Fresh prod/full audit: 51 records / 33 GHSA / 10 packages, exit 1 (25 high / 19 moderate / 7 low). Reviewed union: 36 GHSA; 34 affect a locked version and 2 are candidate-only guards. The fresh audit omits the sharp maintainer advisory. No patch is available for the newly reported cache package as verified in phase 0.

| Package | GHSA / official severity | Affected locked versions | Decision / candidate | Trigger |
| --- | --- | --- | --- | --- |
| brace-expansion | [GHSA-6j4f-fj2g-mc7p](https://github.com/advisories/GHSA-6j4f-fj2g-mc7p) / high | 1.1.18, 2.1.4, 5.0.9 | 1.1.21, 2.1.7, 5.0.12 | brace-expansion: DoS via uncontrolled recursion in parseCommaParts causing stack exhaustion |
| brace-expansion | [GHSA-q2hr-2g5m-vwhr](https://github.com/advisories/GHSA-q2hr-2g5m-vwhr) / medium | 1.1.18, 2.1.4, 5.0.9 | 1.1.21, 2.1.7, 5.0.12 | brace-expansion: Quadratic-time expansion of the `{a},b}` rewrite causes CPU denial of service |
| brace-expansion | [GHSA-qhr7-859c-m2p7](https://github.com/advisories/GHSA-qhr7-859c-m2p7) / high | 1.1.18, 2.1.4, 5.0.9 | 1.1.21, 2.1.7, 5.0.12 | brace-expansion: DoS via uncontrolled recursion on nested brace groups causing stack exhaustion |
| colord | [GHSA-2wm5-q62r-hmrv](https://github.com/advisories/GHSA-2wm5-q62r-hmrv) / medium | 2.9.3 | 2.9.4 | Colord: Slow rejection of oversized malformed color strings |
| devalue | [GHSA-4q55-j62x-fr9h](https://github.com/advisories/GHSA-4q55-j62x-fr9h) / medium | 5.9.2 | 5.9.3 | devalue: Malformed null-prototype object keys bypass __proto__ rejection via property-key coercion |
| devalue | [GHSA-hx4r-w6wj-j8fg](https://github.com/advisories/GHSA-hx4r-w6wj-j8fg) / medium | 5.9.2 | 5.9.3 | devalue: Residual sparse-array CPU amplification in uneval |
| devalue | [GHSA-j22f-vq7h-c4qm](https://github.com/advisories/GHSA-j22f-vq7h-c4qm) / high | 5.9.2 | 5.9.3 | devalue: `stringify`/`uneval` serialize shared memory |
| devalue | [GHSA-mcm9-63f2-9j32](https://github.com/advisories/GHSA-mcm9-63f2-9j32) / high | 5.9.2 | 5.9.3 | devalue: Repeated primitive strings cause quadratic expansion in uneval |
| devalue | [GHSA-wf3x-273g-mvxv](https://github.com/advisories/GHSA-wf3x-273g-mvxv) / low | 5.9.2 | 5.9.3 | devalue: Sparse arrays emitted by uneval cause eager allocation when evaluated |
| devalue | [GHSA-x5rw-q4pp-hg5g](https://github.com/advisories/GHSA-x5rw-q4pp-hg5g) / high | 5.9.2 | 5.9.3 | devalue: stringifyAsync can cause an unhandled rejection despite a caught returned promise |
| fast-uri | [GHSA-5jgf-p345-68v8](https://github.com/advisories/GHSA-5jgf-p345-68v8) / high | 3.1.5 | 3.1.8 | fast-uri vulnerable to host confusion via skipped IDN canonicalization on scheme-relative references |
| fast-uri | [GHSA-f65p-4m7j-42xc](https://github.com/advisories/GHSA-f65p-4m7j-42xc) / high | 3.1.5 | 3.1.8 | fast-uri vulnerable to server-side request forgery via malformed IPv6 normalization |
| fast-uri | [GHSA-fph4-wmhf-6fwf](https://github.com/advisories/GHSA-fph4-wmhf-6fwf) / high | 3.1.5 | 3.1.8 | fast-uri vulnerable to server-side request forgery via repeated hostname percent-decoding |
| fast-uri | [GHSA-hrr3-gc8f-f4qj](https://github.com/advisories/GHSA-hrr3-gc8f-f4qj) / medium | 3.1.5 | 3.1.8 | fast-uri vulnerable to inconsistent host case normalization via percent-encoded octets |
| fast-uri | [GHSA-jqff-g426-hqxp](https://github.com/advisories/GHSA-jqff-g426-hqxp) / high | 3.1.5 | 3.1.8 | fast-uri vulnerable to host confusion via percent-encoded scheme normalization |
| fast-uri | [GHSA-qw65-cvwx-89v3](https://github.com/advisories/GHSA-qw65-cvwx-89v3) / high | 3.1.5 | 3.1.8 | fast-uri vulnerable to authority injection via an unvalidated port in serialize |
| http-cache-semantics | [GHSA-ch52-4w7c-c8xp](https://github.com/advisories/GHSA-ch52-4w7c-c8xp) / high | 4.2.0 | BLOCKED: 4.2.1 unverified/unpublished | http-cache-semantics max-stale handling can disclose cross-user cached responses |
| js-yaml | [GHSA-2883-xcg3-v3hh](https://github.com/advisories/GHSA-2883-xcg3-v3hh) / high | 3.15.1 | 3.15.2, 4.3.2 | js-yaml: maxTotalMergeKeys does not limit CPU use for empty merge sources |
| serialize-javascript | [GHSA-5c6j-r48x-rmvq](https://github.com/advisories/GHSA-5c6j-r48x-rmvq) / high | 4.0.0 | Remove old chain; 7.0.5 fallback only | Serialize JavaScript is Vulnerable to RCE via RegExp.flags and Date.prototype.toISOString() |
| serialize-javascript | [GHSA-gfhx-hw2g-v5hg](https://github.com/advisories/GHSA-gfhx-hw2g-v5hg) / low | None | Remove old chain; 7.0.5 fallback only | Serialize JavaScript: Cross-site scripting (XSS) via unescaped </script> in serialized function bodies |
| serialize-javascript | [GHSA-qj8w-gfj5-8c6v](https://github.com/advisories/GHSA-qj8w-gfj5-8c6v) / medium | None | Remove old chain; 7.0.5 fallback only | Serialize JavaScript has CPU Exhaustion Denial of Service via crafted array-like objects |
| sharp | [GHSA-rgj7-g3m4-5g8c](https://github.com/advisories/GHSA-rgj7-g3m4-5g8c) / high | 0.35.2 | 0.35.5 | sharp: Vulnerabilities in libheif: GHSA-g89c-p67h-r497 and GHSA-2jg2-4ch7-h545 |
| sharp | [GHSA-wq5f-xc86-pv6w](https://github.com/lovell/sharp/security/advisories/GHSA-wq5f-xc86-pv6w) / high | 0.35.2, 0.35.4 | 0.35.5 | Vulnerability in librsvg dependency CVE-2026-96889 |
| svgo | [GHSA-4vpr-x523-8j87](https://github.com/advisories/GHSA-4vpr-x523-8j87) / medium | 2.8.3, 4.0.2 | 2.8.4, 4.1.0 | SVGO: removeScripts incompletely sanitizes executable HTML in SVG foreignObject elements |
| svgo | [GHSA-w27v-7q3p-w38r](https://github.com/advisories/GHSA-w27v-7q3p-w38r) / high | 2.8.3, 4.0.2 | 2.8.4, 4.1.0 | SVGO: removeScripts allows executable links through namespace and control-character bypasses |
| undici | [GHSA-2gqq-gqf2-x968](https://github.com/advisories/GHSA-2gqq-gqf2-x968) / low | 7.29.0, 8.10.1 | 7.29.1, 8.10.2 | undici vulnerable to response truncation via oversized chunked responses in the dump interceptor |
| undici | [GHSA-2jfj-6hjv-fm6j](https://github.com/advisories/GHSA-2jfj-6hjv-fm6j) / medium | 7.29.0, 8.10.1 | 7.29.1, 8.10.2 | undici vulnerable to cross-user cookie disclosure via Set-Cookie caching in shared caches |
| undici | [GHSA-3wwx-pv8p-q78v](https://github.com/advisories/GHSA-3wwx-pv8p-q78v) / medium | 7.29.0, 8.10.1 | 7.29.1, 8.10.2 | undici vulnerable to Denial of Service via unhandled error in WebSocket permessage-deflate decompression |
| undici | [GHSA-3xpg-4rpp-hhhm](https://github.com/advisories/GHSA-3xpg-4rpp-hhhm) / medium | 7.29.0, 8.10.1 | 7.29.1, 8.10.2 | undici vulnerable to Denial of Service via unbounded decompression of compressed responses |
| undici | [GHSA-8436-99hf-9mmv](https://github.com/advisories/GHSA-8436-99hf-9mmv) / low | 7.29.0, 8.10.1 | 7.29.1, 8.10.2 | undici vulnerable to caching and replay of unsafe HTTP method responses |
| undici | [GHSA-pmjh-fq2x-6v4x](https://github.com/advisories/GHSA-pmjh-fq2x-6v4x) / medium | 7.29.0, 8.10.1 | 7.29.1, 8.10.2 | undici vulnerable to Denial of Service via orphaned RetryHandler response body |
| undici | [GHSA-r53p-7pc4-xj5r](https://github.com/advisories/GHSA-r53p-7pc4-xj5r) / low | 7.29.0, 8.10.1 | 7.29.1, 8.10.2 | undici vulnerable to downstream response splitting via retry interceptor |
| undici | [GHSA-rfgv-xxqx-mfg5](https://github.com/advisories/GHSA-rfgv-xxqx-mfg5) / high | 7.29.0, 8.10.1 | 7.29.1, 8.10.2 | undici vulnerable to Denial of Service via unrequested WebSocket subprotocol |
| undici | [GHSA-rx4f-c7p8-82vq](https://github.com/advisories/GHSA-rx4f-c7p8-82vq) / medium | 7.29.0, 8.10.1 | 7.29.1, 8.10.2 | undici vulnerable to Denial of Service via WebSocketStream unclean close |
| undici | [GHSA-vp8m-p9jh-q5pm](https://github.com/advisories/GHSA-vp8m-p9jh-q5pm) / high | 8.10.1 | 7.29.1, 8.10.2 | undici vulnerable to cross-origin cache poisoning via missing origin isolation in interceptors |
| undici | [GHSA-w293-vg96-wgc3](https://github.com/advisories/GHSA-w293-vg96-wgc3) / high | 7.29.0, 8.10.1 | 7.29.1, 8.10.2 | undici vulnerable to TLS certificate validation bypass via dropped connect options in BalancedPool |

## Evidence interpretation

`OPEN_AFFECTED_VERSION` means a lockfile match, not an established visitor exploit. `BLOCKED_NO_VERIFIED_PUBLISHED_FIX` is neither PASS nor a waiver. Candidate guards prevent a proposed upgrade from introducing a known affected range. GitHub uses `medium`; pnpm uses `moderate`. Severity counts refer to records, not unique IDs or path counts.

See [exposure and compatibility decisions](phase0-review.md) and the [implementation packets](../../docs/DEPENDENCY_REMEDIATION_PLAN.md#phase0-packets).
