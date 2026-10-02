# Zhenkun-blog-site 工程监督首轮交付 — 2026-10-02

## 基线与边界

原 checkout 为 `/Users/zhenkun/GitHub/Zhenkun-blog-site`，origin `https://github.com/zhenkun26/Zhenkun-blog-site.git`，upstream `https://github.com/CuteLeaf/Firefly.git`。实际 HEAD 为 `57bed16360c915c17e45ebaf9ac11540c961741e`，分支 `codex/refactor-publication-contracts`；只有该 checkout，一个 worktree，工作区干净。应用中的相关审查任务为 idle；实施期间原仓库 HEAD 与 diff 再次核对未变。进程总清单因沙箱限制未读取，不能声称检查了所有本机进程。

最新本地进展超前于线上：P0 上游个人配置/付款码清理提交 `059d228`，P1 发布/Wiki 合同提交 `57bed16`；两者未推送。main 与本地 origin/main 都是 `bc21bfd`，未 fetch 改动远端。线上实体 Edge 显示 2026-09-06 构建、仍有上游 hero 入口及视频失败提示，与未交付最新分支一致；这不表示 main 构建失败。

项目定位是中文个人博客，Firefly/Astro 7.2.10 + Svelte 5 + Tailwind。已实现基础身份/关于页、分类归档、主题切换、giscus 配置、Pages 流水线、明确文章发布资格与 Wiki ID/引用合同。当前仅一篇未批准草稿，生产文章集为空。页面开关关闭动态、相册、友链等模块；Logo 已搁置，导航/侧栏/公告/视觉选择与真实公开文章评论验收仍待后续。

隔离副本在本任务 `zhenkun-blog-site/`，独立分支 `codex/fix-deployment-contracts`，基于 `57bed16`。复制已安装 node_modules，没有安装或升级依赖；lockfile 未改变。原 checkout 未切分支或修改源码。授权范围仅本地代码、诊断、已有生成物清理与本机预览，不包含文章发布、Space 创建、依赖升级、push、合并、部署、凭据变化或数据删除。

## 本次修复：既有 P2 / F04–F07

- Astro 已输出带 base 的图片地址直接解析为绝对地址；public 图片只加入一次部署前缀，远程/data 图片保持既有合同。
- OG 按安全文章 ID 的每段编码，并加部署 base；archive/search canonical 在 root 和 subpath 都去掉筛选查询及片段。
- sitemap 仅移除匹配的 leading base，再检查既有 page 开关，关闭父页面的子路由也排除。
- 12 个 Astro 页面调用点使用同一静态 `404.html` 路径合同；产物共 13 个关闭页面 stub 均留在部署路径内，保留错误页返回首页导航。静态 stub 的 HTTP 状态仍为 200、依靠 meta refresh；没有把它写成真实 302/404 服务端响应。
- RSS `lastBuildDate` 使用 UTC 协议格式，RSS 频道根与 robots sitemap/规则对齐当前 BASE_URL。
- 42 个新的原生 Node 回归及独立产物/HTTP 验收脚本，不增加测试框架或依赖。

基线产物确认：头像 `/Zhenkun-blog-site/Zhenkun-blog-site/...`、21 个 sitemap URL 中 13 个关闭页面/子页面、站外 `/404/` 跳转、无法按邮件日期协议解析的中文 lastBuildDate。修复后头像/OG 有一个前缀；sitemap 为 8 个允许页面；13 个 stub 指向 `/Zhenkun-blog-site/404.html`（根路径为 `/404.html`）；RSS 日期可解析为 UTC。证据见 [baseline-artifacts.json](baseline-artifacts.json)、[artifacts-subpath-final.json](artifacts-subpath-final.json)、[artifacts-root.json](artifacts-root.json)。

## 实际验证

| 检查 | 结果与范围 |
| --- | --- |
| Node 回归 | PASS：116/116（74 旧 + 42 新），`regressions.log` |
| pnpm check | PASS：256 文件，0 errors / 0 warnings；12 hints 是 Astro early-return 对 notFoundPath 的未使用提示。真实产物证明其被执行，不隐去诊断。`check-final.log` |
| pnpm type-check | PASS：`type-check-final.log` |
| targeted Biome | PASS：8 个 JS/TS/MJS 文件，`biome-final.log` |
| 完整 pnpm build | PASS：最终 root/subpath，保留全部上游步骤及 Pagefind；`build-root-final.log` / `build-subpath-final.log` |
| 实际 XML/HTML/图片 | PASS：两种 base 的 canonical、图片文件存在、sitemap、13 stub、RSS 日期/0 items、robots。`artifacts-*.json` |
| 本机 HTTP | PASS：两种 base 每一被检查的 HTML/XML/图片与文件逐字节相同；错误页与恢复链接存在。`http-root.json` / `http-subpath-final.json` |
| 实体 Edge | PASS：修复后 subpath 首页和 friends→404.html；DPR 2，1462×839，无横向溢出。`edge-subpath-*.json/png` |
| 合成公开文章 | PASS：ignored `tmp/deployment-fixture` 两种 base 的真实文章/封面/OG/RSS；OG 解码 PNG 为 1200×630，头像 1080×1079。`fixture-artifacts-*.json` / `fixture-images-subpath.json` / `images-final.json`。原草稿未改，不是公开文章验收 |
| 线上 HiDPI 补测 | PASS（限定采样）：实际 Edge，DPR 2，1462×792，亮→暗→亮；反向扩散中心 91.7931344% / 4.5454545%，与按钮中心 (1342.015625,36) 相符，已捕捉过渡帧，结束样式清理且恢复原亮色。`edge-live-theme.json/png`；Chrome、实体手机、广泛键盘/窗口组合仍 UNVERIFIED |
| 全新 install / Linux CI / 外部部署 | NOT_RUN：复用本机依赖；此次未运行外部 Actions 或部署 |

已知构建提示保留：空 dynamic 集合、缺少可选 src/icons、chunk-size、Pagefind redirect stubs 和 zh-cn stemming 提示。真实文章发布资格、评论、Obsidian 实际文章/附件转换还需用户选定样本。当前产物无 posts/OG 公开路由，RSS 和 allPostMeta 均为空；Pagefind 只索引 About。没有利用原草稿制造发布验收。

沙箱首次阻止 pnpm 在全局 store 注册副本，随后阻止 tsx IPC。固定 `pnpm_config_verify_deps_before_run=false` 防止复制依赖的自动 install 回退，再获本地执行权限运行现有流水线；没有放宽任何安全设置。Astro preview 是后台服务，最终用 `astro preview stop` 停止本任务创建的进程。

## 后续里程碑与待授权动作

1. P3：首次 Pagefind 查询与快速/清空/关闭的竞态；移动菜单焦点、Tab/Escape/恢复。每项单独实现并用实际 Pagefind 和桌面/移动键盘验收。
2. 发布前工程门禁：评估已记录依赖告警的可达性；定向兼容升级需明确范围。现有 deploy 独立、非 frozen install，PR 未跑完整 pipeline/subpath/typecheck，Biome 仍针对 master；准备具体 CI 补丁再验收，不合并已知不兼容的 merman alpha 升级。
3. P4 可选模块的导航/子路由/接口/索引合同，再 P5 用户选择的单篇公开安全原稿及附件，真实 OG/评论/发布验收。
4. 对齐 CuteLeaf/rainzt 的后续方案以 [用户原始需求](requirements.md) 为约束，沿用既有架构/素材评估；Obsidian 管理原稿、可选 Space 提供编辑协作，先手动样本后判断是否需要一向工具。搁置 Logo 及未批准视觉选择不自动启动。

本次本地提交可回退；原仓库主线保持原样。后续远程审查建议 draft PR，必须先单独取得推送范围。该 PR、main 合并和 Pages 部署都没有发生。


## Independent-review follow-up — route/base collision

P2 初次交付为 `a32502b`，上文 116 项回归及 root/subpath 证据保持原快照。后续独立审查发现逻辑 `/about/` 与 base `/about/` 同名会被 public 资源规则错误去重；已在同一隔离分支分离逻辑路由 helper、修正已带 base 的分类面包屑，并单独提交。当前计数为 **120/120**；最新 type-check/check/Biome、实际 `/Zhenkun-blog-site/` 完整构建及 `/about/` 合成文章碰撞构建通过。精确范围与未重跑项目见 [边界修复验收](route-boundary/report.md)。旧 source-snapshot.json 属于 a32502b，新源码 hash 见 route-boundary/source-snapshot.json。
