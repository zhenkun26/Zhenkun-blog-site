# Zhenkun-blog-site

> [!IMPORTANT]
> **本项目基于 [CuteLeaf/Firefly](https://github.com/CuteLeaf/Firefly) 构建。**
> Firefly 是 [saicaca/fuwari](https://github.com/saicaca/fuwari) 的二次开发主题，感谢 CuteLeaf 与 saicaca 的出色工作。
> 本仓库遵循上游的 MIT 协议，主题层署名保留于 [LICENSE](LICENSE) 与站点页脚（"Powered by Astro & Firefly"）。

🌐 线上地址：**https://zhenkun26.github.io/Zhenkun-blog-site/**

日常修改、写作、双语、排错与回滚从 [维护手册](docs/OPERATIONS.md) 开始；实际任务与待验收事项只看 [ROADMAP](docs/ROADMAP.md)。

这是Zhenkun的个人博客：记录技术学习、项目实践与日常思考，把真实的经验写成文字，也给灵感留一席之地。

---

## 我自己整理的部分（相对上游的改动与约定）

上游提供博客主题本体，以下是本仓库叠加上去的工程约定与定制，细节见对应文档：

| 部分 | 说明 | 位置 |
|---|---|---|
| 项目文档体系 | 路线图（单一任务状态源）、改动五步循环与防抽奖规则、ADR 决策记录 | [docs/](docs/) |
| 目录位置约束 | `references/` 参考材料、`scripts/` 自建脚本（zhenkun- 前缀）、`tmp/` 临时产物 | [AGENTS.md](AGENTS.md) |
| 站点配置定制 | 站点信息、侧栏资料、横幅文案、页面开关等，全部集中在 `src/config/`（26 个模块，见其自带 [README](src/config/README.md)） | `src/config/` |
| 部署方案 | GitHub Actions 构建发布到 GitHub Pages；`base` 路径用 `DEPLOY_BASE` 环境变量注入（本地开发保持根路径） | `.github/workflows/deploy.yml`、[ADR-XB-004](docs/DECISIONS.md) |
| 组件修正 | Profile / Announcement / BannerHomeTextOverlay 三处配置链接改走 base-aware `url()`（GitHub Pages 子路径必需） | `src/components/` |
| 主题切换 | 亮/暗按钮改为点按直接翻转 + View Transitions 圆形扩散动画 | `LightDarkSwitch.svelte` |
| 写作参考 | 上游 Markdown/图表语法示例收存在 `references/firefly-syntax-examples/`，写作时可当手册 | `references/` |

## 分支说明

| 分支 | 用途 |
|---|---|
| `main` | 博客主线。push 即自动部署上线 |
| `firefly-base` | 上游基线快照（Firefly @ db331cf），用于 diff 对照与追溯 |
| `upstream`（本地 remote） | 指向 CuteLeaf/Firefly，`git fetch upstream` 拉取上游更新 |

## 常用命令

```bash
pnpm dev          # 本地开发 http://localhost:4321
pnpm new-post my-note # 新建文章；生成器默认 draft:false，先改 true 再写稿
pnpm build        # 完整构建（图标/LQIP/字体子集/Pagefind 搜索）
pnpm check        # Astro 诊断
pnpm type-check   # TypeScript 类型检查
pnpm exec biome ci ./src # 只读 Biome 检查；pnpm lint 会写文件
```

与 CI 对齐使用 Node 24.20.0、pnpm 11.22.0；包声明的最低 Node 为 22.23.0，`packageManager` 固定 pnpm 版本。首次安装使用 `pnpm install --frozen-lockfile`。

## 部署

push 到 `main` 即自动触发部署（约 1~3 分钟后上线）。部署用构建命令 `pnpm build`，CI 中注入 `DEPLOY_BASE=/Zhenkun-blog-site/` 使资源路径对齐项目页子路径；本地开发无需设置。

## 许可

- 代码：MIT（继承上游 Firefly / Fuwari 的许可与署名）
- 文章内容：CC BY-NC-SA 4.0（站点默认配置，详见页脚"文章许可"）
