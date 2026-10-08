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


### 2026-10-03 — R1b URI transitive resolution and HTTP sandbox

- A root resolver cannot require an undeclared transitive Ajv package in isolated pnpm layout; historical Ajv8.18 metadata was initially queried. Corrected before update by traversing actual check→language-server→volar→YAML→Ajv8.20 path and reading its ^3.0.1 child range. Tests use that real parent chain; no root dependency added.
- Initial HTTP loopback request was denied by shell sandbox (PermissionError), retained in http-root-sandbox-initial.stderr/exit. The identical checker and URL succeeded through standard tool approval. Browser URL-policy refusal remains blocked and no alternate client/route was used.


### 2026-10-03 — R1 font proxy fixture protocol and version probes

- The initial brace-expansion 5 child-major concern was an unverified assumption. Both old 5.0.9 and target 5.0.12 already use balanced-match 4.0.4 within ^4.0.2. Corrected before mutation; no transitive migration occurred.
- SVGO package.json is not publicly exported. The initial version probe failed while actual Iconify behavior passed. Use public SVGO.VERSION; retain the initial failure and the final strict PASS.
- The first local proxy fixture supported only CONNECT and returned 400 to valid HTTP forwarding; 13/14 tests passed. Installed undici ProxyAgent selects forwarding for HTTP unless tunneling is requested. Add guarded forwarding only to the owned localhost origin and keep strict EnvHttpProxyAgent, traffic and download assertions. Final 14/14 target tests and 186/186 full tests passed. Provider fallback or a silent catch cannot establish proxy/download success.


### 2026-10-03 — Cache patch installation, fixture clocks and preview lifecycle

- pnpm patch requires the installed virtual-store lock (`node_modules/.pnpm/lock.yaml`), not just the project lock. Initial patch attempts stopped with PATCH_NO_LOCKFILE; approved ordinary frozen installation supplied the correct state. Store SQLite permission errors required normal tool escalation, not custom registry/security settings. Inactive original package directories can remain after patch install: validate all current lock edges/symlinks rather than infer live exposure from directory existence or delete shared caches.
- Private Module._compile without the expected filename caused a Node 24 native assertion. Use public createRequire to load a hash-verified, dependency-free official baseline plus license; preserve initial crash output. Epoch plus 59.9996 seconds did not preserve the decimal exactly; use representable quarter-ms ticks and strict fresh/exact-boundary/stale assertions, not epsilon. Final 45/45 and 247/247 logs supersede but do not erase 44/45 failure.
- Astro 7 preview CLI starts a daemon and exits. Initial killpg cleanup returned EPERM; inspect the exact preview lock and use official `astro preview stop` for the owned daemon. Final PID/port/lock receipts passed. Ordinary ps query was sandbox-denied and not retried; do not claim machine-wide cleanup. A reused peer probe rewrote its historical proof with the current path: preserve new output in this packet and restore only that self-written historical file to HEAD bytes.
- Full source whitespace checking flags eight single-space context lines in the formal unified patch. Verify each is a context-only line, retain byte/hash identity and raw diagnostic, then separately check all non-patch source. Never trim pnpm patch evidence to make a checker green.


### 2026-10-03 — R4 offline gate schema and execution context

- First security fixture run failed 22/47: a new range assertion was outside its finding loop, and retained GitHub severity uses `medium` while pnpm uses `moderate`. Move the assertion into the exact scope; map only the equivalent severity name while retaining raw source labels. Keep the failed log, positive controls and every negative assertion. Final 49 security / 296 full native tests passed; no severity downgrade or exception was added.
- A copied node_modules directory caused `pnpm exec` to enter its automatic install check and fail with store SQLite access before formatting. Do not retry installation or alter dependency/security settings to run an offline check. Use the already installed documented bin for authorized local tooling, and label it accurately; this is not a frozen/clean-install claim. The first Astro command also used obsolete `astro.js`; resolve `bin/astro.mjs` from that actual package manifest before execution and retain both logs.
- Offline collectors must label injected execution in their own receipt, not rely on surrounding prose. GitHub SHA is injected explicitly in fixture orchestration so hosted environment variables cannot invalidate a synthetic identity. Tests for unchanged workflow structure read a committed fixed baseline instead of relying on a historical commit that may be absent from checkout's shallow clone.


### 2026-10-03 — R4 audit raw bytes must precede decoding

- Independent review found one P2: spawnSync encoding:utf8 replaced malformed stdout31ff0a with31efbfbd0a and stderrfe with efbfbd before evidence retention/hash. Original string-only mocks did not exercise that transport boundary. Preserve the supplied finding, an owned-child reproduction and red regression log.
- Receive Buffer output with encoding:null, write/hash the original bytes, then decode both streams with fatal UTF-8 into separate parser input. Record stream-specific decode errors and block before JSON parsing, while still collecting the second audit. Do not reject a legitimately encoded U+FFFD, normalize invalid bytes or change the raw artifact. Six new owned-Node byte tests plus all prior tests pass (55 security,302 native); sources, policy, workflow and live-audit permission stay unchanged.


### 2026-10-04 — Astro patch registration changed unrelated lock edges

- Error: pnpm 11.22.0 `patch-commit` re-resolved four non-target packages while adding the exact Astro patch. No lifecycle hooks were enabled; the graph drift was noticed after bounded generator probes.
- Response: stop implementation, retain complete lock diff and package/snapshot comparison, mark the whole experiment unaccepted. No hand-edited lock or new overrides; original candidate untouched.
- Prevention: future patch registration should use an inspected lock-only path where available and verify every package/snapshot/parent edge before executing candidate probes or full gates. Initial unsupported `--ignore-scripts` CLI spelling failed without mutation; supported `--config.ignore-scripts=true` was used. Store permission failures are execution blockers, not code defects, and require reviewed escalation rather than alternate stores.


### 2026-10-04 — Primary-source freshness changed during cache closeout

- Observed: official npm latest became4.3.0 while the implementation still targeted reviewed4.2.0. New primary-source guard refused contract generation, correctly preventing stale acceptance. Read-only verified tarball comparison found Vary/status changes; no automatic install or claim of full repair.
- Response: retain the4.2.0 reviewed contract and add an explicit4.3.0 rejection test. Unit fixture metadata for4.2.0 is labelled as extracted historical metadata, not latest. Independent upstream review precedes any acceptance-contract refresh.
- Test wiring: initial primary-source unit additions lacked two imports and an old D01 assertion allowed only one patch; both were corrected explicitly and passing reruns retained. Initial formatting checks also found multi-variable declarations. None were production security PASS.
- Approval: final live audit was denied before process creation due to retained no-disclosure instructions. Stop that exact action; require explicit current authorization evidence rather than alternate HTTP transport or treating it as a code failure.


### 2026-10-04 — Nested Astro parent verification and background preview recovery

- P2: the gate pinned only root Astro files while audit-path resolution checked the terminal cache package. A fixture with patched root and cache but MDX→original nested generator was incorrectly accepted. Reproduced before changing code; fixed by collecting/deduplicating every actual Astro entry and checking each version/four source hashes. Exact original negative, two-patched-instances positive and changed-version negative now pass.
- Validation driver: Astro7 preview detects agent execution and launches a background server; the CLI exits0. The first driver treated that exit as failure and its attempted process-group cleanup found no group. Root build/artifact had already passed. Inspected CLI/logs, resumed only HTTP/root plus the unrun project build via documented background status/stop; no full-matrix repetition or application change. Final HTTP and explicit preview stops pass; original diagnostic log retained.

## 2026-10-05 — Local homepage verification environment

- Copied dependencies did not prevent pnpm11's automatic install check; it failed opening the store SQLite database. Do not retry installation. Use the existing isolated official binaries and record exact commands, rather than claiming literal pnpm/frozen-install PASS.
- Astro dev/build required local port listening, which failed with sandbox EPERM. Only the scoped local verification escalation was approved; that approval does not authorize uploading the separate remediation candidate. First Pagefind execution lacked the isolated `.bin` in PATH; add the executable path and rerun that stage, then continue dependent artifact checks.
- The first local browser render was dev mode and included the retained draft. No dev screenshot was saved/staged; deliver only production-preview captures, which confirm zero public articles. A read-only DOM query's unavailable navigator object is an API limit, not evidence that Edge disconnected.


## 2026-10-07 — Protected-checkout guards must use read-only Git commands

- Initial guard attempted `git write-tree` against the original checkout and the filesystem sandbox rejected its index.lock before a mutation. Replaced it with an SHA256 of `git ls-files --stage`, optional locks disabled; fresh HEAD/branch/status and local-only private aggregate now establish protection without writing original Git metadata. Do not escalate a guard that should be read-only.
### 2026-10-07 — S1 renewed JSON formatting

- Error: JSON serialization expanded previously compact arrays; the targeted Biome CI check reported two formatting errors. The shell command's final diff command returned zero, so that overall shell exit was not a Biome PASS.
- Repair: run the configured formatter on only the two renewed JSON files, preserve their parsed objects, rerun targeted Biome, and record the source correction as a separate commit before runtime acceptance.
- Prevention: capture each gate's actual exit code separately; a later command in a multi-command shell cell must not hide an earlier check failure. Do not infer PASS from a terminal cell's final exit.
## 2026-10-07 — Renewal expiration fixtures

- Error: the first new native run passed 356/358; two repair negatives still used the former October 10 expiry, now inside the renewed window. Neither failure established a runtime patch defect.
- Repair: derive expiration from policy.reviewBy and upstream.reviewBy, check one millisecond before each reviewedAt, and retain actual-clock enforcement in the live CLI. Preserve the first failed matrix and rerun native regressions on the corrected exact source.
- Prevention: renewal must update temporal fixtures to exercise window boundaries, never change expected BLOCKED/exception behavior to PASS.


### 2026-10-08 — graph checker must include the changed parser peer references

- Error: the first bounded graph assertion rejected postcss-nesting14.0.1 because its two csstools dependency strings carry selector-parser7.1.5 peer suffixes; the intended parser update necessarily changes those references to7.1.6.
- Repair: add the two explicit owner/dependency reference substitutions already required by the approved plan; do not globally normalize unknown suffixes. Whole 892-snapshot comparison then passed, with19explained edges and unchanged retained package/integrity/root records.
- Prevention: validate both peer owner keys and the inbound dependency strings, and keep unexplained graph differences blocking.

### 2026-10-08 — real parent test APIs and offline installer context

- Initial five-family fixture errors used a read-only prototype property, expected unknown-command output to be katex-error, reversed typography pseudo API output, treated Astro data-entry objects as tuples, and treated Tailwind raw map text as an object. Actual source/API inspection corrected only the fixtures; physical old sprintf cache was preserved outside the new clean install. Original outputs remain in owned ignored tmp.
- TOML assertions twice misread error contracts: file loader logs a numbered codeblock rather than literal line/column labels, and AstroError exposes loc rather than the constructor input location. Per the coordinator stop rule, the corresponding gate paused for bounded Astra analysis. Actual old1.8.0/new1.9.0 ESM/CJS error objects match for the LF fixture, including inherited name Error; Astro therefore retains its existing generic message and file-only loc. Exact parser fields/codeblock, Astro name/type/message/loc and loader diagnostics now pass, with CRLF controls. No framework/dependency error implementation was changed.
- First offline patch-negative run failed on sandbox access to the default pnpm SQLite store, so61/62 was not accepted. The unchanged command through standard Auto-review passed62/62 including all six missing/corrupt negatives; no store/path substitution. A receipt harness then wrongly assumed all negative exit codes were1; missing patches actually exit254, corrupt patches1. Explicit variant records and real semantic rejection tests are retained.
- Tool orchestration twice failed before executing because nested literal delimiters broke JavaScript parsing. No project mutation ran in those failed calls. Temporary transport loss was handled by reading existing logs and Git state; the lost23955 session was not restarted.
- Prevention: inspect real public declarations and implementation before asserting field names; target the intended namespace without polluting unrelated registries; retain exact negative causes and distinguish installer policy rejection from sandbox/transport failure.

- Follow-up: security Biome exposed two graph-checker variable/style diagnostics before the final matrix. A shell batch continued to the evidence commit after that failure; no formatting PASS was accepted. A separate correction commit retains the failure and applies exact Biome styles, re-runs the graph validator and rebinds only the changed checker boundary; all10files now pass security Biome. Use fail-fast drivers for acceptance sequences.

- Final-matrix native run370/371 failed only because the workflow contract still expected the untouched historical quality job. The approved exact strict-parent-types step was added to a clone of that baseline; complete equality remains enforced and the original baseline bytes stay unchanged. Focused workflow test now passes. Unchanged peers, Astro/formal/strict types and source formatting results remain valid; rerun native plus affected test formatting, then continue full builds.

### 2026-10-08 — GUI harness contracts and transition completion

- Harness failures came from clicking during a theme transition, waiting for a nonexistent main-container id, and assuming mobile search auto-focus on open. Rejected observations are retained. Source uses swup-container and a nonmodal search panel with no auto-focus promise.
- Wait for actual hydration/transition/content completion, click the real input before testing focus, and assert panel inert/aria, computed overflow and restored trigger focus. The bounded rerun passes actual desktop/mobile math and Swup. No product source change was needed.

### 2026-10-08 — Trusted authorization and GitHub merge identity

- Upload Auto-review initially rejected authority found only in transferred assistant context. Preserve that refusal. Once original human push/conditional merge/project/audit directions were supplied, exactly one standard review of the identical operation permitted ordinary FF delivery. Do not change client or policy to evade refusal.
- GitHub rejected the explicit derived noreply address in the first squash author-email parameter before merging. Verify the current account and already-public main author identity, then correct only that parameter and retain head/base/successful-check guards. No private email lookup or account-setting change was needed; ordinary squash succeeded.

### 2026-10-08 — configured block locale is insufficient for monolingual code controls

- Actual current renderer execution succeeds, but explicit concurrent `zh-CN/en/en/zh-CN` still renders Chinese collapse labels/announcements on English blocks and English copy labels on Chinese blocks. Renderer exit0 is execution evidence; the separate language contract is4/4FAIL. Preserve the counterexample rather than accepting empty Home/About as whole-site locale proof.
- Current Astro7 Satteri document file has path/URL/source, without the older `file.data.astro.frontmatter` shape. The custom collapse plugin closes over creation-time texts; built-in frame text registration must target the actual renderer owner. Inspect these installed interfaces before designing an adapter. Per the bounded S2 stop rule, architecture selection pauses for a narrow coordinator decision; no application fix or second build is accepted here.

### 2026-10-08 — inspect the configured processor before declaring a locale seam blocked

- Correction: the previous configured-renderer counterexample is real, but Satteri was not the site's active processor. Current astro.config explicitly uses unified; its actual EC hook receives file.data.astro.frontmatter. Do not infer active behavior from an unused integration branch.
- Selected repair direction: static public text registration plus final current-core AST text hook, keeping original plugin scripts. Cross-core hook delegation fails nominal private types and is discarded without casts. Isolated actual pipeline/browser probes pass; preserve their limits and require fresh full-site verification after implementation.

### 2026-10-08 — actual storage denial and article pointer evidence limits

- Real project-base GUI generated13SecurityError exceptions when storage access was rejected, despite native language links continuing to navigate. Optional storage wrappers now catch both getter and method failures; full corresponding GUI rerun has0exceptions.
- The first whole-site GUI harness expected About me, while the actual English catalog/title is About. Correct the expectation and retain the rejected attempt; this was not a product text failure.
- Synthetic article pointer journeys subsequently timed out on collapse state. A single-page diagnostic shows correct toggles and large geometry changes, but a bounded settled-coordinate rerun still fails the complete journey. Do not turn that short diagnostic into whole-site PASS or keep retrying blindly. Preserve the three failures, remove only the SHA-owned engineering inputs and escalate the unresolved journey.


### 2026-10-08 — whole-body trailing debounce starves post-Swup collapse binding

- Instrumented reproduction on9ad3a2b output: initial native controls work; after Home/article replacement, real pointer hits the returned expand span with no data-init. The observer remains connected to the current body but sees86 typewriter changes; binding eventually occurs after the unrelated text pause, too late for the user's click. A standalone Swup fragment lacking that animation cannot validate this contract.
- Fix only relevant inserted collapse elements using the installed plugin's original initializer; keep the source-fragment guard and deterministic original counterexample. Both complete4variant ×3round-trip browser journeys now pass, with original three failures and new diagnosis retained. Do not infer all old uninstrumented timeouts had this cause, or replace the full journey with a short single-page probe.
- Verification-controller correction: locale-audit CLI accepts an output filename, not --base. Both actual-dist16page assertion runs executed successfully, but the second JSON replaced the first under an owned --base filename. Final JSON moved into ignored evidence; root assertion stdout retained. Future calls must pass unique output paths. No product behavior or assertion changed.


### 2026-10-08 — final S2 whole-site verification and empty-state readability

- Preserve first concurrent headed-window transition/header timeouts. Serial foreground diagnostics and actual contracts pass; do not run two native headed profiles concurrently or accept stale document.readyState as navigation completion. Wait for the exact CDP loader and relevant island hydration.
- The installed sections github style hides its summary after expansion; an invented second-click assertion tested a nonexistent contract. English error output is /en/404/, not /en/404.html. Display settings are disabled; do not activate or invent controls to satisfy a harness.
- Inspected final dark screenshot reveals black empty-state text. Reuse existing text-75 theme color; verify actual paragraph (an inline script follows PostPage before it), parse CSS Color4 with browser Canvas rather than decimal RGB guesses, and retain wrong-selector/parser attempts. Final contrast exceeds9.8 on both languages/themes. Applicable final396native/quality/dual-base/security/HTTP gates rerun on changed source without renewing deadlines.

### 2026-10-08 — Linux build identifiers and complete workflow expectations

- The actual Pages artifact emits existing build metadata `GitHub Actions` and `Linux / x86_64`; the Mac-oriented language checker rejected both. Preserve the original artifact/run and failed output. Classify only exact identifiers inside the existing site-info component; test that the same strings outside it, extended prose and opposite-language text still fail. Apply the same audit in both actual Linux quality jobs after Pagefind/artifact checks.
- The first 397-test run retained one workflow-guard failure because its expected complete original quality job had not yet registered that exact extra step. Keep the baseline and every existing security/permission/no-ignore assertion; append the precisely expected read-only step instead of dropping the structural comparison. The unchanged cache tests still passed before the provisional rebind; final proof must rerun on the final source.

### 2026-10-08 — Final production evidence belongs to its deployed source

- Ordinary squash creates a new SHA; prove candidate/tested-merge/main tree equality and run fresh main/Pages gates. The verification correction required its own PR29, 397-test Linux/language and actual-current proof; PR28 green alone cannot accept it. Final uploaded tar and HTTP/GUI checks bind `29cde48`, while original `4d98d18` results remain separate.
- GitHub EOF/TLS and HTTP body-read timeouts interrupt evidence collection without changing source or CI. Preserve failed attempts and retry the same read clients with bounded transport handling; keep full status/byte assertions, stop on lasting failures or content drift. A brief Mac exec transport disconnect recovered through the same tool.
- A local noreply commit identity can differ from the address accepted by GitHub's explicit squash parameter. Read the already-public successful main author linked to the current account and reuse that exact accepted identity; retain all head/base/check guards. No private-email lookup or account change is needed.

- Before publishing the delivery receipt, raw-byte comparison detected Git's inherited CRLF normalization in nine HTTP-header evidence blobs. Keep original downloads and the local diagnostic; use a `.gitattributes` scoped inside the delivery evidence folder to preserve header bytes, then compare every tracked security artifact to its actual downloaded original. This does not change source/runtime/CI policy or advisory interpretation.
