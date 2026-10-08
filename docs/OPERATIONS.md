# Zhenkun 博客维护手册

这份手册回答“在哪改、怎样验证、出错先看哪里”。当前完成情况与待验收事项只看 [ROADMAP](ROADMAP.md)；取舍看 [DECISIONS](DECISIONS.md)，文件职责看 [ARCHITECTURE](ARCHITECTURE.md)。

## 日常入口：5–10 分钟

在自己的隔离副本/分支中操作。先看 `git status --short` 与 `git branch --show-current`；有不明修改就保留现场，不用 reset、clean 或覆盖来取得干净状态。原项目、私人资料与另一个任务的进程不作为练习材料。

```bash
node --version                    # 与 CI 对齐：24.20.0
pnpm --version                    # packageManager 固定为 11.22.0
pnpm install --frozen-lockfile     # 不改变锁文件；首次安装可能下载包
pnpm dev --host 127.0.0.1          # 默认 4321；只在本机预览
```

先改一件事，在浏览器检查对应中文/英文页面、窄屏、键盘焦点和明暗主题，再看 diff。开发预览能显示草稿；`pnpm preview` 服务的是最近一次 `pnpm build` 的正式产物，不能用它审阅被排除的草稿。停止自己的预览用启动终端的 Ctrl-C，不关闭其他任务的端口/进程。

中文原网址保留，英文加 `/en/`。例如中文 About `/about/` 对应英文 `/en/about/`，上线后分别带 `/Zhenkun-blog-site/` 前缀。邮箱链接只检查地址，不发送测试邮件。

## 文件与数据归属

```mermaid
flowchart LR
  A[文章 MD/MDX] --> B[content.config schema]
  B --> C[发布资格与译文配对]
  C --> D[locale 路由和共享视图]
  D --> E[HTML / OG / feed / 元数据]
  E --> F[正式 build 与 Pagefind]
  F --> G[精确 PR/main CI]
  G --> H[Pages 产物与真实 URL]
```

| 要改什么 | 真实入口 | 约束与用途 |
|---|---|---|
| 名称、中文简介、联系入口 | [profileConfig](../src/config/profileConfig.ts)、[siteConfig](../src/config/siteConfig.ts) | 身份统一 Zhenkun；只用已批准公开资料。英文简介在 `locale-pages.ts` 的 `ENGLISH_BIO`。 |
| 菜单、侧栏、施工提示 | [navBarConfig](../src/config/navBarConfig.ts)、[sidebarConfig](../src/config/sidebarConfig.ts)、[announcementConfig](../src/config/announcementConfig.ts) | 施工提示在首页；侧栏重复公告关闭。语言文本消费者需一并核对，不能只改中文配置。 |
| 中英文界面文字 | [zh_CN](../src/i18n/languages/zh_CN.ts)、[en](../src/i18n/languages/en.ts)、[键定义](../src/i18n/i18nKey.ts) | 同键分别维护；`createTranslator(locale)` 用页面语言，客户端用文档语言；避免 fallback 串语。 |
| 正文和文章元数据 | [posts](../src/content/posts/)、[schema](../src/content.config.ts) | 正文属于站主；技术检查不代替内容与附件公开审核。 |
| 发布、URL、配对 | [post-contract](../src/utils/post-contract.ts)、[locale-contract](../src/utils/locale-contract.ts)、[public-locales](../src/utils/zhenkun-public-locales.ts) | 纯函数负责资格、稳定身份与路径；不请求服务、不存偏好、不渲染 UI。 |
| 页面与交互 | [pages](../src/pages/)、[共享视图](../src/components/pages/)、[layouts](../src/layouts/) | Astro 负责输出，Svelte 负责需要交互的岛；配置的形状由 `src/types/` 约束。 |
| 搜索与语言选择 | [Pagefind 构建](../scripts/run-pagefind.ts)、[LanguageSwitch](../src/components/layout/LanguageSwitch.astro)、[搜索共享视图](../src/components/pages/zhenkun-SearchPage.astro) | 搜索读当前文档语言；跨语言用原生整页导航，同语言保留 Swup。 |
| 评论 | [commentConfig](../src/config/commentConfig.ts)、[wrapper](../src/components/comment/index.astro)、[Giscus](../src/components/comment/Giscus.astro) | 保留既有 repo/category；文章语言与共享 term 已显式传入，不依赖翻译标题配对。 |
| 构建与发布 | [package.json](../package.json)、[build.yml](../.github/workflows/build.yml)、[deploy.yml](../.github/workflows/deploy.yml) | `main` 合并会发布到生产；本地验证、工程发布、真实稿件公开是各自的门。 |

完整配置清单见 [配置 README](../src/config/README.md)。关闭模块不等于私密：旧 HTML redirect stub 可仍返回 200，`public/` 中文件仍可能直接公开。草稿、private 字段和加密 HTML 都不能保护公开 Git 历史或原始图片。

## 写文章与译文

1. 在隔离副本运行 `pnpm new-post my-note`。**现有生成器默认 `draft: false`**：生成后第一步改为 `draft: true`，然后才写稿、构建或提交。未审私人材料放在仓库外；本地 draft 预览不授权 push 到公开分支。
2. 逐项确认 `title`、`published`、`description`、`slug`、`category`、`tags`、`lang` 和作者。中文可写 `lang: zh_CN`，英文须写 `lang: en`；旧的空语言按中文处理。`slug` 决定永久 URL，发布后尽量不变。ID 不允许 `..`、反斜线、百分号、查询串或片段符号。
3. 分类字段保存真实身份值，展示翻译不等于改分类 ID。方向是 AI / 大气科学 / 生活随笔；首页说明不要求伪造文章或数量，旧稿的“随记”分类不能为了配展示而自动改名。
4. 每张图列清来源/使用许可、alt、尺寸、体积与元数据；批准后的共用素材进 `src/assets/images/zhenkun/`，新文章图片可与正文同目录并用 `image: "./cover.avif"`。`public/` 原件会被直接复制，不放未审附件。封面缺省与真实 OG 图片需分别检查。
5. Wiki 示例与语法见 [上游写作参考](../references/firefly-syntax-examples/)；目标必须能解析到合格内容。MDX 使用真实 schema 和插件，不能把一次 Markdown 编译当成路由、图片或整页验收。Obsidian 只手动精选已审稿，不同步整个 vault。
6. 有真实译文才创建另一文件，两份使用不同 `slug`、各自 `lang`、同一稳定 `translationKey`。例如 `slug: owner-lab-zh` / `owner-lab-en` 共用 `translationKey: owner-lab`。缺译不生成英文正文/假 alternate，译文 draft/private 不进入正式配对。
7. 同一 `translationKey` 也是 giscus 共享 term；没有它则回退到文章 ID。因此首次公开前即确定稳定 key，之后改标题不影响 term；改 slug 而无 key 会改变身份。已有评论需要先核对原 term/线程，不能猜迁移或创建新讨论掩盖问题。
8. 在本机 dev 审阅正文、heading、外链/Wiki、图片与手机宽度。向站主提交具体版本 diff、附件清单、URL、分类、译文范围。明确通过后才改 `draft: false` 并运行正式质量/发布门；有实质新改动就重新形成可审版本。

正式产物必须同时核对文章页、1200×630 OG、`api/allPostMeta.json`、RSS、sitemap 与 Pagefind，草稿继续缺席。正文公开后把它改回 draft 或 revert 并不会从 Git 历史或第三方评论中消失。

## 验证与精确发布

| 命令 | 发现什么 |
|---|---|
| `git diff --check` / `git diff --stat` | 空白问题、改动范围与误带文件 |
| `pnpm exec biome ci ./src` | 不写文件的格式/静态检查；`pnpm lint` 和 `pnpm format` 会改文件，勿当只读检查 |
| `pnpm check` / `pnpm type-check` | Astro/content 与 TypeScript 契约；不证明浏览器体验 |
| `node --test scripts/zhenkun-test-locales.mjs` | 真实语言 catalog、路由、配对、偏好与文档语言 |
| `node --test scripts/zhenkun-test-publication.mjs` | 发布资格、ID、Wiki、Markdown/MDX；不替代整页/图片验收 |
| `node --test scripts/zhenkun-test-*.mjs` | 原生完整回归；根据改动运行相关检查，发布源码使用完整 CI 门 |
| `pnpm peers check` | 独立父依赖兼容性，和安全门分开 |
| `node scripts/zhenkun-security-audit.mjs --live --output tmp/security-owner-01` | 当次官方源、两份 raw audit、实际安装和补丁行为；目录必须新建，不能覆盖旧证据 |

`--live` 会向 npm 发送依赖元数据，使用实际当前时钟。安全输出留在忽略的 `tmp/`，不要把私有本地历史、路径、令牌或个人资料混入公开证据。

源码发布时先完整构建根路径，再完整构建 Pages 子路径。第二次构建会替换自有 `dist/`，先留住需要比较的结果；不要对指向证据原件的 dist symlink 运行 build。

```bash
DEPLOY_BASE=/ pnpm build
node scripts/zhenkun-verify-ci-artifacts.mjs --base /
node scripts/zhenkun-audit-locale-html.mjs tmp/locale-root.json
DEPLOY_BASE=/Zhenkun-blog-site/ pnpm build
node scripts/zhenkun-verify-ci-artifacts.mjs --base /Zhenkun-blog-site/
node scripts/zhenkun-audit-locale-html.mjs tmp/locale-pages.json
pnpm preview --host 127.0.0.1
```

正式 `pnpm build` 包含生成步骤、Astro 和 Pagefind；单独 `astro build` 缺少正式搜索链，不能冒充完整通过。不要设置开发 `NODE_ENV` 绕过草稿生产门。

提交前自查 → push 隔离分支 → PR → 检查**准确 head/测试 merge SHA** 的 Full quality 两种 base、Peer compatibility、Dependency security 与 Biome → 按已授工程范围正常合并 → 核对 main SHA 和 Pages run/artifact → 请求真实 URL 并在浏览器检查受影响体验。新 head 不能复用旧 CI。只有文档变动时可用明确的源码相等证据减少本地重复构建；不能把相等当成新 CI 已执行。

记录源 SHA、run URL、部署 URL、HTTP 内容与 GUI 结果，区分本地、CI、产物、线上和真实第三方交互。手机模拟不能代替实体手机，数字/截图不能代替实际阅读与输入。当前授权和真实稿件决定仍以 ROADMAP 为准。

## 依赖与两处到期复核

从 `package.json`、`pnpm-workspace.yaml`、`pnpm-lock.yaml` 与 `scripts/patches/` 一起看变化：固定版本、普通兼容更新、原生父链修复、跨 major 分开。新包先解释用途/维护与服务成本，不用全量升级消除红灯。

锁文件由固定 pnpm 生成，review 根依赖、真实父依赖、integrity、optional 平台包、override 和 patch hash；再 frozen 安装与 peer/类型/行为验证。不要手写锁、用非 frozen 掩盖漂移，或把成功下载当成 native/父类型兼容证明。

安全门保留 raw prod/full 的发现，再根据**当次**官方记录、可达路径、安装实例、补丁与正/反例证据判定 effective verdict。raw 非零与经证明的本地修复可同时存在；未知、过期、来源/边界/实例变化仍失败。单改 hash 不能证明新边界安全。

两处截止均为 **2026-10-14T14:27:22Z**：

- [security policy](../scripts/zhenkun-security-policy.json) 的 `reviewBy`。
- [cache contract](../scripts/zhenkun-cache-repair-contract.json) 的 `reviewedUpstream.reviewBy`。

到期前或官方 primary/上游元数据/源码/父图变化时做有界复核：比较官方 GHSA/CVE 和 tarball/integrity/source、实际闭包与使用场景，保留旧失败现场，验证正例和原实现反例，再决定保留或用经过证明的上游修复替换。源码/配置/工作流变化也可能改变绑定边界，应审查差异、记录理由，再执行当前时钟 gate；不要仅更新 boundarySha256 或推迟日期取得绿色。

退出补丁要同时评估上游对缓存策略和 Astro 调用链的覆盖，取消对应 patch/override 后由 pnpm 重新生成锁，验证所有安装实例、原回归、安全和双 base 构建/CI。上游版本号增加不自动证明两个缺口都修复；安全回滚可能重新暴露风险，需具体替代方案。此手册不续期、不自动升级或创建定时服务。

## 故障定位

| 现象 | 第一份证据与下一步 |
|---|---|
| CI cancelled / waiting / timeout | 看准确 run/job/step、concurrency 与 runner 排队；先区分取消、等待和真实失败，只重跑必要目标，保留首次日志。 |
| frozen install 失败 | 对照 Node/pnpm、lock/package/workspace、patch 路径与 integrity；修具体漂移，不非 frozen 安装或清全缓存。 |
| TypeScript/Astro 失败 | 看文件/行号与实际父包 declaration，再看 schema、slug/lang/配对负例；不批量 suppress。 |
| build/Pagefind/产物失败 | 确认走完整 `pnpm build`、`dist/pagefind/` 与 entry 语言；artifact verifier 读构建结果，不沿用旧 dist。 |
| security 失败 | 看当次 `verdict.json`、primary、raw stdout/stderr、两处截止与 cache 证据；这不等于已被攻击。保持发布阻断，勿 ignore/关检查/漂移日期。 |
| Pages 权限/部署失败 | 看 deploy run、environment、upload artifact 与 deploy step；不改 OAuth、branch protection 或 permissions 来“修绿”。 |
| 子路径资源 404 / canonical 错 | 比较 `DEPLOY_BASE`、生成 HTML 和真实请求 URL；检查是否重复 `/Zhenkun-blog-site/` 或错误 origin，确认最终字节而非只看 200。 |
| disabled 页仍 200 | 看 HTML 的 meta refresh 与模块开关；stub 不是真 404，也不说明关闭内容已删除或私密。 |
| 切语言后 UI/搜索串语 | 看 `<html lang>`、原生完整文档导航、Pagefind 初始化及索引语言；英文按钮不证明索引英文。 |
| Swup 重复 listener / 焦点锁 / 代码块不绑定 | 从受影响页面到返回页面重现，检查挂载/清理/焦点与 console；代码折叠已有精确上游 observer 适配，不叠加另一组全 body observer。 |
| 评论丢失、分线程或重复 widget | 比较 repo/category、`mapping`/`term`、translationKey 与实际线程，再看语言/主题及挂载生命周期；未确定映射前不迁移、不新建讨论掩盖。 |

giscus 在本机/产物层可隔离服务模拟，真实页面可只读看加载、访客、失败、语言/主题和线程身份。发送或回复必须由站主亲自操作，或另给准确目标/内容的发送授权；OAuth 和权限设置不属于此验收。看到 iframe 不代表提交已持久保存。

## 回滚与维护节奏

保留原件、当前 HEAD/branch/status、失败日志和自己的工作副本；一次只设一个写者。回滚用新的 `git revert <commit>` 候选，先确认 diff 与前置依赖，再走相关验证/CI。不要 reset/force 改公开历史；合并提交须先识别父线再决定 `-m`，不能盲选。评论、远端数据与已公开 Git 历史不会被工程 revert 删除。

每周人工看一次依赖 PR 与失败 Actions；每次发布前看准确新 head 的 CI、两个补丁期限、稿件和附件公开资格；官方安全记录/primary 变化立即做有界复核。这是人工操作建议，不创建自动化、不更改 Dependabot 或分支保护。

## 四个隔离练习

只在新的本地练习副本/分支运行，不 push；使用可公开安全样例，保留练习目录供查看，练习结束离开该副本。下面的定向检查证明各自契约，**不能证明真实稿件已获批准或整页已上线**。

| 练习 | 文件、命令与预期 | 恢复方式 |
|---|---|---|
| 改一条双语 UI | 两个 catalog 的 `[Key.home]` 分别临时改为“首页练习”/“Home exercise”；`node --test scripts/zhenkun-test-locales.mjs`，保持语言键/配对通过。dev 中亲自查看两个首页的可见文字和键盘。 | 将这两条练习 diff 恢复；有别人改动时不 restore 整文件。 |
| 安全 draft 配对 | 本地新建 `owner-lab-zh.md` / `owner-lab-en.md`，只写“本地练习”/“Local exercise”；各自唯一 slug、正确 lang、同 `translationKey: owner-lab`，两份 **draft:true**。运行 `node --test scripts/zhenkun-test-locales.mjs scripts/zhenkun-test-publication.mjs`；dev 可预览，生产资格拒绝两份，公开配对为空，共享 comment term 相同。 | 样例不提交/不发布，留在练习副本；回到干净工程副本。不用真实首稿替代样例。 |
| 解释一个真实锁 diff | `git diff f33ff92 57264e7 -- pnpm-workspace.yaml pnpm-lock.yaml`，找到 `astro@7.2.10>smol-toml` 的精确 1.9.0 修复及 patch/integrity；结合已保留 [S1 交付](../references/s1-five-remediation-2026-10-08/delivery/report.md) 和当前 policy 说明 raw/effective 区别。 | 只读，无文件修改；旧日志是该 SHA 的历史证据，不是当前安全 PASS。 |
| 本地提交与 revert | 在隔离分支只提交自己的 UI 演示 diff；记录 `git rev-parse HEAD`，`git revert <演示SHA>`，重跑 locale 定向检查。预期恢复原 catalog 字节，产生新 revert commit，draft 样例仍未提交。 | 保留两个本地提交和日志，不 push、不 reset 公开历史。 |

站主最小跟做验收：完成第一项的两个页面阅读与键盘检查，再跟做第四项确认恢复。工程方的脚本演练不能替代站主这一次操作。
