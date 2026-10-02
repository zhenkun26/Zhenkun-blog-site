# Owner-data cleanup acceptance

Snapshot: 2026-10-01, America/New_York. This completes the local author-cleanup scope begun before P1, under the owner's exact two-image/tool-cleanup exceptions. It is not deployed-host acceptance and does not authorize remote delivery.

The twelve pre-existing source edits clear upstream personal account/contact/payment/example values while retaining configuration shapes, components, friend/book slots and provenance. The hero renders only its configured RSS link; empty links are hidden. Video is disabled and has no active entry. Four sponsor method slots remain disabled and empty, and the donor list is empty. No replacement personal records, endpoints, statistics or payment details were invented.

Only `public/assets/images/sponsor/alipay.png` and `public/assets/images/sponsor/wechat.png` were deleted. [The removal record](payment-asset-removal.json) retains before hashes and sizes. Normal generation removed exactly the two corresponding LQIP keys (25 → 23); all other values are unchanged. Original owner imagery, the launch draft, dependency declarations/lock and license/provenance remain intact.

Validation covers the composed final P0/P1 working tree: fresh full `pnpm check` (255 files, 0 diagnostic errors/warnings/hints), `pnpm type-check`, complete `pnpm build` under `/` and `/Zhenkun-blog-site/`, independently inspected static output, direct preview HTTP requests and inspected 1280×720/390×844 production captures. Root evidence is [artifact-root.json](artifact-root.json), [http-root.json](http-root.json) and [browser-observations.json](browser-observations.json); the corresponding subpath evidence is retained alongside it. The two payment URLs return 404 under both bases. Scanned public text contains no sampled upstream personal/encoded-email markers. No source files besides the exact approved images were deleted.

This is scoped owner-data removal, not acceptance of all site behavior. Known global metadata/path, RSS-date, disabled-route, search/menu and first-public-article/comment issues remain separate packets. Framework/author/license attribution remains intentionally intact. Prior Git history remains recoverable; no history rewrite or deletion of a repository was performed.

ROADMAP alone tracks delivery state. Source changes and the image/LQIP cleanup belong to P0; shared publication/Wiki contracts and the local build-runner choice belong to P1. The Wiki header-email and RSS site-fallback are the two overlapping files; stage those original cleanup hunks separately from P1 implementation.
