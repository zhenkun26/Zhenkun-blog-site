# Zhenkun-blog-site 技术决策记录

> 本文件只记录影响项目结构、技术选型和部署方式的取舍。格式沿用 auto-coding 的 ADR 规范（背景 / 候选方案 / 选择 / 放弃 / 验证 / 改判条件）。

## 索引

| ID | 决策 | 状态 | 证据 |
|---|---|---|---|
| ADR-XB-001 | 采用 CuteLeaf/Firefly 作为博客底座 | accepted | 本文件、git log |
| ADR-XB-002 | 目录位置约束与文档布局 | accepted | AGENTS.md、docs/ |
| ADR-XB-003 | 内容专注中文，不引入多语言内容路由 | historical; direction superseded by ADR-XB-010 | siteConfig.ts、ROADMAP |
| ADR-XB-004 | GitHub Pages 部署方案与 base 路径处理 | accepted | .github/workflows/deploy.yml、astro.config.mjs |
| ADR-XB-005 | 评论系统选型 giscus | accepted | commentConfig.ts、references/m5-giscus-working.png |
| ADR-XB-006 | Selective reference alignment and incremental contracts | proposed | ARCHITECTURE.md、references/comparison-2026-10-01/report.md |
| ADR-XB-007 | Obsidian manuscripts, optional Space editorial work, explicit publishing copies | proposed | ARCHITECTURE.md、references/authoring-2026-10-01/report.md |
| ADR-XB-008 | Shared article contracts and an independent publication preflight | accepted for local implementation | REFACTOR_PLAN.md、ROADMAP.md |
| ADR-XB-009 | 统一 Markdown 计划、候选接纳与质量门 | accepted for local planning/review | ROADMAP、dated G1 evidence |
| ADR-XB-010 | 恢复中英双语目标，先调查后决定实现 | accepted for feasibility only | 现有 i18n、ROADMAP |
| ADR-XB-011 | 复用完整双 base 质量检查门控 Pages 候选 | accepted for local CI implementation review | P2.5 exact decd04b review、dated evidence |
| ADR-XB-012 | 展示名与作者统一 Zhenkun，旧分离提案已替代 | accepted for owner direction and LOCAL profile implementation | 最新明确纠正、ROADMAP |
| ADR-XB-013 | 复用现有开关，修复动态端点并明确公开产物边界 | accepted for LOCAL bounded implementation | P4 measurements、ARCHITECTURE |
| ADR-XB-014 | 双语复用现有 catalog，以显式页面语言与真实译文配对渐进迁移 | LOCAL feasibility accepted; G6 five-point direction approved | P8 exact review/acceptance、synthetic evidence |

## ADR-XB-001：采用 CuteLeaf/Firefly 作为博客底座

- **背景**：从零建设个人博客，需要中文生态成熟、可由 AI 持续小步改造的静态博客方案；用户认可 Fuwari 风格，并希望以 rainzt.cn（Firefly 的二改作品 Aemeath）为长期外观参考。
- **候选方案**：原版 saicaca/fuwari；Hugo 系（PaperMod / stack / Blowfish）；Hexo Butterfly；timlrx/tailwind-nextjs-starter-blog；CuteLeaf/Firefly。
- **选择**：CuteLeaf/Firefly。理由：Fuwari 直接二开，功能覆盖（六语言界面、Pagefind 搜索、说说 / 友链 / 相册 / 音乐 / 看板娘等）远超原版；中文社区活跃（2068 stars，2026-09 仍在持续提交）；文档与配置注释全中文；MIT 协议；Astro 7 + TS 代码结构清晰，适合 AI 小步改造。
- **放弃**：原版 fuwari（功能少、更新慢）；Hugo 系（模板语法对 AI 迭代不如 Astro/TS 友好，且用户已认可 Fuwari 视觉）；Next.js starter（最重，维护成本高）；Hexo Butterfly（生态偏老）。
- **验证**：仓库基于 upstream/master（db331cf）检出。M1 全链路 PASS——pnpm install（59.2s，pnpm 11.22.0）；pnpm dev（localhost:4321 HTTP 200）；浏览器渲染验证截图 `references/m1-home-light-1280x720.png`；pnpm check（253 文件，0 错误 0 警告）；标题热更新生效。
- **改判条件**：上游停更超过 6 个月，或本地改动与上游出现无法维护的结构性冲突；届时基于当时最新版评估重建。

## ADR-XB-002：目录位置约束与文档布局

- **背景**：用户要求杜绝散乱文件与多余隐藏文件夹；同时需要跨会话记忆与流程文档支撑长期迭代。
- **候选方案**：独立 AI 记忆目录（如 ai_pipeline/）；全部并入 docs/；不做约束任其散落。
- **选择**：项目文档集中在 `docs/`（ROADMAP / PROCESS / DECISIONS，ERROR_MEMORY 按需创建）；参考材料进 `references/`；自建脚本进 `scripts/`（`zhenkun-` 前缀与上游脚本区分）；临时产物进 `tmp/` 或 `/tmp`（gitignore）。上游自带的 AGENTS.md / CLAUDE.md / docs 内容保持原位，项目约定追加在 AGENTS.md 尾部。
- **放弃**：新建顶层记忆目录；在仓库外存放项目文件；覆盖上游文档。
- **验证**：AGENTS.md 尾部"项目约定"小节；`.gitignore` 追加 `tmp/`。
- **改判条件**：references/ 或 scripts/ 规模膨胀到影响检索时，再评估细分。

## ADR-XB-003：内容专注中文，不引入多语言内容路由

- **状态**：historical，方向约束由 ADR-XB-010 接续；以下保留当时的中文优先决策，不作为当前拒绝双语调查的依据。

- **背景**：初期规划包含中英双语内容方案；用户明确删去，专注中文内容与中文社区。
- **候选方案**：内容级双语（/en/ 路由 + 翻译工作流）；仅界面语言设为 zh_CN；维持双语路线图。
- **选择**：界面语言 zh_CN（Firefly 默认即中文），内容只写中文；不规划、不实现多语言内容路由，双语里程碑从 ROADMAP 移除。
- **放弃**：内容双语路线图及其全部关联任务。
- **验证**：`src/config/siteConfig.ts` 中 `SITE_LANG = resolveSiteLang("zh_CN")`（上游默认）。
- **改判条件**：用户重新提出双语需求时，另立 ADR 并恢复对应里程碑。

## ADR-XB-004：GitHub Pages 部署方案与 base 路径处理

- **背景**：站点部署到 `https://zhenkun26.github.io/Zhenkun-blog-site/`（项目页子路径）。本地开发希望保持根路径；上游自带 GitHub Pages workflow（触发分支 master，本仓库主分支为 main）。
- **候选方案**：固定 `base: "/Zhenkun-blog-site/"`（本地 URL 变丑）；构建时用环境变量注入 base（本地根路径、CI 子路径）；换用户主站 `zhenkun26.github.io` 根路径部署。
- **选择**：环境变量注入——`astro.config.mjs` 中 `base: process.env.DEPLOY_BASE ?? "/"`，deploy.yml 构建任务注入 `DEPLOY_BASE: /Zhenkun-blog-site/`；deploy.yml/build.yml 触发分支改为 main。
- **放弃**：固定 base（影响本地体验）；主站仓库部署（多站点共存不灵活）。
- **组件偏离**：上游三个组件（Profile.astro / Announcement.astro / BannerHomeTextOverlay.astro）渲染配置链接时未走 base-aware 的 `url()` 工具，已补上（网络地址/mailto 行为不变）。上游更新时此处可能有轻微冲突，属已知维护成本。
- **验证**：本地 `DEPLOY_BASE=/Zhenkun-blog-site/ pnpm build` 通过；dist 全站 HTML 无裸根路径链接；`pnpm check` 0 错误。**线上验证 PASS**——push 触发首次部署 59s 成功，https://zhenkun26.github.io/Zhenkun-blog-site/ 首页/关于页 200，标题与资源前缀正确。
- **改判条件**：GitHub Pages 子路径方案出现无法修复的资源加载问题，或未来购买自定义域名（根路径部署，届时可移除 DEPLOY_BASE 注入）。

## ADR-XB-005：评论系统选型 giscus

- **背景**：站点需要评论能力。仓库为公开 GitHub 仓库 + GitHub Pages 静态部署，无自有服务器；评论者主要为中文读者。
- **候选方案**：
  1. **giscus**（GitHub Discussions 驱动）：零服务器、零成本，数据存本仓库 Discussions，反垃圾天然强（需 GitHub 登录）；缺点：评论者必须有 GitHub 账号，国内访问 GitHub 不稳时加载可能失败。
  2. Waline：功能全（匿名评论、邮件通知），但需部署服务端 + 数据库（Vercel/云函数），多一个运维面和多一套授权边界。
  3. Twikoo：同样需服务端（Vercel/腾讯云函数），管理面板友好。
  4. Disqus：零成本但国内访问差、有广告，排除。
  5. Artalk：需自托管服务器，排除。
- **选择**：giscus。理由：与"GitHub Pages + 公开仓库 + 无服务器"的现有架构零摩擦；隐私与数据主权最好；技术向读者 GitHub 渗透率高。**用户批准（2026-09-06）**。
- **放弃**：Waline/Twikoo（服务端运维成本与当前阶段不匹配，未来评论量起来可再评估）；Disqus/Artalk（访问性/部署成本）。
- **执行记录**：仓库 Discussions 已启用；giscus App 已由用户授权安装（仅 Zhenkun-blog-site 单仓库，权限=元数据读+Discussions 读写）；repoId `R_kgDOUPSsrQ` / 分类 Announcements `DIC_kwDOUPSsrc4DE942` 已配置至 `commentConfig.ts`（type: giscus）。
- **验证**：测试文章页评论区完整渲染 PASS（表情/评论计数/输入框/使用 GitHub 登录按钮），截图 `references/m5-giscus-working.png`；`gh api` 直查 installation 端点的 401 为端点鉴权要求，非安装问题。
- **改判条件**：读者反馈 GitHub 登录门槛过高（非技术访客评论受阻），届时补 Waline 作为替代并保留 giscus 数据。

## ADR-XB-006: Selective reference alignment and incremental contracts

- **Status**: proposed implementation direction, 2026-10-01. Keeping Firefly and owner-data-free templates follows the owner's explicit request and ADR-XB-001. New structural implementation, feature activation, and operational changes are not accepted or completed by this planning record.
- **Context**: The owner asks to assess CuteLeaf and rainzt, identify worthwhile functional alignment, and define maintainable architecture and durable memory boundaries for this one blog. Live desktop/mobile observations and current local/public source inspection show that most article, reading, wallpaper, and optional-page capabilities already exist locally. A newer Firefly has a project collection absent from this baseline. rainzt adds strong owner presentation and feed discovery, but its public V3.4.0 snapshot differs from the displayed live V4.1.3 and excludes backend operations. Current Zhenkun audit findings also identify inconsistent deployment paths, publication/indexing behavior, search initialization, and modal focus.
- **Candidates**: (1) retain Firefly and adapt selected capabilities after focused contract repairs; (2) import/merge the complete Aemeath customization or latest Firefly; (3) rewrite using another application framework; (4) only change appearance while leaving structural inconsistencies in place.
- **Recommended choice**: candidate 1. Preserve Astro/Svelte/static hosting and existing directories. Derive a small capability metadata policy from the existing typed configuration; separate logical routes, emitted assets, and absolute protocol URLs; centralize publication selection incrementally; give page-local client behavior explicit setup/disposal; place future external collection behind a bounded adapter and accepted snapshot. Reuse existing reading/settings/bookmark/gallery features before adding replacements. Adapt projects as a small optional collection when owner content warrants it. Keep the current giscus decision; anonymous comments and public analytics remain independent integration proposals.
- **Rejected alternatives and tradeoffs**: a full merge imports unrelated author configuration, version drift, service assumptions, and changes beyond this scope; the inspected newer project implementation still needs base/guard/accessibility adaptation. A framework rewrite has no evidence-backed benefit for this static personal blog. Appearance-only work leaves reader-facing reliability defects unresolved. Incremental adapters/policies introduce some local maintenance responsibility, but keep changes inspectable and avoid a second routing/configuration framework. No generic plugin engine, backend, new dependency, or top-level directory is proposed.
- **Boundary**: preserve license/provenance notices and framework capability, clear owner-specific examples rather than inventing replacements, and distinguish page visibility from data privacy. Gallery HTML passwords do not protect public image files. Reference media are not licensed by the framework license. A future collector, analytics provider, server-side comment service, private album, upstream merge, dependency declaration change, asset deletion, push, or deployment needs its own scoped decision/authorization. Visual changes continue through the existing one-variable review process.
- **Verification**: planning evidence is the dated [comparison report](../references/comparison-2026-10-01/report.md), accepted screenshot/DOM/keyboard observations, pinned source links, independent architecture/source/asset reviews, and local file/type inspection. [ARCHITECTURE](ARCHITECTURE.md) defines per-layer acceptance. This historical planning record does not establish application implementation, build or deployment acceptance; subsequent cleanup/refactor execution and its applicable authorization are tracked only in ROADMAP.
- **Reconsideration conditions**: a demonstrated product need cannot be met within static hosting; a selected feature requires access-controlled private storage; measured repeated coupling/acceptance failures show that a specific boundary cannot be repaired incrementally; or the owner explicitly changes content/hosting/service goals. Reassess the affected boundary using current evidence rather than replacing the framework solely because a reference has more features.

## ADR-XB-007: Manuscript ownership and optional Blog Space

- **Status**: proposed, 2026-10-01. The owner requested implementation research and a suitable plan; this record does not activate a Space, vault export, synchronization, or article publication.
- **Context**: CuteLeaf documents Obsidian editing directly in `src/content/posts` with build-time Wiki Link conversion. Aemeath's public snapshot also registers Wiki conversion, but the rainzt author's actual Obsidian workflow remains unverified. Zhenkun already has a personal Obsidian vault and a static Markdown blog. Current Wiki target scanning bypasses draft selection, stable loader ID normalization, and deployment base handling. Space provides editorial Pages and authenticated tools, but an Obsidian/Space/Git publishing round trip has not been tested.
- **Candidates**: (1) open the public article directory as the vault; (2) keep the existing personal vault as manuscript source and select public-safe publishing derivatives; (3) make Space the sole manuscript source with tested local snapshots; (4) make all three continuously editable synchronized masters.
- **Recommended choice**: candidate 2, starting with one manual article pilot. Obsidian owns the manuscript and local research; an optional private Blog Space owns selected briefs/review suggestions; Git owns the reviewed static publishing input and history. Adopt semantic revisions into the manuscript before re-export. A Space-originated article may establish a manuscript, but later Page revisions are not automatic publication or overwrite authority. Keep article/photos inside the existing vault until public eligibility is reviewed; map approved paths/assets explicitly into the existing article directories.
- **Rejected alternatives and tradeoffs**: candidate 1 is simpler and remains suitable for a dedicated public-safe writing library, but does not protect private drafts in public Git. Candidate 3 is possible after an accepted Page/text/asset pilot and an explicit editor preference; it should still have one master. Candidate 4 introduces conflict, deletion, privacy, authentication, and operational obligations without demonstrated need. Selective export creates a derivative copy, so content/hash differences must be reviewed rather than silently overwritten.
- **Boundaries**: selection never expands just because a Wiki Link names another private note. `draft:true` and passwords are not source confidentiality. Do not mirror `.obsidian`, whole vaults, arbitrary attachments, native authenticated file references, or editorial agent/task blocks. Use publication-aware Wiki targets, stable IDs, actual anchors, and deployment-aware links. Private source paths/revision provenance stay outside public outputs. No new backend, dependency, scheduler, automatic pruning, two-way merge, or main push is needed for the pilot. Space creation/context transfer and remote delivery require their applicable explicit scope.
- **Verification**: the [authoring assessment](../references/authoring-2026-10-01/report.md) records pinned primary sources, official Space/Obsidian documentation, fresh local code and controlled AST probes, read-only account metadata and whitelisted vault settings, alternatives, and packet acceptance. Creation, export, end-to-end production behavior, and productivity remain unverified. The [architecture](ARCHITECTURE.md) distinguishes manuscript, static publishing, selection, conversion, and delivery; ROADMAP alone tracks implementation.
- **Reconsideration conditions**: the owner prefers Space as the main editor; a completed article pilot reveals unacceptable export friction; a dedicated all-public vault becomes sufficient; or a verified cross-device/concurrent-editing requirement warrants a different source contract. Reassess only that boundary from actual usage before adding automation.

## ADR-XB-008: Shared article contracts and publication preflight

- **Status**: accepted for local implementation, 2026-10-01. The owner asked to begin the engineering refactor with explicit boundaries and durable project memory. Acceptance/delivery remains separate; optional Space/exporter choices in ADR-XB-007 are not activated.
- **Context**: M7 probes confirmed mismatched IDs/base paths, guessed links and draft metadata exposure. Fresh inspection shows duplicate production selection across consumers, post-ID extension stripping, the loader compiling draft sources, caught early Markdown render errors, and differing symlink/dotfile handling. These are publication-boundary defects, independent of a visual redesign or a new authoring service.
- **Candidates**: patch each URL/filter separately; use small shared typed contracts plus a scoped Wiki index/preflight; import newer upstream code wholesale; introduce a backend/publishing service.
- **Choice**: small shared contracts in existing utilities, explicit ID generation in the loader, common consumer selection, a deterministic matching Wiki index and a read-only fail-capable preflight awaited by the build. Use native Node/in-memory regression fixtures and existing Markdown/MDX parsers. Preserve the framework, supported card/alias behavior and explicit legal IDs. Reject unsupported identity/ambiguous/private-target inputs clearly instead of guessing.
- **Tradeoffs**: strict ID/unsupported-syntax diagnostics may require future selected manuscripts to be normalized before publication. Non-NFC and reserved route characters are rejected, not silently rewritten. Re-reading a per-document index favors fresh development state over a new persistent cache; preflight reuses one snapshot. Parser checks do not establish optimized images or complete final MDX output. Heading existence remains a separate follow-up.
- **Boundaries**: local P1 code work can proceed while P0 release acceptance is blocked; it does not close P0 or authorize deletion. Retain all 12 prior cleanup changes, one overlapping Wiki header hunk included. Do not publish drafts, scan a private vault, create/upload to Space, change dependencies, merge upstream, push new source commits or deploy through this packet. Standard-tool cleanup requires an explicit scoped exception; do not run around it.
- **Verification**: [REFACTOR_PLAN](REFACTOR_PLAN.md) defines packet contracts and layered acceptance; ROADMAP owns current results/blockers. The historical [authoring probes](../references/authoring-2026-10-01/wiki-probe.md) document the before state. [Fresh source/artifact evidence](../references/refactor-2026-10-01/publication-contract.md) records this increment separately; no earlier PASS is transferred automatically.
- **Reconsideration conditions**: actual article pilots reveal a required ID/syntax contract beyond this accepted subset; parser/index behavior disagrees with final Astro output; a meaningful performance measurement warrants an index cache; or the owner chooses a different manuscript/editorial authority. Reassess the narrow boundary rather than adding global machinery.

## ADR-XB-009：统一 Markdown 计划、候选接纳与质量门

- **状态**：accepted for local planning and review, 2026-10-02；具体任务/决策门状态只在 ROADMAP 更新，本文不宣布 P2/P3 已接纳。
- **背景**：外部 DOCX v1.1 与原仓库/隔离候选的任务状态不一致；P2 只有隔离仓库提交，原工作分支尚无该对象；P3 后续改动未提交。计划还把已启用 giscus 及现有首篇草稿误作待选事项。用户要求使用 Markdown 并归一，继续授权本地工程推进。
- **候选**：维护 DOCX/多个 checkout 各自状态；直接覆盖原分支/整包拷贝；保留唯一 canonical ROADMAP，以 ADR 记录取舍、日期 evidence 记录测量，先导入纯提交的 review ref 再审核整合。
- **选择**：最后一项。`docs/ROADMAP.md` 是唯一状态源；DOCX 与候选内文档是历史快照。沿用 P0–P7，新增 P2.5 三项可独立接受的 CI 提交与 P8 调查。G1 候选接纳、G2 产品范围、G3 内容/地址、G4 对外操作、G5 写作/视觉、G6 双语细节分别记录，G1 先于 P3 接纳。六步质量门采用环境 → 静态 → 完整双 base 构建 → 产物/HTTP → 浏览器 → 批准/发布，兼容 PROCESS 原五步改动循环。完整构建复用正式脚本，不制造另一条 CI 构建实现。
- **取舍与边界**：fetch 只是把准确 Git 对象纳入本地 review ref，不等于源码整合、G1 接纳或上线。保护原活动分支/用户 uncommitted 和隔离 P3；文档分叉在隔离整合分支逐段协调，不能用候选旧 ROADMAP 覆盖 canonical。G1 之后继续本地任务已获授权，远端 push、main 合并、部署、真实草稿公开、服务/安全配置和私人上传保留独立范围。giscus 依 ADR-XB-005 沿用；真实文章/评论仍需实际验收，HTTP 200 stub 必须如实记录。
- **历史作者/品牌映射（superseded by ADR-XB-012）**：当时提案将作者 Zhenkun 与Zhenkun·Zhenkun 品牌/旧标题分开。用户 2026-10-02 09:28 UTC 明确纠正后，公开站点名称、导航品牌和作者统一 Zhenkun；本历史提案不再约束实现。已确认中文简介/方向/公开邮件与 GitHub 沿用，英文资料仍须人工审校。准确执行状态只在 ROADMAP。
- **验证**：此次准确 ref/SHA/父子链、120 回归与 P3/用户文件保护见 `references/plan-reconciliation-2026-10-02/g1-evidence.json`；docs-only 补丁做链接、范围与差异审查，不把过去应用日志转写成 fresh full-quality PASS。实际候选接纳、整合方法与未执行项由 ROADMAP 继续跟踪。
- **改判条件**：真实整合显示来源/祖先不符、非文档差异不等价、同时写入或未解决的受影响失败时，暂停整合并保留 ref/原 checkout；只调整对应工作包，不扩大为整体重写。

## ADR-XB-010：恢复中英双语目标，先做可行性调查

- **状态**：accepted for feasibility investigation only, 2026-10-02；没有接受双语路由/内容 schema/切换实现。用户重新提出“双语版，可以在顶部切换中文和英文”，满足 ADR-XB-003 的改判条件；旧 ADR 保留作为历史决策，本 ADR 取代其“不规划双语”的方向约束，当前中文实现继续使用。
- **背景**：Firefly 已有 `src/i18n/translation.ts` 的 typed UI keys、六套语言 catalog、默认/缺失回退与全局 `siteConfig.lang`；这可复用，但不等于成熟的逐路由中英系统。现有中文永久链接、公开资格、URL/base、Pagefind、Swup 与 About/配置文案需要一起评估。
- **候选**：仅切换界面语言但文章不分语言；构建期按真实 locale/配对路由提供页面；客户端运行时翻译；另建全新翻译平台。具体路由前缀、缺译页、偏好保存与搜索策略须在调查后比较，不能提前选定 schema 或许诺完整矩阵。
- **选择**：先安排 1–2 工作日工作量的有界调查，非日期承诺。盘点硬编码文本、现有 i18n 能力、Astro 配置/路由、文章 schema/ID/配对、全局及按语言索引、SEO/canonical/hreflang、部署 base 和软导航生命周期；用不发布真实草稿的最小原型验证框架能力。交付字符串/能力清单、路由/SEO/交互备选与新的实现 ADR，随后在 G6 确认默认/记忆/缺译与英文内容，再确定实现计划和验收矩阵。
- **约束**：复用现有语言包与发布/URL 契约，保留中文永久链接的回退路径；真实语言与 html lang/canonical 一致，hreflang 只列实际公开译文；不把中文正文套英文标签伪装译文，不自动批量翻译，不更改 draft 状态，不新增依赖/并行平台/发布。顶部切换应评估对应页面、锚点、键盘焦点、当前语言、SPA 返回/前进和重复监听；缺译、按语言搜索和双 base 均在调查中定义通过条件。
- **验证**：当前源码只确认 typed UI catalog 与全局语言选择；逐页面路由、译文配对、顶部切换、语言偏好、SEO 与 bilingual 搜索均未实现/验收。P8 调查结果及 G6 的当前状态只在 ROADMAP 维护，避免 ADR 变成第二张任务表。
- **改判条件**：框架能力或维护成本使某备选不能保持 URL/发布/浏览器契约，或者站主改变语言范围；提交最小对比与影响，由新 ADR 决定实现，保留当前中文版本可回退。

### ADR-XB-009 的受控整合与流程一致性验证（2026-10-02）

- **冲突取舍**：分别保留 canonical P0–P8/P2.5/G1–G6 和授权边界，将 incoming 的 P2 具体修复、route/base collision 语义及测试限制纳入既有历史证据段；不采纳旧候选里的当前“已接纳/下一步 P3”宣告。全文件复查同时消除自动合入的 M5 acceptance 与旧 not-implemented 状态，M8 保持当前接纳源。
- **一致性规则**：用户指令 → Zhenkun 项目附录 → 上游指导；DECISIONS 最新适用 ADR 管取舍，ROADMAP 管状态，PROCESS 保留五步循环/六层验证的分工，ERROR_MEMORY 管可执行经验，dated references 只证明特定 SHA/哈希和环境。候选 ROADMAP 是待整合的 canonical 修订，原仓库在 fast-forward 前仍为权威；不新增状态文档。
- **边界与证据**：两条 P2 cherry-pick 带原 commit provenance；旧证据/快照按原字节保留，新增 mapping/应用树等价/保护哈希/新验证独立落证据。ERROR_MEMORY 等于已复核 baf9b2d，排除 uncommitted P3。治理文件修改只澄清既有优先级与被接续方向，不放宽 push、部署、隐私、依赖、安全或删除权限；G1 独立复核前不接纳 P3、不修改原活动分支。

## ADR-XB-011：复用完整双 base 质量检查门控 Pages 候选

- **状态**：accepted for local CI implementation review, 2026-10-02；父任务转交独立复核精确 `decd04b084c917648163c44225451ad1ceb5ecbe` 接受本地实现，非 hosted CI 执行/生产验收。后续 Biome 修复候选与原仓库整合状态只在 ROADMAP。没有推送、部署或分支保护设置变更。
- **背景**：Biome 原触发 `master`，检查/构建 workflow 不含正式完整构建链，Pages 使用非 frozen 安装且不依赖质量检查；可能上传与已验证依赖/产物契约不一致的结果。
- **候选**：依靠分支规则与相互独立的检查；在部署 workflow 复制质量步骤；由部署 job 调用同仓库、同提交的 reusable `build.yml`。
- **选择**：最后一项。质量矩阵覆盖 `/` 和 `/Zhenkun-blog-site/`，运行 frozen 安装、源码 Biome、Astro、TypeScript、原生契约回归、正式 `pnpm build` 与 Pagefind/部署产物检查。部署自身在该门成功后 frozen 安装与完整构建，再验证即将上传的产物。Node/pnpm 固定与既有本地版本一致，不修改依赖声明或锁文件。保留既有 push/main 与人工触发入口、Pages environment/权限；`needs` 默认成功条件不加绕过分支。复用 workflow 的并发组与 Pages 的 `pages` 组不同。
- **取舍**：main push 时独立质量 workflow 与部署调用可能重复运行；部署也再构建一次，以验证实际上传产物。暂选清晰的同提交依赖图，优化重复成本另立有界改动。必需检查 job 名字改变须在 G4 核对，当前不操作 GitHub 设置；旧独立 Biome action 的 floating `latest` 保留为既存限制。
- **验证**：本地 YAML/命令语法和依赖图检查、新产物检查器回归及既有真实产物核验见 `references/p25-ci-2026-10-02/`。这些检查不能证明 Linux 干净安装或 GitHub Actions 运行。全仓 Biome 基线已有错误，不能因质量门阻止发布而弱化它；没有重试被自动审批拒绝的 pnpm 依赖安装路径。
- **依据**：[GitHub reusable workflow 文档](https://docs.github.com/en/actions/how-tos/reuse-automations/reuse-workflows)规定 `./.github/workflows/...` 使用 caller 同一提交；调用只配置 job `uses` 与受限 `contents: read`。
- **改判条件**：独立复核发现 hosted Actions/锁文件安装不兼容、required check 名称不匹配或重复成本不可接受时，保持未发布状态，另提最小修订；真实文章 P5 的公开计数/标题负向守卫须按已批准内容另审。

## ADR-XB-012：展示名与作者统一为 Zhenkun

- **状态**：accepted for owner direction and LOCAL implementation; exact 7ec53a2 independently reviewed PASS, directly approved by owner and guarded local FF accepted; no production acceptance. 父任务转交用户最新明确纠正“你记忆出了混乱？我说的是改为Zhenkun”（2026-10-02 09:28 UTC，Sentinel_f04a413208d08191a4e56aa919a1bbc7）。这是当前有效身份要求；任务执行/接纳状态只在 ROADMAP。
- **背景与替代**：此前资料提案把作者 Zhenkun 与品牌“Zhenkun”分开，并保留“Zhenkun”标题；最新纠正明确要求站点展示名称与作者都为 Zhenkun。旧分离/保留标题提案为 superseded，历史 evidence 留原字节，不能再作为活动指令。
- **选择**：siteConfig.title、navbar.title、profileConfig.name 使用 Zhenkun，About 介绍和公开身份关键词同步；现有页脚、Person/schema/meta author 和文章 OG 构建消费这些值。About meta description 使用已批准 profile bio。简介、公开 GitHub/邮箱和主方向 AI / 大气科学 / 生活随笔沿用批准值，不创造内容填充分类。
- **边界**：仅改变公开展示资料的本地候选；保留仓库名、GitHub Pages 域名和 /Zhenkun-blog-site/ 地址、现有草稿/分类、上游 Firefly/Fuwari/Astro 署名与 LICENSE。Logo 仍暂缓，P8 语言方案不由本次引入，不因此部署或公开真实文章。
- **验证**：四文件候选源码 `f0ea5164ab7e0ccc34ecfc478c6c3e5813a50db7` 的精确配置/源内容、六条实际构建路由的标题/导航/页脚/Person/meta/OG/Twitter、About 与 RSS 已核验；已有直接工具的 147 native、全源码 Biome、TypeScript/Astro、部署子路径完整八阶段构建及桌面/390×844 模拟 About 渲染 PASS。`references/owner-profile-2026-10-02/` 区分实际产物、源码消费与空文章库未生成的文章 OG PNG，保存失败首次尝试和恢复。无字面 pnpm 执行、干净安装/Linux/hosted/实体手机/生产结果的 PASS；此处验证不关闭 ROADMAP 的独立复核/接纳门。
- **改判条件**：站主进一步明确新的展示名/公开信息时以新明确指令接续本条；此前分离方案不能因恢复旧记忆而重新启用。

## ADR-XB-013：复用现有开关，修复动态端点并明确公开产物边界

- **范围**：P4 有界本地实现设计经精确 b0017e24 独立复核接受，沿用原开关政策；具体本地接纳/后续交互与发布状态只由 ROADMAP 记录。本条不接受服务激活、关闭项删除或生产发布。
- **背景**：导航、动态页/侧栏、评论子页及 sitemap 已消费现有动态父开关，但 local JSON GET 仍读取集合并渲染 Markdown。空动态库会隐藏这一不一致；关闭视图也不会移除公开 gallery 文件或静态 HTTP 200 跳转页。
- **候选**：仅修复漏掉的真实端点守卫并盘点所有现有开关；现在引入统一 registry/第二开关图；关闭后删除路由与资源；为了测试而启用所有外部服务。
- **选择**：第一项。真实 GET 在 processor/collection 之前消费 `siteConfig.pages.dynamic`，关闭时返回有正确 Content-Type 的 `[]`；启用模式保持原 Markdown、图片元数据、排序、JSON 和空集行为。不新增依赖/config、不移动内容。配置通过既有环境解析后消费，registry 仍是按实际重复成本评估的后续提案。
- **取舍与边界**：13 个 disabled static 页面/子页仍是指向 base 内 `404.html` 的 HTTP 200 meta refresh，占位页与真正不存在路径的 HTTP 404 分开记录；当前公开 gallery 四文件保留并可直达。页面开关是展示政策，不提供私密存储。giscus 保持已启用，真实文章/评论须按既有批准后实测；音乐/local、analytics 空配置、Memos/装饰/display 等沿各自现有设置，不自动启用或关闭。完整 enabled/unconfigured 外部服务矩阵不由 source guard 或空库构建冒充验收。
- **验证**：精确 `a353c2ee800bbff2865541288ea04308c245cdc5` 的实际 GET/真实 Markdown processor 内存回归含关闭 sentinel/禁止读取、启用非空/空集；before 2/4 失败、after 四项通过。新鲜全套 151 native、TS/Astro/Biome、部署 base 完整八阶段及实际产物/33 HTTP 见 [P4 report](../references/p4-capabilities-2026-10-02/report.md)。原根 base/28 HTTP 按原字节保留，另有 fresh 根产物检查与 root dist 归档；不声称重跑根构建。Pagefind raw fragment URL 与部署后的搜索结果 URL 分开核验，真实已生成模块/index/WASM 的 Node HTTP probe 证明结果解析，不代替浏览器 UI、Linux/hosted 或部署。
- **改判条件**：站主要求真正取消关闭路由/公开资源、引入私人相册、变更服务或遇到可复现的新配置分歧时，另做有界 ADR/授权与实际状态矩阵；不得由此候选放宽隐私、依赖、安全、删除、发布边界。

## ADR-XB-014：复用 catalog，以显式页面语言与真实译文配对渐进迁移

- **G6后续批准（2026-10-02）**：站主对保留中文URL + `/en/`、默认中文/本地记忆、诚实缺译、先Home/About/UI、同篇中英共享评论五点回复“可以”。以 `references/g6-owner-approval-2026-10-02/approval.json` 精确问答为依据，A作为该有界首增量方向；下文标为待G6的上述五点已由本条接续。英文bio的精确copy仍待审，任何真实译文公开、远端评论/安全/部署均不由这次批准覆盖。任务状态只在ROADMAP。 后续站主明确要求“界面一套中文一套英文，中文界面无需英文，英文界面无需中文”；导航/按钮/搜索/空态/错误/缺译/footer/About/accessible names遵循当前locale，窄保留proper names与中文/EN选择器，不做对照UI。父任务明确转交英文bio草案已接受，以上本条的bio待审限制由该后续记录接续；详见monolingual-ui.json。

- **状态/授权**：LOCAL feasibility accepted，精确922a249独立复核PASS后仅本地接纳调查文档/分析；implementation仍proposed。调查按ADR-XB-010的有界授权完成，接纳事实见ROADMAP和dated acceptance；推荐尚不等于G6产品选择或实现批准。当前任务状态只在 ROADMAP。用户已要求顶部“中文 / EN”；默认中文、记忆偏好、缺译交互、英文资料与首批译文仍须 G6 确认。本次只有文档、分析脚本和 synthetic 证据，无生产语言路由/切换实现。
- **背景与观察**：实际六套字典各 419 键，中英缺键/空值/命名占位符差异均为零，510 次直接调用分布 81 文件，可复用已有 catalog。AST 扫描 292 文件得到 146 个含汉字候选/30 文件，包含配置、别名、文件名及诊断；不是 146 个已确诊 UI 缺陷或 510 次必需改写。27 个路由文件无 locale 目录/hreflang，`i18n`、日期和配置时代码控件文案读全站语言；文章 `lang` 只作元数据，未承担配对/过滤。完整计数方法/源码哈希/实际函数测试见 [P8 report](../references/p8-feasibility-2026-10-02/report.md)。

### 两个现实选项

| 维度 | A：一个静态构建，中文原 URL + 显式 `/en/` 路由 | B：两个全站语言构建，再受控拼合产物 |
|---|---|---|
| 复用方式 | 保留 catalog，新增显式 locale 参数/页面上下文，共享页面 view；Svelte 通过 props 获取页面语言 | 复用真实 `PUBLIC_SITE_LANG` 全站开关，中英各跑同一正式流水线，English build 使用嵌套部署 base |
| 中文 URL | 保留现有首页/About/文章 ID 与地址 | 保留现有中文产物及地址 |
| 部署例 | 根 base `/` 与 `/en/`；项目 base `/Zhenkun-blog-site/` 与 `/Zhenkun-blog-site/en/` | 中文 base `/` 或 `/Zhenkun-blog-site/`；英文 build base `/en/` 或 `/Zhenkun-blog-site/en/`，输出到两个独立临时目录 |
| 语言读取 | render-time locale 显式传递；禁止构建中临时改全局配置，避免并发 prerender 串语言 | 原有 510 次调用可继续读每次构建的全站语言；owner config/About/文章仍需要语言选取 seam，不会自动翻译 |
| 特殊成本 | 共享 UI/日期/客户端 locale 迁移；配置时 Expressive Code collapsible 文案必须另测逐页支持 | 增加完整构建成本；需拼合 manifest、碰撞哈希校验、静态资源/字体/robots/sitemap/feed 归属规则，禁止无条件覆盖 |
| 搜索 | 一次 Pagefind 处理双语言 HTML，按文档语言初始化对应索引 | 两套 Pagefind bundle/index 置于各自语言 base，载入时隔离 |
| 发布契约 | 在剥离 deployment base 后识别 locale，再应用现有逻辑路由开关；共享 eligible+pair registry | 每次构建现有逻辑根开关可复用；拼合端必须核验两次 eligible/pair/discovery 与跨语言链接 |
| 验证覆盖 | 已实测最小 Astro 双 base/双 locale；完整 Firefly 与配置时插件仍未知 | 实测全站 locale resolver 可用；完整双语言流水线/拼合/碰撞/locale 内容选择未原型验证 |

- **推荐**：先按 A 做少量共享页面的可审查增量。理由是已有目录/布局/发布契约可继续共享，一个最终 artifact/质量门比较清晰，最小 Astro 与真实 Pagefind 分流已测通；这不是已证明 Firefly 整站可直接切语言。B 是可行的后备架构，适用于配置时插件只能可靠按全站语言生成、或显式 locale 迁移成本超出增量收益时；其未验证拼合风险不能隐藏成“只改环境变量”。实现第一轮必须验证配置时文本和共同布局；若失败，先回到此 ADR 改判，再实施 B。每个选项都需要公开译文与配对 schema，均不添加服务/翻译 API/依赖。
- **暂不选择**：仅客户端替换 UI 字符串（无法证明内容/SEO/搜索同语言）；自动机器翻译全部稿件；把中文正文重写到英文地址并声称译文可用；整体换框架；新增另一份开关图。

### 共同契约与无译文行为（待 G6 确认）

1. 中文永久链接、当前用户资料/稿件和 upstream 署名原样保留。UI 内部 `zh_CN`、网页语言 `zh-CN`/`en` 与路由 `/en/` 有明确转换，`lang` 空的历史中文稿按迁移约定归中文；不由 getTranslation 的未知值 English fallback 推导产品语言。A 的组件/客户端实例读当前页面 locale，不能通过切换全局 `siteConfig.lang` 来混合构建。品牌和作者均 Zhenkun；英文 bio/About/分类展示名须站主审阅，类别/标签 ID 不因翻译重命名。
2. 建议中文作为无指定语言的首页，显式 URL 总是优先。建议只保存站主/读者主动选择的偏好，用于首页入口提示和后续同语言导航；storage 不可用时退回 URL。不要自动把中文深链重定向到英文首页或覆盖指定语言。**默认/偏好两项是本 ADR 推荐，并非用户已经拍板。**
3. 译文资格是现有 eligible predicate AND 该语言实际已审阅公开内容；建议增加可选稳定 `translationKey` 和规范化内容语言映射，不改变原 `getPostId` 的稳定契约。配对 manifest 由 eligible 内容派生，验证每组每语言唯一、目标存在、ID/slug 安全与语言合法；不能只在相同文件名或 `lang` 上猜配对。译文独立 draft/private 状态保持；草稿译文不能进入 alternates、搜索、feed、API 或 sitemap。Wiki/内链解析优先当前语言已公开译文，否则明确链接中文原文，沿现有发布/附件保护，不泄漏未公开配对记录。
4. 无英文稿时不生成假英文页，不启用 Astro fallback rewrite。建议 EN 对应页选项显示“暂无英文版”，另提供有明确名称的英文首页入口；不能让 EN 对应页链接静默跳到无关首页。英文页可明确链接中文原文。双语页 canonical 各自指向其真实 URL；hreflang 只包含实际公开配对，绝对 URL、自指和相互返回。缺译页不声明不存在的 alternate。`x-default` 可只用于真实首页/语言入口，非强制所有文章。
5. deployment base、locale prefix、逻辑 route/ID 分层。原站 `site_url` 含子路径，Astro 7.2.10 的绝对 helper 会保留/重复它；推荐用实际 locale relative URL + site origin 解析为 absolute，或在经过完整 P2 回归后规范化 Astro `site`，但不得将已带 base 的 helper URL再次传入逻辑 route 加 base。当前 `/en/gallery/` 与 `/en/search/` 的实测过滤/canonical scope gap须先解决，再生成英文页；两语言 disabled 页、API、公开资源沿 P4 既有边界，不激活服务。
6. 首阶段建议跨语言 anchor 使用已支持的 `data-no-swup`，完整文档导航重建 UI/Search；同语言保留 P3 Swup/菜单/搜索会话。取舍是跨语言一次页面加载以及音乐播放位置是否延续：主题/音乐已有存储行为应实际验证，不能承诺不中断。installed Head plugin 已更新 lang，不代表缓存 Pagefind 自动切索引。以后软切语言须先测试销毁/reinit、旧请求、焦点与全局缓存，避免将旧索引当新语言。
7. Pagefind 1.5.2 公共 `createInstance({language})` 被 detectLanguage 覆盖，应依实际 `<html lang>` 初始化，英文选择不能靠该参数。当前双 base 的 fresh Worker/最小文档语言 seam 证明初始化分流，不证明浏览器转换。原 P4 单语言 About URL 核验仍成立，但其“显式 language”措辞不证明强制索引语言。生产 RSS、sitemap、标签/分类、OG/Person、评论 thread identity 与语言边界须从同一个配对契约消费；giscus 语言和同稿/分稿 thread 方案列入 G6，不擅改已有配置。

### 增量交付、验收与迁移

以下是架构依赖顺序/验收责任，不是第二张已开始任务表；执行状态只在 ROADMAP。

| 增量 | 可审查交付 | 必须证明的边界 |
|---|---|---|
| 语言/URL 基础 | typed locale adapter、eligible pair lookup、locale-aware logical policy；保留旧 ID/中文链接 | 中文/英文/未知/缺译/重复组/draft/private；根、项目、route/base collision；查询/hash；内链目标资格；不修改原稿发布状态 |
| 两个共享页面 | 先 Home/About common shell 与顶部 anchor；现有 catalog/日期逐页复用；站主审核英文文案 | 当前路由与渲染语言一致；全部 common UI/aria-label/owner copy/配置时插件实测；桌面/移动/键盘语义截图；theme/music 跨语言行为明确 |
| 有译文的文章 | 站主选定少量公开内容后增加配对 schema/route/OG/feed/discovery；其余保留中文 | 一组单语/一组双语/草稿译文/私稿/附件与 Wiki；canonical、自指 reciprocal hreflang、真实文章 OG/标题/正文语言；真实评论另验收 |
| 搜索与交互 | actual browser locale initialization，沿现有搜索 session/Swup | 两 base，各语言结果与 URL；清空/重开/快速替换/延迟/503、20 次同语言导航、跨语言返回、焦点/菜单锁；不可用储存和缺译不误跳 |
| 交付门 | 复用正式完整 pipeline 与 artifact checker；按选定 A/B 扩展同提交质量矩阵 | native/TS/Astro/Biome、完整双 base、所有本地 HTTP/artifact/browser；Linux frozen/hosted/required-check 是独立执行门；任何远端发布继续 G4 |

- **回退/迁移**：增量分 commit、保留中文路由与 schema 默认；失败时停止生成新增英文路由或回退该增量，不删除既有文章/资源、不重置用户工作。B 的两个输出先各自核验，再只通过 manifest 合并；重复路径必须明确同字节共享或拒绝，禁止 cp 覆盖。Feed/robots/404/OG 与标签汇总策略未定前不得发布合并产物。不为该调查重复完整根站构建，分析脚本/fixture 的成功不能替代未来完整源码质量门。
- **验证**：实际源函数 probe PASS；synthetic Astro 7.2.10 双 base 各五页、共 12 HTTP、Pagefind 1.5.2 两语言初始化和反例 PASS，raw site/helper及错误假设日志完整保留。生产 491 文件及 27 config/草稿保护哈希另核验。详情及限制见 P8 report/JSON；没有已实现全站双语、浏览器/生产 SEO/Linux/hosted 的 PASS。
- **依据**：[Astro i18n guide](https://docs.astro.build/en/guides/internationalization/) 与 [module API](https://docs.astro.build/en/reference/modules/astro-i18n/)用于路由语义；[Pagefind multilingual](https://pagefind.app/docs/multilingual/)用于 HTML 语言索引；[Google localized variants](https://developers.google.com/search/docs/specialty/international/localized-versions)用于 absolute/self/reciprocal alternates。实际安装版本另用本地生成物验证，文档不代替运行。
- **改判条件**：独立复核计数/样例不成立；G6 选择不同路径/回退；单构建配置时插件或 locale 传递无法可靠保持一致；真实正文/搜索/Swup/交付矩阵失败；维护成本/英文内容需求改变。先修订 ADR，再明确增量，不从调查自动升级到重写/批量翻译/外部发布。


## ADR-XB-015: Repository identity and address compatibility

- **Status**: Accepted by the owner on 2026-10-02.
- **Decision**: Use `Zhenkun-blog-site` for the primary directory, repository and Pages base; keep the public author as Zhenkun. The existing unrelated blog-example fork stays unchanged. Project scripts and author asset paths use the `zhenkun` prefix.
- **Delivery**: Prepare a separate change from the current remote main for the public site. The 38 existing local development commits are excluded from this delivery. Preserve repository identity, discussions and giscus repository/category IDs.
- **Compatibility**: Retain the old local directory as a symlink and use GitHub's native repository redirect. The owner subsequently chose to release the old website address and use only the new Pages URL. No additional compatibility repository is created.
- **Records**: The owner requested name normalization throughout historical text. Historical reports are reading copies; original measurement bytes remain recoverable from the commits they cite. Only fresh checks establish validation for this working tree. Git history is not rewritten.
- **Validation**: See ROADMAP for current checks and delivery status.

## ADR-XB-016: Bounded dependency remediation after phase-0 review

- **Status**: Selected for isolated candidate evaluation on 2026-10-03 under the owner's remediation authorization. This approves the planning direction, not compatibility acceptance, a waiver, source-branch integration or remote delivery. Execution state is only in ROADMAP.
- **Context**: The October 2 plan's 32 GHSA baseline is insufficient for the reviewed current/candidate graph. Fresh audit adds `http-cache-semantics`; maintainer sources add a sharp advisory missing from the audit, and serializer candidates have additional constraints. The union is 36 GHSA, with 34 current version matches and two candidate-only guards. The application tree remains the deployed monolingual baseline; P8-I1 is excluded.
- **Decision — old Swup chain**: Evaluate two exact-parent overrides from `@swup/parallel-plugin@0.4.0` and `@swup/route-name-plugin@4.1.0`, each declaring `@swup/plugin ^3.0.0`, to plugin **4.0.0**. This is an intentional cross-major override, not natural resolution. Official plugin 4 removes the bundling CLI; ESM/type entry bytes equal 3.0.1, while CJS has a statically reviewed lookup change. No newer published parent naturally repairs the chain in the captured metadata. Evaluate this before updating children that may disappear. Require actual parent-plugin ESM/CJS/types, requirements, mount/unmount/hooks/route/parallel behavior and complete site browser gates. Both optional plugin features default off in the current site, so ordinary site navigation alone cannot validate them.
- **Alternatives rejected/deferred**: Deleting microbundle's edge breaks plugin 3's published CLI contract; aliasing old terser to the new Rollup plugin is not a proven API replacement; blanket plugin or serializer overrides expand risk. If the selected experiment fails, return for complex review; only then consider exact `rollup-plugin-terser@7.0.2>serialize-javascript: 7.0.5` with real worker/serialization compatibility tests. Version 7.0.3 remains DoS-affected; 7.1.1 is separately XSS-affected. Current serializer 4.0.0 is not affected by those two candidate guards but retains its historical RCE version match.
- **Decision — native chain**: Evaluate sharp 0.35.5 for root, Astro and exact Miniflare parents, with undici 7.29.1 for the current Miniflare. Latest captured Cloudflare/Wrangler/Miniflare metadata still pins sharp 0.35.4 and expands workerd/prerelease scope, so broad parent updates are not the first candidate. Verify Linux native library versions and the actual used API; do not activate or remove Cloudflare capability. Pages checks must leave CF_WORKERS unset, not set it to the truthy string `false`.
- **Decision — cache blocker**: Audit claims a 4.2.1 repair, but the official advisory supplies no patched version, the npm version endpoint returns 404, and latest remains 4.2.0. No invented version or ignore rule is approved. Current Astro image-build calls do not establish a shared user cache/max-stale exploit, but the affected version remains open. A verified upstream/parent repair, separately reviewed patch design or explicitly approved expiring exception is required before release closure. No exception is granted by this ADR.
- **Contracts**: Preserve Node/pnpm pins, allowBuilds, formal TypeScript declaration checks, frozen installation, full two-base build/Pagefind, draft and disabled-page rules, current UI/Swup contracts and remote authorization boundaries. Do not mix bilingual implementation, content publication or website optimization into remediation. Security checks must include the bounded official advisory union, not only registry counts, and treat unavailable/invalid audit data as non-success.
- **Evidence**: [Phase-0 review](../references/dependency-phase0-2026-10-03/phase0-review.md), [advisory ledger](../references/dependency-phase0-2026-10-03/advisory-matrix.json), [official package comparison](../references/dependency-phase0-2026-10-03/package-source-review.json), [registry metadata](../references/dependency-phase0-2026-10-03/registry-sources.json), [audit receipt](../references/dependency-phase0-2026-10-03/audit-receipt.json). Source selection and metadata are verified; candidate execution is unverified.
- **Reconsideration / rollback**: Reconsider on changed parent ranges/releases, new relevant advisories, failed actual-parent/native/browser tests, larger unexplained lock changes, new exposure or a different accepted application baseline. Revert one candidate through a new commit with consistent dependency configuration and lockfile; preserve evidence and report any reintroduced vulnerabilities. A proposed exception has an explicit owner/date, at most seven days before review (initial proposed date 2026-10-10), immediate invalidation on exposure change/repair publication, and leaves total remediation partial. Overrides require a review date and removal when the parent range or graph makes them unnecessary.
