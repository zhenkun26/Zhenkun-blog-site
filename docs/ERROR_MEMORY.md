# 错误记忆

## 2026-10-01: Markdown-only preflight misread MDX code

- Error: The first publication-preflight implementation parsed both `.md` and `.mdx` as ordinary Markdown. A valid MDX export containing the literal string `"[[missing]]"` was treated as a Wiki reference and failed, although the site compiler treats it as code.
- Recovery: Use the installed native MDX renderer for `.mdx`, and the Markdown processor for `.md`. Controlled checks distinguish actual prose references from ESM/JSX/code strings; imports are compiled without execution and no fixture files are created.
- Prevention: Match the site's native syntax parser before treating a source diagnostic as a publication failure. Markdown transform checks do not establish MDX module resolution, optimized asset output or complete production rendering. Repeat affected checks after parser changes.

## 2026-10-01: Reference capture transition and viewport mismatch

- Error: A Swup URL changed before the new main content rendered, producing a blank/stale feed screenshot. A requested mobile viewport also left an existing second tab at 1280 × 720. These captures could not support the intended feed/mobile claims.
- Recovery: Inspected the actual page title/main content and measured innerWidth/innerHeight. Recaptured the stable feed and used a fresh mobile tab with verified 390 × 844 dimensions. Rejected captures remain marked accepted:false in references/comparison-2026-10-01/observations.json; they were not deleted or used in the report.
- Prevention: Accept a navigation capture only after expected content is present, not merely after waitForURL. Verify each captured tab's actual viewport. Tool/capture failures are separate from product defects; screenshots with the wrong step or dimensions cannot establish PASS.
- P1 follow-up: Readable DOM/title can precede completion of Swup or hero reveal opacity animations. Two initial production captures were retained as rejected diagnostics in `references/refactor-2026-10-01/browser-observations.json`; stable replacements verify relevant content and ancestor opacity as well as viewport. A DOM visibility check does not alone establish a readable screenshot.

## 2026-10-01: Configuration-probe shape assumption

- Error: A one-off cleanup acceptance probe used `booknavConfig.groups`, but the exported configuration is a `BooknavGroup[]`; the probe failed before producing its evidence.
- Recovery: Read the export and reran the probe using the array directly. The corrected probe passed and wrote `references/audit-2026-10-01/cleanup-config.json`; no application fix was needed.
- Prevention: Read the actual exported type before writing configuration probes. Record script failures separately from application defects, and do not use empty or failed evidence files as PASS.

## 2026-10-01: Review command context and audit endpoint recovery

- Error: `gh run list` initially selected the upstream Firefly repository, and `pnpm audit --prod` failed with `ERR_PNPM_AUDIT_ENDPOINT_NOT_EXISTS` at the configured npm mirror.
- Recovery: Discarded upstream runs from blog evidence and repeated GitHub reads with `--repo zhenkun26/Zhenkun-blog-site`. Repeated the dependency scan with an explicit `--registry=https://registry.npmjs.org` override; the completed scan reported advisories and is not a clean result. No registry configuration or dependencies changed.
- Prevention: Specify the intended repository on GitHub CLI review commands; record an unavailable advisory endpoint as BLOCKED and use a supported endpoint for the read-only scan. Inspect filesystem side effects before validation: this build chain empties/removes output files and cannot run under the current no-deletion instruction.

## 2026-09-06：主题扩散圆心在 HiDPI 环境中偏移

- 错误：之前把顶部中央扩散归因于事件代理，仅改用 getElementById 取按钮位置。线上脚本已包含该修复，但问题仍在。
- 证据：本次在 DPR=2 的内置 Chromium 中，DOM 按钮中心为 (550.75, 31.5)，计算样式中的 circle 圆心也是该坐标，截图的实际圆心却约为横坐标的一半。CSS circle(px) 和 polygon(px) 均出现偏移，换成百分比后圆心回到按钮。证据支持快照裁切像素缩放问题，不足以断言具体 Chromium 版本或 GPU 驱动缺陷。
- 修复：圆心与半径都转为相对视口的百分比，由 CSS 关键帧驱动快照；circle 百分比半径按视口对角线 / sqrt(2) 换算。组件通过 bind:this 取按钮；坐标不可用时直接切主题；等待 Svelte tick 后捕获新视图，过渡结束清理变量，期间忽略重入。
- 验证：check / type-check / build PASS；DPR=2 中间帧 `references/m4-theme-percent-light.png`。实体 Chrome 的控制台粘贴保护未绕过，后续 UI 操作多次被窗口变更中断；实体 Chrome/Edge 最终验收待完成。
- 预防：出现圆心漂移时同时核对 DOM 坐标、裁切计算值、动画截图；不能把内置浏览器通过写成实体浏览器通过。无效坐标不再兜底到屏幕中央。排查方案中 CSS px 与 polygon px 都未解决，应保留百分比而非仅换动画 API。
- 生产预览复核：`http://127.0.0.1:4322/`，最终 circle(%) 方案中间帧 PASS，截图 `references/m4-theme-percent-production.png`。实体 Edge 关于页点击切换成功，终态截图 `references/m4-theme-percent-edge.png`；原生截图取得时动画已结束，不能据此宣称实体 Edge 的动画起点已完成验收。预览保留供用户直接验证。
- 工具教训：构建的 tsx IPC 管道与预览监听需要沙箱外运行；首次受限失败后按权限流程重试。仅格式化修改过的组件，避免全仓 lint --write 扩大改动。


## 2026-10-02 — isolated verification environment

- Relocating installed pnpm 11 node_modules can trigger its default automatic install check and a global store registration outside the sandbox. This copy hit EPERM before the build. Set `pnpm_config_verify_deps_before_run=false` only for commands using the verified copied dependencies; no install/lock/dependency mutation follows. A copied dependency runtime does not prove a clean install.
- tsx IPC listen is disallowed by the restricted shell even in writable temp. Use a reviewed local execution exception for the unchanged check/build/preview pipeline; do not bypass build steps or weaken security settings to fake acceptance.
- Astro 7 preview can run as a background daemon. Ending the launcher/stdin is not server shutdown; the next invocation may silently reuse its old base. Use `astro preview stop` for this task's specific preview, then restart with the intended base and verify actual HTTP bytes. Only task-created preview processes are stopped.


## 2026-10-02 — logical route mistaken for a based asset

- P2's schema-utils reused public-asset prefix normalization for logical routes. With base `/about/`, author `/about/` collapsed to the deployment root; independent review and before.json confirmed the regression.
- Separate logical-route resolution (always prefix) from public/emitted asset handling. Audit callers: getCategoryUrl already supplies a based route and must resolve directly instead of entering the logical helper.
- Prevention: literal collision-base regressions plus actual built Person.url and category breadcrumb checks. A repeated route/base name is valid; do not infer malformed URLs from a repeated substring when an emitted artifact and route semantics establish correctness.

## 2026-10-02 — P3 request and UI lifecycle recovery

- Actual production baseline: two responsive keyword reactions let the inactive empty input cancel the first Pagefind query during initialization. A single query session now owns debounce and stale completion invalidation, including loader waits, clear/close and unmount.
- The first implementation cleared results on close but did not rerun an unchanged mobile keyword on reopen. Production browser acceptance caught it; the opening switch now reissues that keyword. Keep this regression alongside rapid edits, stale success/failure, loading-state ownership and disposed-session tests.
- Delegating accordion clicks fixed node-listener replacement but Swup reran the page script and accumulated document listeners. After repeated navigation one click left the accordion closed. Add a window-scoped initialization guard; execute the actual Astro script five times in a native VM regression and check one listener/one transition, then repeat real SPA visits.
- A fullscreen scrim locator's center was inside the drawer and selected Series. That capture is a diagnostic, not a scrim PASS. Use an observed uncovered scrim point and verify the URL did not change, focus returned and inert/scroll locks released.
- Mac terminal/browser transport disconnected after the initial build; no post-fix browser acceptance or commit was claimed. On reconnection inspect Git and task-server ports before resuming. The queued handoff-document write had not executed; do not assume uncertain operations succeeded. Local HTTP verification also hit sandbox EPERM and then passed through a reviewed local-only execution exception.

## 2026-10-02 — P3 controlled import verification

- Two blank lines in the imported menu guard contained trailing spaces, so source diff --check failed. Removed only that whitespace in a separate commit; preserved the dirty source and historical evidence. Final native/static/full builds passed, and all 55 subpath client JS files match the browser-tested build byte for byte. Raw measurement logs retain original whitespace and are excluded from source hygiene checks.
- Localized search titles and heading permalinks made exact English/title locators time out. Use observed result hrefs and the actual heading text. Delayed Pagefind requests caused an instrument deadline to expire, but a later DOM observation confirmed the correct first-query result without retyping; record both facts rather than treating the timeout as a product failure or omitting it.
- Immediately after an emulated viewport change, a locator click left both panel and focus unchanged. A fresh AX semantic button click opened the same panel. Input/hit-test/layout synchronization is an inference, not a proven state-machine defect; physical resize/orientation remains unverified. After theme switching, wait for html:not(.theme-revealing) before evaluating subsequent menu input.
- A Python stdin documentation update failed during parsing because of terminal encoding; no write executed. Recovered with apply_patch and explicit UTF-8 file I/O with ASCII script text. Recheck the saved bytes and intended diff; never infer a document write succeeded from an attempted command.

## 2026-10-02 — P2.5 bounded CI verification

- Full-source Biome reported 15 errors across 298 checked files, including existing Astro import-order diagnostics. The shell wrapper also used zsh's read-only `status` variable and failed; the raw tool log still establishes the reported lint failure. Preserve the baseline, use task-specific variable names or `set -e`, and never equate targeted script PASS with a clean repository.
- The first Pagefind checker fixture and code both assumed `<hash>.pf_meta`. Running against the real retained production artifact caught the missing `pagefind.` prefix; corrected code and fixture to `pagefind.<hash>.pf_meta`, then all 147 regressions and the real artifact check passed. A fixture matching an implementation mistake is insufficient evidence; check an actual emitted file before accepting the contract. A follow-up formatting check caught one line wrap after the correction; only the two new scripts were formatted and rechecked.
- P2.5 deliberately used direct existing binaries, not pnpm, and did not retry the reviewer's denied dependency-setup action or the earlier relocation workaround above. Local YAML and `bash -n` checks do not execute GitHub Actions, install frozen dependencies, or rebuild a Linux artifact. Preserve those limits until the appropriate independent review and approved execution.

## 2026-10-02 — formatting evidence must ignore printer trivia precisely

- The first repair semantic audit expected TypeScript transpilation to erase multiline-array formatting; its printer retained the original line breaks and optional trailing comma, so emitted JavaScript strings differed despite identical values. The audit stopped before staging/committing source.
- Replaced that invalid byte-equality expectation with full parsed AST equality, including every property name, literal and array order, excluding source positions/trailing-comma trivia. All 14 Astro frontmatters separately preserve import token multisets, non-import statement tokens/order and exact template/script/style bytes. Preserve this distinction: AST/source invariants are verified; emitted production byte equality was not measured and must not be claimed.

## 2026-10-02 — Zhenkun identity verification and preview cleanup

- The first complete deployment-base build failed at Astro's local listener with sandbox EPERM after three generators passed. The exact same eight declared stages then passed through a reviewed local-only exception, using existing binaries and the tsx import loader. Keep both logs; this establishes the declared stage execution on Mac, not literal pnpm, clean Linux or hosted Actions execution.
- A generic old-name probe initially flagged the intentionally retained visible `zhenkun26.github.io/Zhenkun-blog-site` site URL. Exempt only that exact approved URL text while retaining strict title/navbar/author/meta/schema checks; do not globally remove Zhenkun or rename repository/domain paths. Current public output has zero articles, so the unchanged article OG renderer's config consumption is source evidence, not a rendered real article image.
- CUA tab creation rejected an unsupported visibility option before creating a tab; retry used the documented creation input. Browser DOM evaluation did not expose `navigator`; recovered with DOM-only observations and left browser version unqueried. Desktop/mobile screenshots and fresh title/content/viewport assertions passed; reset emulation and close only the task-created tab.
- Astro preview stop/status reported no server while the task PID 58064 still listened on 127.0.0.1:4342. Verified its exact preview command and port, then used guarded SIGTERM on that one task-created PID and confirmed the port was clear. A CLI status alone does not prove cleanup; do not terminate unrelated processes.

## 2026-10-02 — P4 endpoint and successor verification

- The dynamic page/sidebar/comment route were disabled, but the actual JSON GET still read and rendered local dynamic content. An in-memory sentinel and a source that throws if read reproduced 2/4 regression failures. Guard the real GET with the existing resolved page flag before processor/collection work; preserve enabled Markdown/schema/ordering and valid empty collections. An empty real collection alone cannot prove suppression.
- The original P4 artifact audit incorrectly expected Pagefind's stored fragment URL to include the deployment base. The actual subpath index stores `/about/`; Pagefind derives result URLs from the loaded bundle path. Preserve `artifact-audit-subpath.log` as FAIL and the original 17 evidence files unchanged. Add `artifact-audit-v2.py` to distinguish raw index URL and resolved route; exercise the actual emitted module/index/WASM over local HTTP with explicit basePath in Node. This verifies result resolution, not browser UI/default import behavior. No source change or full rebuild was needed.
- Local exec transport temporarily disconnected during a read; recovery returned the same source HEAD and no preview listener. Check fresh Git/ports before continuing and do not treat attempted reads/writes as completed actions.
- The checkpoint guard tried Git `ls-tree` with an unsupported exclude pathspec and stopped before writing. Filter the exact `ls-tree` lines by pathname, then rerun all HEAD/clean-tree/protection guards before the documentation-only commit. Original received ROADMAP only; candidate synchronized that local checkpoint without accepting P4 source into original.

## 2026-10-02 — P8 installed-version and fixture assumptions

- The installed Astro compiler is compiler-rs, and its actual CLI is `astro/bin/astro.mjs`; guessed legacy package/CLI names failed. Discover existing package entrypoints rather than installing replacements. Shell unmatched globs also failed before useful reads; use known discovered paths and bounded output for minified dependencies.
- A minimal Astro fixture inherited the shared symlinked dependency Vite cache and hit sandbox EPERM on cache unlink. Dedicated local fixture Vite/Astro caches recovered without touching protected dependency files. Loopback HTTP listen separately needed the reviewed, authorized local-only execution exception; this was not dependency setup or a retry of denied pnpm installation.
- Astro 7.2.10 locale absolute URL helpers join configured site path with an already-based route. The existing `/Zhenkun-blog-site/` site URL made root canonical retain that path and subpath canonical duplicate it. Retained raw HTML/logs; origin-only synthetic config then passed both bases. A locale helper does not validate translation existence and cannot blindly replace the established P2 logical/public URL contract.
- Pagefind 1.5.2 public createInstance overrides a language option with detectLanguage. No-document English option selected the larger Chinese index; changing languages in one Node module/WASM context then yielded zero English results. Retain those failed expectations; successful fresh Workers use minimal HTML-lang detection seams and real emitted JS/index/WASM over HTTP. Do not call this a browser locale-transition defect or browser acceptance. Historical P4 single-language URL evidence remains intact, but its explicit-language wording cannot establish forced locale selection.
- A review-reproducible source guard initially used default-buffer git show for each asset and hit ENOBUFS on a public texture. Batch Git tree blob/mode comparison plus on-disk SHA256 checks avoids binary transport and proves all 491 source paths. The failure did not change source; final inventory/function logs were regenerated after the guard passed.


## 2026-10-02 — first bilingual shell measurements

- Static locale binding did not cover client-generated TOC empty labels: English Home became Chinese after initialization. Bind runtime controls to the actual document language and test real DOM after client setup, alongside native document-language regression. Rendered date, calendar/TOC labels and wallpaper alt fixes preserve config.
- Monolingual audits must identify exact permitted author/product/media names and language chooser elements. Original music work/artist metadata is retained only by exact values and matching metadata DOM; arbitrary Chinese controls still fail. Do not use broad Han or region exemptions.
- Imported audit CLI executed a file write using its caller's slash argument; add a main guard. CDP repeated top-level const declarations collide; scope each probe. Enter on native buttons needs the character event, not just key codes. Syntax/import/protocol probe failures are not product failures or PASS.
- Reusing the original P4 artifact script reintroduced its already-recorded raw Pagefind URL/base mistake. The subpath UI assertions passed before that audit failed. Use the retained v2 raw/resolved rule and complete only the affected HTTP audit; do not rebuild unchanged source or mark the failed combined harness PASS.
- Astro 7.2.10 agent detection auto-backgrounds preview, so terminating the CLI launcher left a worker. Identify exact PID/command/cwd, stop only the task worker, own foreground preview children and verify listener ports; CLI exit alone does not establish cleanup.


## 2026-10-02 — independent bilingual review corrections

- Normal-state browser/music checks missed the actual audio-error producer. A hardcoded Chinese fm:error message appeared in English; restored state held generic English text on Chinese pages. Localize the producer state and event together; exercise actual component config, full manager handler and actual view callback with media/fetch prohibited. Four regressions reproduce the failures across both locales/bases.
- Running tsc with --isolatedDeclarations false produced an empty log while the declared tsc --noEmit --isolatedDeclarations failed TS9007 on inferred exported returns. That earlier broad type-gate PASS was invalid. Read package.json, preserve exact flags, capture command/argv/source/exit, and declare public return types; never weaken the required gate.
- Full-source Biome did not check newly added verification scripts. Format/check those scripts explicitly and resolve remaining lint errors; scope the evidence separately rather than implying a whole-repository script PASS.
- Canonical doc checkpoints can leave the candidate unable to fast-forward from the original. Semantically reconcile the current canonical checkpoint into the candidate, preserving blocked review/current pending acceptance and measured evidence; verify ancestry and source equivalence before proposing acceptance.


## 2026-10-02 — Isolated production verification and linked dependencies

- Error: invoking pnpm in a copied production source tree caused its automatic dependency check to request reinitialization of the shared linked dependency directory. pnpm refused with `ERR_PNPM_UNSAFE_MODULES_DIR`; no deletion or install was retried.
- Recovery: execute the already installed Astro/TypeScript binaries and the eight declared build stages through the tsx import loader. Preserve the failed wrapper log and the actual successful commands; do not describe this as a clean install or literal pnpm validation for the isolated tree.
- Prevention: inspect dependency linking and wrapper behavior before verification. Directory-only ignore patterns do not cover a dependency symlink; verify staged file modes. A linked node_modules entry was removed from the index (the filesystem link was retained) before any push.

## 2026-10-02 — Release verification environment boundaries

- The host Python tarfile API does not support `extractall(filter=...)`. The first extraction attempt failed before writing files; a subsequent artifact check consequently had no input. Recovery validated every archive entry as a relative, non-traversing regular file/directory with no links, then used exclusive file creation in a new ignored directory. Keep dependent checks behind successful extraction; do not claim the failed attempt passed or remove extraction safety to accommodate an older API.
- Local browser navigation was blocked by the client, and an existing live tab later produced a clipboard focus-token mismatch/inconsistent input state. Those attempts were excluded from GUI PASS. A separate deployed-host tab with observed controls completed the actual smoke checks. Keep automation-input failures separate from product defects, re-establish visible state, and use a dedicated test tab. Restore temporary viewport overrides afterward.


## 2026-10-03 — Lock graph comparison must cover peer contexts and aliases

- Error: the first A/R3 graph checker stripped two resolved peer suffixes but retained two other obsolete transitive peer names; the second treated three existing pnpm alias references as ordinary name/version references. Both stopped before recording PASS and neither changed the package candidate.
- Recovery: assert the exact four removed old-build peer names on only the three affected Swup nodes, resolve a full alias snapshot key before composing name@version, then compare every surviving snapshot and prove optional flags from all production/development root paths. Raw diffs and diagnostics remain preserved.
- Prevention: distinguish package-version sets from actual parent edges, peer variants, alias references and required/optional reachability. Never approve patch drift or mask a mismatch merely to make a structural checker pass.

- Evidence-format diagnostic in the same packet: checking newly staged raw `.diff` artifacts reported 1201 context-blank lines as trailing whitespace (1160 full diff, 41 correction diff). Preserve byte-exact Git evidence rather than trim its context markers; inspect every diagnostic category and run the whitespace gate on all other files. Record the full diagnostic and scoped PASS separately. The first pre-stage diff check did not cover untracked evidence.


### 2026-10-03 — A/R3 validation tooling and GUI boundary

- Error: TypeScript 6 rejects command-line file compilation next to tsconfig without `--ignoreConfig` (TS5112). Correction: use explicit isolated fixture options with `--ignoreConfig`; keep the separately required formal `pnpm type-check` script's `--isolatedDeclarations` unchanged. Both final checks passed.
- Error: raw GitHub advisory ranges contain commas; npm semver does not interpret those as conjunctions, causing an incorrect initial count of 6. Correction: preserve raw ranges, normalize commas to spaces for semver matching, rerun to 32 and confirm all 31 fresh audit GHSA are in the union. The initial count is rejected in the receipt.
- Boundary: Browser Use URL policy rejected acquisition of a prior localhost connection-error data-document tab. Candidate GUI never loaded; do not switch clients/routes or reuse historical GUI results. Record exact blocker and continue independent artifact/API checks.


### 2026-10-03 — R1a final fixture format diagnostic

- Adding the benign owned Buffer-view roundtrip assertion caused one Biome formatting diagnostic. Preserve initial raw output in `biome-buffer-initial.log`, apply formatter only to the new fixture and rerun final Biome (300 files) and complete native suite (166 tests). Both final exits zero; no dependency/application changes after full builds. Do not mark the initial formatter failure as product or final-gate PASS.


### 2026-10-03 — Linux CI metadata field boundary

- Read-only jobs summary assumed `runner_os`, which this GitHub jobs payload does not expose (KeyError). Corrected summary uses returned runner labels and explicit Ubuntu version/image lines in actual job logs. The diagnostic did not alter CI or candidate and is not a failed product check. Avoid inventing runtime metadata from missing fields.
