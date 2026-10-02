# Zhenkun-blog-site 技术决策记录

> 本文件只记录影响项目结构、技术选型和部署方式的取舍。格式沿用 auto-coding 的 ADR 规范（背景 / 候选方案 / 选择 / 放弃 / 验证 / 改判条件）。

## 索引

| ID | 决策 | 状态 | 证据 |
|---|---|---|---|
| ADR-XB-001 | 采用 CuteLeaf/Firefly 作为博客底座 | accepted | 本文件、git log |
| ADR-XB-002 | 目录位置约束与文档布局 | accepted | AGENTS.md、docs/ |
| ADR-XB-003 | 内容专注中文，不引入多语言内容路由 | accepted | siteConfig.ts、ROADMAP |
| ADR-XB-004 | GitHub Pages 部署方案与 base 路径处理 | accepted | .github/workflows/deploy.yml、astro.config.mjs |
| ADR-XB-005 | 评论系统选型 giscus | accepted | commentConfig.ts、references/m5-giscus-working.png |

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


## ADR-XB-015: Repository identity and address compatibility

- **Status**: Accepted by the owner on 2026-10-02.
- **Decision**: Use `Zhenkun-blog-site` for the checkout, repository and Pages base, and Zhenkun for the public author. Preserve the separate existing blog-example fork.
- **Scope**: Deliver only the name/address change from the current production main. Local refactoring and bilingual candidates retain their independent acceptance and release gates. Preserve repository/discussion IDs and Git history.
- **Compatibility**: A local symlink and native GitHub repository redirect preserve existing access. The owner subsequently chose to release the old website address and use only the new Pages URL; no additional compatibility repository is created.
- **Records**: Historical text is normalized at the owner's request; original measurement bytes remain available in the commits cited by those records. Fresh validation is recorded in ROADMAP.
