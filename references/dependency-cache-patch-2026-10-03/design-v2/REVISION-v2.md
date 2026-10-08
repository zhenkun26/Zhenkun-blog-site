# v2 静态评审修订记录

状态：等待重新静态审核；候选未应用、未解析执行、未运行语法或动态测试。P2 修订是文本层面的响应，不代表漏洞已修复或测试通过。

## v1 封存

独立静态 reviewer 给出无 P1、两项 P2，v1 设计门未通过。修订前将原十个文件逐字节复制到 `v1/`；SHA256 清单在 `v1-archive-receipt.json`。原候选 hash 为 c9e63e322baa5cf5e9f262d39e02f0a046c1be07a614487387cd8dbd930c3042，原组合 patch hash 为 bb56c75bd93ee5cd71688cd0bf169b1f4dab23768ce4e9754e8b4ee2961aeb04。旧 manifest 保留原样，没有替换历史状态。

## P2-1：Unicode 大小写转换发生在 ASCII 校验之前

- 原因：v1 先 toLowerCase，Kelvin 字符 K 可变成合法 ASCII k，随后字符检查无法识别原始非法 token；两边缺 k 时可能按缺席匹配。
- v2：split → 仅 trim SP/HTAB → filter 空项 → 原始 token 显式 ASCII A-Z/a-z 字符集验证和完整 * 判断 → 全部通过才 lowercase。没有使用 Unicode case-insensitive regex。
- B08 扩展为 K、含 K 列表及合法 K 对照，覆盖复用、TTL、两种 fallback、序列化；所有用例 NOT_RUN。

## P2-2：把 stale 禁止无条件用于 fresh 错误回退

- 原因：v1 两个 stale helper 无条件调用 `_requiresStaleRevalidation()`，使合法 public,s-maxage=60、age=10 的 500/undefined fallback 从原 policy 变成新错误 policy/抛错。
- v2：两个 helper 都先无条件检查 `_requiresRevalidation()`；另以 `this.stale() && this._requiresStaleRevalidation()` 检查过期限制。fresh 匹配请求保留原时间分支，边界 age>=maxAge 后限制仍生效。
- evaluate 的 stale 分支、TTL 的不延长 stale 窗口逻辑不变；原库 fresh must-revalidate evaluate 保守 miss 不变，但不扩大全面 fresh helper 禁止。
- A07/A18 补齐 fresh/boundary/stale × 有无 stale 扩展 × 错误组矩阵。时钟规格覆盖旧 policy、初始 constructor、new this.constructor、fromObject 和返回 policy；不再只覆盖旧实例 now。

## 范围保持

相对 v1 的候选代码差异仅为 parseVary 顺序/ASCII 字符集和两个 stale helper 的过期条件，可直接检查 `v1-to-v2.candidate.diff`。未改变 304 四限制头合并、own-property 缺席匹配、HEAD error fallback 方向；它们仍待动态验证。Astro 自己的失败回退仍不被包补丁自动覆盖。

本轮只访问本设计目录；生成器改为读取 task-local 官方源快照，sourcePath/HEAD 仅作历史出处，不再次访问 Sol 树。没有安装、候选执行、patch apply、原仓库编辑或安全豁免。manifest 的哈希用于字节追溯，不是修复证明。
