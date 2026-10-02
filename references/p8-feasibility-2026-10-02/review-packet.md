# Bounded P8 review packet

The requested review target is the final commit on `codex/p8-bilingual-feasibility` in `/Users/zhenkun/Documents/Codex/2026-10-02/task-4/tmp/p8-feasibility`, reported with its exact SHA by the implementation task. Canonical original is `04cbf0bfbf13ff8a17f0ba66ed2277526b6e5139`; its checkpoint changes only ROADMAP. The candidate descends from that checkpoint, with application source still identical to measured baseline `27e09c220e1ffe16817d5bf02e950a4fbf332b7b` / P4 source `a353c2ee800bbff2865541288ea04308c245cdc5`.

Scope: ADR-XB-014, architecture clarification, actual failure lessons and dated analysis/evidence. No production locale route, schema, owner translation, dependency/lock/config, service, publication, remote or main change. The proposed canonical ROADMAP is byte-identical to the actual canonical checkpoint; it keeps P8 in progress pending independent review and G6 unchosen. P4 local acceptance is already separately recorded at `references/p4-local-acceptance-2026-10-02/local-acceptance.json`.

Assess the actual inventory method and limits, both realistic architecture options, recommendation assumptions and incremental delivery/tests. In particular, verify the source-global locale seam, current P2 hypothetical locale scope gap, actual Astro site-path joining, available-pair versus constructible URL, draft/private preservation, configuration-time plugin risk, HTML language selection versus ignored Pagefind language option, and fresh-context versus browser-transition evidence. P4 explicit-language wording is narrowed by this investigation; no historical evidence was rewritten.

Evidence entrypoints:

- `report.md`: measurements, manual triage and recovered failures.
- `inventory.json` / `inventory.mjs`: 419 keys, 510 calls/81 files, 146 occurrence candidates/30 files, exact paths/lines and parser diagnostics.
- `existing-contract-probe.json` / `.mjs`: actual existing function execution, in-memory seam restored.
- `astro-locale-fixture.json` / `.mjs` / `pagefind-fixture-worker.mjs`: raw incompatible site-path cases, successful synthetic origin/base cases, real emitted search initialization, absent translated file, all output hashes and closed server records.
- `production-snapshot.json`, `preservation.json`, `validation.json`, `evidence-sha256.json`: exact 491 unchanged application paths, all 27 config-folder files (25 TS plus README/HTML), protected 50 dirty files, .workbuddy/main/P4 evidence and draft boundaries.

Reproduction from this candidate, with existing dependencies only:

```sh
node references/p8-feasibility-2026-10-02/inventory.mjs
node --import tsx references/p8-feasibility-2026-10-02/existing-contract-probe.mjs
node references/p8-feasibility-2026-10-02/astro-locale-fixture.mjs
python3 references/p8-feasibility-2026-10-02/verify-delivery.py
```

The source-baseline guard works on a later docs-only review HEAD and stops on any application mismatch. The fixture builds four minimal five-page variants (two raw compatibility observations and two adapted dual-language bases), not the full production eight-stage pipeline. It writes only ignored temporary fixture/caches plus its dated logs/JSON, and temporary loopback HTTP needs the local execution permission in this environment. Worker language detection is a minimal seam without a real browser. The preservation auditor additionally depends on the named local protected checkout and canonical checkpoint remaining unchanged; a later intentional canonical commit requires a new review context, not relaxing the guard silently. Reproduction overwrites dated output logs/JSON; compare hashes first or use a separate review copy.

Stop after independent feasibility/ADR review. G6 must decide product details before implementation; any article publication, remote action or new service retains its separate boundary. Linux frozen/hosted/required checks, real article/comment, production release and browser bilingual behavior remain open.
