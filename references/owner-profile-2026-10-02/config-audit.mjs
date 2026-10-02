import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { profileConfig } from "../../src/config/profileConfig.ts";
import { siteConfig } from "../../src/config/siteConfig.ts";

const bio = "探索气象学、人工智能与计算机科学的交叉，记录学习、实践与生活。";
const before = JSON.parse(readFileSync("references/owner-profile-2026-10-02/before.json", "utf8"));
assert.equal(profileConfig.name, "Zhenkun");
assert.equal(siteConfig.title, "Zhenkun");
assert.equal(siteConfig.navbar.title, "Zhenkun");
assert.equal(profileConfig.bio, bio);
assert.equal(siteConfig.description, bio);
assert.equal(profileConfig.links.find(link => link.name === "GitHub").url, "https://github.com/zhenkun26");
assert.equal(profileConfig.links.find(link => link.name === "Email").url, "mailto:zhenkunz25@gmail.com");
assert.equal(siteConfig.site_url, "https://zhenkun26.github.io/Zhenkun-blog-site/");
assert.equal(profileConfig.avatar, before.avatar);
assert.deepEqual(siteConfig.navbar.logo, before.logo);
assert.deepEqual(siteConfig.pages, before.pages);
for (const topic of ["AI", "大气科学", "生活随笔"]) assert.ok(siteConfig.keywords.includes(topic));
assert.ok(!siteConfig.keywords.some(keyword => /Zhenkun|Zhenkun/.test(keyword)));
const about = readFileSync("src/content/spec/about.md", "utf8");
assert.ok(about.includes("**Zhenkun**") && about.includes(bio));
assert.ok(about.includes("mailto:zhenkunz25@gmail.com") && about.includes("https://github.com/zhenkun26"));
for (const topic of ["AI", "大气科学", "生活随笔"]) assert.ok(about.includes(`- **${topic}**`));
assert.ok(!/Zhenkun|Zhenkun|zzk26personal@163\.com/.test(about));
const preserved = ["src/content/posts/blog-launch.md", "src/components/layout/Footer.astro", "src/pages/og/[...slug].ts", "LICENSE"];
for (const path of preserved) {
  assert.equal(createHash("sha256").update(readFileSync(path)).digest("hex"), before.sha256[path], `${path} changed`);
}
assert.ok(readFileSync("src/content/posts/blog-launch.md", "utf8").includes("draft: true"));
assert.ok(readFileSync("src/pages/about.astro", "utf8").includes("description={profileConfig.bio}"));
console.log(JSON.stringify({status:"PASS", displayName:siteConfig.title, navbar:siteConfig.navbar.title, author:profileConfig.name, bio, publicLinks:profileConfig.links, mainTopics:["AI","大气科学","生活随笔"], categories:"Actual public categories remain article-derived; no draft reclassification", unchanged:{siteUrl:siteConfig.site_url, avatar:profileConfig.avatar, logo:siteConfig.navbar.logo, pageToggles:siteConfig.pages, sourceHashes:preserved}, boundary:"Direct config/source assertions; rendered output checked separately"},null,2));
