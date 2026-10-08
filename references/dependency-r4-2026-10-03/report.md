# PUBLIC PRIVACY PROJECTION; original SHA256 029424d5c4b1a42a7221f44bd1011afdaabbf3f61bc5487a15462952ab13690b; local raw original retained.
# R4 本地安全门候选（2026-10-03）

源码 `ce800e5b1d2526b9fbe6cf67eac65a1f18b8405a`，基线 `66d8b1ec5d8eac585af69c5dfa74ea6eb9346e5a`，分支 `codex/dependency-r4-security-20261003`，独立目录 `<local-home>/Documents/Codex/2026-10-03/task/zhenkun-r4`。R4 本地实现已封存，独立审查待完成；真实安全门仍 BLOCKED，live audit/hosted CI 未运行。任务状态唯一来源是 `docs/ROADMAP.md`。

## 设计与改动

仅新增两个独立 job、三个脚本/台账文件、一个固定 workflow 测试基线和 ADR。依赖声明、锁、八个 guards、allowBuilds、cache patch、应用与部署 workflow 未改。

- `scripts/zhenkun-security-audit.mjs`：生产和完整审计各一次；固定官方 registry，单次120秒和32MiB输出上限；第一份失败仍采集第二份。保留 stdout/stderr 原字节、状态/信号/传输错误、时间、实际 HEAD、预期 CI SHA、依赖/策略/脚本/patch 哈希及采集前后快照。已有输出目录拒绝覆盖。只显式 `--live --output tmp/...` CLI 才进入实际执行；离线注入 runner 自动标识 `INJECTED_OFFLINE`。
- 严格判定：坏 JSON/HTML、缺字段、错误对象、未知 severity/ID/alias、计数或退出码不一致、撤回通告、版本/路径范围不一致、源变化或 dirty/错误 HEAD 为 BLOCKED/2。任何有效原始告警（包括中低危）或已知受影响版本为 FAIL/1；仅双份有效无告警、图/补丁/策略完整且无已知命中才 PASS/0。本轮没有临时例外接口。
- `scripts/zhenkun-security-policy.json`：36 条既有 GHSA 加单独 CVE-2026-93750，共37项。GHSA/CVE aliases 仅取自保留官方数据，去重后保留所有原始观测、版本、路径和最高严重性。GitHub 的12处 `medium` 在判定层映射到同级 `moderate`，来源标签未抹掉；不是降低严重性。多来源受影响范围取并集，窄范围不能覆盖较宽通告。未知新通告必须审阅，不是白名单放行。
- 补丁完整性检查包括文件、workspace/lock登记与实际父入口解析源哈希；它从不删告警或赋予 mitigation。当前cache即使哈希正确、registry返回空报告，已知通告仍命中。当前不实现“验证证据齐全后自动忽略”，因此缺 Linux 与新审计授权不能被绕过。台账维护人为整改协调者，2026-10-10 到期后严格 BLOCKED；更新需独立审核，不自动续期。

CVE-2026-93750 保留发布者 High8.2/≤4.2.0 与 issue57 Medium5.9/≤4.1.1 的差异，按较宽来源阻断4.2.0。37项是已有有界来源台账，不是本轮重新联网查证全部通告，也不是未知漏洞的穷尽保证。现存官方基线中≥4.2.1的audit建议不被本门解释为已经发布的修复。

## CI 与发布关系

`build.yml` 原 quality matrix、名字、两个 base、fail-fast:false、全部既有步骤/事件/并发/contents:read 原样。新增 `compatibility` 只负责 frozen安装与peer检查，新增 `security` 负责 frozen安装、三份新文件Biome检查、一次采集和证据上传；新增两个安装使用 `--ignore-scripts`，原质量 job 的完整安装不变。它们互不 needs，安全失败不会遮住两 base 的原生测试运行机会。

最新交接明确覆盖原计划8.2的“quality依赖security”顺序，取舍已写ADR：现有 deploy.yml 仍由 `build needs quality` 等待整个 reusable workflow；该调用失败就不构建/发布，未改部署权限、secret、branch protection、required-check配置或dispatch。无 `continue-on-error`、`|| true`、ignore-registry-errors 或自动fix。

采集步骤在前置失败时仍尝试记录两份诊断（取消除外）；上传用 `always()` 且缺文件为error，上传成功不能覆盖前面失败。只上传本次专用目录，保留7天，不读取/打印完整环境或token。新action固定官方 [upload-artifact v4.6.2](https://github.com/actions/upload-artifact/releases/tag/v4.6.2) 的 [ea165f8d65b6e75b540449e92b4886f43607fa02](https://github.com/actions/upload-artifact/commit/ea165f8d65b6e75b540449e92b4886f43607fa02)；公开页面已核对，未执行action。见 [来源记录](action-provenance.json)。Runner中断、checkout失败、磁盘故障或取消仍可能无法产出完整artifact，这些情况不构成成功扫描。

## 实际验证

[总收据](validation-receipt.json) 与 [源码哈希](tested-source-hashes.json) 绑定上述源码；所有成功和失败命令原文保留。

| 门 | 本次实际结果 |
|---|---|
| 安全离线测试 |49项PASS；正常/全部severity/版本残留/已知漏报/aliases/新通告/JSON/传输/退出码/策略到期/源码变更/补丁缺失篡改/输出保留与CI依赖检查 |
| 完整 native |[296/296 PASS，0 skip](native-final-ci-env.log)，含原247与新增49，设置模拟GITHUB_SHA；真实既有Sharp/Miniflare/workerd和cache45用例保留 |
| Astro |[258文件，0错误/0警告/12 hints](check-correct-entry.log) |
| 正式类型 |`tsc --noEmit --isolatedDeclarations` PASS；strict Swup独立fixture PASS |
| Biome |[301文件PASS](biome-final.log)，包括全src与新增两脚本/JSON；无修复 |
| 结构/保护 |459个应用、依赖、部署文件与基线逐字节一致；原quality job深比较、部署调用链、固定action、失败保存路径与只读权限有离线断言；六个受保护仓库及私有哈希前后一致 |

使用复制且不共享写入的现有node_modules，未声称干净安装。`pnpm exec` 首次触发复制安装的自动检查，在SQLite store权限处失败，未重试安装；后续直接调用已安装工具的公开bin完成离线检查，不能称为字面pnpm包装命令验收。Astro最初误用旧版入口`astro.js`失败，之后采用包manifest声明的`bin/astro.mjs`；两条日志保留。首轮47项有22项失败，根因是新增范围断言位置越过finding作用域、以及台账medium命名映射，修正后47项通过，再加CI HEAD/显式调用测试至49项，完整296项通过；未删断言或降低门禁。

## 离线采集证据，不是新审计

[回放来源与调用记录](offline-evidence-provenance.json) 明确每个runner均注入，没有spawn实际pnpm audit：

- [已有告警回放](offline-retained-findings/verdict.json)：FAIL/1，raw一条GHSA、已知范围两条cache机制命中，补丁不豁免。
- [传输失败夹具](offline-transport-error/verdict.json)：BLOCKED/2，两次都记录错误。
- [非法JSON夹具](offline-invalid-json/verdict.json)：BLOCKED/2，exit0不能伪装成功。

每例目录含两份原文、stderr、collection与verdict；模式均为INJECTED_OFFLINE，实际本地HEAD和锁哈希可核对。保留审计的raw数据没有改写或美化。

## 未运行项与接纳边界

本轮 live audit、审计元数据外发、GitHub写入/上传/触发、hosted/Linux冻结安装、action上传、peer job实际执行均 NOT_RUN。元数据传输和new-head上传授权仍待答，不重复询问或换连接。R4实际安全门不能称为绿。此前cache独立复核由协调者提供：sourceaf1a0379/evidence66d8b1ec，reviewer44/44（不含安装D03）、无P1/P2；这是供述的精确旧候选审查，不是R4独立审查，也不关闭任何CVE。

双base构建/Pagefind/HTTP本轮NOT_RUN：R4仅新增门禁，459个相关应用/依赖/部署字节及原quality job保持一致，完整native/Astro/类型足以覆盖本地变化；前批cache双base证据不重标为R4鲜活执行。GUI沿用BLOCKED/NOT_RUN，未换客户端。未来获授权后的hosted运行应单独核验：同一精确commit的三个独立jobs、Linux cache patch/D03、完整矩阵及失败artifact；当前默认风险阻断保持。

## 回滚、保护与停止

以新revert提交一致回滚本批workflow/脚本/政策/测试和fixture，保留证据并在ROADMAP退回R4状态；撤回门禁不等于安全通过。原cache、peer、R2、R1、phase0与原仓库及原.workbuddy哈希均保持，见 [保护记录](protection-final.json)；原本地分支不整合。R4 native夹具四个已知端口已关闭，临时自有安全夹具按t.after清理，忽略的既有native产物保留，见 [清理记录](cleanup.json)。未恢复双语或其他暂停工程。

完成本地源码/证据提交后停写，交协调者安排独立R4复核。请求Astra HIGH，实际运行模型UNVERIFIED。
