# Zhenkun 资料候选：执行与复核交付

## 改动

用户最新明确纠正要求公开站点名称、导航品牌与作者均为 **Zhenkun**。旧“作者 Zhenkun / 品牌 Zhenkun / 保留旧标题”提案已由 ADR-XB-012 替代；候选 ROADMAP/ADR 同步移除活动分离要求，历史材料保持原字节。

候选路径 `/Users/zhenkun/Documents/Codex/2026-10-02/task/tmp/zhenkun-g1/review`，分支 `codex/profile-zhenkun`，基线 `a3d1a9a80b5acbe305720dbc09d28af23c8247d8`；资料源码提交 **`f0ea5164ab7e0ccc34ecfc478c6c3e5813a50db7`**。后续提交仅记录 docs/evidence，可从分支查询最终交付 SHA，生产源码逐字节绑定 f0ea516。

| 文件 | 之前 | 候选 |
|---|---|---|
| `src/config/profileConfig.ts` | 作者 Zhenkun，旧简介与 163 邮箱 | Zhenkun；已批准简介；`zhenkunz25@gmail.com` |
| `src/config/siteConfig.ts` | Zhenkun，旧描述/身份关键词 | title/navbar 均 Zhenkun；已批准简介；身份与三个主方向关键词 |
| `src/content/spec/about.md` | 旧作者介绍与主题分类文案 | Zhenkun；已批准简介；AI / 大气科学 / 生活随笔；新邮箱 |
| `src/pages/about.astro` | About 描述使用“关于我” | 使用已批准 profile bio，分享与搜索描述一致 |

简介精确为“探索气象学、人工智能与计算机科学的交叉，记录学习、实践与生活。”。GitHub 仍为 `https://github.com/zhenkun26`。现有页脚、结构化数据、meta author、OG/Twitter 与 RSS 消费配置，无须复制身份字段或改造渲染器。`before.json` 记录准确基线配置/源码哈希，截图是本候选实际渲染证据；未把旧页面截图宣称为本次 fresh before render。

原仓库 `/Users/zhenkun/GitHub/Zhenkun-blog-site` 的活动分支 `codex/refactor-publication-contracts` 仍为 **a3d1a9a**，tracked 干净；main 保持 `bc21bfd92dd7081f2cf0acbec80d446f9d02c7de`。此前 P2.5 精确 6f551119 的独立复核与用户直接批准本地 fast-forward 已完成，证据另存 `references/p25-local-acceptance-2026-10-02/`；资料候选尚未接纳。原 .workbuddy 和旧隔离 checkout 的 50 个未提交 P3/证据文件均通过新鲜哈希守卫。

## 证据

以下是执行方对 f0ea516 相同源码字节的实际测量，**不是独立资料复核结论**。

| 检查 | 实际结果 | 材料 |
|---|---|---|
| 全源码 Biome | PASS，298 文件，未自动修复 | `biome-full-source.log` |
| 原生契约回归 | PASS，147/147，无失败/跳过 | `native-tests-147.log` |
| TypeScript | PASS，exit 0 | `type-check.log`（空输出） |
| Astro check | PASS，257 文件，0 errors / 0 warnings / 12 retained hints | `astro-check.log` |
| 精确资料、链接、边界源码断言 | PASS | `config-audit.mjs`、`config-audit.json` |
| 正式 build 定义的完整八阶段 | PASS，`/Zhenkun-blog-site/`，八项 exit 0 | `run-declared-build.mjs`、`build-stages.json`、`build-subpath.log` |
| 六条实际产物路由及 RSS | PASS | `artifact-audit.py`、`artifact-audit.json` |
| P2.5 实际产物检查 | PASS，Pagefind、图片、canonical、RSS/sitemap/stub 等 | `deployment-artifacts.json` |
| 实际浏览器 | PASS，Edge GUI Home/About 桌面 1462×839 DPR2；About 冷载入移动模拟 390×844 DPR1；均无横向溢出 | `browser-checks.json` 与三张 JPEG |
| 源码/旧材料/保护守卫 | PASS，四文件源码精确绑定、50 个 P3 文件和 .workbuddy 原样 | `snapshot.py`、`source-snapshot.json` |

六路由为首页、About、归档、搜索、分类、标签，标题/导航/版权作者/meta author/OG site name 均为 Zhenkun；OG/Twitter 标题和页面标题一致。Home/About 的普通/OG/Twitter 简介、Person/WebSite/Organization/ProfilePage 身份、公开 GitHub 与受保护邮件链接解码均核对。RSS 频道标题为 Zhenkun，link 仍为原 Pages 项目 URL，0 items；公开文章 API 仍为空，未创建文章填充分类。

完整八阶段执行采用已有直接 Astro 二进制与 Node `--import tsx` 调用正式 scripts；helper 先断言 package 的完整 build 定义，未删减生成、字体、minify 或 Pagefind 步骤。这是 Mac 上相同声明阶段的执行，**没有运行字面 pnpm build、安装依赖或证明 Linux/hosted CI**。此方式令现有站点信息的 pnpm 诊断显示 unknown，未伪造 npm user agent 或改代码遮盖。首轮默认 sandbox 在 Astro listener 遇 EPERM，保存三阶段通过/后续失败原日志；同一完整执行获本地例外后八阶段全部通过。

旧名称扫描首次误报保留的可见 `zhenkun26.github.io/Zhenkun-blog-site` 域名地址，随后只排除这个精确允许字符串；名称和元数据断言保持严格。浏览器版本没有本次新鲜查询，因此未引用过去版本作为本次实测。CUA 的不支持参数/受限 navigator 访问已按文档恢复，没有改走其他自动化接口。

截图已逐张查看：`home-desktop.jpg`、`about-desktop.jpg`（完整页面）、`about-mobile.jpg`。本次浏览器标签已关闭、视口已恢复。Astro stop/status 错报 no server 后，对已经核实命令/端口的唯一任务 PID 58064 发 SIGTERM；127.0.0.1:4342 监听清空，详见 `preview-stop.log` 与 `preview-cleanup.json`。`artifact-sha256.json` 绑定当前 dist，`evidence-sha256.json` 绑定此目录交付材料；生成物不提交为源码。

## 假设与风险

仓库名、域名与 `/Zhenkun-blog-site/` URL 保留，因此站点信息的地址中仍有 Zhenkun-blog-site。这是地址边界，不是旧公开展示名。头像、现有 Logo、开关、草稿分类、Firefly/Fuwari/Astro 法定来源署名与 LICENSE 保持；新 Logo 仍暂缓。草稿 `blog-launch.md` 仍 `draft:true`，零真实公开文章。

文章 OG renderer 源码继续消费 site title/profile name，已确认字段映射；空库没有真实文章 OG PNG，不能宣称其实际图片/正文/评论验收。根 base 未因这份纯资料包重新构建；本次没有新的逐路由 HTTP 字节矩阵、实体手机、Chrome、干净安装/Linux、hosted Actions 或 required-check 兼容性结果。12 个现存 Astro hints 保留。历史双 base/P3 浏览器证据仍绑定各自源 SHA，未移贴为本次 fresh 测量。

P2.5 本地实现接纳不等于 frozen/hosted/发布验收。原 Pages 的历史部署状态与此次候选分开；没有推送、main 合并、远端 CI、部署、凭据/权限变化或文章公开。

## 待授权动作与下一阶段

停在**精确资料候选的独立复核门**，向协调父任务交付分支最终 SHA、四文件源码 SHA 和可重现材料。复核后是否本地整合应依据准确目标及直接授权另行处理；此次不自行接纳资料候选。

下一独立工程阶段为 P4 功能开关矩阵，沿现有配置核验导航、直达路由、索引/feeds、资源和降级，明确 HTTP 200 meta-refresh stub 的限制；giscus 真评论仍依赖已批准公开文章。P8 仅做中英双语可行性调查，具体语言路由/译文/切换策略尚未选择。发布、真实草稿公开和服务/安全设置保留各自授权范围。
