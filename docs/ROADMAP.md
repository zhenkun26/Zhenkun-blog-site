# Zhenkun-blog-site 路线图（单一任务状态源）

> 规则：任务状态只有 未开始 / 进行中 / 完成（完成必须附验证证据）。每次会话结束更新本文件；跨会话恢复先读本文件。当前断点见文末。

## M1 MVP —— Firefly 底座本地跑通（当前里程碑）

- [x] M1-1 git init，Firefly 以 `upstream` 远端接入，本地 main 基于 upstream/master（db331cf）
- [x] M1-2 环境：Node 24.20（要求 ≥22.23）、pnpm 11.22.0（corepack，与 packageManager 锁定一致）
- [x] M1-3 Phase 0 文档骨架（AGENTS 项目约定 / ROADMAP / PROCESS / DECISIONS / .gitignore 追加）→ commit 2ffcda9
- [x] M1-4 `pnpm install` 成功（59.2s）→ PASS
- [x] M1-5 `pnpm dev` → localhost:4321 渲染验证 → PASS，截图 `references/m1-home-light-1280x720.png`
- [x] M1-6 最小配置：站点标题占位（title/subtitle/navbar.title）→ commit 4714c14

验收标准：dev 服务器正常渲染默认首页；`pnpm check` 无错误（253 文件 0 错误 0 警告 PASS）；全部改动独立 commit 可回退。

## M2 站点基础配置（未开始）

逐项拍板，每项一个 commit：

- [x] 站点信息：title / subtitle / description / keywords / site_url / siteStartDate → 用户定稿已应用（"Zhenkun / 记录、思考与灵感"），GitHub Pages URL
- [x] 头像与资料（文字部分）：profileConfig 昵称"Zhenkun"、bio 代拟、GitHub/邮箱/RSS 链接 → **头像已替换为用户图**（2026-09-06，assets/images/zhenkun/avatar.avif）
- [x] 图片素材入库：用户图 6 张统一转 AVIF 新增（头像 1 + 桌面壁纸 3 + 手机壁纸 2），上游原图未动，壁纸未启用待 M4
- [x] 清理演示内容 1/4：关于我页 → 用户审核定稿已上线（含气象×AI 背景段落）
- [x] 清理演示内容 2/4：演示文章 → 语法参考 7 篇+7 图移 `references/firefly-syntax-examples/`；推广/演示 15 文件删除（commit 082fdd1）
- [x] 清理演示内容 3/4：4 条演示动态删除（commit f37b7e0）
- [x] 清理演示内容 4/4：留言板/友链模板保留不动（日后启用页面时直接可用）
- [ ] 导航栏：navBarConfig（菜单项、Logo、模式）
- [ ] 侧边栏：sidebarConfig（组件取舍）
- [x] 页面开关：友链 / 留言板 / 动态 / 相册 / 书签导航 / 打赏 全部关闭（页面 302 到 /404/，导航自动隐藏；上游推广菜单已移除，保留 MIT 署名）
- [ ] 评论系统选型（giscus 需 GitHub 公开仓库；Waline 需额外服务端）→ 先出 ADR 再执行
- [ ] 公告栏演示文案替换或关闭（announcementConfig.ts，侧栏"欢迎来到我的博客！这是一则示例公告"）——M2 遗留小项，可与 M4 一起处理

验收标准：改动后 `pnpm check` + dev 渲染正常，每项独立可回退。

## M3 GitHub Pages 部署（已完成 2026-09-05）

- [x] ADR：部署方式 → ADR-XB-004（Actions 构建发布 Pages，DEPLOY_BASE 环境变量注入子路径）
- [x] base path 处理 → `astro.config.mjs` 环境变量方案 + 三个组件链接渲染补 base-aware `url()`
- [x] site_url 与 sitemap / RSS 对齐 → siteConfig 早已指向 Pages URL
- [x] workflow 文件 + 首次部署验证 → 上游 deploy.yml 触发分支改 main；**push 触发首次部署 59s 成功**

验收标准：**PASS** — 线上 https://zhenkun26.github.io/Zhenkun-blog-site/ 首页/关于页 200，标题正确，资源带子路径前缀；截图 `references/m3-live-first-deploy-1280x720.png`。

## M4 外观逐项迭代（参考 rainzt.cn，未开始）

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

## 当前断点

### Active delivery — 2026-10-02

- [ ] Publish the owner-requested `Zhenkun-blog-site` identity and Pages base. This production patch starts from `bc21bfd92dd7081f2cf0acbec80d446f9d02c7de` and excludes the 38 local development commits.
- Scope: repository/site URLs, giscus repository slug (stable IDs preserved), public author name, author asset directory and text references. The launch article remains a draft. No dependency declaration, lockfile, permission or feature change is included.
- Compatibility: GitHub native repository redirect; local directory symlink; the old website address is released at the owner’s request; no account-site repository is created.
- Verification: PASS — installed Astro check (253 files, zero errors/warnings), exact TypeScript declaration gate, all eight declared production build stages, fresh new-base canonical/title checks, empty public metadata and Pagefind output. Validation used existing dependencies directly after pnpm safely refused dependency reinitialization; no install was retried. Existing unrelated production defects remain outside this name-only patch. Delivery: ready for authorized remote rename and deployment.

### Earlier checkpoint

- 里程碑：M4 外观迭代进行中（横幅文案、主题切换动画完成；logo 搁置）
- 状态：giscus 已按 ADR-XB-005 启用；主题切换 HiDPI 修复 `7faf3f1` 已获用户授权推送并上线，实体浏览器动画最终验收待完成；首篇文章仍为 draft，待用户审核；favicon/公告文案欠着。
- 下一项：在实体 Chrome/Edge 刷新线上站点验收主题切换。文章审核通过后再发布；其余外观候选暂不推进。
- 上线证据（2026-09-06）：[Pages run 34032507630](https://github.com/zhenkun26/Zhenkun-blog-site/actions/runs/34032507630) SUCCESS，build 43s / deploy 10s；线上首页与 `LightDarkSwitch.DDOGg_t7.js` 获取成功，脚本包含百分比半径换算与 `--theme-reveal-start` / `--theme-reveal-end`，确认已替换旧资源。本轮 `pnpm type-check` 再次 PASS。此条文档提交使用 `[skip ci]`，避免仅记录部署结果再次触发相同站点构建。
- 本次交接证据：生产预览 `http://127.0.0.1:4322/` 已运行；内置 Chromium 最终 circle(%) 中间帧 `references/m4-theme-percent-production.png`；实体 Edge 关于页切换终态 `references/m4-theme-percent-edge.png`（原生截图未捕获中间帧，圆心最终验收仍保留为待办）。
- 已知待办：M4 启用已入库壁纸（backgroundWallpaper.ts，桌面 3 张/手机 2 张已备好）
