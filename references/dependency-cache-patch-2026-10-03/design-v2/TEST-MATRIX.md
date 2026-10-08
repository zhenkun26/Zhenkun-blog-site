# 待实现测试矩阵 v2

全部 NOT_RUN；以下是候选补丁的预期断言，不是第三方测试结果，也没有执行漏洞样本。实现只能在后续授权的独立树。使用 node:test、无网络、无文件系统缓存、虚构 example.invalid URL、无真实会话数据的普通头映射；不对外部服务发请求，不修改全局原型。测试模块必须经真实 Astro 父包解析修补后的 CachePolicy。

时钟设计：以真实解析的 CachePolicy 为父类构造测试专用 subclass，覆写 prototype 的 now() 读取该测试闭包中的逻辑时钟。在第一次 new 前固定为非零 T（例如 2026-10-03T00:00:00Z）；每个后续 constructor、revalidatedPolicy 内的 new this.constructor、static fromObject 以及结果 policy 都继承同一时钟。不能只在已创建的旧实例上赋 now：那会使原 _responseTime 和返回的新 policy 使用真实墙钟。含 Date/Age/Last-Modified 的 fixture 与 T 一致。每个用例检查原/返回 policy.now()，并在测试边界验证新 policy 的 age/TTL 与逻辑时刻相符；独立测试使用独立 subclass/闭包，不改全局 Date、不 sleep。fromObject 保留序列化 t，新的 200/500 policy 在当前逻辑时刻初始化；304 policy 的年龄计算同时核对保存的响应 Date。

通用观测：evaluateRequest.response 是否缺席、revalidation.synchronous、satisfiesWithoutRevalidation、maxAge/TTL、直接 SWR、revalidatedPolicy 的 policy 身份/modified/matches。只检查 status 或不抛错不够。限制用例分别在 t=0、普通过期后执行；时间窗口边界用可复现毫秒。SIE 错误组为 500/502/503/504 和 undefined；400/404 作为非该错误组对照。有 headers 的错误应产生新 policy，undefined 无可用 fallback 应抛错。

## A. 93748：安全限制与时间状态

| ID | 输入类别 | 必须观察到的候选结果 |
|---|---|---|
| A01 | shared Set-Cookie，无 public/immutable，带普通显式 TTL | 无直接复用；maxAge=TTL=0；direct SWR=false；SIE 不得返回原 policy |
| A02 | A01 分别带无值、有界、较大 max-stale 请求 | 仍同步验证/无 response，不能被请求宽容度解禁 |
| A03 | response no-cache；同样叠加各 stale 扩展 | 同 A01；另测 qualified no-cache 延续原库保守策略 |
| A04 | shared proxy-revalidate，含 public、max-age 的对照 | 延续原库 maxAge=0；所有旁路禁止；不是将 proxy-revalidate 当 private 限制 |
| A05 | response no-store、shared private、不能 storable 的状态/方法、构造请求 no-store | 即使人为保留 policy 也不能借 stale 命中 |
| A06 | response must-revalidate：fresh 与 stale | evaluate 延续旧库保守 miss；stale 两 helper 禁止；fresh 两 helper 保留既有时间判断，不能因本批增加 fresh 全面禁止；fresh TTL 可为正但不能延长 stale |
| A07 | public,s-maxage=60：age=10（fresh）、60（边界）、61（stale），另测 s-maxage=0；无 stale 扩展及 SIE/SWR 扩展两组，交叉 500/502/503/504/undefined 错误 | fresh 合法匹配请求错误 fallback 返回同一 policy、modified=false、matches=true，包括 500 和 undefined；边界及 stale 即使扩展仍不返旧 policy：有 headers 错误得到新 policy/modified=true/matches=false，undefined 抛错；fresh evaluate 与 helper 既有行为保留，TTL 不含 stale 扩展。构造及返回的新 policy 时钟受同一闭包控制 |
| A08 | shared:false + proxy-revalidate/s-maxage | 不引入共享专属限制；与既有 private 行为对照 |
| A09 | shared cookie + public；cookie + immutable；private cookie | 正向缓存/合法 stale 可工作；再分别叠加 no-cache/no-store/wildcard 验证这些限制优先 |
| A10 | 普通 public 缓存自然过期，maxAge 非安全归零 | 合法 max-stale 命中；窗口不足 miss；保留库既有严格边界，不顺手改 >= 语义 |
| A11 | 普通 max-age=0、Expires 已过期、无 freshness 推导得到 0 | 没有安全限制时仍按原有 stale 许可运作，不能把数值 0 一刀切 |
| A12 | 普通 fresh response，无 stale 扩展 | 直接命中、TTL 正常；不被新 helper 全局禁用 |
| A13 | 普通 SWR：窗口内/刚好到界/过界 | evaluate 在窗口内 response+异步验证；satisfiesWithoutRevalidation=false；direct SWR 按原边界；过界无缓存 response |
| A14 | 普通 SIE：窗口内/刚好到界/过界 × 全错误组 | 匹配请求在窗口内才可复用；400/404 不能按 SIE 接受；undefined 与有 headers 的错误结果分开 |
| A15 | SIE 对不同 URL、host、method、Vary 值 | 不返回原 policy；无 response 时抛错；匹配请求正向对照必须仍可复用 |
| A16 | SIE incoming Cache-Control:no-cache / Pragma:no-cache | 不得借错误回退复用；incoming no-store 不被误称为同一请求禁止语义 |
| A17 | GET policy → HEAD 错误回退、HEAD→GET、同方法请求 | 前两种 method 不匹配不得回退；正常 revalidationHeaders 的 HEAD 支持保持；这是明示保守变化 |
| A18 | 普通 public,max-age=60 与 public,s-maxage=60 正向对照：age=10/60/61 × 500/502/503/504/undefined × 无显式 SIE/有 SIE；另以400/404作非错误组对照 | fresh 匹配的两类策略都保留既有错误回退；无 SIE 普通策略到界后不返旧 policy；有 SIE 普通策略窗口内可回退，共享 s-maxage 到界后仍禁止。400/404 不按 SIE 复用。核对原/返回 policy 身份、结果 flags、时钟/age/TTL，不能只看是否抛错；不误报成新启用功能 |

A01–A07 至少各覆盖 evaluate、satisfies、direct SWR、SIE、TTL 五个入口。SIE 的 request max-age/min-fresh 行为没有在本补丁中全面重写，应记录为边界，不把测试扩展成通用 HTTP 缓存符合性工程。

## B. 93750：规范化和自有属性

| ID | 输入类别 | 必须观察到的候选结果 |
|---|---|---|
| B01 | Vary 裸 *、两侧 SP/HTAB、含 * 的列表、尾逗号/重复空项 | 无直接复用；maxAge/TTL=0；两个 stale fallback 都禁止 |
| B02 | 普通不同大小写字段名、允许的 OWS、重复字段、空列表项 | 规范化字段名；真实值相同可命中、不同必须 miss；不改字段值本身 |
| B03 | 没有 Vary、空 Vary、仅空列表项 | 与无 nominated fields 的行为一致；避免凭空创造 variant |
| B04 | 普通字段两边都缺席、一边缺席、两边自有且同/不同值 | 两缺席匹配；单边存在不匹配；两边存在按值比较 |
| B05 | constructor、__proto__、hasOwnProperty 等 token；普通对象/null-prototype 映射 | Vary 比较只用自有 presence/value；不调用对象自有 hasOwnProperty；不对整个 API 承诺任意 getter 安全 |
| B06 | 缓存端自有字段，另一端仅继承同值；反向同样执行 | 必须 miss，直接属性读取造成的假匹配消失 |
| B07 | 两边只有继承字段，同值和不同值 | 两边都视为真实缺席，允许缺席匹配；显式记录与 issue 宽泛描述的解释差异 |
| B08 | Kelvin `K`、含 `K` 的列表（如 `Accept, K`、`K, K`）、两侧合法 OWS；合法 `K`、`K, Accept` 与 x* 正向；其他非法空白中断/分隔符/非 OWS 字符/非字符串 | 必须在 lowercase 前拒绝 K，即使两边都缺 k 也不能匹配；每个非法变体覆盖 evaluate/satisfies、maxAge/TTL=0、direct SWR=false、SIE全错误组不返旧 policy，以及 toObject/fromObject/JSON roundtrip 后相同阻断。合法 K→k：两边缺席可匹配、自有同值可匹配、差值/单边缺席必须 miss；验证正常TTL与允许的stale扩展，避免一刀切。x* 按普通字段匹配 |
| B09 | Vary 匹配失败并带 max-stale/SWR/SIE | 普通请求入口及 error fallback 均不得复用；direct SWR 只能判断响应侧，不能声称它验证了请求 variant |
| B10 | Vary wildcard policy 的 revalidationHeaders | 不附加缓存旧 validator；不把它误作普通相同 variant |

所有 prototype 用例仅用 Object.create/defineProperty 构造局部数据，不赋值 Object.prototype、不执行代码 payload。`__proto__` 自有键使用安全的 defineProperty 或 JSON.parse 数据表示，不用对象 literal 的原型特殊语义。对不支持的 getter 输入只作为不可执行边界记录，不安装/运行第三方构造器。

## C. API、序列化与 304 生命周期

| ID | 输入类别 | 必须观察到的候选结果 |
|---|---|---|
| C01 | 每个安全限制 policy 原实例、toObject→fromObject、JSON roundtrip | 同样阻断；v1 序列化结构不加新授权布尔位；不依赖补丁新字段存在 |
| C02 | 用官方原始格式的可信历史 v1 静态 fixture 恢复 | 不运行未修补库生成样本；来源结构人工核对，恢复后仍覆盖 A/B 限制 |
| C03 | shared/private、public/immutable、Vary 自有特殊键 roundtrip | 模式/例外/自有键保存；不把 JSON 丢失 prototype 当兼容失败 |
| C04 | 普通匹配 ETag 的 304、Last-Modified 304、200 更新 | 原有公开结果形状与合法验证更新保持；再检验 resulting policy |
| C05 | 304 第一次加入 no-cache/private/no-store（原来无 Cache-Control） | 新 policy 保存新增限制，后续 evaluate/stale/TTL 受限 |
| C06 | 304 第一次加入规范/非规范 Vary wildcard 或 Set-Cookie | 新 policy 不丢限制；Set-Cookie 用没有 public/immutable 的原始缓存对照；wildcard 不应丢失 |
| C07 | 304 第一次加入 Pragma:no-cache、原来无 Cache-Control | 继承既有 pragma 转换逻辑，后续阻断；已有显式 Cache-Control 则保持原先优先级 |
| C08 | 已有 no-cache 经合法 304 改为 public/max-age；public cookie 对照 | 允许合法新策略放行；不能把本次成功验证等同于永久禁用 |
| C09 | 不匹配/无效 304 validator、非目标响应头合并 | 保留并记录基线返回行为，不把旧缺陷悄悄扩展为新修复；任何安全遗漏回交评审 |
| C10 | responseHeaders()、revalidationHeaders()、maxAge/TTL 返回类型 | 不改变 API 形状；responseHeaders 单独返回 cookie 不是授权复用；低层 accessor 不能当 gate |
| C11 | 请求 no-cache/pragma、max-age/min-fresh、GET/HEAD 的 evaluate 既有行为 | 原有正常分支不受意外影响；记录 SIE 单独收紧处 |
| C12 | 多实例、时间窗口/TTL舍入、错误清理、constructor/new this.constructor/fromObject | 按开头 subclass/闭包控制所有构造和返回 policy 的时钟，fresh/boundary/stale 断言不能被墙钟污染；多用例隔离，无真实 sleep、全局猴子补丁或持久副作用 |

## D. 安装图、父调用和站点门（后续单独授权）

| ID | 门 | 验收标准 |
|---|---|---|
| D01 | 官方源匹配与 patch 登记 | 原始 integrity/source hash 相符；pnpm 正式生成 patch/lock；唯一精确 4.2.0 patch，非 git/fork 安装 |
| D02 | 实际实例解析 | 从 Astro 父入口定位全部该包实例，均为被审补丁字节；不能只测根 mock；graph 无无关版本/parent 漂移 |
| D03 | frozen install / 缺失 patch 负门 | Mac+Linux 可复现；缺 patch/不匹配 patch 必须失败；包版本仍真实 4.2.0，不伪造 4.2.1 |
| D04 | Astro remote load/revalidate | 有界自有 response/fetch fixture：公开图片TTL、200/304/错误、cookie/no-cache/Vary；不访问互联网、不透传真实凭据；记录 Astro 自行 stale fallback 不受本 patch 管控 |
| D05 | 已有项目门 | 精确候选质量/native/类型、正式双 base 八阶段 build/Pagefind、artifact 契约；不切换 Markdown 引擎/Cloudflare/双语工作 |
| D06 | 报告与复核 | 原 audit 保留，补丁测试结果逐项有证据；独立安全/兼容评审，不以 patch hash 自动豁免；rollback 保留证据并恢复 BLOCKED |

## 审查停止点

- 必须先确认：fresh must-revalidate evaluate 的保守兼容与 fresh helper 保留、共享 s-maxage 仅过期后禁止、HEAD 错误回退收紧、304 新限制头、缺席字段语义、原始 ASCII 校验在 lowercase 前，以及全部构造/返回 policy 的受控时钟。
- 任一限制入口还能返回旧 policy/缓存 response、序列化后限制丢失、fresh 正向对照全灭、304 新限制遗漏、安装 graph 扩散：停止，不通过修改预期或删用例接纳。
- 当前完成的是范围设计和静态 diff，不是以上矩阵实现、执行或安全批准。所有 A/B/C/D 行保持 NOT_RUN。
