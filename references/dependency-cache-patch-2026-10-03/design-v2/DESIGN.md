# PUBLIC PRIVACY PROJECTION; original SHA256 cbbf1889dda70b079240a98a2b1032ab6f7365b71db86eb5ea5436e976529a1e; local raw original retained.
# http-cache-semantics 4.2.0：待审本地补丁设计 v2

日期：2026-10-03。状态：DESIGN_ONLY / NOT_APPLIED / NOT_EXECUTED。

v1 独立静态评审结果为未通过（无 P1、两项 P2）。原始十个文件及其 manifest 均保存在 `v1/`，`v1-archive-receipt.json` 记录逐字节封存结果。v2 仅处理 ASCII 校验顺序和 fresh/stale fallback 区分，并补充测试时钟设计；等待重新静态评审。详见 `REVISION-v2.md` 和 `v1-to-v2.candidate.diff`。

结论：已有可独立审查的有限源码候选，值得进入一次单独实现审查；没有动态测试证据，不足以接受补丁、关闭任一漏洞、授权发布或豁免 R4。所有运行时矩阵均 NOT_RUN。若范围或关键断言不能可靠闭合，停止本候选，不轮换 fork。

## 边界与交付

- 写入仅限 `<local-home>/Documents/Codex/2026-10-03/task/cache-patch-design-20261003/`。
- v1 原始读取来自 task-4/zhenkun-r2 的已安装官方 http-cache-semantics@4.2.0；当时仓库 HEAD 为 b974258753ca07347eae535a3f5ca94e902f033a、工作区干净。v2 只读本目录已核实哈希的官方源快照，不重新访问 Sol 树；不将 v1 的 HEAD/干净状态冒充 v2 的新现场观察。未应用任何 patch，未改仓库、锁、node_modules 或 Sol 树。
- `upstream-index.js.txt` 是精确源快照；SHA256：01b7d66c854b2fe53ac05c98feb6e0d64722ab8898a778e2d2426a8b468d178f。
- `01-reuse-restrictions.patch`：官方源 → 93748 复用限制候选；尚未包含 Vary 规范化修复。
- `02-vary-normalization.patch`：在 01 结果上应用的 93750 候选，不能单独应用到官方源。
- `http-cache-semantics@4.2.0.candidate.patch`：官方源 → 两项合并候选；将来只注册这一个组合补丁，不同时注册三个。
- `candidate-index.js.txt`：组合候选，仅文本。`manifest.json` 绑定代码来源和各 artifact 哈希。
- `TEST-MATRIX.md`：待实现的测试规格，不是已执行测试。
- `author_patch.py`：本次自写的文本生成器，已执行其读取/替换/生成 diff 操作；未 import、解析执行或测试候选 JavaScript。唯一静态自动检查是源哈希和替换锚点唯一性。没有执行 patch apply、node --check 或 pnpm。

## 来源、归属、分歧

| 来源 | 实际提供的信息 | 本候选如何使用 |
|---|---|---|
| 已安装官方 npm 包 4.2.0，BSD-2-Clause | 完整 index.js / LICENSE / package.json | 补丁的唯一代码基底，逐行自行编写差异；未从第三方 fork 拷贝 diff |
| GHSA-ch52-4w7c-c8xp / CVE-2026-93748 | GitHub Reviewed High，受影响 <=4.2.0，patched None | 第一项安全目标；不采用 audit 声称但未核实发布的 4.2.1 |
| 上游 issue #56 | 报告 max-stale 越过安全归零限制，旧描述 <=4.1.1、High | 设计问题来源，不替代对 4.2.0 的匹配 |
| 上游仓库开放 PR #58，14a8c2ad51740dc39bf3e8f1a11c845a5003f217 | PR 正文建议集中复用限制，未合并、无 review | 仅概念参考；精确提交页读取受限，未绕过，未审阅或采用 diff |
| hellonewday 仓库开放补充 PR #1，显示短 SHA 101a9e9 | 作者声称覆盖两种 stale fallback、Vary、请求匹配并增加测试 | 仅旁路检查清单参考；未读取或采用其代码，158/33/19 等作者测试数字不作为本候选证据 |
| 上游 issue #57 | Medium / CVSS 3.1 5.9，描述 <=4.1.1；Vary OWS/list/prototype 问题 | 第二项机制来源；不能称上游报告一致认为 4.2.0 High |
| VulnCheck 发布者 CVE-2026-93750 公告 | High / CVSS 4.0 8.2，<=4.2.0 | 单独保留发布者范围和严重度；不抹平与 issue 的差异 |

原始源 4.2.0 的独立匹配：`evaluateRequest` 394–443 行允许 max-stale，未检查 security-zero 原因；`maxAge` 599–626 行因 no-cache、共享 cookie、裸 Vary *、proxy-revalidate 归零；`_varyMatches` 482–499 行只拒绝精确 `'*'`，并用直接属性读取比较字段；`revalidatedPolicy` 832–841 行先处理错误回退、没有请求匹配；685/692 行两种 stale helper 只做时间计算。上述是 SOURCE_CONFIRMED，不是漏洞样本运行结果。

保留 `LICENSE.upstream.txt`；未来随官方包继续保留其原 LICENSE/版权声明。没有采用任何他人公开 diff，因此没有将未确认 fork 许可当成授权。公开讨论给予来源归属，不称其为维护者已接受修复。RFC 仅作为语义参考，未复制其代码或长段文本。

来源链接：

- https://github.com/advisories/GHSA-ch52-4w7c-c8xp
- https://github.com/kornelski/http-cache-semantics/issues/56
- https://github.com/kornelski/http-cache-semantics/pull/58
- https://github.com/hellonewday/http-cache-semantics/pull/1
- https://github.com/kornelski/http-cache-semantics/issues/57
- https://www.vulncheck.com/advisories/http-cache-semantics-through-4.2.0-cross-client-cache-disclosure-via-vary-wildcard

## 语义依据与明确取舍

RFC 9111 §4.1：Vary 列表含任一 `*` 就不匹配；两边真实缺席的字段可以匹配。§4.2.4、§5.2.2.2/.8/.10：显式限制不能被过期复用绕过，共享 s-maxage 包含 stale 重验证要求。§4.3.4 支持验证后更新响应头。Set-Cookie 的默认阻断以及 public/immutable 例外来自本库既有策略，不是 RFC 禁止所有 cookie 缓存。

https://www.rfc-editor.org/rfc/rfc9111.html#section-4.1
https://www.rfc-editor.org/rfc/rfc9111.html#section-4.2.4
https://www.rfc-editor.org/rfc/rfc9111.html#section-4.3.4
https://www.rfc-editor.org/rfc/rfc9111.html#section-5.2.2

### 01：93748 与复用旁路

1. 提取 `_requiresRevalidation()`，重用已有 storable/no-cache/shared-cookie/proxy-revalidate/裸 Vary * 归零原因，不能把所有 `maxAge() === 0` 都当安全限制。普通过期仍可合法使用 max-stale。
2. 在 `evaluateRequest` 的已有 must-revalidate 检查处加入上述限制，因而同时覆盖 `satisfiesWithoutRevalidation`；保留原库对 fresh must-revalidate 的保守 miss 行为，不在本修复中放宽它。
3. 新增 `_requiresStaleRevalidation()`：must-revalidate 或共享策略存在 s-maxage。它描述 stale 阶段的约束，不等同于无条件禁止。evaluate 已在 stale 分支调用；两个 stale helper 只在 `this.stale()` 为真时应用该约束。共享 s-maxage 的 fresh evaluate hit、fresh 匹配请求错误 fallback 均保留。以 public,s-maxage=60、age=10 为例，500/undefined 仍可返回原 policy；age=60 或以后才禁止这类 stale fallback。must-revalidate 的 evaluate 保守行为继续单独保留，不借本轮扩大其 fresh helper 限制。
4. `useStaleWhileRevalidate()` 和 `_useStaleIfError()` 先检查无条件安全限制，再检查“已过期且 stale 禁止”。不无条件拒绝所有 fresh s-maxage/must-revalidate helper 调用；保留原库 fresh helper 的既有时间判断与返回值。
5. `revalidatedPolicy()` 的错误回退前增加 URL/host/method/Vary 匹配，并拒绝 incoming no-cache/Pragma no-cache。匹配方法与 evaluateRequest 一致（allowHeadMethod=false）；GET 缓存对 HEAD 的错误复用从过去的无条件允许变成禁止，正常 revalidationHeaders 的 HEAD 行为不改。
6. TTL：安全受限策略返回 0；must-revalidate/shared s-maxage 的 TTL 不被 stale 扩展延长，但允许正常 fresh TTL。TTL 不是服务授权，不能把 TTL>0 当作无条件命中。
7. 304 生命周期缺口：原库仅遍历已有头，可能忽略新限制。窄范围补入 304 自有的 cache-control/vary/set-cookie/pragma。未重写一般 304 合并、未改变其既有 validator 匹配算法。这一项虽然不是公告的直接入口，却是避免新 policy 失去限制的必要审查点。

### 02：93750

1. `parseVary` 按以下顺序处理：分割逗号 → 仅去除 SP/HTAB OWS → 忽略空列表项 → 对**原始 token** 用含 A–Z/a–z 的显式 ASCII token 字符集校验并拒绝完整 `*` → 全部通过后才小写化。不能先 Unicode toLowerCase；Kelvin 字符 K 会被转成 ASCII k，从而掩盖非法输入。`K` 和任何含它的列表均阻断；合法 `K` 正常规范化为 k。`x*` 是合法普通 token，不视作 wildcard。
2. `_varyMatches` 和 `_requiresRevalidation` 共同使用该解析，因而 Vary wildcard 的 maxAge/TTL/direct SWR/error fallback 一并受限。
3. 每个字段分别做 own-property presence 比较；两边存在才读值；只有一边存在则 miss；两边真实缺席允许匹配。使用 `Object.prototype.hasOwnProperty.call`，兼容 null-prototype map 和被遮蔽的 hasOwnProperty。
4. **不能把 `Vary: constructor` 且两边都没有自有 constructor，强行规定为 miss 来追随 issue 的宽泛表述。** 两边继承的属性均不代表 HTTP 字段；忽略它们后两边都缺席符合 RFC。关键安全断言是“自有字段与另一边同值继承字段不能匹配”，以及继承值不参与比较。这项解释需独立审阅者明确确认。

### API / 序列化

- 不改 module.exports、构造参数、公开返回对象形状、包版本或依赖；新增方法仅为下划线内部 helper。
- 不新增保存的 `_blocked` 标志；检查从现有 `_resHeaders/_rescc/_isShared/...` 动态计算。`toObject/fromObject` 的 v1 格式不变，已有序列化条目不能靠缺少新标志绕过限制。
- `responseHeaders()` 仍是低层转换函数，不自行授权复用或剥离所有 Set-Cookie；调用者必须检查 evaluate/revalidation 结果。本设计不承诺任意调用 responseHeaders 都安全。
- 错误 fallback 不允许时：有 headers 的 500 等走现有新 policy、modified=true、matches=false 路径；undefined 或无 headers 保持既有抛错路径。不能把抛错误认为 silent cache hit。
- 成功的 304 可以支持本次实际验证后的使用；测试应检查其生成的新 policy 对**后续**未经验证的请求施加限制，而不是把合法 304 本次使用也全部禁止。

## 已识别风险、非目标和停止条件

1. 仅针对两项已识别机制及必要旁路；不宣称该库完全符合 RFC 或没有其他漏洞。Cache-Control parser 的大小写/重复/非法指令、任意恶意 getters/prototypes、非可信序列化对象、一般 304 合并、异常时钟行为等不作完整重写。测试需明确支持输入契约：普通数据对象或 null-prototype 头映射，小写 header keys；无需执行 getter 或污染全局 prototype。
2. 针对 Vary 的非法 token fail-closed、共享 s-maxage **过期后**禁止、TTL 不延长 stale 窗口、incoming no-cache 对 SIE 的收紧及 304 新限制头，是有意可观察变化；可能降低缓存命中率。不加入 fresh 合法 s-maxage fallback 禁止。没有网络/负载数据，不声称性能无变化。
3. private/shared 必须分开；public/immutable 例外不覆盖 no-store/no-cache/Vary 禁止。
4. Astro 的实际路径只使用 storable/TTL，并自己在 build revalidation 失败时复用缓存文件；包级 patch 不重写这一父包回退，不能声称因此消除了所有 Astro 构建陈旧缓存问题。也未验证 CF_WORKERS/部署运行时。
5. 当前不存在安全回归 PASS、语法 PASS、补丁可应用 PASS、冻结安装 PASS 或父包兼容 PASS。仅文件哈希/锚点生成确认，不能代替以上证据。
6. 若独立审查认为 304/s-maxage/own-property 的策略不能接受，必须重新确定有限范围，不通过降级断言或删负例“修绿”。若关键 API 仍可重用受限响应，停止；如需更大缓存重写则返回决策。

## 后续单独实现包（尚未授权本设计作者执行）

1. 父任务先独立审查本设计与组合 diff，重点审查上述五项可观察变化、304 及 Vary 缺席语义。
2. 从准确接受的候选 SHA 建独立实现树；重新核实官方包 integrity、实际父解析、源 SHA。变化即停止比对，不模糊应用。
3. 未来目标：`scripts/patches/http-cache-semantics@4.2.0.patch`、pnpm-workspace 的精确 patchedDependencies、pnpm 生成锁、专用 node:test 及证据。保留现有所有 overrides、allowBuilds、Node/pnpm、内容和工作流。
4. pnpm patch/patch-commit 及 lock 生成过程应在单独获准的实现包执行；本设计文本不是已生成/验证的 pnpm patch 记录。不得手写 lock integrity/hash，不得先改 node_modules 再忘记提交补丁。
5. 独立审查通过后，才实现并运行 TEST-MATRIX 中的无外部目标测试，再做 Mac/Linux frozen install、实际 Astro 父调用、现有质量/native、双 base 完整八阶段 build/Pagefind。未审 fork 代码不安装、不执行；若需要官方上游测试，先核实确切来源和授权再读取。
6. 外部依赖：官方 registry 元数据/现有官方包可用，后续 Linux 执行环境；本地自行补丁不依赖 PR 合并或 fork 包发布。
7. 回滚：补丁、workspace 登记、生成锁和专用测试为一致单元；新本地回滚提交保留证据。回滚恢复受影响库，安全状态重新 BLOCKED。记录维护者、复核日期以及官方修复发布、父版本或源 hash 变化等复核触发条件，不自动移除。
8. R4 独立后续；本候选 hash 只绑定字节，绝不是安全豁免。接受之前两项继续未修复，原始 audit 不过滤；实现成功也要独立决定如何表达“本地修补”，不假造官方修复版本或 registry 零告警。
