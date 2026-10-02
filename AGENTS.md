# Repository Guidelines

## Project Structure & Module Organization

Firefly is an Astro 7 site with Svelte islands and TypeScript configuration. Main source code lives in `src/`: routes in `src/pages`, layouts in `src/layouts`, reusable UI in `src/components`, styles in `src/styles`, content in `src/content`, helpers in `src/utils`, and Markdown/HTML plugins in `src/plugins`. Site configuration is split across `src/config` with matching type definitions in `src/types`; prefer imports from `@/config` when available. Static files served directly belong in `public`, source-managed images in `src/assets`, docs in `docs` and `Firefly-Docs`, and automation in `scripts`.

## Build, Test, and Development Commands

Use `pnpm`; the `preinstall` script enforces it.

- `pnpm dev` or `pnpm start`: run the local Astro dev server.
- `pnpm check`: run Astro diagnostics.
- `pnpm type-check`: run TypeScript with `--noEmit`.
- `pnpm format`: format `src` with Biome.
- `pnpm lint`: run Biome checks and safe fixes on `src`.
- `pnpm build`: generate icons, LQIPs, the Astro build, font subsets, and Pagefind search output in `dist`.
- `pnpm preview`: preview the production build locally.
- `pnpm new-post`: scaffold a new content post.

## Coding Style & Naming Conventions

Biome is the formatter and linter. It uses tabs for indentation and double quotes for JavaScript/TypeScript strings. Keep Astro and Svelte components in `PascalCase` (`PostCard.astro`, `Search.svelte`), config modules in `camelCase` ending with `Config.ts`, and utilities in descriptive kebab case such as `date-utils.ts`. Keep `src/types` aligned with `src/config`. Avoid unrelated formatting churn.

## Testing Guidelines

There is no dedicated unit-test framework configured. Before submitting changes, run `pnpm check`, `pnpm type-check`, and `pnpm build` for rendering, content, or generated asset work. For visual or interactive changes, verify with `pnpm dev` or `pnpm preview` and include screenshots in the PR. Name future tests near the feature they cover, using the local file name as the stem.

## Commit & Pull Request Guidelines

Use Conventional Commits, matching the current history: `feat: ...`, `fix: ...`, and `chore: ...`. Keep commits and PRs focused on one concern. PRs should include a concise summary, linked issues when relevant, validation commands run, and screenshots for UI changes. Discuss major features or design changes in an issue or discussion before implementation.

## Security & Configuration Tips

Do not commit secrets, tokens, or service keys in config files. Keep deployment-specific settings in the target platform environment, and review generated files such as `dist`, `src/constants/lqips.json`, and `src/constants/icons.ts` before committing them.

---

# Zhenkun-blog-site 项目约定（追加于上游 AGENTS.md 之上）

> 本节是博客项目的仓库规则。用户当前明确指令优先于项目约定；在项目约定内，本节优先于上游主题开发指引。技术/方向取舍以 DECISIONS 的最新适用 ADR 为准（superseded 条目保留历史），任务状态只看 ROADMAP；冲突协调写入 ADR，不由历史快照恢复已撤回的方向。

## 项目定位

- 这是公共品牌与作者均为 Zhenkun 的个人博客（仓库与站点路径为 Zhenkun-blog-site），底座为 CuteLeaf/Firefly（Astro 7 + Svelte 5 + Tailwind）。G6 已批准中文原 URL、英文 /en/ 与两套单语言 UI；Home/About 首增量沿 ADR-XB-014，精确任务/接纳状态只看 canonical ROADMAP，不由旧调查措辞恢复待确认状态。
- 上游仓库保留为 git remote `upstream`（分支 `master`）；本地 `main` 在 Firefly 历史之上叠加自有提交，message 延续 Conventional Commits。

## 文档索引（单一状态源）

| 文档 | 职责 |
|---|---|
| `docs/ROADMAP.md` | 计划列表与当前状态；每次会话结束必须更新勾选与"当前断点" |
| `docs/PROCESS.md` | 改动五步循环、防抽奖规则、回滚规则、证据纪律 |
| `docs/DECISIONS.md` | ADR 决策记录（背景/候选/选择/放弃/验证/改判条件） |
| `src/config/README.md` | 主题配置文件地图（上游自带，26 个配置模块） |

## 目录位置约束

- 仓库根 = 博客本体；不新增顶层目录，除非 ADR 批准。
- `docs/` 只放项目方法论文档；上游的 README 翻译与图片保持原位不动。
- `references/` 放参考材料（对标站点截图、上游文档摘录）；`scripts/` 放自建脚本，用 `zhenkun-` 前缀与上游脚本区分。
- 临时产物（截图草稿、实验文件）一律 `/tmp` 或仓库 `tmp/`（已 gitignore）；不得散落在仓库外或根目录，会话结束前清理。

## 记忆与恢复协议（假设每次轮次之间都会失忆）

- **L0 仓库即记忆**：git log/diff、本文件、docs/ 三件套就是状态本身。重要结论必须落文件，聊天记录不算记忆。
- **L1 错误记忆**：出现自愈、反复失败或关键教训时，追加 `docs/ERROR_MEMORY.md`（错误 → 修复 → 预防规则）；超过 100 条触发合并提炼。
- **L2 任务状态**：ROADMAP.md 的勾选与"当前断点"小节是唯一任务状态源；发现多处状态矛盾时停止实现，以仓库现实为准。
- **L3 交接报告**：每次交付按"改动 + 证据 + 假设与风险 + 待授权动作"四段汇报。
- **恢复会话**：先读本文件与 ROADMAP；旧会话的一切 PASS 视为未验证，重跑关键验证后才能在其上继续。

## 授权边界（未获明确授权不得执行）

- `git push`、创建/修改远程仓库、部署（GitHub Pages / Vercel 等）
- 安装新依赖（`pnpm add`）、修改 pnpm-lock.yaml 之外的依赖声明
- 删除文件、批量重命名、合并上游更新（`git merge upstream/master`）
- 上文 Firefly 开发规范中的验证要求（`pnpm check` / `type-check` / `build`）在本仓库继续适用。
