# 改动流程与回滚规则

## 单项改动循环（每个任务都走这五步）

1. **提议**：说明改什么、为什么、影响哪些文件；外观类附对标参考（rainzt.cn 截图或 Firefly demo）。
2. **计划**：常规配置改动直接列 TODO 执行；结构性 / 方向性改动先写 ADR 到 `docs/DECISIONS.md`。
3. **执行**：最小改动，不顺手重构；一个任务一个 commit，message 用 Conventional Commits（`feat:` `fix:` `chore:` `docs:`）。
4. **验证**：按改动类型选择——配置类 `pnpm check` + dev 渲染；UI 类浏览器截图（存 `references/`）；结构性改动加 `pnpm build`。
5. **记录**：勾选 ROADMAP、必要时补 ADR 验证字段、按"改动 + 证据 + 假设与风险 + 待授权动作"四段汇报。

## 前端改动的防抽奖规则（本项目特别纪律）

前端迭代成本高、AI 生成不稳定，因此：

- **先描述后动手**：用户用自然语言描述目标效果 → AI 列出涉及的配置项 / 组件清单与预期变化 → 用户确认后再改。
- **一次只改一个视觉变量**；改前记录当前值（写入 commit message 或 `references/`）。
- **不满意即回滚**（见下），不在同一个 commit 里反复试错。
- 每项改动的前后截图留档 `references/`，作为外观演进的唯一依据。

## 回滚规则

- 单任务回滚：`git revert <commit>`，保持历史；不 amend 已记录验证证据的 commit。
- 跨任务回滚：ROADMAP 勾选同步退回，并在"当前断点"记录原因。
- 上游合并冲突：放弃本地改动优先于破坏上游结构；冲突解决需在 ADR 记录。

## 证据纪律

- 证据四态：PASS / FAIL / BLOCKED / NOT_APPLICABLE；BLOCKED 不得转写为 PASS。
- 旧会话的验证证据有时效：恢复会话后，重跑关键验证才能在其上继续。
- 状态矛盾（ROADMAP、聊天记录、工作区不一致）时停止实现，以仓库现实为准。

## Bounded work and recovery

- ROADMAP alone records the active packet, intended outcome, exclusions, working branch/base, affected verification, blockers, and next action. ARCHITECTURE describes contracts; DECISIONS records tradeoffs; neither keeps a copied live task checklist.
- Recover through AGENTS → ROADMAP → the packet's relevant ADR/error records → live Git status/log/diff. Historical PASS is a snapshot. Recheck affected behavior after source edits and before using it as acceptance for further work.
- Distinguish external OBSERVED behavior, SOURCE_CONFIRMED implementation, INFERRED recommendations, and UNVERIFIED gaps. A screenshot of a reference, a source configuration, a dev render, a build artifact, and a deployed result establish different facts.
- Preserve prior working-tree changes. Keep each implementation packet focused; planning completion does not mean source implementation, content publication, feature activation, or deployment is complete. No service endpoint, author record, statistic, or approval may be invented to close a gap.
- Before a check, inspect its filesystem/network side effects. A build that empties output or staging remains BLOCKED under the no-deletion instruction unless the owner grants an exact tool/file exception recorded in ROADMAP; do not bypass it through another output directory or a wrapper. New dependencies, broader deletion, upstream merging, push, and deployment retain their existing authorization boundaries.
- Screenshots belong to dated references folders. Verify the intended title/content and actual viewport before accepting them; URL change alone can precede Swup content replacement. Keep rejected captures identified as diagnostics, and do not stage private/transient captures for public delivery. A staging folder is not a backup and is not permission to clean up files.
- At handoff, update ROADMAP and report changes, evidence, assumptions/risks, and pending authorized actions. ERROR_MEMORY records actual failures and recovery, not a parallel risk register or task board.
