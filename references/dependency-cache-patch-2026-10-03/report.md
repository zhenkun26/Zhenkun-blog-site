# Cache policy 本地候选验证（2026-10-03）

源码提交 `af1a0379ec9518931ef3d703dacdcbd4102daacf`，基线 `ed64aad20e7025afa7834f3eb2008c0c57cc2240`，分支 `codex/dependency-cache-patch-20261003`。本报告是候选执行证据，任务状态仅见 `docs/ROADMAP.md`。已完成 Mac 本地验证；独立实现/动态安全兼容复核未完成，不能宣布漏洞关闭或批准发布。

## 改动与来源

只登记精确 `http-cache-semantics@4.2.0` 的 pnpm patch，正式工具生成锁；不虚构 4.2.1，不安装 fork，不新增全局 override。八个既有 guards、allowBuilds、根 peer、Node/pnpm、应用/CI/双语候选保持原字节。官方 4.2.0 integrity/source/LICENSE 与 [来源记录](provenance-initial.json) 一致，BSD-2-Clause 许可证随可执行官方基线保留。

父任务提供了 v2 独立静态审查 PASS；本执行方不把它当作独立动态验收。不可改写的 [设计快照](design-v2/DESIGN.md) 和 [原规范矩阵](design-v2/TEST-MATRIX.md) 中 NOT_RUN 是设计阶段事实；当前执行状态另见 [matrix-execution.json](matrix-execution.json)。v2 已包含先校验 ASCII 再小写、共享 s-maxage 仅到期后禁止 stale 的两项静态复核修正。

补丁集中限制不可存储、no-cache、共享 cookie、proxy-revalidate、Vary wildcard/非法字段的复用；must-revalidate/s-maxage 到期后限制 stale；错误回退要求相同请求/variant 并尊重 incoming no-cache；仅补齐 304 首次新增四类限制头，保留 v1 序列化/API 形状。正常 fresh/stale 正向控制、合法 304 解禁仍受测。HEAD 错误回退更保守，既有 fresh must-revalidate evaluate 保守 miss 继续保留；不承诺完整 RFC 缓存实现、任意 getter 安全或 accessor 自带授权。

## 实际解析与安装

[全图检查](graph-verification.json)：895→895 package records、898→898 snapshots、1779 条引用全量核对。只有 patch 登记、cache snapshot 名和 Astro7.2.10 子边改变。所有 package records、其他 snapshot/importer/settings 原样；真实 Astro 父链和 hoisted 共两个链接都解析同一个批准源字节。

- 正式 patch SHA256：`64774074b0bcda954d8e01db3c04999f48f2c96f26e99769d4f9fd7ba746ffb3`。
- 实际源 SHA256：`55eefdf582537830c28f1a17d02c9b476ac3a820cc2eb0211ffb57d163f71c89`。
- 锁 SHA256：`6f4a61e19f5e118ea4636a11984ae52f24e11764d6fdade9cab3d3101fd4d002`。

同候选接管前正式 [frozen 安装](install-patched-frozen.log) PASS（15.6s）；本续跑不伪称重新干净安装。锁和 patch 未变，当前 D03 再测缺 patch 与内容改变分别失败于 ENOENT/lock config，排除权限/store 错误。Mac 阴性门通过不代表 Linux 通过。旧未补丁物理包目录由 pnpm 保留，但没有当前锁边或 symlink 指向它；单独记为 inactive，不删除共享 store 或强制安装。

## 本次鲜活验证

[命令/时间/退出码/哈希总收据](validation-receipt.json) 绑定源码，各命令有原始 stdout/stderr。

| 验证 | 结果与边界 |
|---|---|
| 缓存 node:test | [45/45 PASS，0 skip](cache-matrix-clock-repaired.log)：规范 A18+B10+C12+D01–04 共44组，另1个测试包含4个官方基线反例；不是46项规范全部关闭 |
| 完整 native glob | [247/247 PASS，0 skip](native-all.log)，含真实 Sharp/Miniflare/workerd、Swup、字体与已有契约 |
| 质量与父 API | Astro258文件/0错误/0警告/12 hints；Biome306文件；正式 isolatedDeclarations 与 strict Swup 类型 PASS；peer PASS；实际 root/MDX/Astro/Satteri、公开 MDX integration/container/RSS API PASS |
| 两个完整八阶段 build | `/` 与 `/Zhenkun-blog-site/` 均 PASS；Pagefind zh-cn各1页，95/98词；每个252文件 [哈希清单](artifact-manifests.json) |
| 产物与 HTTP | 两 base artifact verifier 通过；各24个实际 loopback HTTP响应与产物字节一致，canonical/OG/robots/sitemap/空RSS/草稿与13个既有meta-refresh stub契约保持 |
| 图与保护 | [图](graph-verification.json)、[受保护仓库](protection-final.json)、[清理](cleanup.json)通过；不主张浏览器或生产验证 |

C12 原失败来自 epoch 双精度：59.9996 被算成59.99960009765625。保留 [原脚本](test-before-clock-repair.mjs.txt) 与44/45失败日志；现用该 epoch 可表示的0.25ms刻度，并严格断言 TTL=0 时仍 fresh、60秒精确 stale、60.00025秒 stale，未用 epsilon 或削弱边界。另保留先前私有 Module._compile 崩溃；正式测试使用公开 createRequire 加载经过哈希核验、无导入的官方模块。

D04 使用实际 Astro remote load/revalidate，合成 example.invalid fetch，不访问真实服务或传凭据；Web Headers 不接受 Kelvin ByteString，故该输入在 B08 raw CachePolicy 及序列化全面覆盖，而不冒充 Astro HTTP 输入覆盖。Astro 自己在图片生成失败时使用旧文件的分支是 SOURCE_CONFIRMED，未被本包 patch 控制。静态博客部署资产本身不运行这段 Node 缓存逻辑；图片构建/开发服务器或未来 SSR/共享请求上下文必须单独分析，不能据单用户静态构建就宣称跨用户漏洞不可达。

## 审计、来源差异与未闭合项

保留 [生产](audit-prod.json) 与 [完整](audit-full.json) 原始报告：各1 high/1条 GHSA-ch52-4w7c-c8xp，版本仍真实4.2.0。它们来自本候选接管前、仅时钟测试修正之前；本续跑的新审计请求未执行。自动审批拒绝向公共 npm registry 发送依赖审计元数据，要求明确披露授权；见 [BLOCKED记录](audit-refresh-blocked.json)。没有换渠道、过滤告警或把旧结果说成本次刷新。

[账本](advisory-reconciliation.json) 保留36条既有官方范围对当前锁的重算（1条版本命中），不是全部来源重新查证或穷尽发现。额外 CVE-2026-93750 独立记录，不并入原36计数：捕获的 [VulnCheck发布者通告](https://www.vulncheck.com/advisories/http-cache-semantics-through-4.2.0-cross-client-cache-disclosure-via-vary-wildcard) 为High8.2/≤4.2.0，而 [上游issue57](https://github.com/kornelski/http-cache-semantics/issues/57) 为报告者Medium5.9/≤4.1.1；保留差异、不凭较窄旧范围排除4.2.0。捕获的 [Reviewed GHSA](https://github.com/advisories/GHSA-ch52-4w7c-c8xp) 无已发布修复，而原audit声称≥4.2.1；不把audit建议当可安装版本。

无 ignore/waiver/hash豁免，R4未实施。待独立动态安全兼容复核精确源码、Linux frozen/矩阵/双base门、GUI现有限制及审计刷新授权解决后，协调者才能决定下一包；不得直接推进远程或安全关闭。模型偏好 Astra HIGH，实际运行模型不可核验。

## 回滚与保护

协调者维护该本地补丁，最迟2026-10-10复核；官方修复发布、父版本/范围/源字节变化、新通告、共享运行时暴露或关键用例失败时立即复核。日期不自动批准移除或升级，也不是临时漏洞豁免。以新 revert 提交一致回滚 patch、workspace登记、生成锁、专用测试和基线夹具，保留本报告与失败记录；恢复未补丁库时安全状态保持/恢复 BLOCKED。

原仓库b6c3e39、R1955c78b、phase096b7b899、R2b974258和peered64aad的HEAD/分支/受跟踪状态及原.workbuddy哈希前后完全一致。旧peer脚本会把当前路径写进自己的历史proof；本次结果保存到本批后已恢复旧文件的HEAD字节，最终无历史证据diff。原native夹具await dispose/close；本次预览PID32554/32791经官方stop停止、4个已知端口拒绝连接、preview lock消失。启动器killpg最初EPERM、普通ps读取被sandbox拒绝均如实保留，不主张全机进程普查。忽略的构建/测试快照保留。无push/合并/部署、其他暂停工程恢复或安全设置改动。
