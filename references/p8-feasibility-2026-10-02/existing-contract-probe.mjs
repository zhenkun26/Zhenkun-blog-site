import { verifySourceBaseline } from "./source-baseline.mjs";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";

const base = "27e09c220e1ffe16817d5bf02e950a4fbf332b7b";
verifySourceBaseline();
globalThis.__p8Lang = "zh_CN";
const translationURL = pathToFileURL(`${process.cwd()}/src/i18n/translation.ts`).href;
const hooks = registerHooks({ resolve(specifier, context, nextResolve) {
  if (context.parentURL === translationURL && /^\.\.\/config(?:\/index(?:\.ts)?)?$/.test(specifier)) {
    return { url: "data:text/javascript," + encodeURIComponent("export const siteConfig = {get lang(){ return globalThis.__p8Lang; }};"), shortCircuit: true };
  }
  return nextResolve(specifier, context);
} });
const observations = [];
try {
  const { i18n, getTranslation } = await import(translationURL);
  const { default: Key } = await import("../../src/i18n/i18nKey.ts");
  const { resolveSiteLang, getOgLocale } = await import("../../src/utils/site-config-utils.ts");
  for (const lang of ["zh_CN", "en", "en_US", "zh-CN", "unknown"]) {
    globalThis.__p8Lang = lang;
    const actual = i18n(Key.home);
    observations.push({ contract: "actual global i18n(home)", lang, actual });
    assert.equal(actual, lang === "zh_CN" ? getTranslation("zh_CN")[Key.home] : getTranslation("en")[Key.home]);
  }
  const en = getTranslation("en");
  const old = en[Key.home];
  try {
    en[Key.home] = "";
    globalThis.__p8Lang = "en";
    const actual = i18n(Key.home);
    assert.equal(actual, getTranslation("zh_CN")[Key.home]);
    observations.push({ contract: "Actual missing English value fallback (temporary in-memory mutation only)", actual, languageMix: true });
  } finally { en[Key.home] = old; }
  const originalOverride = process.env.PUBLIC_SITE_LANG;
  try {
    for (const override of ["zh-CN", "en-US", "invalid"]) {
      process.env.PUBLIC_SITE_LANG = override;
      const resolved = resolveSiteLang("zh_CN");
      assert.equal(resolved, override === "en-US" ? "en" : "zh_CN");
      observations.push({ contract: "Actual build-wide locale resolver", override, resolved, ogLocale: getOgLocale(resolved) });
    }
  } finally {
    if (originalOverride === undefined) delete process.env.PUBLIC_SITE_LANG;
    else process.env.PUBLIC_SITE_LANG = originalOverride;
  }
  const { isPageInSitemap, getDeploymentCanonicalUrl } = await import("../../src/utils/deployment-contract.ts");
  const { getPostId } = await import("../../src/utils/post-contract.ts");
  const closed = { friends:false,guestbook:false,dynamic:false,gallery:false,booknav:false,bilibili:false,bangumi:false,vndb:false,mal:false,sponsor:false };
  for (const deployment of ["/", "/Zhenkun-blog-site/"]) {
    const origin = "https://zhenkun26.github.io";
    const unprefixed = isPageInSitemap(origin + deployment + "gallery/", deployment, closed, true);
    const nested = isPageInSitemap(origin + deployment + "en/gallery/", deployment, closed, true);
    assert.equal(unprefixed, false); assert.equal(nested, true);
    const existing = getDeploymentCanonicalUrl(new URL(origin + deployment + "search/?q=x#test"), deployment);
    const hypothetical = getDeploymentCanonicalUrl(new URL(origin + deployment + "en/search/?q=x#test"), deployment);
    assert.ok(!existing.includes("?")); assert.ok(hypothetical.includes("?q=x"));
    observations.push({ contract: "Actual existing deployment helpers on hypothetical locale routes", deployment, disabledUnprefixedGalleryIndexable: unprefixed, disabledEnglishGalleryIndexable: nested, existingSearchCanonical: existing, hypotheticalEnglishSearchCanonical: hypothetical, interpretation: "Expected scope gap: no English routes exist today. Option A must add locale-aware logical route policy before emitting English routes; not a current Chinese-site regression." });
  }
  const ids = [getPostId("example.md", { lang: "zh_CN" }), getPostId("example.md", { lang: "en" })];
  assert.equal(ids[0], ids[1]);
  observations.push({ contract: "Actual publication ID does not pair/filter by lang", ids, interpretation: "Existing lang is metadata, not a translation identity or locale route system." });
} finally { hooks.deregister(); delete globalThis.__p8Lang; }
const result = { status: "PASS_OBSERVED_EXISTING_CONTRACTS", base, observations, boundary: "Actual existing functions, in-memory config seam and temporary English-value mutation restored in finally. No repo mutation, feature implementation, article translation or service call." };
writeFileSync("references/p8-feasibility-2026-10-02/existing-contract-probe.json", JSON.stringify(result, null, 2) + "\n");
console.log(JSON.stringify(result));
