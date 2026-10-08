# S1 official-source and deployment-boundary review

Source inputs are retained security candidate `563431d97338ee5c9e0e95784df869ae4d6f829c` and deployed main `f33ff92aaf8d03602202caf46da48f40f5676273`. The normal merge preserves both histories. Only ROADMAP and ERROR_MEMORY conflict; independent records are retained and the current checkpoint gives the actual delivery state.

All 38 bounded official GETs succeeded. The 36 GHSA records preserve severity, affected ranges, aliases and withdrawal state. The two cache primary records and latest metadata preserve their exact policy projection hashes. The official upstream 4.3.0 tarball passes its recorded SHA512 integrity and its complete index.js remains `ede1cc404a492fa348eb9d97a3007a0d72aa717bd22cd86a56bd0824c19729ca`. See [raw records and receipt](official/review.json).

This fresh source comparison retains the prior bounded patch decision. It does not assert a new independent review or an audit of all future disclosures. Existing exact cache and Astro entry patches, installed versions, dependency declarations and lock bytes remain unchanged. Both windows begin at `2026-10-07T14:27:22Z` and expire at `2026-10-14T14:27:22Z`; new advisory, primary, graph, exposure or source changes invalidate the proof sooner.

The deployed main diff changes four application files: Announcement's banner variant, its approved construction text, sidebars disabling duplicate notices, and homepage page-one insertion. No image optimization input, credential, article, author field, service or language route is added. The new application boundary is `995950540a337e65e078c6b0d2ed8a52a8205c43e243d400010aea1e96e14aa0`. Runtime regressions and exact installed-source/negative proof must still establish that this combined source satisfies the retained repair.

Renewing the policy exposed a fixed October 3 synthetic test clock. Synthetic positive fixtures now derive an in-window clock from the policy's reviewedAt; expiration/before-window negatives remain. Actual security orchestration continues to use the real clock, and no exception or severity downgrade is introduced.
