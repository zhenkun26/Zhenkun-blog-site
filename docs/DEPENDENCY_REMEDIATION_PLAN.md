# Zhenkun-blog-site 依赖安全整改方案

> 初版：2026-10-02（America/New_York）；阶段 0 修订：2026-10-03（UTC），版本 2。
> 本文件定义整改范围、实施顺序与验收方法；任务进度统一维护在 [ROADMAP](ROADMAP.md)。
> 当前交付是方案文档。依赖版本尚未修改，漏洞尚未修复，以下候选配置和实施命令均未执行。

**版本 2 决策摘要：**先验证两个旧 Swup 插件的精确父边跨主版本 override，以移除 microbundle 构建链；再更新仍存在的依赖。sharp 的顶层、Astro 和 Miniflare 副本均评估 `0.35.5`；serializer 仅作为失败后的备选评估 `7.0.5`。新增 `http-cache-semantics@4.2.0` 高危告警暂无已核验的已发布修复版本，保持阻断。执行范围以[阶段 0 批次](#phase0-packets)及 ADR-XB-016 为准；下文 50/32 与 R1/R2/R3 原始计数是历史分组，不是当前关闭数量。

证据：[阶段 0 审阅](../references/dependency-phase0-2026-10-03/phase0-review.md)、[36 项公告核销表](../references/dependency-phase0-2026-10-03/advisory-matrix.md)、[版本实例与父边 JSON](../references/dependency-phase0-2026-10-03/advisory-matrix.json)。当前源码仍与已发布单语应用树一致，P8-I1 双语候选不在整改基线内。

## 1. 需要解决什么

2026-10-02 历史依赖审计命中 **50 条告警记录**，涉及 **9 个包、32 个独立 GHSA 漏洞编号**，其中高危 24 条、中危 19 条、低危 7 条、严重级别 0 条。一个漏洞可能出现在多个版本中，一条记录也可包含多条路径，因此 50 既不是独立漏洞数，也不是依赖路径数。

2026-10-03 阶段 0 的生产与完整审计均返回 **51 条记录 / 33 个 GHSA / 10 个包（25 高、19 中、7 低）**，退出码均为 1。审计新增 cache 公告，却尚未报告 sharp 维护者公告；合并历史、官方新增与候选风险后，本轮核销范围为 **36 个 GHSA，其中 34 个匹配当前锁定版本，2 个仅约束 serializer 候选**。构建或审计数字下降不代表这些项目已关闭。

当前网站由 GitHub Pages 提供静态 HTML、CSS、JavaScript 和图片，没有部署 Node 服务端、Cloudflare Worker 或公开上传接口。此前审查未发现访客可直接触发这些漏洞的生产路径，但构建机仍会解析文章、处理图标和图片、下载字体并执行依赖工具。**静态部署降低了部分运行时暴露面，不能消除构建与供应链风险。**

整改目标是升级或替换实际引入漏洞的依赖链，并保留博客的发布、网址、搜索和菜单行为；审计忽略规则、依赖分类调整和删除锁文件都不能代替修复。

### 1.1 可核验基线

| 项目 | 编制时基线 |
| --- | --- |
| 仓库 | `zhenkun26/Zhenkun-blog-site` |
| 文档与本地基线 | `53cf67d121ce053b2d5f2aed4dd40c7d07d8506a` |
| 已部署应用源码 | `43c21ad305876a197e02ed7830991af8575c5485` |
| 运行时与包管理器 | Node `24.20.0`、pnpm `11.22.0` |
| 应用关键版本 | Astro `7.2.10`、Svelte `5.57.0` |
| 生产网址 | <https://zhenkun26.github.io/Zhenkun-blog-site/> |
| 现有原生测试 | 151 项；这是上次发布结果，整改候选仍须重跑 |
| 公开文章 | 0；现有首篇文章保留 `draft: true` |
| 依赖声明及锁文件 | 本轮规划未修改 |

本次证据：

- [基线、命令退出码与依赖文件哈希](../references/dependency-remediation-2026-10-02/baseline.json)
- [生产依赖审计原文](../references/dependency-remediation-2026-10-02/baseline-prod-audit.json)
- [完整依赖审计原文](../references/dependency-remediation-2026-10-02/baseline-full-audit.json)
- [已安装父依赖版本约束](../references/dependency-remediation-2026-10-02/installed-parent-edges.json)
- [修复版本的 npm 官方元数据](../references/dependency-remediation-2026-10-02/patch-target-metadata.json)
- [上一轮发布的代码审查与可达性分析](../references/release-review-2026-10-02/report.md)

## 2. 完成标准

整改必须同时达到以下条件，才能宣布“本轮依赖安全整改完成”：

1. 全部 32 个历史 GHSA 和阶段 0 官方公告并集在候选图中的受影响实例均已消除；当前核销表为 36 项，不能只核对审计端点已收录的部分。仅修复一条路径或一个重复版本不够。
2. 生产与完整依赖审计中，所有有可用修复且适用于当前依赖图的告警完成处理；目标是无忽略项的零告警。执行时若出现新增漏洞，重新分类并纳入报告。
3. `critical`、`high` 必须为 0。若存在确实不能立即修复的其他告警，须单独批准有期限的例外，并将总体状态写为“部分完成”，不能写成零告警。
4. 干净环境使用冻结锁文件安装成功，不产生未评估的 peer 冲突、安装脚本权限变化或运行时降级。
5. 原有 151 项回归，以及本轮有必要新增的针对性回归全部通过；Astro、TypeScript、Biome、双路径完整构建与产物检查通过。
6. 真实浏览器完成搜索、移动菜单、主题终态和页面导航验收。生产草稿、禁用模块、RSS、sitemap 与站点路径边界不发生回归。
7. 如已获发布授权，精确候选的远端 CI、部署及线上产物核验通过；如果只获本地整改授权，应报告“本地修复完成，尚未发布”。
8. 每个 override 都有作用范围、原因、兼容性证据和退出条件；没有用大范围忽略、自动强制升级或移至 devDependencies 的方式隐藏结果。

“暂未发现可利用路径”“单次构建通过”“告警数字变少”均不能独立满足完成标准。

## 3. 依赖清单与修复下限

以下历史表已根据 2026-10-03 官方元数据修订关键目标；所有候选均须重新核对其完整公告并集和实际父边。**发布存在、Node 引擎相容、版本不落入已查公告，均不证明组合兼容。** http-cache-semantics 暂无可执行目标。详细引擎、完整性及父约束证据见阶段 0 JSON。

| 包 | 当前受影响版本 | 本次候选修复下限 | 告警数：高/中/低 | 主要依赖链 | 首选处理方式 |
| --- | --- | --- | --- | --- | --- |
| `devalue` | `5.9.2` | `5.9.3` | 3 / 2 / 1 | Astro、Svelte | 同一主版本内更新所有副本 |
| `js-yaml` | `3.15.1` | `3.15.2` | 1 / 0 / 0 | `gray-matter` | 保持 3.x，验证 frontmatter 解析 |
| `svgo` | `2.8.3`、`4.0.2` | 分别 `2.8.4`、`4.1.0` | 2 / 2 / 0 | microbundle/PostCSS、astro-icon/Iconify | 按主版本分别修复，不能统一强制到 4.x |
| `undici` | `7.29.0`、`8.10.1` | 分别 `7.29.1`、`8.10.2` | 5 / 10 / 6 | Miniflare、Astro/unifont | 8.x 正常范围升级；7.x 检查父包精确固定 |
| `sharp` | `0.35.2`、`0.35.4` | `0.35.5` | 1 / 0 / 0（历史；另有新高危） | 顶层、Astro、Cloudflare/Miniflare | 全部副本及 Linux 原生库；不能再把顶层 0.35.4 称为已安全修复 |
| `fast-uri` | `3.1.5` | `3.1.8` | 5 / 1 / 0 | Astro check → YAML language server → AJV | 同一主版本内更新，覆盖全部 6 条告警 |
| `brace-expansion` | `1.1.18`、`2.1.4`、`5.0.9` | 分别 `1.1.21`、`2.1.7`、`5.0.12` | 6 / 3 / 0 | 多个 minimatch/glob 版本 | 三条版本线分别修复 |
| `colord` | `2.9.3` | `2.9.4` | 0 / 1 / 0 | microbundle → cssnano | 同一主版本内修复 |
| `serialize-javascript` | `4.0.0` | 优先移除旧链；备选 `7.0.5` | 1 / 0 / 0（历史） | Swup 旧插件 → microbundle → rollup-plugin-terser | 7.0.3 落入另一 DoS 公告；7.1.1 也有独立 XSS 公告，不盲追 latest |
| `http-cache-semantics` | `4.2.0` | **BLOCKED** | 1 / 0 / 0（新增） | Astro 远程图片构建缓存 | 审计宣称 4.2.1，但 npm 404、官方无修复版本；禁止假设版本存在 |
| **历史合计** |  |  | **24 / 19 / 7** | **2026-10-02 的 50 条记录，32 个 GHSA** | 当前数字与并集见第 1 节 |

不能只取某包第一条告警的修复版本。例如 `fast-uri` 的不同告警分别要求 `3.1.6`、`3.1.7`、`3.1.8`，因此本次目标至少是 `3.1.8`；`brace-expansion` 的三条版本线也必须取各自覆盖全部告警的下限。[fast-uri 公告](https://github.com/advisories/GHSA-hrr3-gc8f-f4qj)、[brace-expansion 公告](https://github.com/advisories/GHSA-q2hr-2g5m-vwhr)。

## 4. 风险排序

优先级同时考虑漏洞后果、真实执行位置、输入可信度和修复兼容成本。下列 R1–R5 是实施批次编号，不能与安全评级混用。

### 优先处理实际参与构建和渲染的数据链

- **devalue**：序列化过程中可能涉及共享缓冲区内容泄露等问题。当前没有发现将 Node Buffer 作为岛屿组件数据传给浏览器的路径，但应消除这个潜在边界缺口。验证不需要真实凭据，可使用人为构造的无敏感标记数据。[公告](https://github.com/advisories/GHSA-j22f-vq7h-c4qm)
- **js-yaml**：参与文章 frontmatter 解析。当前仓库内容可信，但未来新增稿件会增加输入面；应在写作流程扩大前修复解析资源消耗问题。
- **SVGO**：参与图标构建。升级后仍不能把图标压缩器当作通用安全清洗器；不引入未经审查的 SVG，也不因此开放上传入口。
- **undici 8.x**：涉及字体构建工具的网络请求。没有面向访客的 Node 请求服务，但构建时远程响应仍需纳入风险范围。

### 其次处理检查、样式和文件匹配链

`fast-uri`、`brace-expansion`、`colord` 主要处在检查或构建工具链。它们的修复大多可留在原有主版本内，适合小范围、可追踪地更新；不能因“不直接运行在网页里”而永久忽略。

### 单独处理精确固定和跨主版本链

- Miniflare 当前把 `sharp` 固定为 `0.35.2`、`undici` 固定为 `7.29.0`。正常范围刷新未必能解决，必须处理父包约束。
- `rollup-plugin-terser@7.0.2` 要求 `serialize-javascript ^4.0.0`。历史 RCE 公告的下限 7.0.3 仍命中另一 DoS 公告，因此备选至少评估 7.0.5；优先尝试两条 Swup 父边覆盖以消除整个旧构建链，仍须明确承认其跨主版本边界。[RCE 公告](https://github.com/advisories/GHSA-5c6j-r48x-rmvq)、[DoS 公告](https://github.com/advisories/GHSA-qj8w-gfj5-8c6v)

## 5. R1：修复现有兼容范围内的依赖

### 5.1 已核验的约束

| 父依赖 | 当前声明 | 对应候选 |
| --- | --- | --- |
| Astro `7.2.10`、Svelte `5.57.0` | `devalue ^5.8.1` | `5.9.3` |
| gray-matter `4.0.3` | `js-yaml ^3.13.1` | `3.15.2` |
| Iconify tools `5.0.12` | `svgo ^4.0.1` | `4.1.0` |
| postcss-svgo `5.1.0` | `svgo ^2.7.0` | `2.8.4` |
| unifont `0.7.5` | `undici ^8.0.0` | `8.10.2` |
| AJV `8.20.0` | `fast-uri ^3.0.1` | `3.1.8` |
| minimatch 3.x / 5.x、9.x / 10.x | `brace-expansion` 的 1.x / 2.x / 5.x 范围 | 各版本线修复下限 |
| postcss-colormin、postcss-minify-gradients | `colord ^2.9.1` | `2.9.4` |

这些约束与候选在版本范围上相容；这只证明有望进行有界更新，不证明构建或浏览器已经兼容。执行时需检查锁文件中全部父边，不能只检查表中的代表路径。

### 5.2 执行方法

1. 记录当前 Git SHA、依赖文件哈希、生产/完整审计和 `pnpm why` 输出。
2. 优先尝试只更新目标传递依赖的锁文件解析结果，不修改不相关直接依赖，不新增这些包为顶层依赖。
3. 如果所用 pnpm 命令不能可靠限制范围，不进行全量盲更新；改用逐项审查的限定 override 生成候选，再审查完整锁文件差异。
4. 每批写明旧版本、新版本、父范围、变更原因、受影响功能和验证结果。建议把内容/序列化、图标/网络、检查/匹配分成可独立评估的子批次。
5. 重新审计，确认对应 GHSA 在所有受影响副本中消失。任何依赖图扩大、无关版本漂移或新安装脚本都必须说明并收敛。

以下保留初版的**范围选择器示例**以说明版本线，阶段 0 不选择整段应用。先完成批次 A 并重算父边，再按仍存在的实例决定正常范围更新或更窄的父边覆盖。保留现有 `packages` 和 `allowBuilds`，不整文件替换。

```yaml
overrides:
  "devalue@^5": "5.9.3"
  "js-yaml@^3": "3.15.2"
  "svgo@^2": "2.8.4"
  "svgo@^4": "4.1.0"
  "undici@^8": "8.10.2"
  "fast-uri@^3": "3.1.8"
  "brace-expansion@^1": "1.1.21"
  "brace-expansion@^2": "2.1.7"
  "brace-expansion@^5": "5.0.12"
  "colord@^2": "2.9.4"
```

override 可覆盖传递依赖，必须放在根配置，并可限定父包或版本范围；使用后仍须检查它实际匹配了哪些边。[pnpm overrides 文档](https://pnpm.io/settings/dependency-resolution#overrides)

按当前基线，R1 对应 38 条告警记录。这个数字用于核对范围，不是对执行后计数的保证；漏洞数据库和父依赖解析结果都可能改变。

## 6. R2：修复 Cloudflare / Miniflare 中固定的旧副本

### 6.1 首选路径

检查 `@astrojs/cloudflare`、`wrangler`、`@cloudflare/vite-plugin` 与 `miniflare` 的兼容组合，选择能自然带入已修复 `sharp` / `undici` 的父包版本。版本候选应来自官方发布说明和实际元数据，不能仅依据 `latest` 标签。

当前发现 `miniflare@5.20260828.0-alpha`，因此更要检查 prerelease 状态和上层兼容关系，不能在修复中无意引入另一组未评估的预发布版本。依赖升级不启用 `CF_WORKERS`，不迁移部署平台。

### 6.2 父包暂不能升级时的有界候选

在说明父包精确固定被覆盖的原因，并补齐验证后，可评估：

```yaml
overrides:
  "miniflare@5.20260828.0-alpha>sharp": "0.35.5"
  "miniflare@5.20260828.0-alpha>undici": "7.29.1"
```

这是待验证方案，不是自动批准的兼容组合。核对匹配父版本、Node engines、平台二进制、模块格式和依赖者实际使用的 API。不能把所有 `undici` 强制统一到 8.x，也不能因项目顶层 `sharp` 已修复而漏掉嵌套旧副本。

验证至少包括：Linux 干净安装、原生图片处理能加载、现有头像/封面输出正确，以及 Pages 双路径完整构建。若选择维护 Cloudflare 适配能力，还需验证对应本地适配入口；没有测过的能力保留未验证状态。

R2 在当前基线对应 11 条记录：`sharp` 1 条、`undici` 7.x 的 10 条。若提议移除 Cloudflare 依赖，则属于能力范围变化，应另行决策；不能为了降低数字直接删除依赖链。

## 7. R3：解决 serialize-javascript 的跨主版本问题

这是本轮最需要独立处理的一项：当前为 `4.0.0`，父包接受 `^4.0.0`；7.0.3 已不是可接受候选，备选 7.0.5 的 Node 要求为 >=20。阶段 0 选择先尝试两个旧插件到 `@swup/plugin 4.0.0` 的精确父边 override。它超出两个父包的 `^3.0.0`，必须经过真实父调用和浏览器验收，不称为自然范围升级。

按以下顺序评估，每一步都留下证据：

1. **优先升级父依赖链。** 查清 `@swup/astro`、parallel/route-name 插件为何引入 `@swup/plugin@3.0.1` 和 microbundle；寻找已修正依赖声明或升级构建工具链的兼容版本。仓库同时存在 `@swup/plugin@4.0.0`，不能据此直接替换依赖旧主版本的插件。
2. **父链无法自然修复时，评估替换旧构建链。** 先确认已发布插件是否包含可直接使用的构建产物，以及替换会不会改变 Swup 集成与构建入口。不要使用 `overrides: { package: "-" }` 把旧链静默剪掉。
3. **最后才考虑精确父边跨版本 override。** 必须证明父包对序列化函数的使用仍兼容，包含普通对象、Date、RegExp、转义内容和 worker 参数传递；不得只凭网页构建成功就批准这项变化，因为旧 microbundle 链可能根本没在当前构建里运行。
4. **如果仍无可靠方案，明确阻塞。** 保留该高危未解决状态，提交已完成子批次与剩余问题。未经明确例外批准，不将整个整改标记完成。

阶段 0 已给出官方发布包支持的有界实验目标，详见下文批次 A；尚未实测，因此不视为可直接接纳的兼容组合。不提供全局 serializer 覆盖，也不删除父包依赖来隐藏告警。

R3 在当前基线对应 1 条高危记录。若父链升级同时消除了旧 SVGO、colord 或匹配依赖的副本，应据新依赖图重新核对，避免重复计算收益。

## 8. R4：建立持续审计门禁

现有 CI 已覆盖格式、类型、151 项测试、双路径构建和产物检查，但这些检查不替代依赖安全审计。建议在整改落地时增加独立安全检查，而不是只在本次手工运行一次。

### 8.1 门禁行为

| 输入或情况 | 应有结果 |
| --- | --- |
| 有效审计结果且无不允许的告警 | PASS |
| 发现高危或严重漏洞 | FAIL，阻止该候选发布 |
| 历史 32 项及阶段 0 官方公告并集仍有受影响实例 | FAIL；例外需单独批准，不能算整改完成 |
| 中低危有可用修复但尚未处理 | 保持整改未完成，并按既定发布策略判定；不能静默忽略 |
| 注册表超时、限流、返回 HTML、JSON 损坏或缺少必要字段 | BLOCKED，安全检查未完成；CI 作非成功处理 |
| 输出有错误对象但退出码异常为 0 | BLOCKED，不把退出码当成唯一依据 |
| 同一 GHSA 的部分版本已修复、其他版本仍存在 | FAIL |

安全检查应对生产和完整依赖图分别保存原始 JSON、退出码、扫描时间、注册表、Git SHA 和依赖文件哈希。比较时以 GHSA、包名、受影响版本和路径为键；总数字只作摘要。

不要使用 `--ignore-registry-errors` 或无条件 `|| true` 把网络失败变成通过，不新增大范围 `audit.ignore`。临时容忍必须记录理由、范围、责任人和复查期限，并在报告中显示。[pnpm audit 文档](https://pnpm.io/cli/audit)

### 8.2 CI 与发布整合

- 安全检查绑定 PR 的精确源码与锁文件；main 上也执行。优先在可复用 build 工作流增加一次独立审计 job，两个 base 的质量 job 依赖其成功，部署依赖整个工作流成功；避免两次矩阵扫描与另起互不相依的工作流。
- 保留 `pnpm install --frozen-lockfile`，不在 CI 里自动改锁文件或自动修复漏洞。
- 工具和 Actions 使用经核验的固定版本/SHA。新增上传证据步骤时，日志不得包含 token、完整环境变量或私人目录内容。
- 审计失败也应保存诊断产物；上传成功不能覆盖审计失败状态。
- 防止三套工作流重复实现不同的审计策略；优先复用现有质量工作流。
- main 的 required checks 若要新增或调整，单独确认权限变更。现有分支保护维持，不能为了合并关闭检查。
- 如需要定期扫描或自动提醒，由用户确定频率和通知方式后配置。本方案不创建定时任务。

### 8.3 门禁逻辑的必要测试

只为实际新增的安全判定逻辑补充有意义的测试：无告警、严重/高危、中低危、重复版本残留、网络错误、非法 JSON、缺字段、被撤回或更新的公告、错误退出码。测试不得依赖实时漏洞数据库才能稳定运行。

## 9. R5：验证整改没有损坏博客

### 9.1 安装与工作区纪律

先确认当前 Git 分支、未提交文件、工具版本、锁文件和安装目录的关系。保留 `.workbuddy`、已有开发分支、历史证据及未接纳的双语候选。

使用独立、预先说明用途的验证环境，优先让 GitHub runner 做干净安装。不要在复用原仓库 `node_modules` 的副本里执行可能重建共享目录的安装；工具拒绝时停止并报告，不换包装命令重试删除。

禁止删除源码、资产、锁文件、依赖目录或历史证据；不执行 `rm -rf node_modules`、删除锁文件重装等操作。标准构建缓存例外和七项 `zhenkun-ci-artifacts-*` 测试夹具例外沿用 ROADMAP 的明确范围，不能扩展到新测试或依赖目录。若安装/验证需要额外清理，先说明确切目录和副作用并取得对应授权。

### 9.2 审计与版本定位命令

以下命令用于重新采集事实，不执行自动修复；保存输出时使用新的日期/批次文件，保留既有基线。

```sh
node --version
pnpm --version
git status --short --branch
git rev-parse HEAD

pnpm audit --prod --registry=https://registry.npmjs.org --json
pnpm audit --registry=https://registry.npmjs.org --json

pnpm why devalue
pnpm why js-yaml
pnpm why svgo
pnpm why undici
pnpm why sharp
pnpm why fast-uri
pnpm why brace-expansion
pnpm why colord
pnpm why serialize-javascript
```

审计返回非零时，先区分“有效报告发现漏洞”和“扫描失败”，再决定下一步；不能把所有非零都当成同一种结果。

不把 `pnpm audit --fix` 当作默认一步修复。它会写入修复配置；自动更新也可能扩大锁文件变化范围。`pnpm update` 默认可改写依赖声明，`--no-save` 只限制声明写入，不能自动保证传递依赖兼容。[update 行为说明](https://pnpm.io/cli/update)

本地实际 pnpm 为 `11.22.0`。官网的版本化链接当前会跳转至包含更新版本行为的页面，因此实施前核对本地 `pnpm help audit`、`pnpm help update`；不照搬仅在 pnpm 12 提供的选项。

### 9.3 每个完整候选的验证命令

在已确认副作用与安装权限的验证环境中，按顺序执行。依赖安装需要先有审核后的候选锁文件；冻结安装不是更新锁文件的命令。

```sh
pnpm install --frozen-lockfile
pnpm exec biome ci ./src
pnpm check
pnpm type-check
node --test scripts/zhenkun-test-*.mjs

DEPLOY_BASE=/ pnpm build
node scripts/zhenkun-verify-ci-artifacts.mjs --base /

DEPLOY_BASE=/Zhenkun-blog-site/ pnpm build
node scripts/zhenkun-verify-ci-artifacts.mjs --base /Zhenkun-blog-site/

pnpm audit --prod --registry=https://registry.npmjs.org --json
pnpm audit --registry=https://registry.npmjs.org --json
git diff --check
```

每项命令记录实际退出码，失败后不把后续输出拼成一次成功运行。第二次构建会替换第一次的 `dist`，因此每种 base 的验证和证据保存必须在下一次构建前完成。若新增检查脚本，按仓库约定单独检查其格式和类型，`biome ci ./src` 并不覆盖 `scripts`。

### 9.4 针对性测试矩阵

| 变动 | 需要证明的行为 | 不能替代它的证据 |
| --- | --- | --- |
| devalue / Svelte / Astro | 岛屿组件正常 hydration；人工标记的 Buffer/typed array 样例不泄露界外数据；序列化错误正确被处理 | 仅首页 HTTP 200 |
| js-yaml / gray-matter | 日期、布尔值、标签、Unicode、合法别名解析保持；已知病理输入在资源限制内安全拒绝或结束 | 仅空内容构建 |
| SVGO / Iconify | 图标、SVG 属性、样式与原生导入正常；不新增可执行危险链接 | 文件存在或压缩率相近 |
| sharp / Miniflare | 支持的平台加载成功；头像/封面可解码，尺寸正确；全链不残留旧 sharp | 仅顶层版本输出 |
| undici / unifont | 允许来源的字体获取及输出正常；用本地可控 HTTP fixture 验证需要的错误/超时行为，不向任意外部目标发送探针 | 单次缓存命中的构建 |
| brace-expansion / glob | 文章、图片、脚本与样式输入集合不缺失；嵌套、Unicode 和合法通配规则保持 | 没有抛异常 |
| serialize-javascript / Swup 链 | 真实父调用点的序列化/worker 用法兼容，以及 SPA 脚本生命周期、首搜、菜单和前进后退正常 | 仅未执行 microbundle 的 Astro 构建 |

病理输入测试采用小规模、安全标记数据、子进程超时和资源上限，不运行可能耗尽机器内存的大规模公开利用样例。新测试临时目录的清理不自动继承七项旧测试的例外。

### 9.5 浏览器与产物验收

至少验证桌面 1280×900、移动模拟 390×844，分别记录浏览器与截图：

- 首次搜索、快速替换关键词、清空、关闭后用原词重开；Pagefind 加载成功且结果路径正确。
- 移动菜单初始焦点、Tab/Shift+Tab 循环、Escape 焦点恢复、遮罩关闭、背景滚动恢复。
- Home → About → Home 的 Swup 往返，菜单/搜索仍正常，没有重复监听或残留 inert。
- 明暗主题终态正常；实体设备与动画中间帧若未测，明确标记未验证。
- 中文原网址、canonical、OG 图片、RSS、sitemap、robots、静态资源路径保持正确；无重复 base。
- 草稿未出现在正文页、元数据、RSS、Pagefind 或 OG 公开输出中。禁用页面仍按已接纳的 HTTP 200 stub 规则跳转，不能误报成服务器 404。

当前没有公开文章。正向正文、MDX、Wiki 图片和 OG 行为应用明确标注的合成夹具验证，夹具不进入线上内容；真实文章和评论验收仍需主人批准文章后进行。

## 10. 提交、发布和回滚

### 10.1 建议交付批次

| 批次 | 内容 | 对应基线范围 | 出口 |
| --- | --- | --- | --- |
| R1 | 原范围内补丁/小版本修复 | 38 条记录 | 锁文件可解释、目标告警消失、相关测试通过 |
| R2 | Cloudflare/Miniflare 精确固定链 | 11 条记录 | 父版本或有界 override 验证通过 |
| R3 | Swup 旧构建链与 serializer 跨版本 | 1 条记录 | 调用兼容证据充分，高危残留为 0 |
| R4 | CI 安全门禁和证据保存 | 持续防回归 | 失败输入不被误判 PASS |
| R5 | 最终全量验证、授权发布、线上复核 | 整个候选 | 依赖图和实际部署产物一致 |

批次范围可以因父依赖连带修复而合并，但必须说明变化，并以最终实际依赖图重新计算；不为凑批次数拆分必须共同验证的版本组合。

使用 `codex/` 分支，每个完成增量按 Conventional Commits 提交，例如 `fix(deps): patch content and build dependency chains`。原有分支保留；不重写已发布历史。ROADMAP 更新任务进度，dated references 保存审计和验证证据，不把 README 改成进度日志。

### 10.2 发布条件

提交不等于推送，推送不等于合并与部署。获得对应目标和范围授权后，先将候选送入现有 PR 流程；核验精确 head 的质量与安全检查，再合并。遵守 main 线性历史和保护规则，不通过强推或关闭门禁解决失败。

部署后下载实际 Pages artifact，运行现有产物检查并与线上响应核对。记录 PR、合并 SHA、部署 run、产物摘要、线上 HTTP 结果和浏览器截图。最后如仅追加交付记录，可按仓库现有方式进行 documentation-only 收尾，但不得借此跳过应用变更的验证。

### 10.3 回滚规则

- 每批变更都应可定位到独立提交和依赖差异；同时记录该版本的已知漏洞状态。
- 功能回归出现后停止后续合并。通过新的回滚提交恢复已知可运行状态，禁止强推、历史重写或破坏性 reset。
- 回滚可能重新引入漏洞，必须再次写明风险与临时限制；旧版本“能运行”不代表安全问题消失。
- 若回滚会删除文件或涉及额外发布权限，先按仓库规则处理，不擅自执行；保留已有证据和用户文件。
- 不混合回滚站点更名、作者资料、已接纳发布规则或其他无关功能。

## 11. 例外与长期维护

目标是修复，不是建立永久忽略名单。确无兼容修复的情况，应单独记录：

| 字段 | 必填内容 |
| --- | --- |
| 标识 | GHSA、包名、精确版本、全部受影响依赖路径 |
| 风险 | 触发条件、可能后果、构建/生产边界、哪些情况会使原评估失效 |
| 受阻原因 | 父版本约束、上游问题或可复现兼容回归；附证据 |
| 临时措施 | 限制输入来源、暂停相关能力等具体措施 |
| 批准与责任 | 实际批准人、批准范围、执行责任人；不得编造 |
| 期限 | 由批准时确定的复查日期/事件，不设无限期例外 |
| 退出条件 | 上游修复发布、兼容性问题解决或相关能力替换 |

引入 SSR、Cloudflare 服务、用户上传、远程稿件导入、第三方 SVG、Buffer 组件数据，或扩大 CI token 权限时，都应重新审查可达性。对新依赖更新建立小批次验证习惯，避免长期累积后一次跨多个主版本。

## 12. 交接给执行者的要求

收到对应批次的实施交接后，先读 `AGENTS.md`、ROADMAP、ADR-XB-016 和最新 Git 状态，重新核验审计基线。阶段 0 推荐按 **R3 → R1a → R2 → R1b → R4 → R5** 执行下文精确批次；cache 修复可用性作为持续阻断并行跟踪，不自动创建后台任务。出现锁文件扩大、安装目录重建、兼容性失败或权限冲突时，停止受影响动作并说明具体原因。

每次交付明确报告：改了哪些包、为什么选择这些版本、消除了哪些 GHSA、还剩什么、哪些测试实际执行、哪些没有验证、提交 SHA、是否推送/合并/部署。未知项保持未知，不以“静态网站”或“测试通过”把未修复告警写成安全。

**本次文档的完成不代表任何依赖整改已经完成。实际执行、必要的依赖配置修改及远端交付，需要按届时明确授权推进。**

## 附录：基线漏洞编号清单

下面按 GHSA 去重列出 32 项，用于最终逐项核销；具体受影响版本、完整路径及各版本线修复范围以本次 JSON 证据为准。

| 依赖 | 漏洞编号 | 等级 | 基线受影响版本 |
| --- | --- | --- | --- |
| `brace-expansion` | [GHSA-6j4f-fj2g-mc7p](https://github.com/advisories/GHSA-6j4f-fj2g-mc7p) | 高 | `1.1.18`, `2.1.4`, `5.0.9` |
| `brace-expansion` | [GHSA-q2hr-2g5m-vwhr](https://github.com/advisories/GHSA-q2hr-2g5m-vwhr) | 中 | `1.1.18`, `2.1.4`, `5.0.9` |
| `brace-expansion` | [GHSA-qhr7-859c-m2p7](https://github.com/advisories/GHSA-qhr7-859c-m2p7) | 高 | `1.1.18`, `2.1.4`, `5.0.9` |
| `colord` | [GHSA-2wm5-q62r-hmrv](https://github.com/advisories/GHSA-2wm5-q62r-hmrv) | 中 | `2.9.3` |
| `devalue` | [GHSA-4q55-j62x-fr9h](https://github.com/advisories/GHSA-4q55-j62x-fr9h) | 中 | `5.9.2` |
| `devalue` | [GHSA-hx4r-w6wj-j8fg](https://github.com/advisories/GHSA-hx4r-w6wj-j8fg) | 中 | `5.9.2` |
| `devalue` | [GHSA-j22f-vq7h-c4qm](https://github.com/advisories/GHSA-j22f-vq7h-c4qm) | 高 | `5.9.2` |
| `devalue` | [GHSA-mcm9-63f2-9j32](https://github.com/advisories/GHSA-mcm9-63f2-9j32) | 高 | `5.9.2` |
| `devalue` | [GHSA-wf3x-273g-mvxv](https://github.com/advisories/GHSA-wf3x-273g-mvxv) | 低 | `5.9.2` |
| `devalue` | [GHSA-x5rw-q4pp-hg5g](https://github.com/advisories/GHSA-x5rw-q4pp-hg5g) | 高 | `5.9.2` |
| `fast-uri` | [GHSA-5jgf-p345-68v8](https://github.com/advisories/GHSA-5jgf-p345-68v8) | 高 | `3.1.5` |
| `fast-uri` | [GHSA-f65p-4m7j-42xc](https://github.com/advisories/GHSA-f65p-4m7j-42xc) | 高 | `3.1.5` |
| `fast-uri` | [GHSA-fph4-wmhf-6fwf](https://github.com/advisories/GHSA-fph4-wmhf-6fwf) | 高 | `3.1.5` |
| `fast-uri` | [GHSA-hrr3-gc8f-f4qj](https://github.com/advisories/GHSA-hrr3-gc8f-f4qj) | 中 | `3.1.5` |
| `fast-uri` | [GHSA-jqff-g426-hqxp](https://github.com/advisories/GHSA-jqff-g426-hqxp) | 高 | `3.1.5` |
| `fast-uri` | [GHSA-qw65-cvwx-89v3](https://github.com/advisories/GHSA-qw65-cvwx-89v3) | 高 | `3.1.5` |
| `js-yaml` | [GHSA-2883-xcg3-v3hh](https://github.com/advisories/GHSA-2883-xcg3-v3hh) | 高 | `3.15.1` |
| `serialize-javascript` | [GHSA-5c6j-r48x-rmvq](https://github.com/advisories/GHSA-5c6j-r48x-rmvq) | 高 | `4.0.0` |
| `sharp` | [GHSA-rgj7-g3m4-5g8c](https://github.com/advisories/GHSA-rgj7-g3m4-5g8c) | 高 | `0.35.2` |
| `svgo` | [GHSA-4vpr-x523-8j87](https://github.com/advisories/GHSA-4vpr-x523-8j87) | 中 | `2.8.3`, `4.0.2` |
| `svgo` | [GHSA-w27v-7q3p-w38r](https://github.com/advisories/GHSA-w27v-7q3p-w38r) | 高 | `2.8.3`, `4.0.2` |
| `undici` | [GHSA-2gqq-gqf2-x968](https://github.com/advisories/GHSA-2gqq-gqf2-x968) | 低 | `7.29.0`, `8.10.1` |
| `undici` | [GHSA-2jfj-6hjv-fm6j](https://github.com/advisories/GHSA-2jfj-6hjv-fm6j) | 中 | `7.29.0`, `8.10.1` |
| `undici` | [GHSA-3wwx-pv8p-q78v](https://github.com/advisories/GHSA-3wwx-pv8p-q78v) | 中 | `7.29.0`, `8.10.1` |
| `undici` | [GHSA-3xpg-4rpp-hhhm](https://github.com/advisories/GHSA-3xpg-4rpp-hhhm) | 中 | `7.29.0`, `8.10.1` |
| `undici` | [GHSA-8436-99hf-9mmv](https://github.com/advisories/GHSA-8436-99hf-9mmv) | 低 | `7.29.0`, `8.10.1` |
| `undici` | [GHSA-pmjh-fq2x-6v4x](https://github.com/advisories/GHSA-pmjh-fq2x-6v4x) | 中 | `7.29.0`, `8.10.1` |
| `undici` | [GHSA-r53p-7pc4-xj5r](https://github.com/advisories/GHSA-r53p-7pc4-xj5r) | 低 | `7.29.0`, `8.10.1` |
| `undici` | [GHSA-rfgv-xxqx-mfg5](https://github.com/advisories/GHSA-rfgv-xxqx-mfg5) | 高 | `7.29.0`, `8.10.1` |
| `undici` | [GHSA-rx4f-c7p8-82vq](https://github.com/advisories/GHSA-rx4f-c7p8-82vq) | 中 | `7.29.0`, `8.10.1` |
| `undici` | [GHSA-vp8m-p9jh-q5pm](https://github.com/advisories/GHSA-vp8m-p9jh-q5pm) | 高 | `8.10.1` |
| `undici` | [GHSA-w293-vg96-wgc3](https://github.com/advisories/GHSA-w293-vg96-wgc3) | 高 | `7.29.0`, `8.10.1` |

<a id="phase0-packets"></a>

## 阶段 0：精确实施交接（版本 2）

本节是候选操作说明，执行状态只记录 ROADMAP。当前阶段 0 在此停下，不生成候选锁文件、不安装、不运行应用测试。后续由协调者维持一条写入线：常规有界实现交给 6.1 Sol Fast，跨主版本/原生兼容/公告冲突/范围扩大交给 Astra xhigh。若工具不能证实实际模型，记录未验证，不以口头声明替代。

### A / R3：优先消除 Swup 旧构建链

**精确输入：**阶段 0 交付提交，应用基线仍为 `43c21ad`；源分支/用户目录保留。实施前确认没有双语或其他源码被混入。仅在不共享 node_modules 的隔离 checkout 安装，包管理器保持 11.22.0，Node 保持 CI 的 24.20.0。

**变更范围：**`pnpm-workspace.yaml`、由包管理器生成的 `pnpm-lock.yaml`、必要的真实父调用回归、dated evidence 和 ROADMAP。不改 `package.json` 的版本、Swup 配置、页面功能、CI 或部署。保留 `packages`、`allowBuilds`，只合并以下两个根级条目：

```yaml
overrides:
  "@swup/parallel-plugin@0.4.0>@swup/plugin": "4.0.0"
  "@swup/route-name-plugin@4.1.0>@swup/plugin": "4.0.0"
```

两个父包均声明 `^3.0.0`；上面是**跨主版本 override**，不是正常依赖刷新。ESM 和类型文件字节一致、官方移除 CLI 的说明支持试验，CJS 和运行行为仍待验证。禁止添加全局 plugin/serializer override、删除依赖条目或把旧链移到 devDependencies。

**后续获交接后可执行的顺序：**先通过当前 pnpm 的本地 help 确认命令行为；生成锁文件使用 `pnpm install --lockfile-only --ignore-scripts`，审查完整 diff 后才在该隔离 checkout 执行 `pnpm install --frozen-lockfile`。不得手写 integrity 或使用旧共享安装目录。前一命令也可能解析元数据/写缓存，因此属于实施阶段，本轮未执行。

**锁文件接受条件：**只新增两条 override；两个目标父边均到 4.0.0；现有其他 plugin 4 使用者不漂移；所有消失节点必须可追溯到失去唯一入边的旧链；无关直接依赖、Astro/Svelte/Swup/Node/CI 版本不变；没有新的 peer 问题或安装脚本授权。若出现无法解释的新增/漂移，停止并返回复杂审阅。

**真实兼容门：**

- 对安装后的两条父边分别解析并证明实际加载的基类版本，测试它们实际的 ESM 和 CJS 入口、类型声明，以及合法/非法版本要求检查。
- 使用真实父插件构造、mount/unmount 和真实 Swup hook API，证明注册与注销、重复挂载无累积；route-name 的匹配/命名，parallel 的 visit 标记/容器恢复均须覆盖。当前集成默认 `parallel:false`、`routes:false`，现有页面未显式开启，普通首页 smoke 不会执行这两项；可以在隔离安全夹具中打开，不修改生产开关。
- 正式 `pnpm check`、`pnpm type-check`（保留 isolatedDeclarations）、source Biome、新脚本单独 Biome，以及现有 native suite；记录实际数量，不预填 151/165 PASS。
- 两 base 各完整 `pnpm build` 后立即保存并验证产物和 Pagefind。真实浏览器验证 Home/About 往返、前进后退、首次/替换/清空/重开搜索、移动菜单键盘与焦点、滚动/inert 清理，不能只验 HTTP 200。
- 生产/完整审计与官方并集重新核对；证明 `@swup/plugin 3`、microbundle、rollup-plugin-terser、serializer 4 的所有入边消失。按新图记录 v2 SVGO、colord、brace 等是否随之消失，不预先承诺告警减少数量。

**交付与停止条件：**一个有范围说明的独立候选提交、依赖 diff/父边/审计原文与退出码、真实回归及浏览器证据，交协调者独立审查。不得自行接纳到原分支、main、推送或部署。若失败，停止 A；不得自动应用 serializer 7.0.5 备选。通过新回滚提交恢复这两个配置文件的同批次变化和相关新增测试，保留证据；涉及文件删除继续遵守现有边界。

### B–F：后续有界批次

| 批次 / 依赖 | 精确候选与范围 | 验证及出口 | 回滚 / 未决 |
| --- | --- | --- | --- |
| B / R1a，A 完成并重算图后 | devalue `5.9.2→5.9.3`（Astro/Svelte `^5.8.1`）；gray-matter 的 js-yaml `3.15.1→3.15.2`，现有 4.3.2 保持 | 正常范围定向锁更新优先；必要时只覆盖 `astro@7.2.10>devalue`、`svelte@5.57.0>devalue`、`gray-matter@4.0.3>js-yaml`。真实序列化/hydration、frontmatter 日期/标签/Unicode/别名、正式质量门和双 base 内容输出 | 同批配置+锁一起回滚；不触碰正文公开状态。安全标记小夹具，不执行公开利用代码 |
| C / R2，独立原生批次 | 根/Astro sharp `0.35.4→0.35.5`（原范围），Miniflare 精确 `0.35.2→0.35.5` 和 undici `7.29.0→7.29.1`；父框架不升级 | Linux 干净冻结安装、所有 sharp 副本和平台二进制、实际 libvips/librsvg来源、无害头像/封面解码尺寸、图片导入与 Miniflare 实际 API、双 base 完整构建；CF_WORKERS 必须未设置 | 顶层和嵌套一起核销新 sharp 公告。最新 CF 组合仍旧 sharp，不能替代这批。原生失败回到 Astra 审阅，禁止删除 Cloudflare 能力 |
| D / R1b，A–C 后的剩余图 | 仅仍存在的 SVGO `2.8.4/4.1.0`、undici8 `8.10.2`、fast-uri `3.1.8`、brace `1.1.21/2.1.7/5.0.12`、colord `2.9.4` | 按剩余父边拆小增量；图标/字体请求错误/URI schema/输入发现集合对应测试；不得为已消失链添加顶层依赖或永久 override | 每批保留旧新父边清单；正常范围刷新优先，作用于不同主版本的补丁不合并成一个全局版本 |
| E / R4，策略先确定 | 可复用 build 工作流独立安全 job；部署依赖其成功；保持 frozen-lockfile 和现有权限 | 生产+完整 JSON及退出码/时间/registry/SHA/依赖hash保存；网络/JSON/缺字段/错误对象为 BLOCKED且非成功；高危/严重/受影响残留 FAIL；失败也上传证据。稳定夹具覆盖判定，不依赖实时数据库 | 没有 cache 修复或明确例外时门禁保持红，不能 `|| true` 或 ignore。required checks、权限与定时通知不自动变更 |
| F / R5，全部依赖与门禁候选完成 | 精确最终 SHA 的干净 Linux 安装、质量、双 base 产物/HTTP/Pagefind/真实浏览器总验收 | 正文正向用获准 synthetic 夹具；草稿/禁用页/RSS/sitemap/robots/canonical/OG边界保持；候选树与测试树一致 | 合并/推送/上线另行协调授权；回滚依赖三文件与当批源码为一致组合，并报告重新引入的漏洞 |

阶段 0 已查询上述补丁的官方 npm 元数据。undici7 要求 Node >=20.18.1，undici8 >=22.19.0，sharp >=20.9.0，serializer >=20；brace5 为 `20 || >=22`。CI Node 24.20.0 在这些范围内。引擎相容不证明 Linux 二进制、模块格式、API 或 peer 相容；不要因此更新引擎或 allowBuilds。

### 独立阻断：cache 修复与临时例外

`http-cache-semantics@4.2.0` 经 Astro `^4.2.0` 引入。官方当前没有可核验的已发布修复；本文件不提供 4.2.1 的安装命令。优先等待/评估官方补丁或移除实际使用该库的可靠父版本；改造 Astro 图片缓存或维护补丁属于新的复杂方案，不能由执行者临时编造。

该调用点构建自己的图片 Request 并计算 storable/timeToLive；没有发现访客 max-stale 进入共享用户缓存的路径。这支持有条件的可达性判断，不能抵消高危版本匹配或宣称已修复。若确需临时发布，必须有实际批准人与负责人、精确版本/父边和限制；**建议首次复查不晚于 2026-10-10（七天）**，且在修复发布、引入共享用户缓存/SSR/代理/外部不可信输入时立即失效。无批准即无豁免；到期 CI 非成功，不自动延长，整体状态仍为部分完成。

其他 override 也记录责任人、首次采用日期和最多十四天复查点；原父包接纳修复范围或图中不再存在该边时移除覆盖，并重跑相应门禁。回滚重新引入风险时同样需要记录时限，不能把历史可运行版本称为安全。

### 持续契约

当前以已发布单语树为准，两 base 为 `/`、`/Zhenkun-blog-site/`。若另一任务先接纳双语，立即停止沿用本基线，重新协调树与测试；届时增加中/英 × 两 base、语言索引/单语言 UI/语言导航矩阵，不恢复暂停的双语工程。Pagefind 必须经完整正式构建生成，并区分原始索引 URL 与浏览器解析后路径。新测试的临时清理不得扩展七项既有 artifact 测试的窄例外。
