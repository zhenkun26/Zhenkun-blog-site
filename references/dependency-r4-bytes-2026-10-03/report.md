# R4 原始字节保真修正（2026-10-03）

源码 `1ffbe4c99f0a48c8d7e70498c7f8bb921eb24435`，基线 `735c141482e46af9819bf6c521ce1ac3ee46c388`，原独立分支 `codex/dependency-r4-security-20261003`。只修改采集/解析脚本与其测试。独立复核对初版 sourcece800/evidence735c 给出1项P2、无P1；本修正本地验证通过，仍待独立复审，不关闭R4发布门或任何CVE。

## 复现与修正

原collector以 `encoding: "utf8"` 接收子进程输出，非法字节已在保存前被替换。自写Node子进程重现复核输入，未执行pnpm或npm audit：[初始证据](initial-reproduction.json) 中 stdout `31ff0a → 31efbfbd0a`，stderr `fe → efbfbd`；保存后的hash也不再对应原输入。原R4报告关于字节保真的广义主张由本复核修正，旧报告、原日志和manifest均保持原样。

现在使用 `encoding: null` 获取Buffer，stdout/stderr原Buffer直接落盘并计算SHA256；再以 `TextDecoder("utf-8", {fatal:true, ignoreBOM:true})` 分别严格解码。BOM保留给原JSON解析规则处理，不新增容错。任一流非法或截断UTF-8都会在receipt记下 `decodingErrors`，解析器在JSON解释前以 `AUDIT_INVALID_UTF8` 返回BLOCKED/2，不静默替换，不删除原始证据。prod失败仍采集full，两个流和两份结果彼此独立。

[修正后逐字节检查](after-fix-verification.json) 验证原复核输入仍保存为 `31ff0a`/`fe`，hash等于输入；截断样例 `e282`/`f09f8c` 也完整保留。两个样例均为 `INJECTED_OFFLINE`、BLOCKED/2，各有完整collection/verdict/raw文件。所有实际子进程只运行自写字节输出程序，未调用审计服务。

## 验证与证据

新增六项有界测试：复核非法字节、嵌在可损失解码后仍可解析JSON中的非法字节、截断多字节序列、仅stderr非法、合法中文/emoji/字面替换字符 `�` 的正向控制，以及prod非法但full有效的独立处理。均通过实际自写Node子进程传递collector的encoding选项；旧内存runner改为返回Buffer，避免字符串mock掩盖真实传输行为。

- [修正前回归](tests-before-fix.log)：6/6预期失败并留档。正向用例此时失败于缺少新解码状态字段，不表示原实现破坏全部合法UTF-8。
- [安全门测试](security-tests-fixed.log)：55/55 PASS，0 skip，含原49与新增6；模拟GITHUB_SHA。
- [全量原生](native-all.log)：302/302 PASS，0 skip，含已有cache/native等回归。
- 正式 `tsc --noEmit --isolatedDeclarations`、严格Swup类型通过；[Biome](biome.log)301文件通过，无修复。
- [总收据](validation-receipt.json) 和 [源码哈希](tested-source-hashes.json) 绑定精确提交；六个受保护仓库与私有hash见 [保护记录](protection.json)，旧R4证据manifest完整，自有夹具子进程已退出、已知native端口关闭，见 [清理](cleanup.json)。

## 范围、未运行项与停止

公告来源、37项台账、severity/alias策略、workflow、token权限、依赖/patch/lock与部署关系均未变。原始告警仍阻断；本修正不增加豁免。live audit/审计元数据外发、new-head上传、GitHub写入或workflow触发均未执行，既有授权等待状态未改变，也未换连接绕过。

本次是证据字节处理修正，应用/构建未改；Astro、双base构建/Pagefind/HTTP、GUI、hosted/Linux及artifact上传本轮NOT_RUN，未把前批PASS改记成本次执行。后续先对本精确修正做独立复审，获明确许可后才由协调者推进真实审计或远程验收。回滚通过新revert仅退回本修正两个脚本，保留失败证据并恢复该P2为OPEN，不能把原有49项PASS当作字节保真证明。

源码和证据本地封存后停写。请求Astra HIGH，实际运行模型UNVERIFIED。唯一任务状态见ROADMAP。
