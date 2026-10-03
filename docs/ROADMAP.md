# Zhenkun-blog-site 路线图（单一任务状态源）

> 规则：任务状态只有 未开始 / 进行中 / 完成（完成必须附验证证据）。每次会话结束更新本文件；跨会话恢复先读本文件。当前断点见文末。

## M1 MVP —— Firefly 底座本地跑通（已完成）

- [x] M1-1 git init，Firefly 以 `upstream` 远端接入，本地 main 基于 upstream/master（db331cf）
- [x] M1-2 环境：Node 24.20（要求 ≥22.23）、pnpm 11.22.0（corepack，与 packageManager 锁定一致）
- [x] M1-3 Phase 0 文档骨架（AGENTS 项目约定 / ROADMAP / PROCESS / DECISIONS / .gitignore 追加）→ commit 2ffcda9
- [x] M1-4 `pnpm install` 成功（59.2s）→ PASS
- [x] M1-5 `pnpm dev` → localhost:4321 渲染验证 → PASS，截图 `references/m1-home-light-1280x720.png`
- [x] M1-6 最小配置：站点标题占位（title/subtitle/navbar.title）→ commit 4714c14

验收标准：dev 服务器正常渲染默认首页；`pnpm check` 无错误（253 文件 0 错误 0 警告 PASS）；全部改动独立 commit 可回退。

## M2 站点基础配置（进行中）

逐项拍板，每项一个 commit：

- [x] 站点信息：title / subtitle / description / keywords / site_url / siteStartDate → 用户定稿已应用（"Zhenkun / 记录、思考与灵感"），GitHub Pages URL
- [x] 历史头像与资料（文字部分；新作者/品牌映射见 M8/P7）：profileConfig 昵称"Zhenkun"、bio 代拟、GitHub/邮箱/RSS 链接 → **头像已替换为用户图**（2026-09-06，assets/images/zhenkun/avatar.avif）
- [x] 图片素材入库：用户图 6 张统一转 AVIF 新增（头像 1 + 桌面壁纸 3 + 手机壁纸 2），上游原图未动，壁纸未启用待 M4
- [x] 清理演示内容 1/4：关于我页 → 用户审核定稿已上线（含气象×AI 背景段落）
- [x] 清理演示内容 2/4：演示文章 → 语法参考 7 篇+7 图移 `references/firefly-syntax-examples/`；推广/演示 15 文件删除（commit 082fdd1）
- [x] 清理演示内容 3/4：4 条演示动态删除（commit f37b7e0）
- [x] 清理演示内容 4/4：留言板/友链模板保留；2026-10-01 友链模板的上游个人资料已清空，启用前需填充自己的信息
- [ ] 导航栏：navBarConfig（菜单项、Logo、模式）
- [ ] 侧边栏：sidebarConfig（组件取舍）
- [x] 页面开关：友链 / 留言板 / 动态 / 相册 / 书签导航 / 打赏 全部关闭（导航自动隐藏；上游推广菜单已移除，保留 MIT 署名）。2026-10-01 审查确认 Pages 产物是 HTTP 200 HTML 跳转占位页，当时跳转错误指向站外根路径；P2 修正候选与当前 G1 接纳范围见 M8
- [x] 评论系统选型：giscus，已按 ADR-XB-005 配置；首篇文章发布后的真实评论交互仍待验收
- [ ] 公告栏演示文案替换或关闭（announcementConfig.ts，侧栏"欢迎来到我的博客！这是一则示例公告"）——M2 遗留小项，可与 M4 一起处理

验收标准：改动后 `pnpm check` + dev 渲染正常，每项独立可回退。

## M3 GitHub Pages 部署（已完成 2026-09-05）

- [x] ADR：部署方式 → ADR-XB-004（Actions 构建发布 Pages，DEPLOY_BASE 环境变量注入子路径）
- [x] base path 处理 → `astro.config.mjs` 环境变量方案 + 三个组件链接渲染补 base-aware `url()`
- [x] site_url 与 sitemap / RSS 对齐 → siteConfig 早已指向 Pages URL
- [x] workflow 文件 + 首次部署验证 → 上游 deploy.yml 触发分支改 main；**push 触发首次部署 59s 成功**

验收标准：**PASS** — 线上 https://zhenkun26.github.io/Zhenkun-blog-site/ 首页/关于页 200，标题正确，资源带子路径前缀；截图 `references/m3-live-first-deploy-1280x720.png`。

## M4 外观逐项迭代（参考 rainzt.cn，进行中）

原则：**一次只做一项**，完成后截图对比 → 用户确认 → 下一项。候选池（顺序待定）：

- [x] 横幅文案：主标题 "Welcome to my little corner"（3.5rem）+ 三条中文打字机副标题 → commit 024d119，线上验证通过
- [x] 亮/暗切换：改为点按直接翻转 + View Transitions 圆形扩散动画（圆心=按钮，圆内新色/圆外旧色）→ commit 2476cae，动画帧截图 `references/m4-theme-toggle-mid.png`；三选一下拉移除，"跟随系统"保留为初始默认
- [x] 主题切换动画兼容性修复：圆心显式取按钮位置（实体设备圆心漂移 bug）→ commit 42d5db0
- [x] 主题切换 HiDPI 二次修复（2026-09-06）：确认 px 裁切圆心与 DOM 坐标不一致；改为百分比圆心/半径 + CSS 快照动画，绑定组件按钮并防止过渡重入。`pnpm check` 253 文件 0 错误/警告、`pnpm type-check`、`pnpm build` PASS；内置 Chromium DPR=2 中间帧验证 PASS，`references/m4-theme-percent-light.png`。实体 Chrome/Edge 与线上发布后验收待完成，不能由内置浏览器结果代替。
- [x] 仓库治理：main 分支保护、Dependabot PR 清理并关闭自动更新、README 重写（注明 Firefly 来源）、firefly-base 基线分支 → commit 1a9bfa3/9e523a6
- [ ] logo（蝴蝶×梅枝）：两稿均不满意，**用户要求搁置**；候选池保留，等灵感或用户供图
- [x] 评论系统：ADR-XB-005 批准并执行完毕（giscus App 已安装、配置上线、本地渲染验证 PASS）
- [ ] 第一篇文章：草稿已写（blog-launch.md，draft:true 未发布），**待用户审核**后改 draft:false 发布
- [ ] 背景壁纸模式（backgroundWallpaper.ts：banner / 全屏 / 透明 / 纯色；素材已入库可选用）
- [ ] 主题色相（hue）与明暗默认模式
- [ ] 字体方案（fontConfig.ts）
- [ ] 文章列表布局（list / grid / masonry，封面位置）
- [ ] 特效取舍（effectsConfig.ts 樱花等）
- [ ] 页脚（footerConfig）

验收标准：每项独立 commit + 前后截图留档 `references/`。

## M5 审查整改（2026-10-01，进行中）

- [x] 审查报告与证据：`references/audit-2026-10-01/report.md`
- [x] Evaluated remediation proposal: `references/audit-2026-10-01/remediation-plan.md`; packets A–E separate author cleanup, deployment/feed correctness, interaction, dependencies/delivery, and reader experience.
- [x] Authorized local template cleanup: upstream contact/payment/account values cleared, schemas/components retained, empty hero links hidden, video disabled. Fresh check/type-check and desktop/mobile dev rendering PASS at local acceptance; production delivery is now complete through PR #20 (see the current checkpoint).
- [x] Complete local author-asset cleanup and production acceptance after the owner's exact tool/two-file exceptions: only the two payment-code originals removed; templates retained. Fresh check/type-check, both complete builds, artifact/HTTP and desktop/mobile preview acceptance PASS. Evidence: `references/refactor-2026-10-01/author-cleanup.md`. Subsequent production delivery is recorded under PR #20 in the current checkpoint.
- Historical F04–F07 execution evidence (2026-10-02): isolated P2 的 116 回归、双 base/HTTP/合成 OG/Edge 原始材料留在 `references/engineering-2026-10-02/report.md`；**当前接纳状态只见 M8/P2 与 G1**，不以本历史条目宣布原分支接纳或上线。
- F02 first-search / F03 mobile modal keyboard 的执行、最终验收与未验证项统一见 M8/P3；不保留另一份“未实现”状态。
- [x] Dependency remediation planning: [detailed plan](DEPENDENCY_REMEDIATION_PLAN.md), with a fresh production/full audit baseline, verified published patch candidates, parent constraints, staged remediation, CI gates, regression acceptance and rollback. Evidence: `references/dependency-remediation-2026-10-02/`. Planning only; candidate compatibility is not yet tested.
- [x] Dependency phase 0: official advisory/registry reconciliation, actual parent-edge ledger, exposure review and bounded implementation packets, in isolated `codex/dependency-phase0-20261003`; see ADR-XB-016 and the current checkpoint. This is planning/evidence completion only, pending coordination into the source branch.
- [ ] Targeted dependency implementation R1–R5 remains not started. Next packet: R3 two exact Swup parent overrides, then recalculate remaining graph before other updates. Fresh 2026-10-03 audit: 51 records / 33 GHSA / 10 packages (25 high, 19 moderate, 7 low); reviewed official union: 36 GHSA, 34 current version matches and 2 candidate guards. The new cache advisory has no verified published fix. No dependency versions or CI workflows changed; historical release checks do not close these issues.
- [ ] Production empty state and accessibility follow-up — proposed; draft publication still requires owner review

## M6 Reference assessment and architecture direction (planning complete; local implementation started in M8)

- [x] Clarified scope: one Zhenkun-blog-site, informed by CuteLeaf and rainzt; no second repository is involved.
- [x] Live desktop/mobile UX and sampled keyboard review; accepted screenshots, rejected-capture manifest, and the six-step assessment are in `references/comparison-2026-10-01/report.md`.
- [x] Pinned public-source and local-capability review: separate current live behavior, public version snapshots, local implementation, and recommendations. Independent source review corrected calendar metrics and service-verification wording.
- [x] Target contracts and proposed direction: `docs/ARCHITECTURE.md` and ADR-XB-006. Keep Firefly/Astro/Svelte; adapt selected capabilities incrementally. 当次为规划快照，未执行应用改造；后续实施状态见 M8，不代表当前仍未实现。
- [x] Asset inventory and intake/publication instructions: `references/comparison-2026-10-01/asset-brief.md`. Existing avatar + five wallpaper candidates verified; no new material is needed for correctness repairs.
- [ ] Accept/implement structural changes in focused packets after M5 cleanup acceptance: deployment/feed contracts → search/menu → capability/publication policy → reading/identity → optional content modules. Visual choices remain one variable per owner review.
- [ ] Projects or feed aggregation are optional future increments. No upstream merge, backend, dependency change, scheduler, service account, or copied reference author/media data is authorized by this plan.

## M7 Authoring workflow assessment (publication repairs accepted; authoring pilot pending)

- [x] Distinguish reference Wiki syntax from authoring/synchronization/publication: CuteLeaf's direct posts-as-vault workflow confirmed; Aemeath public conversion confirmed; rainzt's actual Obsidian use remains unverified. Evidence: `references/authoring-2026-10-01/report.md`.
- [x] Fresh local Wiki/source and controlled in-memory AST review; documented draft metadata, deployment-base, missing/ambiguous-target, extension, and implicit-ID gaps. 该次研究未修改源码；后续修复见 M8/P1，研究证据不等于生产验收。
- [x] Official Space/Obsidian capability review, complete read-only Space metadata listing, and whitelisted existing-vault settings inspection. No Blog Space existed in the accessible listing; no Space write, private note read/upload, or vault configuration edit occurred.
- [x] Tailored ownership and rollout proposal: ADR-XB-007 and the ARCHITECTURE manuscript/editorial contract. Recommend Obsidian manuscripts + optional Space editorial suggestions + explicit Git publishing derivatives; start with one manual article.
- [x] Implement Wiki publication-aware lookup, loader-aligned IDs, deployment-aware links and actionable diagnostics in M8/P1, with fresh source/build/controlled-transform acceptance. Manual authoring/public-article acceptance remains separate.
- [ ] Owner-selected public-safe article/asset pilot, after applicable source repairs and production-verification boundary are resolved. Existing launch draft remains unapproved; `draft:true` must not be treated as private storage.
- [ ] Create/use a private Blog Space if explicitly requested, with selected context and an accepted text/asset conversion sample. No recurring task or publishing synchronization is enabled by this plan.
- [ ] Consider a bounded one-way `zhenkun-*` exporter or authenticated Space adapter only after manual usage demonstrates repetition; no new dependency, watcher, automatic deletion, or delivery implied.

## M8 Engineering refactor（2026-10-02，进行中）

`docs/REFACTOR_PLAN.md` 保留 P0–P7 的原范围；本节是唯一任务状态。新增 P2.5 质量门与 P8 双语调查，不重编号已有任务。顺序：完成 G1 候选接纳 → P3 最终验收 → P2.5 三项独立 CI 改动 → 已确认站主资料独立配置；P4 与真实文章 P5 按依赖验收，P6/P7 的可选集成与视觉另行选择。用户已授权继续本地开发，G1 不因该授权或 fetch 自动完成。

The local-acceptance entries below retain their original scope and commit evidence. Their accepted production changes are now published through PR #20 at `43c21ad`; see G4 and the completed development release checkpoint. P8-I1 application code remains unaccepted and excluded.

- [x] P0 上游个人资料/支付素材清理：`059d22816dbedf946de96edaccc85d2d556dcdbe`，保留框架模板与 MIT 来源署名。证据：`references/refactor-2026-10-01/publication-contract.md`、`references/refactor-2026-10-01/payment-asset-removal.json`。
- [x] P1 article/Wiki 契约本地接纳：`57bed16360c915c17e45ebaf9ac11540c961741e`。发布资格、ID、URL、源输入准入、原生 Markdown/MDX 预检和消费者统一；74 项回归、类型/完整检查、双 base 完整构建及相应产物/HTTP/浏览器证据，见 `references/refactor-2026-10-01/publication-contract.md`。真实公开文章仍属 P5。
- [x] P2 本地整合接纳（G1 完成，仅 LOCAL）：原仓库已有本地 review ref `refs/heads/codex/review-p2-deployment-contracts` → `baf9b2d29310c7b32f6c23934802be3cc54ba022`；其父提交为 `a32502b06cb83c7a2d14d03eafc25d1947c56efc`，共同 P1 基线为 `57bed16360c915c17e45ebaf9ac11540c961741e`。此次从原仓库该 ref 建立独立 detached 源码视图，重跑 120/120 原生回归 PASS；原活动分支已守卫后以 `--ff-only` 整合独立复核通过的 `ad1a04f20ac5d92f64aacfa5bdf90767f6e5f421`。P2 范围为 public/emitted media、全局 OG/过滤页 canonical、禁用路由与 sitemap、RSS UTC 日期/频道和 robots base；HTTP 200 stub 限制继续单列。证据：`references/plan-reconciliation-2026-10-02/g1-evidence.json`、`native-tests-120.log`。
- [x] P3 本地接纳（仅 LOCAL）：独立复核精确 `289cb6183d16b6cac62c18c84758c02bc8fb6289` PASS，按原 HEAD `cb667956b7785ad7f553768628907cb20e6d1693` / 活动分支 / clean tracked-index / 祖先关系 / 50 个 dirty P3 文件与 .workbuddy 守卫，本地 `--ff-only` 接纳。搜索 `f2d0c26`、菜单 `099eebc`、格式 `2781650` 与最终证据分别提交。502 production files / 九处变化 / 55 个客户端 JS 等同性与准确测试绑定见 `references/p3-import-2026-10-02/`；本地接纳证据见 `references/p3-local-acceptance-2026-10-02/`。P3 不代表远端 main、真实文章/评论或生产发布验收。视口改动后的定位首击限制与实体设备、Linux/干净安装未测项保留。
- [x] P2.5-A CI 分支（仅 LOCAL 实现接纳）：`6242cc809095a1dfa50b971eb777f57be167284e` 将 Biome push/PR 对齐 main；精确 `6f551119016cb79f978d218c2606cfa8996f440b` 独立复核 PASS 后，经用户直接批准和守卫本地 fast-forward 整合。未触发远端。
- [x] P2.5-B CI 完整质量流水线（仅 LOCAL 实现接纳）：`ac96dcc9df8680788582cf41c1655e1e55041c1b` 的正式完整双 base/类型/契约/Pagefind 质量门与修复 `6e0ca6122271042f1801701732c2ab678f372081` 已随精确复核 6f551119 本地整合。源码 6e0ca61 实测 full Biome 298 文件、147 native、直接类型/Astro PASS；本次接纳只重核 Git/保护守卫，不把旧测量当成 fresh 执行。Linux/hosted/required-check 验收 OPEN。
- [x] P2.5-C 部署锁文件与质量门（仅 LOCAL 配置接纳）：`13f8956e09ef1baa07ef855be4ffa774650b6675` frozen 安装、同提交 reusable 门及上传前产物核验已随独立复核 6f551119 本地整合，原 Pages 权限/环境/并发保留。没有实际部署执行或生产接纳；G4 保留。
- [ ] P2.5 执行验收（OPEN）：Linux frozen 干净安装、hosted Actions 完整双 base 流水线及 required-check 名称兼容性尚未验证；本地实现接纳/质量准备不等于这些运行或发布验收。
- [x] P4 功能开关一致性（仅 LOCAL 实现接纳）：独立 6.1 Sol 复核精确 `b0017e24ce813fb43fefb3046737660e8e70a5ad` PASS 后，按父任务当前明确指令及原 HEAD `795e7d1d3e0cd4ea4de1dd41c83e40d3f5ca647c` / branch / clean tracked+index / 祖先 / 491 source hashes / 47 evidence hashes / 27 config 原样 / 50 P3 文件 / .workbuddy / main 守卫，以 `--ff-only` 本地接纳。源码为 `a353c2ee800bbff2865541288ea04308c245cdc5`，仅真实动态 GET 开关守卫和四项回归；执行方 fresh 151/TS/Astro/Biome299/子路径八阶段/33 HTTP/真实 Pagefind Node 索引解析与原根快照分开留档，独立复核测量按父任务转交记录。报告与矩阵：`references/p4-capabilities-2026-10-02/`，本地接纳：`references/p4-local-acceptance-2026-10-02/local-acceptance.json`。13 个 HTTP200/meta refresh stub、四个公开 gallery 资源继续保留；giscus 已启用但真实文章/评论、默认浏览器 Pagefind、完整启用/缺配置外部服务、Linux frozen/hosted/required checks 与生产验收 OPEN。无模块激活、配置变更、文章公开或远端操作。
- [ ] P5 首篇真实文章演练：绑定现有 `src/content/posts/blog-launch.md`；`draft: true` 保持，文章内容、公开附件、永久链接与发布目标待站主审核。前置为相关 P0–P4/质量门；先做受控预览和发布验收单，再按 G3/G4 批准范围公开，不另外杜撰首篇文章。
- [ ] P6 可选写作入口：沿 ADR-XB-007 评估唯一稿源、Obsidian/Blog Space 的收益与单向转换；P5 之后按真实需要启动，私人 vault、Space 创建/上下文上传、同步和凭据保留各自边界。
- [ ] P7 资料与阅读/视觉：资料子项已完成，仅 LOCAL：展示名、站点 title/navbar 与作者均统一 **Zhenkun**，旧品牌/作者分离方案由 ADR-XB-012 superseded。已批准简介“探索气象学、人工智能与计算机科学的交叉，记录学习、实践与生活。”、GitHub `https://github.com/zhenkun26`、邮箱 `zhenkunz25@gmail.com`、主方向 AI / 大气科学 / 生活随笔已应用。独立复核精确 `7ec53a2a7d9557ecbda89319e55c48d3fdca2e66` PASS 后，用户直接批准 a3d1a9a → 7ec53a2，守卫本地 fast-forward 接纳；源码为 `f0ea5164ab7e0ccc34ecfc478c6c3e5813a50db7`。执行方六路由/147 native/全源码 Biome/类型/Astro/部署子路径八阶段/桌面与模拟 About 日志在 `references/owner-profile-2026-10-02/`；父任务转交独立复核九条 rendered pages 等 PASS，接纳证据在 `references/profile-local-acceptance-2026-10-02/`。仓库 URL、草稿分类、许可证与来源署名保留；其他阅读/视觉项、真实文章 OG PNG/评论、实体手机、Linux/hosted/生产验收仍未关闭。Logo 继续暂缓。
- [x] P8 中英双语可行性调查（完成，仅 LOCAL 文档/分析接纳）：独立复核精确 `922a2490b52a501a84aa60b2dacb33422d6aa913` PASS，经当前明确接纳指令和原 `04cbf0bfbf13ff8a17f0ba66ed2277526b6e5139` / branch / clean tracked+index / 祖先 / 491生产文件 / 27配置目录文件 / 33证据文件 / 50受保护文件 / .workbuddy / main 守卫，本地 `--ff-only` 接纳。AST 盘点292文件，六套各419键字典，中英缺键/空值/命名占位符差异零；510调用/81文件、146 heuristic Han候选/30文件、零parser diagnostics。原实际函数与synthetic双base各五页/共12 HTTP/真实Pagefind初始化分流测量、raw site/helper和恢复限制保存在 `references/p8-feasibility-2026-10-02/`，本次仅fresh Git/哈希检查，不重复构建或把Node seam当浏览器验收。ADR-XB-014比较单构建显式 `/en/` 和双构建拼合，推荐A与渐进Home/About/UI，默认中文/记忆偏好/诚实缺译/英文资料/配对共享评论仍待G6站主确认；接纳调查不接受这些产品选择或双语实现。接纳材料 `references/p8-local-acceptance-2026-10-02/local-acceptance.json`；无生产源码/配置/schema/文章修改、新依赖/服务或远端公开。

- [ ] P8-I1 双语首个增量（进行中，a06独立复核BLOCKED，修复候选待新复核）：独立复核精确 `a06b5302cbc3cbcf7798ba63b77e0af5207a0269` 指出两项P1：英文MusicManager实际error事件中文、正式 `tsc --noEmit --isolatedDeclarations` 的TS9007；先前 `--isolatedDeclarations false` 空日志不证明声明gate，原报告该广义PASS由本条纠正。隔离 `codex/p8-home-about-shell` 以 `094770374a7ef8ee9e82197b5d66513f2f565063` 修复producer事件/恢复state同locale，并以 `d6b5056d1c385cccbacb165e3664a7dfb1597af0` 补显式lookup返回类型/新脚本格式。新实测应用/构建/测试源码 `d6b5056d1c385cccbacb165e3664a7dfb1597af0`：4项真实配置+handler+view regression修复前全FAIL、修复后PASS，禁止媒体播放/fetch；165 native、精确声明类型gate（保存command/argv/source/exit0）、Astro265文件0error0warning12hint、源Biome306和3个新脚本Biome、双base各八阶段与四页完整monolingual static/metadata/artifact通过。音乐inline产物变化，已重建双base，不将5432610旧browser/HTTP记录当fresh新源码证明。Home/About共同UI有界范围、原始音乐作品/artist精确例外和关闭settings保持，真实文章/comment、配置时文案/feeds/soft locale另行增量。新 [fix review packet](/Users/zhenkun/Documents/Codex/2026-10-02/task-4/tmp/p8-shell/references/p8-shell-review-fixes-2026-10-02/report.md) 与quality-gates.json保存测量；本canonical remediation checkpoint将被语义合入候选，最终精确候选HEAD由交接告知，新独立review未PASS，不自动接纳。原70证据/50 protected/main/.workbuddy守卫通过；无应用源码整合、push/main合并/配置/服务/依赖/文章公开/部署。

### G1–G6 决策门（与执行任务分别记录）

| 门 | 决策与范围 | 当前状态 / 下一条件 |
|---|---|---|
| G1 候选接纳 | 是否将独立复核的 P2 整合进原工作分支 | **本地接纳完成，后续已随 PR #20 发布**：独立复核精确 ad1a04f PASS（120 回归、498 production files、30 evidence hashes、168 historical blobs、50 P3 文件与 .workbuddy）；守卫原 ac4be59/clean tracked/index/目标 SHA/保护哈希后，本地 `--ff-only` 接纳 ad1a04f。G1 原接纳不代表远端发布；本次 Linux/干净安装与线上 GUI/部署证据见 G4。物理设备、真实文章/评论及 HTTP 200 stub 限制仍保留。 |
| G2 产品范围 | 可选模块保留/关闭，是否接受当前 stub 限制 | **进行中**：P4 有界开关矩阵经精确复核已本地接纳，保留13个 HTTP200 stub/四个公开 gallery 文件限制；giscus 沿 ADR-XB-005 已启用，真实文章/评论与其他启用服务交互未验收。其他服务/模块不新增启用。 |
| G3 内容与地址 | 真实文章、公开附件、永久链接；身份资料映射 | **进行中**：Zhenkun 资料经精确复核、直接批准已本地接纳；旧身份分离提案 superseded。P5 现有 blog-launch 草稿仍待内容/附件/地址审核。资料接纳不等于文章发布。 |
| G4 对外操作 | 分别授权推送、合并、部署及目标，分支保护/必需检查或权限变更 | **本次38项工程交付完成**：用户明确授权审查通过后提交、合并与发布；PR #20 已合并，`43c21ad` 在 Pages run `37032943481` 成功部署并通过线上验收。原分支与保护保留；双语候选、文章公开和依赖升级仍在本次发布范围之外。 |
| G5 写作与视觉 | Obsidian/Blog Space 采用方式；每项视觉改动 | **未开始**：P6 仍为可选；P7 一项一审，Logo 暂缓。 |
| G6 双语细节 | 默认语言、偏好记忆、语言路径、缺译交互、英文资料、选定译文 | **完成，五点方向已批准**：站主对“保留中文网址、英文用 `/en/`；默认中文并记住选择；缺译明确提示；先做首页、About和界面文案；同篇中英文共用评论”回复“可以”，精确转交记录在 `references/g6-owner-approval-2026-10-02/approval.json`。后续明确要求两套单语言UI，中文无需英文、英文无需中文；保留proper names和中文/EN选择器。父任务明确转交英文bio已接受，记录见 `monolingual-ui.json`；未批准真实文章翻译/公开或远端giscus操作。首个LOCAL增量见P8-I1。 |

### 六步质量门（依同一被审查源码快照执行）

保留 `PROCESS.md` 的五步改动循环；下面六步是质量/发布验证层次，不替代五步流程。结果标为 PASS / FAIL / BLOCKED / NOT_APPLICABLE；未运行单列 **未执行**，不算 FAIL 或 PASS。每项材料绑定准确 Git SHA、命令/环境、预期与实际；P3 未提交时先绑定逐文件哈希，提交后补精确 SHA。

| 顺序 | 检查 | 通过标准 |
|---|---|---|
| 1 环境 | 固定运行时/包管理器、干净安装、锁文件约束 | 记录版本，frozen 安装不改锁。2026-10-02 发布复核已在 GitHub Ubuntu runner 以 Node 24.20.0、pnpm 11.22.0 对双 base 完成 frozen 干净安装和全部质量检查；证据见当前断点。 |
| 2 静态 | 格式/改动范围、TypeScript/Astro、发布/URL/生命周期契约回归 | 适用检查无错误；现存 hints 逐项分级，不写成“零问题”。本次发布 fresh 151/151 原生回归、全源 Biome、精确 TypeScript 与 Astro 检查 PASS；其他旧日志按 SHA 保留为历史证据。 |
| 3 完整构建 | `/` 与 `/Zhenkun-blog-site/` | 使用正式完整脚本链，包含生成步骤、Astro 与 Pagefind；不能用单独 astro build 代替。 |
| 4 产物 | URL、公开资格、RSS/sitemap/robots、OG/图片及本地 HTTP | 无重复 base/错误 origin；仅合格内容入索引；OG 1200×630；草稿/关闭项负向断言。HTTP 状态、404 内容和 meta refresh 分开检查，不把当前 HTTP 200 stub 当真 404；不写死 sitemap 项数。 |
| 5 交互 | 搜索、菜单、主题/导航 | 首次/重复/并发/清空/失败/退出、键盘与窄屏、SPA 往返均有实际浏览器证据；Chrome、Edge、手机模拟/实体设备及 viewport/version 分开记录。双语矩阵待 P8 调查决策后确定。 |
| 6 发布门 | 独立复核、批准、远端精确 SHA/必需检查、部署后真实 URL | 本地接纳/已复核/批准/已发布分别记录；G3/G4 齐全才发布，检查线上响应/资源。本次38项候选已按明确授权完成精确 PR/main CI、部署产物和线上 HTTP/GUI 验收；不扩展为双语候选或真实文章/评论接纳。 |

两种 base 都检查：首页/公开样例/静态资源/canonical/OG/feed 的正向 URL；草稿、禁用模块、同名 Wiki、私有 metadata/附件的负向边界；RSS 日期/robots/sitemap/图像字节；慢网、缺资源、旧查询、重复监听、焦点与滚动锁。真实库目前只有一篇 draft、零公开文章；获准 synthetic 样例的证据不得代替真实文章/评论验收。

## 当前断点

### Dependency A/R3 — 2026-10-03 — BLOCKED before frozen install

- **Scope/base**: Owner-authorized A/R3 only, isolated `codex/dependency-ar3-20261003` at `/Users/zhenkun/Documents/Codex/2026-10-03/task-3/zhenkun-ar3`, from exact phase-0 commit `96b7b899dbe80aadd68f83a7ba1482bf386d0eb1`. Node v24.20.0 / pnpm 11.22.0. Related writers inspected idle; no bilingual/application/CI changes. Runtime model setting remains UNVERIFIED.
- **Executed**: Exact two parent overrides and official-registry `install --lockfile-only --ignore-scripts`; initial default-store access failure recorded, same command succeeded with reviewed escalation. No alternate store or security setting change. P3 brace-expansion ledger correction now takes prod/full path union (33 paths for each of three rows); original audits retained.
- **Stop condition**: Generated lock shrinks 1350→942 package records, with 408 removed nodes reachable from plugin 3 and no new/changed package records. However both existing Vite 8.2.2 snapshots change `rolldown: 1.2.4→1.2.7`, beyond the two parent edges. Locked metadata/optional flags also change. Under the packet acceptance rule, candidate is BLOCKED for Astra review; no manual lock correction or fallback override attempted.
- **Evidence**: [A/R3 report](../references/dependency-ar3-2026-10-03/report.md), complete lock diff, structured graph review and official raw prod/full audits. Both lock-only audits exit 1: 44 records / 31 GHSA (21 high, 16 moderate, 7 low), versus phase-0 51 / 33. Sharp official-only advisory remains additional; cache remains affected with no verified published fix and no waiver.
- **Gates**: Frozen install, actual ESM/CJS/types/requirements/Swup lifecycle/route/parallel gates, check/type-check/Biome/native regression, both full builds/Pagefind and real browser navigation/search/menu/cleanup are BLOCKED / NOT_RUN due to the earlier lock acceptance stop. Zero candidate tests executed; historical counts are not used. No node_modules created.
- **Protection/next action**: Original source stays `b6c3e39b2bf7ea73ec60234dc42f8240e0e8695f` with clean tracked/index and retained `.workbuddy`; phase-0 stays at the exact base and clean. No merge, push or deployment. Candidate retained solely for review. Stop writing after evidence commit; coordinator/Astra must judge the unexpected Vite edge before any install or compatibility claim.


### Dependency remediation phase 0 — 2026-10-03

- **Scope/authorization**: The owner authorized preparing to resolve dependency security issues and ongoing supervision, using Astra xhigh for complex coupling and 6.1 Sol Fast for routine implementation. This delegated increment is bounded to phase-0 queries/audits, local plan/decision/evidence edits and a local commit, stopping before dependency changes. No source/main integration, push, deployment, security-permission change, bilingual implementation or website optimization. Active model/reasoning setting is not exposed by available runtime tools and remains UNVERIFIED.
- **Baseline/writer**: Source checkout remains `codex/plan-dependency-remediation` at `b6c3e39b2bf7ea73ec60234dc42f8240e0e8695f`, with clean tracked/index and retained `.workbuddy/`. Work is isolated in `/Users/zhenkun/Documents/Codex/2026-10-03/task/zhenkun-dependency-phase0`, branch `codex/dependency-phase0-20261003`. No shared node_modules. Application/scripts/configuration/dependencies/CI are tree-equivalent to deployed source `43c21ad`; P8-I1 remains unaccepted and excluded. Related project chats were idle when inspected. Coordination keeps one writer.
- **Completed evidence**: [Phase-0 review](../references/dependency-phase0-2026-10-03/phase0-review.md), [36-GHSA ledger](../references/dependency-phase0-2026-10-03/advisory-matrix.md) and JSON preserve official affected ranges, current version instances, immediate lockfile parent edges, available full audit paths, trigger conditions and open status. Fresh prod/full pnpm 11.22.0 audits each exit 1 with 51 records / 33 GHSA / 10 packages. Official union also includes sharp omitted by audit and two serializer candidate guards. Advisory/registry errors are retained as evidence, not converted to PASS.
- **Complex decisions**: ADR-XB-016 selects a future two-parent plugin 3→4 override experiment, explicitly outside both `^3.0.0` ranges, to remove the legacy build chain before updating its children. Official ESM/types are byte-identical; CJS has a source-reviewed difference and real API/browser tests remain required. Sharp targets include top-level/Astro/Miniflare 0.35.5; serializer 7.0.5 is fallback only. No candidate installed or exercised.
- **Blockers**: `http-cache-semantics@4.2.0` high advisory is newly reported; audit's supposed 4.2.1 repair is not published in the captured npm evidence and the official advisory has no first patched version. No waiver granted. Swup cross-major compatibility, Miniflare pin overrides, Linux binaries and actual dev listeners remain unverified. Static source boundaries do not prove a production exploit or eliminate version matches.
- **Validation this increment**: Fresh JSON/schema/count/range/parent-edge consistency, official tarball integrity and export hashes, document links, bounded file scope and unchanged dependency/application/source-checkout guards are recorded in the phase-0 verification receipt. No application tests, install, build, browser run or PoC. Prior 151/165 counts stay historical.
- **Next executable packet**: Plan version 2, batch A/R3 only: exact two Swup-parent overrides, generated lockfile review, isolated frozen install, actual parent-plugin and full site/dual-base/Pagefind/browser gates, then independent review by the coordinator. Recompute remaining graph before R1a/R2/R1b. The coordinator handles subsequent implementation; this worker stops after the phase-0 commit. Unavailable cache fix prevents overall zero-vulnerability completion, not preparation of independent local candidates.

### Dependency remediation planning — 2026-10-02 (historical delivery)

- Completed the owner's requested Markdown remediation plan at `docs/DEPENDENCY_REMEDIATION_PLAN.md`, on local branch `codex/plan-dependency-remediation` from `53cf67d121ce053b2d5f2aed4dd40c7d07d8506a`. The document distinguishes proposed steps from executed work and includes a 32-GHSA closeout inventory.
- Fresh production and full dependency audits each returned 50 advisory records: 24 high, 19 moderate, 7 low, zero critical, affecting 9 packages. Both exited 1 for reported vulnerabilities. Commands, raw reports, dependency-file hashes, installed parent constraints and 13 published patch-version metadata records are retained in `references/dependency-remediation-2026-10-02/`.
- Patch candidates are confirmed to exist in the official npm registry; their combined compatibility is not established. R1–R3 separate compatible ranges, Miniflare's exact pins, and the `serialize-javascript` 4.x-to-7.x parent constraint. R4/R5 define future CI gates and final verification without creating workflows or schedules now.
- This increment changes documentation and audit evidence only. Dependency files, application code, CI workflows, production and preexisting `.workbuddy` remain unchanged. Document consistency, local links and dependency hashes were freshly checked; application tests/builds were not rerun for this documentation-only increment.
- Delivery and archive: the owner authorized push, synchronization and archival. Plan commit `8321b158661cbf28c57a60ca09a76cf8ec488b75` was pushed to `origin/codex/plan-dependency-remediation`, with upstream tracking configured and fresh fetch confirming zero ahead/behind. The six plan/evidence files are preserved in a [verified ZIP snapshot](../references/dependency-remediation-2026-10-02/planning-snapshot-8321b15.zip); its source SHA, per-file hashes, archive digest and delivery checks are recorded in the [delivery receipt](../references/dependency-remediation-2026-10-02/delivery-receipt.json). Original files and branches are retained. This receipt increment accompanies the same remote branch; main remains `53cf67d121ce053b2d5f2aed4dd40c7d07d8506a`, with no merge or deployment.
- Next work is implementation under the owner's applicable authorization, followed by fresh candidate-specific checks. The completed 38-commit release does not itself authorize a separate dependency/CI change or remote delivery. Existing filesystem restrictions and the seven artifact tests' narrowly approved fixture cleanup remain in force.

### Completed development release — 2026-10-02

- [x] Review and publish the 38 existing development commits, as explicitly authorized by the owner conditional on resolving material release risks. Review source starts at `28e4b70`; production base is `ab26876`. The original 38 commits are inventoried in `references/release-review-2026-10-02/commits.json`. PR #20 merged and published source `43c21ad305876a197e02ed7830991af8575c5485`.
- Scope: accepted P0/P1/P2/P3/P2.5/P4 and owner-profile changes, plus existing planning/evidence records and the completed identity update. The separate unaccepted bilingual implementation is not included. The launch article remains `draft: true`; no new feature activation, service or dependency is authorized.
- Main requires linear history. Original development branches/commits are preserved. Candidate `4d200ac` and merged source `43c21ad` are tree-equivalent to reviewed `294d13d`; three hosted PR checks passed before squash merge. No protection setting was changed. Local main was fast-forwarded to the merged source; the final delivery receipt changes documentation/evidence only.
- Fresh code review covers publication admission/visibility, Wiki paths, media/canonical/feed URLs, Pagefind/session lifecycle, modal keyboard behavior, capability guards, owner data, CI and changed tracked evidence. Focused secret-pattern scan found no matches in 417 changed text files; this is not an exhaustive credential guarantee.
- Review repair: pin the standalone Biome action to the declared installed `2.5.11`, replacing `latest` so its results do not drift from the full quality gate. No package or lockfile change.
- Fresh local checks PASS: 151 native tests, Astro (257 files, zero errors/warnings, 12 retained hints), TypeScript, Biome (298 files), both complete production builds, artifact contracts and 24 current project-base HTTP checks. New local browser access was BLOCKED by the browser client; prior accepted interaction sources were compared, without claiming a fresh local GUI run.
- Hosted PR run `37032444740`, merged-main run `37032942965`, and Pages run `37032943481` PASS, including Linux frozen installation and both full quality bases. Downloaded Pages artifact `11238841086` passed the artifact verifier; all 24 deployed HTTP checks match that exact artifact byte-for-byte. Fresh deployed GUI checks PASS at 1280×900 and 390×844: first/replacement search, mobile query reopen, keyboard focus wrap/Escape restoration, background inert/scroll restoration and About→Home→About Swup navigation. Evidence: `live-browser.json`, `live-http.json`, `artifact-receipt.json` and screenshots under `references/release-review-2026-10-02/`.
- Dependency audit remains non-clean: 50 inherited advisory records (24 high, 19 moderate, 7 low). Dependency declarations and lockfile are identical to production. The reviewed static deployment has no identified visitor-controlled production exploit; build-time trusted-input and supply-chain risks remain. Reachability, primary sources and limits are recorded in `references/release-review-2026-10-02/report.md`; no dependency upgrade is included.
- The owner explicitly approved cleanup only of the `zhenkun-ci-artifacts-*` directories created by the seven artifact tests, both locally and in CI. No source, dependency or user directory is covered. Existing standard build/cache exceptions remain unchanged. Review-only temporary evidence is retained.
- Current delivery is complete; no release approval remains pending for these 38 commits. Separate next work remains P8-I1 independent bilingual review, P5 owner-approved public article/comment acceptance, and targeted dependency maintenance. Physical-device/theme-animation acceptance is not implied by the deployed smoke checks. Preexisting `.workbuddy` files remain unchanged and untracked.


### Completed identity delivery — 2026-10-02

- [x] Complete the owner-requested `Zhenkun-blog-site` identity update, local/GitHub compatibility and new Pages address. Physical checkout: `/Users/zhenkun/GitHub/Zhenkun-blog-site`; working branch: `codex/rename-zhenkun-blog-site`, based on `31fb5379bed20016c19401b0067ba12abc211d0a`.
- The directory has been renamed and its former path is a symlink. Tracked text, script names, author asset paths, configuration and historical reading copies are normalized to the new identity. No Git history is rewritten.
- Remote delivery is bounded to identity/address changes on `bc21bfd92dd7081f2cf0acbec80d446f9d02c7de`; the existing 38 local commits and pending bilingual candidate remain outside this release.
- Validation: PASS — 144 native tests, exact TypeScript gate, Astro (257 files, 0 errors/warnings, 12 retained hints), targeted Biome, complete builds at `/` and `/Zhenkun-blog-site/`, artifact checks and deployed HTTP/browser checks. Evidence: `references/site-identity-2026-10-02/verification.json` and `live-http.json`. The existing standard-tool cleanup exception remains limited to the previously approved generated outputs/caches; fixture-deleting tests are excluded from local execution.
- Website compatibility: the owner selected release of the old website address and activation of the new Pages URL; no account-site repository will be created. Repository name, homepage and origin are verified against unchanged repository ID `1358212269`. GitHub’s old repository address resolves to the new repository; the released website returns 404. Production source `a47c836107cc029690a0fa46334d8676674848c0` deployed successfully in Actions run `37029800697`. The separate existing fork remains ID `1351901291`, unchanged.

- Delivery separation: the local rename branch carries the normalized current development tree. Remote main now ends at documentation receipt `ab26876d82888d6fd9275724756bda28ee3442bc`; deployed source remains `a47c836107cc029690a0fa46334d8676674848c0`. Only the independent production name/address patch and its delivery receipt were pushed; the 38 earlier development commits remain local. No additional public repository, dependency change or article publication occurred.

### Earlier engineering checkpoint

- **本轮结果（2026-10-02）**：DOCX v1.1 的新增计划已归并到本文件/ADR；`Zhenkun博客工程推进计划.docx` 仅为外部历史快照，不再维护第二份状态。隔离 P2/P3 中的 ROADMAP 也是已提交/历史快照，后续整合必须以本文件的最新状态为准，逐段协调，不能覆盖 canonical 文档。
- **原仓库**：`/Users/zhenkun/GitHub/Zhenkun-blog-site`，活动分支 `codex/refactor-publication-contracts`；G1/P3/P2.5 及 Zhenkun 资料子项先后按独立复核、直接授权与守卫本地接纳。此次状态基于精确资料候选 `7ec53a2a7d9557ecbda89319e55c48d3fdca2e66`，当前 HEAD 从 Git 查询，不在自身文档中自指。local main 仍 `bc21bfd92dd7081f2cf0acbec80d446f9d02c7de`，原分支 tracked 干净，用户 .workbuddy 与 50 个隔离 P3 文件原样保护。没有远端写入/部署。
- **P2 来源与可追溯性**：从 `/Users/zhenkun/Documents/Codex/2026-10-02/task/zhenkun-blog-site` 仅 fetch 已提交 `baf9b2d29310c7b32f6c23934802be3cc54ba022` 至原仓库全新本地 `refs/heads/codex/review-p2-deployment-contracts`；祖先链 `57bed16360c915c17e45ebaf9ac11540c961741e` → `a32502b06cb83c7a2d14d03eafc25d1947c56efc` → `baf9b2d29310c7b32f6c23934802be3cc54ba022` 已验证。没有 checkout/reset/merge 原活动分支，没有传递未提交 P3，没有 remote push。原仓库 ref 的 detached clone 重跑 120/120 PASS（Node 24.20.0、已有依赖复用，无安装）；原源码和锁文件未修改。证据与完整命令见 `references/plan-reconciliation-2026-10-02/g1-evidence.json`。
- **历史 P2 证据范围**：a32502b 执行方记录 116 回归、类型/Astro/8 文件 Biome、双 base 完整构建/HTTP/浏览器及合成 OG；baf9b2d 执行方记录 120 回归、类型/Astro/Biome、`/Zhenkun-blog-site/` 与 `/about/` 边界构建/产物。独立复核任务记录 120 回归、8 项快照和所存 author/breadcrumb/OG 产物，类型/构建等只复核保存日志；follow-up 明确区分 logical route 总是加 base 与 public/emitted asset 已有前缀去重：`/about/` base 下作者路径为 `/about/about/`，category breadcrumb 已有 base 直接解析。准确报告/源码哈希位于 `references/engineering-2026-10-02/route-boundary/`；当时 3-file Biome 和合成 OG/Person/breadcrumb 核验按该快照留档。最终 baf9b2d 的根路径完整构建、HTTP/浏览器未重跑。此次 fresh 120 native PASS 仅证明该层，不扩大上述范围。候选原始证据位于 review ref 的 `references/engineering-2026-10-02/`，安全整合后进入活动分支。
- **隔离 P3 保留**：`codex/fix-deployment-contracts` HEAD 仍为 baf9b2d，九个搜索/菜单实现与测试/故障预览文件未提交，另有 ERROR_MEMORY 和 dated browser 证据。此次逐文件校验 50 个 P3 源码/证据文件不变；材料在隔离 `references/p3-2026-10-02/`，没有复制为第二张状态表。此前 140 测试与 Edge 子路径执行证据待 G1 后最终复核；Chrome、实体手机及最终根 base 的交互范围不能由 Edge 模拟结果代替。
- **本轮受控整合候选**：用户已要求自主评估冲突。在独立 `codex/integrate-p2-g1`（`/Users/zhenkun/Documents/Codex/2026-10-02/task/tmp/zhenkun-g1/review`）以 canonical `ac4be592811cc7450c73806bca5d98c5be2babdb` 为基线逐条 cherry-pick 两个 P2 commit。两次仅 ROADMAP 各一处显式冲突；当时原分支仍为 ac4be59。已协调新里程碑/门禁与旧执行事实，并修正自动合入的 M5 “P2 accepted”及旧未实现文字；当时 ERROR_MEMORY 只追加两个已提交 P2 条目，未引入 P3。映射、差异/哈希和流程审查材料见 `references/g1-integration-2026-10-02/`。该候选已获独立复核 PASS，并按守卫条件本地 fast-forward 原分支；这里只接纳 G1，P3 保持未接纳。
- **当前授权/下一步**：G1/P3/P2.5 实现及 Zhenkun 资料子项均仅本地接纳。P2.5 c6118323 → 6f551119 的直接批准和证据留在 `references/p25-local-acceptance-2026-10-02/`。资料精确 `7ec53a2a7d9557ecbda89319e55c48d3fdca2e66` 独立 PASS 后，自动审批因此前批准只覆盖 6f551119 而拒绝新目标；用户随后直接回复“批准这次精确本地 fast-forward”，同一原 HEAD a3d1a9a/branch/clean tracked/祖先/50 P3/.workbuddy/main/证据哈希守卫通过，已完成 a3d1a9a → 7ec53a2，无绕过。接纳新增材料仅 docs/evidence，生产源码仍 f0ea516；历史候选快照不回写。Linux frozen/hosted/required-check 和 G4 生产验收 OPEN。P4 精确 b0017e24 经父任务转交独立 6.1 Sol PASS 和当前明确本地接纳指令，fresh Git/哈希守卫后已 795e7d1 → b0017e24 本地 FF。未重复执行源码测试/完整根构建；原测量与独立复核/本次接纳分开记录。P8精确922a249已获父任务转交独立PASS并通过fresh保护守卫，本地04cbf0b → 922a249 docs/analysis-only FF接纳；原测量/独立复核/本次接纳分别记录，候选历史快照不回写。站主已明确回复“可以”批准G6五点方向，精确证据另存；当前唯一活动P8-I1的a06独立复核BLOCKED；两项P1已在隔离源码d6b5056有界修复并fresh验证，当前等待新精确候选独立复核，详情以P8-I1条目及fix review packet为准；原仓库尚未接纳候选应用源码，不自动翻译或公开文章。英文bio已获后续明确接受，首增量执行两套单语言UI规则；同篇中英文共享评论身份只作本地mapping，不改远端giscus。P5 保持待明确文章审核/公开授权。无 push/main 合并/远端 CI/部署/新服务或文章公开。
- **P3 验证快照**：源码 `278165033a8ad422f6403ac07e02f7af19e6ab24` 已通过 140/140 native、类型、Astro（257 files，0 errors/0 warnings/12 retained hints）、正式双 base 完整构建及最终产物。浏览器/每种 base 24 条 HTTP 绑定 `099eebc26955a10dfb6da08aa9d2f20982233a65`；后续仅两行尾空格变化，子路径 55 个客户端 JS 文件逐字节一致，未宣称所有 HTML/inline scripts 一致。实际 Edge GUI 154.0.4258.48，1462×839 DPR2、390×844 移动模拟及 1023/1024 断点；两种 base 各 20 次 Swup 菜单导航，搜索首词/替换/原词重开/延迟/503、菜单键盘/遮罩/焦点与锁释放均保存。聚焦复现中，立即改视口后的定位点击未改变焦点或面板，随后新鲜 AX 语义按钮点击正常打开；输入命中/布局同步是推断，非已证实产品缺陷，实体 resize/orientation 未验证。主题恢复，临时标签与 server 已关闭。Chrome、实体手机、主题动画起点、干净安装/Linux、真实文章/评论与部署未执行；此前独立 P3 复核尚未执行；本轮独立复核精确 `289cb6183d16b6cac62c18c84758c02bc8fb6289` PASS 后已本地接纳，以上执行方原始测量仍绑定其各自 SHA。
- **G1 历史验证快照**：tested source commit `8416068b9505b4cd235d4acf0de87b0c54d4fb09`；最终候选仅后续 docs/evidence 增量，498 个生产文件的 mode/blob/SHA256 与 `baf9b2d` 一致。120/120 native、同步后 TypeScript、Astro（256 files，0 errors/0 warnings/12 retained hints）、8-file Biome PASS；正式双 base 构建含生成/字体/Pagefind PASS；每种 base 产物与 24 条 HTTP 字节核验 PASS。现有 headless Edge 154.0.4258.48、1462×792 DPR2 的 Home/About 图片/canonical、主题终态往返、关闭友链→base 内 404.html PASS，已查看根 About/子路径 Home 截图；GUI/实体手机/主题动画起点和 P3 搜索/菜单未验证。CUA 连接关闭、初次 types 未同步/探针引号/preview base 配置失败均按实际恢复记录，不算产品 PASS。测试、保护哈希、commit mapping/冲突 rationale 与流程一致性检查见 `references/g1-integration-2026-10-02/process-audit.json` 和 source snapshot；独立复核精确 ad1a04f PASS 后 G1 已本地接纳；P3 验收独立进行。
- **持续限制**：未获新 push/main 合并/部署、永久删除、依赖/凭据/权限调整、文章公开、Space/私人上下文上传授权。标准 check/build/dev/preview 仅可按既有批准清理 `dist/`、generated `.astro/`、`node_modules/.astro/`、`node_modules/.vite/`、tool-created/expired tsx IPC/cache/探测文件；源、公有资产、文档、私人稿件、Git、依赖包和锁文件不在清理例外内。
- **仍待实际验收**：没有已批准公开文章；真实正文/优化封面/heading 存在性/评论、物理浏览器主题动画、Linux 干净安装和远端候选部署均不能由本地空库构建证明。2026-10-01 依赖 audit 的 50 advisories 仅为历史报告，需后续按当前版本与可利用性评估；不自动升级或合并机器人 PR。没有声称当前预览 server 仍运行，使用前检查 live status。
- **记忆边界**：ROADMAP 记录任务状态，DECISIONS 记录取舍，ARCHITECTURE/REFACTOR_PLAN 记录职责与原契约，PROCESS 记录稳定流程，ERROR_MEMORY 记录真实失败，dated references 记录测量。私人写作与未选素材不进入工程文档/构建；历史 M6/M7/P0/P1 证据留在对应 references，不因归一而删除。


### Historical context — 2026-09-06

- 里程碑：M4 外观迭代进行中（横幅文案、主题切换动画完成；logo 搁置）
- 状态：giscus 已按 ADR-XB-005 启用；主题切换 HiDPI 修复 `7faf3f1` 已获用户授权推送并上线，实体浏览器动画最终验收待完成；首篇文章仍为 draft，待用户审核；favicon/公告文案欠着。
- 当时下一项：在实体 Chrome/Edge 刷新线上站点验收主题切换。文章审核通过后再发布；其余外观候选暂不推进。当前顺序以本节上方最新断点为准。
- 上线证据（2026-09-06）：[Pages run 34032507630](https://github.com/zhenkun26/Zhenkun-blog-site/actions/runs/34032507630) SUCCESS，build 43s / deploy 10s；线上首页与 `LightDarkSwitch.DDOGg_t7.js` 获取成功，脚本包含百分比半径换算与 `--theme-reveal-start` / `--theme-reveal-end`，确认已替换旧资源。本轮 `pnpm type-check` 再次 PASS。此条文档提交使用 `[skip ci]`，避免仅记录部署结果再次触发相同站点构建。
- 当时交接证据：生产预览曾运行于 `http://127.0.0.1:4322/`，不作为当前运行状态；内置 Chromium 最终 circle(%) 中间帧 `references/m4-theme-percent-production.png`；实体 Edge 关于页切换终态 `references/m4-theme-percent-edge.png`（原生截图未捕获中间帧，圆心最终验收仍保留为待办）。
- 已知待办：M4 启用已入库壁纸（backgroundWallpaper.ts，桌面 3 张/手机 2 张已备好）
