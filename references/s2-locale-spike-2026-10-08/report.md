# S2 bounded locale investigation — architecture handoff

The current configured code renderer fails the requested monolingual controls. This is an observed renderer counterexample, not a conclusion that a single bilingual build is impossible. The instructed architecture decision point has been reached; application implementation is paused before selecting an adapter or a second build.

## Exact boundary

- Current main/base: `a7b31c777f415e725eaf4d280da34380b3fc82cd`; deployed source: `57264e7c833035b751f9e16f2464a2f358fb81fa`, [Pages 37729199074](https://github.com/zhenkun26/Zhenkun-blog-site/actions/runs/37729199074) completed successfully. Their differences are documentation/evidence only.
- [Read-only refresh](state-refresh.json) at `2026-10-08T05:23:14Z` confirms the latest Pages run, current main and online homepage HTTP200 / `zh-CN` / one construction notice. Open PRs are dependency bots #27, #26 and #6; none is imported or altered. This GET is not fresh GUI or artifact-byte acceptance.
- Single writer: `codex/blog-s2-bilingual-20261008`. No legacy P8 source has been imported. Source/configuration/dependencies/lock/patches/workflows remain identical to the base. This packet adds local documentation and diagnostic evidence only; no S2 PR, push, merge or deployment.
- Node `24.20.0`, project pnpm `11.22.0`; normal frozen install succeeded without a custom store or changed dependency declarations. Both S1 review deadlines remain `2026-10-14T14:27:22.000Z`; no extension or contract rebind.
- Original project, private working directory, original security candidate and unaccepted P8 candidate retain their recorded HEAD/branch/status/index and private/symlink protection checks. The detailed private receipt stays outside this public repository.

## Observed counterexample

[Probe](code-locale-probe.mts) constructs the actual installed `createAstroRenderer` with current themes/plugins and the project's four collapse strings. It uses the real renderer's explicit block-locale API on a fixed, safe 20-line JavaScript fixture, concurrently in order `zh-CN`, `en`, `en`, `zh-CN`. No global configuration is changed between renders; no post is published. Locale-relevant configuration is mirrored; this is not an import or execution of the whole Astro build configuration.

| Requested locale | Actual copy title / completion | Actual collapse / announcement | Contract |
|---|---|---|---|
| `zh-CN`, twice | `Copy to clipboard` / `Copied!` | 中文 | FAIL: copy labels |
| `en`, twice | English | `展开` / `收起`; `代码块已展开` / `代码块已折叠` | FAIL: collapse labels |

[Result](renderer-result.json) records all four cases and the raw snapshot hash. [Chinese fragment](code-zh.html) and [English fragment](code-en.html) are the captured renderer AST serialized with its existing installed HTML serializer. They are code fragments, not complete Astro page/build/HTTP/browser evidence. The renderer process exits zero because rendering succeeded; the language contract is explicitly **FAIL**, with `wholeSiteAcceptance: false`.

Reproduce from this exact base with the existing frozen installation:

```sh
mkdir -p tmp/s2-20261008
pnpm exec tsx references/s2-locale-spike-2026-10-08/code-locale-probe.mts
node references/s2-locale-spike-2026-10-08/code-locale-summary.mjs
```

The raw AST/stdout and first diagnostic capture remain in ignored, owned temporary storage. The shared fixture is not a manuscript, media request or comment. Native/type/build/GUI/hosted S2 acceptance has not run.

## Source-confirmed interfaces and decision

[Installed interface excerpts and hashes](installed-interfaces.json) establish the following:

1. `astro-expressive-code@0.44.2` calls `getBlockLocale({ input, file })` before creating/rendering a code block. Core `0.44.2` exposes the block locale to plugin hooks. The [official configuration API](https://expressive-code.com/reference/configuration/#getblocklocale) describes the same seam.
2. Astro 7's current Satteri document adapter supplies path/URL/source; it does **not** supply `file.data.astro.frontmatter`. A resolver copied from an older rehype/VFile example is unproven here. Document-language ownership must work through the real current adapter and existing content-language/publication contract.
3. `expressive-code-collapsible@0.1.0` resolves its four text options at plugin creation, then its rendered-block hook uses that closed-over configuration. It does not consume hook locale. Its peer uses the retained older core; structural compatibility needs the existing strict type/real-owner gates.
4. The actual frame plugin `0.44.2` uses `pluginFramesTexts.get(locale)` and exports locale registration. Its defaults are English plus German; this explains the Chinese copy counterexample. Registration must affect the renderer's real owner. Root collapsible-sections and line-numbers are `0.44.2`; the custom collapse package is `0.1.0`. Terminal titles/explicit collapsed sections remain untested.

| Option | Minimal proposed change | Maintenance and acceptance cost |
|---|---|---|
| A: retain one bilingual build | Explicit document-to-block locale resolver; a small locale adapter around original collapse hooks; correctly owned copy/terminal/section text localization from the existing catalog. Keep plugin behavior and a single CSS/JS owner. | Must prove locale propagation through real Markdown/MDX and both installed core owners; immutable concurrent rendering; strict types; native controls/ARIA and runtime behavior. No plugin fork, global config mutation or new dependency has been implemented. |
| B: two complete builds plus checked merge | Build Chinese and English with their own bases, then merge only through a validated manifest. | Doubles the formal generation/font/Pagefind pipeline and adds collision hashes, resource ownership, sitemap/robots/feed/SEO merging and deployment consistency. Neither its formal pipeline nor merge has been validated. |

**Recommendation, inferred:** request a narrow Astra high implementation decision on A's document-locale and plugin-owner seams first. A looks smaller than B, but has not passed an adapter experiment. Do not approve A as proven or switch automatically to B. The stop follows S2 prompt A.5 and the overall plan's architecture boundary; it is not a routine extra Codex review or an Auto-review refusal.

## Legacy migration and resumption

[55-file migration map](migration-map.json) records the functional increment from legacy `1e7f49c` to unaccepted `d0a2b9e` (1433 additions, 175 removals), each proposed current target and its current/legacy blob. No file is marked migrated. Valid reference areas are locale contract/pages/preference, translator, common shell, Search/MusicManager/View, About and language controls, then date/navigation/schema consumers.

The three old test scripts must become `zhenkun-*` and enter the real CI glob; old base/URL tokens and `xiayi-locale` storage must be replaced without adding an unused compatibility layer. Existing approved Zhenkun identity/contact and PR23 construction notice must survive per-file migration. Old catalog/`localeUi` duplication and `approved: true` pairing must not become permanent parallel language/publication policies. Legacy package/lock/config/docs and old PASS records are not migration source or current acceptance.

After a parent decision, run the bounded real-site spike: shared Home/About and an isolated safe synthetic body; two bases, code/error/date controls, actual Pagefind and Swup. Only then record the accepted A/B choice and proceed with language/URL contracts, shell and eligible discovery consumers. Keep the specified formal types/native/dual-build/artifact/HTTP/GUI/exact-CI gates. Real articles and giscus interaction remain separately unaccepted; S3's S2 prerequisite is not satisfied.
