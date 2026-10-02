# P2 路由/base 同名边界修复

独立审查发现 `DEPLOY_BASE=/about/` 时，逻辑作者路由 `/about/` 被 public 资源去重规则折叠为 `https://zhenkun26.github.io/about/`，应为 `https://zhenkun26.github.io/about/about/`。已通过旧 helper 和真实调用关系重现，见 `before.json`。这是 P2 初次交付的低优先级边界回归；原 root 和 `/Zhenkun-blog-site/` 验收证据仍是其对应提交的历史快照。

## 最小实现

- 新增纯 `getLogicalRouteUrl`：逻辑路由始终追加部署 base，不因为名称相同而去重。
- `schema-utils.toAbsoluteUrl` 明确只接受逻辑路由；绝对远程/data 等既有输入分支保持不变，图片仍走独立的 `getPublicAssetUrl` / schema-image。
- 检查全部调用点：作者 `/about/`、首页 `/` 属于逻辑路由；分类面包屑的 `getCategoryUrl` 已带 base，改为直接 `new URL`，避免重复添加。
- 新增四项 root、`/Zhenkun-blog-site/`、`/about/`、`/archive/` 回归，以明确 literal URL 检查逻辑路由与 public 资源的不同合同。
- 产物检查新增真实 Person.url 与合成文章分类面包屑断言。删除全局“重复路径段即错误”的验收假设：`/about/about/` 是合法路由，应以真实文件存在及语义断言验收。

## 新证据（未改写旧证据）

- PASS：120/120 Native 回归（此前 116 + 本次 4），`regressions.log`。
- PASS：type-check；完整 Astro check 为 256 文件、0 errors / 0 warnings / 原有 12 early-return hints；targeted Biome 3 文件。
- PASS：真实部署 `/Zhenkun-blog-site/` 完整 pnpm build 与新增 Person.url 的产物检查；公开文章仍为 0，原草稿不变。
- PASS：ignored 合成文章副本在碰撞 base `/about/` 下的完整 pnpm build；首页/关于页/文章作者 URL 正确为 `/about/about/`，分类面包屑为 `/about/archive/?category=Engineering`，其他 sitemap/redirect/feed/image 检查通过，OG 实际解码为 1200×630 PNG。
- root 的本次逻辑行为由四项 Native 边界测试覆盖；本次没有重跑 root 完整构建或 HTTP/browser。此前 root 完整构建与 HTTP 是 a32502b 的历史验收，不声明成新提交的新测量。
- 本次日志仅去除行尾空白便于 diff 检查；原 P2 所有原始 proof 文件保留。

本次没有执行 P3/视觉改动、发布原草稿、升级依赖、启动预览、push、合并或部署。隔离分支为 `codex/fix-deployment-contracts`，起点 `a32502b06cb83c7a2d14d03eafc25d1947c56efc`；修复单独提交，最终 hash 从 live Git 读取。原 checkout 未改动。
