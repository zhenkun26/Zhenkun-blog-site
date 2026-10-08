# PUBLIC PRIVACY PROJECTION; original SHA256 9c4c777c5d07a469ddd4d7c00e0c29c4887e37cd65fa36728fd7cabebabaaa58; local raw original retained.
# Pending bounded execution confirmation — not an approval

Working directory: `<local-home>/Documents/Codex/2026-10-03/task-4/zhenkun-r2`.
Only the earlier exact Sharp metadata query has received a direct human-approved escalated retry. Its exit was 0. The subsequent ordinary-sandbox Undici and Miniflare queries exited 1 with `ERR_PNPM_META_FETCH_FAIL`. No lock generation or install has run. Do not treat this document as permission or switch registry, cache/store paths or security settings.

## Proposed minimum network/install permission scope

1. Official read-only package queries listed verbatim in `pending-official-queries.json`: Undici 7.29.1, the unchanged exact Miniflare parent, and the complete 25 platform optional targets declared by the successfully fetched Sharp 0.35.5 metadata. Each query uses `pnpm view <exact-name@version> --json --registry=https://registry.npmjs.org`. The runner should bound each child lifetime and stop on any substantive failure; it must not repeatedly retry a failed endpoint.
2. Only after metadata/closure acceptance, edit the two already authorized workspace overrides and run these two package-manager lock operations:

```text
pnpm install --lockfile-only --ignore-scripts --registry=https://registry.npmjs.org
pnpm update sharp@0.35.5 --no-save --lockfile-only --ignore-scripts --registry=https://registry.npmjs.org
```

Review the entire generated lock before proceeding. No handwritten lock resolution, framework/workerd upgrade or unrelated drift is accepted. Keep package.json ranges, all six existing guards, Node/pnpm and allowBuilds unchanged.

3. Only after closure acceptance, install the candidate in this fresh isolated checkout:

```text
pnpm install --frozen-lockfile --registry=https://registry.npmjs.org
```

The root preinstall is `npx only-allow pnpm`. Existing allowed official lifecycle scripts are esbuild `node install.js` and workerd `node install.js`; both are already authorized by allowBuilds, which must not change. Successfully fetched Sharp 0.35.5 metadata declares no install/postinstall hook. Inspect all target metadata/lock scripts before running; any new hook or unknown child-download origin stops for review. Use the official registry for command-scoped npm/npx access as well, without changing global configuration. No dependency added to the root manifest.

4. Fresh read-only prod/full audit calls send this public dependency graph to the same official npm audit endpoint:

```text
pnpm audit --prod --json --registry=https://registry.npmjs.org
pnpm audit --json --registry=https://registry.npmjs.org
```

If fresh known-advisory retrieval needs the same permission, limit it to public read-only `https://api.github.com/advisories/<known-GHSA>` endpoints for the existing 36-entry ledger and the already identified Sharp/Undici/cache findings. No GitHub write, PR, push, workflow, permission, account or credential mutation is included.

## Resource effects and limits

Read-only queries write captured public metadata/diagnostics under the dated references directory and may write package-manager metadata caches. Lock commands write only the candidate workspace lock/configuration and normal package-manager caches. Frozen install creates this checkout's node_modules and uses the existing default pnpm store `<local-home>/.local/share/pnpm/store/v11`; no alternate store/cache directory is proposed. Cache location is whatever the existing pnpm runtime uses; it is not changed. Network is official npm metadata/tarballs/audit and, if separately included, public GitHub advisory GETs. Downloaded target package integrity must match published metadata.

No system, network-security, registry, permission, credential, Node/pnpm pin or allowBuilds setting changes. No modification of original `b6c3e39`, .workbuddy, protected R1 `955c78b` or phase0. No lifecycle scripts other than existing approved ones; no global installs. Standard Mac tests/builds and owned loopback/Miniflare cleanup are already in task scope and should first run in the ordinary sandbox. If runtime/loopback execution is separately denied, stop that gate and report it; this proposed package is not blanket runtime escalation permission. Linux remains NOT_RUN on this host. No remote writes or deployment.

Every escalated tool call still requires normal approval review. A rejection stops its gate; this scope cannot be used through another route or tool to evade it.
