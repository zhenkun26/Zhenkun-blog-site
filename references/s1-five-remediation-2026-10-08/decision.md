# S1 五条新增告警：有界实施决策

2026-10-08。绑定候选 `1bde54cb488cfae291efef528391da2d511fb73c`，分支 `codex/blog-security-integration-20261007`。这是交给 Sol 的技术决策及探针证据；项目实时状态仍只在候选 `docs/ROADMAP.md`，本文件不授予发布 PASS。本轮没有修改候选源码、依赖、锁文件或文档，没有安装依赖、push、CI、merge 或部署。

**建议实施一份有界修复候选：移除旧 sprintf 依赖链；两条 KaTeX 父边统一到已安装、已核实的 0.18.5；所有 selector-parser 实例统一到 7.1.6；smol-toml 升到 1.9.0；source-map-js 升到 1.2.2。** 保留现有框架、十四条守卫中十三条的原值及两份 cache/Astro 补丁，只替换旧 PostCSS→source-map-js 守卫。新增一个精确 js-yaml CLI 适配补丁，避免直接替换 argparse 引入已实测的 CLI 回归。没有一条告警获得豁免；下面给的是可实施路线，最终接纳仍须真实安装图和验收。

## 先纠正审计明细

同一次审计的 prod/full 各有六条 advisory、2 high / 3 moderate / 1 low，但实例与路径并不相同。旧 `references/s1-audit-refresh-2026-10-08/report.md` 把部分 prod 明细泛化到了 full；Sol 记录本次 ADR/ROADMAP 时应明确勘误，保留历史原始文件。

| 包 | prod 实例/路径数 | full 实例/路径数 |
|---|---|---|
| sprintf-js | 1.0.3 / 1 | 相同 |
| smol-toml | 1.8.0 / 43 | 相同 |
| KaTeX | 0.16.47 / 2 | 相同 |
| source-map-js | 1.2.1 / 83 | 1.2.1 / 87 |
| postcss-selector-parser | 6.0.10 / 1；6.1.4 / 13 | 上述实例加 7.1.5 / 3 |

所以 7.1.5 **已在 full 原始审计中报告**，并非 audit 遗漏。五个告警以 prod、full 和真实锁图并集处理。其余一条是保留原始 high 记录的 http-cache-semantics；既有同次行为修复证明通过，不代表五条新告警已修复。[原始路径与 SHA256 对照](analysis/audit-path-matrix.json)。

## 使用及暴露范围

这些判断针对本地候选的源码和安装图，不能把候选依赖版本写成线上已部署版本。Pages 工作流上传 `dist`，`CF_WORKERS` 没有在该工作流启用；本轮没有对线上执行攻击、重新部署或验证服务器运行时。

| 包 | 实际调用边界 | 与公开站点的关系 |
|---|---|---|
| sprintf-js | 唯一路径为 gray-matter 4.0.3 → js-yaml 3.15.2 → argparse 1.0.10 → sprintf-js 1.0.3。argparse 由 YAML 的 `bin/js-yaml.js` 加载；其 YAML 库入口不加载 argparse。Wiki 索引和隔离脚本使用 gray-matter 库入口。 | 当前调用链未建立读者请求控制 printf 格式串的路径；CLI/开发工具仍安装受影响包。可信格式输入只是限制暴露，不是修复或审计豁免。`%.101f` 这种极短输入说明一般大小限制不足以修复它。 |
| KaTeX | Astro 的 rehype-katex 实际加载自身 0.16.47；remark-math 下 math HTML 扩展也保留该实例。root 0.18.5 和 CSS 已存在。配置 `{ katex }` 不是该插件支持的 renderer 注入 API。 | 主要是构建时生成 HTML；若同进程原型已被污染，生成的不可信链接/资源仍可能进入静态产物，风险能延续到阅读端。当前源代码未发现读者提交公式的服务端入口。KaTeX 本身不制造该原型污染。 |
| smol-toml | Astro 7.2.10 的 TOML file loader / data-entry parser，以及 internal-helpers 0.10.4、0.11.0 的 `+++` frontmatter。 | 恶意 TOML 可阻塞构建或开发进程；GitHub Pages 不执行这个解析器。源码已定位入口，未把现有零公开文章构建当成 TOML 功能覆盖。 |
| source-map-js | PostCSS、Tailwind node、两代 css-tree、magicast 的编译/转换路径；还通过 RSS 使用的 sanitize-html→PostCSS 抵达。 | 恶意 map/导入资产影响构建、开发和工具调用。当前 RSS 为静态生成，未证明线上有 map 解析服务。已检查这些具体路径，不声称对所有未来 island/服务完成可达性证明。 |
| selector-parser | typography 生成选择器、Expressive Code 两代 core→postcss-nested，以及开发依赖 postcss-nesting 的直接/peer 路径。 | 默认用途是构建 CSS；恶意 PR、导入资源或未来动态解析服务会改变信任边界。`dependencies`/`devDependencies` 的分类不等于读者浏览器/服务端暴露分类。 |

## 1. sprintf：移除依赖链，同时适配 YAML CLI

官方 [GHSA-hp3w-g68c-fv3c](https://github.com/advisories/GHSA-hp3w-g68c-fv3c) 为 moderate，影响 `<=1.1.3`，没有官方 patched version。`sprintf-js/1.1.4` 实测 404。正常上游路线暂不能解决：gray-matter latest 仍 4.0.3；js-yaml 最高 3.x 为 3.15.2，仍依赖 argparse `^1.0.7`。js-yaml 4.3.2/5.4.3 依赖 argparse 2，但不符合 gray-matter 的 `^3.13.1`，直接替换还会触及其 `safeLoad/safeDump` 与 YAML schema 语义。

**选择**：仅 `js-yaml@3.15.2>argparse: 2.0.1`，并对 **js-yaml 3.15.2 的 `bin/js-yaml.js`** 做小型适配。argparse 2.0.1 已在候选其他路径使用，官方 tarball 完整性已核实；它不依赖 sprintf-js，其内部格式化实现不接受该精度语法。

裸 override 不合格：隔离探针确认 `--version` 退出 0 却输出空字符串，普通转换产生旧 API 弃用警告。设计适配仅将 CLI 改用 `add_help`、`add_argument`、`store_true`、`SUPPRESS`、`default`、`parse_args`，并显式注册 `-v/--version` action。它不改 YAML 解析库、schema、gray-matter 或文章源。[设计差异](analysis/js-yaml-cli-design.diff)是隔离副本的原型，不是已安装补丁；Sol 应生成规范 pnpm patch，保留真实 3.15.2 版本及官方 integrity。

**已验证**：十个 CLI 场景的退出码与原版一致；适配后 YAML/JSON/多文档、版本 stdout、缺文件/非法 YAML、旧 `--to-json` 均通过，弃用警告消失。仍有明确允许的诊断差异：help 标题/措辞变化；未知参数的 usage 从 stdout 移至 stderr。不要把这写成 CLI 逐字节兼容。[裸替换结果](analysis/sprintf-probe.json)、[适配结果](analysis/sprintf-adapter-probe.json)。

**Sol 验证门**：包管理器生成的全图不再有 argparse 1.0.10 或 sprintf-js；真实 gray-matter→YAML→argparse resolver 指向 2.0.1；完整 YAML 库字节保持原样；真实 CLI 的帮助/版本/文件及 stdin 转换/compact/trace/退出码验证；原 frontmatter 日期、别名、Unicode、draft/发布边界回归；补丁缺失/损坏的 frozen 安装负向测试和 CLI 行为证明。不得删 CLI 文件或仅删依赖声明来隐藏风险。

**失败/回滚**：若任一真实父入口仍加载旧链、CLI 适配失败或 YAML 库语义变化，回滚此 override、生成锁与 CLI patch 注册为一个单位，保持安全 BLOCKED。可信本地格式字符串、限制 CLI 调用可以暂时减少暴露，但没有可发布版本不构成豁免。不要自行发明 sprintf 1.1.4、改包版本号、返回空串吞掉所有异常，或升级整个 YAML 主版本。

## 2. KaTeX：两条实际父边统一到现有 0.18.5

[GHSA-238p-pmpm-9mq7](https://github.com/advisories/GHSA-238p-pmpm-9mq7) 为 low，范围 `>=0.11.0 <0.18.2`，首修版 0.18.2。选择 **0.18.5** 是为了复用当前 root renderer、CSS、mhchem 和依赖图，而不是另引一份 0.18.2。官方 0.18.5 tarball 已验证 integrity；manifest、CJS/ESM renderer、mhchem、types 五个文件与安装实例完全一致。

精确覆盖 `rehype-katex@7.0.1>katex`、`micromark-extension-math@3.1.0>katex`；两者现有声明均 `^0.16.0`，所以是**明确的跨 0.x minor 兼容替换**。所核查 latest 父版本仍是 7.0.1/3.1.0，不能靠普通父版本更新自然获得修复。不引入新的数学框架，不用现有 `{ katex }` 配置假装已修复，不因本项顺手清理配置。

**已验证**：实际父包副本加载 0.18.5 后，默认/继承 trust、受污染 processor 等负向控制成立，显式 own trust 的正向控制仍成立；老版本对同一无网络 HTML 夹具生成 anchor，新版本拒绝。mathHtml 实际回调和共享 mhchem 通过；严格 TypeScript（`skipLibCheck=false`）对两个父包声明通过，现有旧 `@types/katex` 不要求额外升级。**五个公式/错误样例的 HTML 树均有版本差异**，不能宣称产物字节不变。[行为](analysis/katex-probe.json)、[类型夹具](analysis/katex-types.mts)。

**Sol 验证门**：两个真实父 resolver 都到同一个 0.18.5，无残留 0.16.47；官方 settings/default/processor 和 namespace/group 恢复负向控制；公式、块/行内、错误 fallback、macros、strict/maxExpand、mhchem；实际 Markdown→HAST→HTML 和 micromark→HTML；严格父包类型。用私有 synthetic 公式夹具核对桌面/窄屏/light/dark 的字体、MathML、溢出及 Swup 往返，不公开草稿或把夹具纳入最终搜索/feed。现有零公开文章构建不能替代这些测试。

**失败/回滚**：父 API/类型、公式渲染或安全控制不合格时，两条 guard 与锁一起回滚，保留 BLOCKED。不要忽略类型错误、开启全局 trust 或将全局 prototype 清理当永久修复。0.18.2 不是自动 fallback：若改用它，需重新核对 root/CSS/mhchem 同版本及完整父行为。必要的旧版 backport 是另一次有界设计决定。

## 3. selector-parser：保留父包，只替换 parser 的三个 owner

[GHSA-rj75-hqrm-r3gf](https://github.com/advisories/GHSA-rj75-hqrm-r3gf) 为 moderate，影响全部 `<7.1.6`。官方修复将三处每索引线性查找改为 Set membership；仅限制嵌套深度不能修复平面选择器的二次复杂度。

选择三个精确 owner：typography 0.5.20（当前固定 6.0.10）、postcss-nested 6.2.0（`^6.1.1`）、postcss-nesting 14.0.1（`^7.1.1`），都解析到 7.1.6。前两项跨主版本，需要下面的 API/产物证明。最后一项必须让 `@csstools/selector-resolve-nested@4.0.1`、`selector-specificity@6.0.0` 的 `^7.1.1` peer context 同步得到 7.1.6，不必在证据出现前给 peer 包额外 blanket override。

正常父更新比较：typography latest 仍 0.5.20，仍精确固定旧 parser；Expressive Code latest core 0.44.2 仍依赖 postcss-nested `^6.0.1`。把 nested 升到 8.0.1 会再跨一个父主版本，且解决不了 typography 的精确固定，所以本轮不选整条上游升级。

**已验证**：两个真实旧父包副本配合 7.1.6 的 typography `commonTrailingPseudos`、nested CSS 转换通过；当前源码及历史 dist 的 **2,836 个唯一选择器**，6.0.10/6.1.4/7.1.5 与 7.1.6 的解析往返文本一致；小型有界复杂度探针支持官方修复。它不是新的全站构建，更不等于官方 8,413 条 corpus 已全部执行。[父行为](analysis/css-probe.json)、[真实 CSS corpus](analysis/css-corpus-probe.json)。

**Sol 验证门**：全图清除三种旧实例，检查直接及两个 peer context；peer 严格检查；官方 class/id/Sass interpolation 复杂度控制及 benign 同量级对照；AST clone/walk/pseudo/escape/nesting；实际 Tailwind typography、两代 Expressive Code 和 postcss-nesting 转换；完整 CSS 产物及公式/代码块/正文页面交互。不要以机器速度不同为由放宽成固定超大超时。

**失败/回滚**：新 peer 冲突、CSS/AST 语义差异、剩余任一旧实例或复杂度控制失败，回滚三个 guard 与锁，保持 BLOCKED。若真实父行为不兼容，再决定对两个旧 parser 精确 backport 官方修复；本分析没有接纳这种备用补丁。选择器长度上限只约束经过该入口的输入，不能替代全图修复。

## 4. smol-toml：三条父边到 1.9.0，明确对象语义变化

[GHSA-r4xh-jqrq-34v2](https://github.com/advisories/GHSA-r4xh-jqrq-34v2) 为 moderate，影响 `<=1.8.0`，官方首修版 **1.9.0**；audit 推断的 1.8.1 不存在。Astro 7.2.10、internal-helpers 0.10.4 和 0.11.0 均声明 `^1.6.0`，1.9.0 在原范围内，无需更新框架。

**已验证及重要差异**：官方 tarball integrity 通过，实际 parseKey 修复在发布源码中。固定 dot-free TOML 的扫描计数从每行扫描剩余全文变成 0 次该全局点号搜索。五组数据值、两个真实 helper 的 YAML/TOML 内容通过。但 **1.9.0 返回 null-prototype table**，且整个发布 diff 还包含 BOM/unsafeKeyBehaviour 等变更；初始 deepStrictEqual 因原型不同而失败，已明确保留该事实，只把值相同与原型变化分开验证，未将失败伪装成逐对象等价。[探针](analysis/simple-fixes-probe.json)、[发布源码差异](analysis/toml-dist-parse.js.diff)。

**Sol 验证门**：三条真实 resolver；两个 helper frontmatter，Astro file loader/data-entry（含异常位置），实际 Zod/内容 ID/draft/日期接收路径；root/嵌套 null-prototype、数组表、quoted/dotted key、Unicode、date/time/BigInt、重复/非法键和错误控制；保留正常 YAML 行为。当前 probe 不涵盖完整 Astro loader/settings 集成，需 Sol 补齐。

**失败/回滚**：如果真实调用依赖普通对象原型，或日期/数据/错误定位出现新回归，回滚三条 guard 与锁，返回有界适配决定。不要用 JSON clone 丢失 Date/BigInt、对任意键 Object.assign 恢复潜在危险继承，或用不存在的 1.8.1 过门。对可信 TOML 限长可缓解工作量，但不会让旧版本获得 PASS；本轮未接纳 1.8 的本地 backport。

## 5. source-map-js：五个 owner 全覆盖到 1.2.2

[GHSA-68fv-2mgg-jv7q](https://github.com/advisories/GHSA-68fv-2mgg-jv7q) 为 high，影响 `>=1.0.0 <1.2.2`。官方 1.2.2 发布及 integrity 已核实。五个 owner 是 PostCSS 8.5.26、Tailwind node 4.3.3、css-tree 2.2.1 / 3.2.1、magicast 0.5.4；其范围均容纳 1.2.2。现有 PostCSS guard 1.2.1 必须有记录地替换，不能保留为“防漂移”而阻止安全修复。

修复不仅检查单层 offset：还验证非负安全整数/总嵌套行偏移，限制 line 到 10^7，避免来源 getter 指数重复计算，在源代码耗尽时终止 SourceNode 补行，并优化 generator 的大行间隔序列化。不能仅测一次普通 map roundtrip。

**已验证**：非法/超大及嵌套 offset 拒绝、合法 SourceNode 及 generator 控制通过；12 层有界 fixture 的内部 sources getter 调用从 531,441 降到 1；两个 css-tree 和真实 PostCSS 副本的生成/map 输出通过。没有运行无界恶意循环。[探针](analysis/simple-fixes-probe.json)。

**Sol 验证门**：五个真实 resolver、prod/full 全路径；完整上述官方负向/正向控制；Tailwind node 与 magicast 的实际 map 生成/组合，css-tree/PostCSS API，含 sourcesContent 与 Unicode 的构建产物。当前 probe 未执行 Tailwind node/magicast 真实集成，它们仍是实施门。

**失败/回滚**：任何 owner 遗漏、映射内容/诊断位置回归、超限/嵌套控制失败，回滚本组五条 guard（包括原 guard 改值）及对应锁，保持 BLOCKED。只限制传入 map 字节不能限制小体积 map 声明的大 offset。

## 给 Sol 的精确变更边界与合并验收

以下为现有 `overrides` 的增量/一项替换，**不是整个 workspace 文件**：

```yaml
"js-yaml@3.15.2>argparse": "2.0.1"
"rehype-katex@7.0.1>katex": "0.18.5"
"micromark-extension-math@3.1.0>katex": "0.18.5"
"@tailwindcss/typography@0.5.20>postcss-selector-parser": "7.1.6"
"postcss-nested@6.2.0>postcss-selector-parser": "7.1.6"
"postcss-nesting@14.0.1>postcss-selector-parser": "7.1.6"
"astro@7.2.10>smol-toml": "1.9.0"
"@astrojs/internal-helpers@0.10.4>smol-toml": "1.9.0"
"@astrojs/internal-helpers@0.11.0>smol-toml": "1.9.0"
"postcss@8.5.26>source-map-js": "1.2.2" # 替换原 1.2.1
"@tailwindcss/node@4.3.3>source-map-js": "1.2.2"
"css-tree@2.2.1>source-map-js": "1.2.2"
"css-tree@3.2.1>source-map-js": "1.2.2"
"magicast@0.5.4>source-map-js": "1.2.2"
```

预期十四条原 guard 中十三条保留、新增十三条、原 PostCSS 条改值，共 27 条；数量只是结构预期，不能代替内容检查。现有 Astro/http-cache patch 的文件内容保持不变；新增精确 `js-yaml@3.15.2` CLI patch 注册。默认不变更 root package.json、allowBuilds、Node 24.20.0、pnpm 11.22.0、peer 策略、任何框架主版本或应用功能。不添加 blanket override。

Sol 先 fresh 检查候选 clean HEAD、原工作区保护及 remote/PR，然后在 ADR 记录这份选择和有限 CLI 诊断差异，更新唯一 ROADMAP 的实施断点。在隔离分支准备上述 workspace/patch 与测试，由 pnpm 对全部五组变更统一生成锁（现有有界方式 `install --lockfile-only --ignore-scripts --no-frozen-lockfile`，官方 registry）；不要手改锁，不调用已知会大范围重新解算的 patch-commit 流程后照单全收。立刻将每条版本/integrity/parent/peer/patch suffix 差异与基线对照：允许五组修复及不再被引用的旧链消失，其他漂移即停，不追加无界 pin。

合并验收顺序：

1. frozen 安装、包完整性、真实父 resolver/peer 图和每组专项控制；尤其证明 sprintf 物理消失与新 CLI patch 真正应用。隔离探针不替代真实 pnpm 解析。
2. 官方五条记录加入安全 ledger，保留原严重度、全部 aliases、版本范围及 npm/官方差异；原 ledger 不重写，raw audit 不过滤。因为 lock/workspace/ledger 改变，cache contract 必须经过实际父路径/补丁/行为证明重新绑定，不能只接受新 hash。CLI 补丁也要建立源码/行为/损坏拒绝证据。
3. 对最终实现快照执行原质量门及受影响新测试：格式、peer、严格类型/Astro、native、正式双 base 全脚本构建、Pagefind/公开资格/HTTP、上述公式与 CSS synthetic GUI。一次最终完整矩阵即可，本轮没有重跑旧矩阵。
4. 新候选的真实 prod/full npm audit 和同次 cache repair proof。若出现新 advisory、未知 severity/alias、残留实例、过期或失败控制，继续 BLOCKED。通过之后才轮到 PR22 当前精确 head Linux CI；本分析不触发更新或发布。

新 guard/CLI patch 由整改协调者与实施 Sol 维护；最晚与当前合同的 `2026-10-14T14:27:22Z` 窗口一起复核，遇上游修复/父范围/源码/暴露变化提前复核。本次分析不自动延长原 36 GHSA/cache 的审查窗口。只在正常父声明和包管理器图已自然覆盖修复、相应测试通过时去掉 guard/patch；日期不授权自动删除或升级。任何已记录实施失败保留证据，通过新 revert commit 回滚对应完整单位，不 reset/amend 掩盖，也不把恢复旧图解释为可以部署。

## 证据及交接限度

- 本轮查询限定为现有父包/固定修复元数据、js-yaml 的同包版本清单、四个官方修复 commit、五个官方 tarball；五个 tarball integrity 均验证。开始时一次 TLS 失败改用保持证书校验的 curl 恢复；后来执行通道短暂断开，已先读回 clean HEAD 和已存输出，没有重复未知写入。没有权限拒绝或新的待授权动作。
- [请求/完整性收据](analysis/official-receipt.json)、[正常父版本比较](analysis/followup-receipt.json)、[KaTeX 官方字节及 YAML 最高主分支版本](analysis/final-fetch-receipt.json)、[真实 manifest/range](analysis/installed-packages.json)。
- 探针在任务目录的复制包中注入指定子包，未运行包管理器或 install scripts；对只读安装包使用符号链接。没有证明新的 lock 能自然生成，也没有执行本轮 Linux/全构建/浏览器/生产验收。这些限制已列为 Sol 的门，不是豁免。
- 本轮没有发现必须永久放弃修复的一项；sprintf 有已验证的移除链路线，但有条件的 CLI 适配不可省略。若真实安装/父行为证伪该路线，则按对应失败条件保持阻断，重新做有界决定。

实施交接：Sol 可按上述精确边界继续；本分析作者完成交付后停写，不增加常规审阅 worker。
