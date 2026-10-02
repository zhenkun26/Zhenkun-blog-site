# Owner inputs queued after P3 review

Received through the coordinating parent task on 2026-10-02. These are separate upcoming milestones; no persona, category, email or locale source was edited in P3.

## Confirmed public profile

- Display name: Zhenkun.
- Main sections: AI、大气科学、生活随笔.
- Biography: 探索气象学、人工智能与计算机科学的交叉，记录学习、实践与生活。
- GitHub: https://github.com/zhenkun26
- Public email: zhenkunz25@gmail.com

The parent supplied the explicit exchange: the assistant displayed these proposed values and asked whether the email could be directly shown on the public blog; the owner answered “可以” (`Sentinel_cdfae631a24c8191af8255e56fa0eaad`). This authorizes local profile configuration. It does not authorize a remote deployment or publishing the existing draft.

## Requested upcoming bilingual capability

Owner request (`Sentinel_b89fed97c9988191aef01c5e794b163c`): “后续推进设置双语版，可以在顶部切换中文和英文”.

After P3 and profile configuration, inspect the existing framework i18n and establish a small testable plan before implementation. Parent proposals are default Chinese, a top 中文 / EN switch, visitor-choice persistence and corresponding-page preservation where translations exist; these implementation choices still need the scoped plan.

The plan must cover navigation/bio/buttons/search/messages, route and canonical/hreflang policy, language-specific search, missing-translation fallback, keyboard access, root/subpath builds and repeated SPA navigation. Article versions require explicit locale and translation association. Do not label a Chinese body as an English article, or mass-translate/publish content without review. No service, dependency, remote delivery or article-publication step is included.
