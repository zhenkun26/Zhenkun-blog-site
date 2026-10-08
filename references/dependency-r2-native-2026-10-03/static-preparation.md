# R2 static preparation — not implemented or tested

The dependency candidate remains byte-identical to reviewed base `d12dd98abf383d4c47bf9bf987516b953baf2904` (application/test source `90704e36768c2dc64ea80b30a364dcd46e2752f2`). A specifically permitted Sharp query succeeded after its original failure; subsequent ordinary Undici/Miniflare queries failed before lock generation or installation. These are planned acceptance requirements, not executed runtime checks.

## Authorized target and lock review

Keep root `sharp: ^0.35.4`, Astro 7.2.10, the full Cloudflare/workerd/framework combination, Node 24.20.0, pnpm 11.22.0, `allowBuilds` and all six existing overrides unchanged. Add only:

```yaml
  "miniflare@5.20260828.0-alpha>sharp": "0.35.5"
  "miniflare@5.20260828.0-alpha>undici": "7.29.1"
```

Once the same official query is permitted, verify the actual published targets, parent declarations and all platform metadata first. Generate the lock using pnpm, then a natural targeted Sharp update preserving the declared range (`--no-save`); never edit lock resolutions or integrity by hand. Review every package record, importer, snapshot, peer context and optional flag before frozen installation. Expected differences are the target Sharp/native/libvips closure, Miniflare Undici 7 patch and explained deduplication. Extra major versions, unrelated versions or unexplained changes stop this packet for Astra high review.

The supplied target decision is Sharp 0.35.5, libvips 8.18.7, librsvg 2.63.2 and sharp-libvips 1.3.4. The successful query confirms Sharp version, libvips minimum and the 25 optional target versions. Individual child metadata, actual libvips/librsvg and native installation still require proof. Compare the entire platform optional set, including Linux glibc/musl, macOS, Windows and WASM packages. Keeping a WASM optional lock record must never make a native runtime failure pass. Linux x64 requires glibc >=2.28. The official [Sharp installation documentation](https://sharp.pixelplumbing.com/install/) was read before the query failed; it is platform guidance, not target installation evidence.

## Native test implementation after unblocking

Add `scripts/zhenkun-test-r2-native.mjs` only with the actual candidate. Existing Ubuntu workflow already invokes `node --test scripts/zhenkun-test-*.mjs`; the new file must be selected without a CI edit, skipped test or fallback success. The file is not added in this blocked packet, which would otherwise introduce target assertions against an unchanged dependency tree.

Resolve Sharp separately from the root, actual Astro entrypoint and actual Miniflare entrypoint obtained through existing Wrangler and Cloudflare Vite-plugin parents. Resolve Undici through actual Miniflare; separately prove Unifont still resolves its guarded 8.10.2. Do not add a direct Miniflare or Undici dependency. Save real resolved paths, manifests, versions, native `.node` module identity and SHA256; assert the supported platform native binary is loaded. Assert target `sharp.versions`, including vips/rsvg. Generate small asymmetric PNG/JPEG buffers and a harmless self-contained SVG in memory; each parent must decode, resize and rotate them, produce PNG/WebP, and verify dimensions/format and deterministic content where applicable. No exploit payloads or external SVG resources.

Construct only a local Miniflare using its public supported options conversion if needed; `cf:false`, telemetry disabled, ephemeral loopback ports, no persistence, no remote proxy, account, credential or production binding. `CF_WORKERS` must be absent, never the string `false`. Use one owned loopback origin with fixed image, echo, redirect and bounded streaming fixtures. Deny arbitrary origin inputs. No independent `undici.fetch` call can stand in for the parent API.

Exercise direct `getImagesBinding("IMAGES")`: `info` for bitmap and SVG, `input(stream).transform(...).output({format})`, output response type/header/dimensions and a bounded unsupported-output error. Worker routes must use real `fetch(originImage, {cf:{image:...}})` to verify PNG/WebP transforms, JSON original/output metadata, transform error, SVG rejection and success/error headers. Installed Miniflare source proves SVG metadata is parsed before SVG rejection; do not claim that rejection makes librsvg unreachable.

Exercise actual `dispatchFetch` with method and custom headers, exact binary upload/download, chunked request/response streams, followed and manual redirects, cancellation during an active stream and a subsequent successful request. Assertions must prove bytes and recovery, not merely HTTP status. Drain/cancel response bodies, close fixture connections/timers, and dispose Miniflare in `finally`/test cleanup. Use in-memory fixtures where possible and document any owned temporary output and cleanup. If actual APIs differ, stop and report the specific mismatch before adapting the scope.

## Fresh verification and evidence

After the complete generated lock is accepted: official frozen install; new R2 test file and full native suite; formal isolatedDeclarations and strict Swup parent declarations; Astro; source and new-file Biome; full builds at `/` and `/Zhenkun-blog-site/` with CF_WORKERS absent; preserve each build immediately, verify Pagefind/artifact contracts and local HTTP bytes. Preserve exact commands, exits, source hashes, image receipts and actual native/API results. Current Mac checks cannot establish Linux PASS. Linux stays NOT_RUN until a separately reviewed exact R2 candidate runs there.

Run fresh prod/full audits and reevaluate the retained 36-GHSA ledger against the actual graph. Do not substitute a zero audit count for official sharp advisory closure. Cache without a published fix, the inherited peer FAIL and GUI BLOCKED remain open. Review the two new overrides by 2026-10-17, earlier on parent/advisory changes; neither date nor a new parent release automatically removes a guard.

Before local source/evidence commits, recheck original `b6c3e39`, protected R1 `955c78b` and phase0 `96b7b89`, plus private .workbuddy hashes and tracked/index cleanliness. Stop writing for independent review. No push, PR update, merge, deployment, R4 CI gate or bilingual work belongs to this task.
