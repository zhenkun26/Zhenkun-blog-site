# A/R3 rolldown correction — structural gate passed

Input candidate: `14a0d7ca87104d5afc702f1b7d118e1a7374fed3` (dependency source `e9d0b25`). Application baseline: `96b7b89` phase 0, tree-equivalent to published monolingual source. Same isolated checkout and branch; one writer. Actual runtime model cannot be attested by available tools.

## Cause and chosen correction

Vite 8.2.2 declares `rolldown ~1.2.4`. The original lock had both 1.2.4 (Vite) and 1.2.7 (old build-tool optional peer). The first Swup override regeneration selected 1.2.7 for both Vite 8.2.2 peer variants. The exact installed pnpm 11.22.0 source shows override-setting drift, construction of preferred versions from existing lock entries and highest-satisfying selection in a priority group. This source trace explains the observed re-resolution; it does not establish an unavoidable coupling or claim live resolver instrumentation. [Resolver excerpts/hash](resolver-source-evidence.json) and [Vite metadata](vite-parent-metadata.json) preserve the basis.

The approved correction adds only `vite@8.2.2>rolldown: 1.2.4` to the two existing Swup overrides. It narrows an already satisfied range to preserve the original runtime version. A global rolldown override, latest/patch acceptance, dependency addition, direct package change and handcrafted lock edit were rejected as unnecessary.

pnpm ran `install --lockfile-only --ignore-scripts --registry=https://registry.npmjs.org` with the existing Node 24.20.0 / pnpm 11.22.0 and exited 0. The package manager wrote the lock; no node_modules or scripts were created/run. [Command receipt](command-receipt.json), [log](lock-regeneration.log), [correction diff](correction-lock.diff) and [complete baseline diff](complete-lock.diff) are retained.

## Full graph verification

- All three Vite snapshots retain rolldown 1.2.4: Vite 8.2.1 and both Vite 8.2.2 @types/node variants. The old report's statement that 1.2.4 disappeared was false; it remained under Vite 8.2.1. Original report/manifest bytes are archived here and old raw logs/audits/diffs remain unchanged.
- Package records: 1350→925; 425 removed, zero added and zero changed existing records/integrities. Compared with the blocked 942-package candidate, 17 now-unreferenced rolldown 1.2.7/related records disappear. Every removed package was reachable from the old plugin-3 graph. The two Swup parents resolve plugin 4.0.0.
- Every surviving snapshot, dependency/optional dependency edge and root importer is compared. Only the three Swup nodes lose the exact obsolete peer suffixes/list from the removed build chain; the only surviving version-edge changes after that explicit normalization are the intended two Swup class edges. All other peer variants retain versions, and all refs resolve, including existing aliases.
- Six snapshots become optional: terser 5.50.0, @jridgewell/source-map 0.3.11, buffer-from 1.1.2, commander 2.20.3, source-map-support 0.5.21 and source-map 0.6.1. Full traversal from both production and development roots proves old required paths disappear while only optional paths remain. [Optionality proof](optionality-proof.json) includes concrete old/new paths. These are consequences of removing the old required chain, not new optional-dependency settings.

[Graph verification](graph-verification.json) is PASS_LOCK_SCOPE_ONLY. Two initial checker expectation failures (obsolete peer names and alias handling) are recorded there; they did not trigger package changes or count as PASS. The corrected check retains raw differences and precise normalization boundaries.

## Handoff and limits

The third override is a narrow protection exception approved by the coordinator. Review by 2026-10-17 or a separately authorized bundler update. Remove it only after package-manager regeneration preserves the approved graph without it, or a separately tested Vite/rolldown change replaces it. Changing the Vite version requires renewed review because the selector would stop matching. Do not drop the guard automatically on expiry or broaden it globally.

Sol Fast can continue from the correction commit with frozen installation and all existing A/R3 gates. It must independently confirm no lock mutation, peer equivalence, actual two-parent behavior (current production optional features are off), formal declarations, native suite, complete two-base builds/Pagefind, real browser behavior and fresh prod/full audit plus official union. The previous mdx peer warning is inherited but still requires acceptance; it is not declared passed here. The earlier 44-record audit is historical, not a new result for this lock. Cache has no verified published repair, and sharp remains unchanged; no overall security closure.

No frozen install, package lifecycle scripts, application tests, build, browser or PoC were run in this correction. No original-checkout edits, merge, push or deployment. Roll back configuration and generated lock together through a new commit if the candidate fails, preserving the diagnostic history.

Evidence formatting: the full staged whitespace check returned exit 2 solely for 1201 single-space context lines inside the two byte-exact raw diff artifacts. A scoped check excluding exactly those two raw diff files passed for every other staged file. Raw evidence was preserved unchanged; this is not a lock or application failure. The [handoff verification](handoff-verification.json) records both outcomes and original-checkout protection.
