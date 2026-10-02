import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { siteConfig } from "../../src/config/siteConfig.ts";
import { commentConfig } from "../../src/config/commentConfig.ts";
import { dynamicConfig } from "../../src/config/dynamicConfig.ts";
import { musicPlayerConfig } from "../../src/config/musicConfig.ts";
import { analyticsConfig } from "../../src/config/analyticsConfig.ts";
import { spineModelConfig, live2dWidgetConfig } from "../../src/config/pioConfig.ts";
import { displaySettingsConfig } from "../../src/config/displaySettingsConfig.ts";
import { sidebarLayoutConfig } from "../../src/config/sidebarConfig.ts";
import { plantumlConfig } from "../../src/config/plantumlConfig.ts";
import { sakuraConfig } from "../../src/config/effectsConfig.ts";
import { resolveNavMenuLinks } from "../../src/utils/nav-menu-utils.ts";

const baseline = "d8eb0cb3ca6eb2c2fa0b703a47721d2a9f6146f1";
const sha = (data) => createHash("sha256").update(data).digest("hex");
const configHashes = {};
for (const name of readdirSync("src/config")) {
	const path = `src/config/${name}`;
	const bytes = readFileSync(path);
	assert.ok(bytes.equals(execFileSync("git", ["show", `${baseline}:${path}`])), path);
	configHashes[path] = sha(bytes);
}
assert.ok(Object.values(siteConfig.pages).every((enabled) => enabled === false));
assert.equal(commentConfig.type, "giscus");
const links = resolveNavMenuLinks();
function flatten(items) {
	return items.flatMap((link) => link.children ? flatten(link.children) : [link]);
}
const visibleLinks = flatten(links).map(({ name, url, pageKey }) => ({ name, url, pageKey }));
assert.ok(visibleLinks.every((link) => !link.pageKey));
const musicAssets = musicPlayerConfig.local.playlist.flatMap((song) => [song.url, song.cover]).filter(Boolean);
for (const asset of musicAssets) {
	assert.ok(!/^https?:/.test(asset), "Current music playlist is local");
	assert.ok(readFileSync(`public${asset}`).length > 0);
}
const inventory = {
	status: "PASS_CURRENT_CONFIGURATION",
	baseline,
	source: "a353c2ee800bbff2865541288ea04308c245cdc5",
	pageToggles: siteConfig.pages,
	publicPageEnvOverrides: Object.keys(siteConfig.pages).map((key) => `PUBLIC_PAGES_${key.toUpperCase()}`).filter((key) => process.env[key] !== undefined),
	displaySettingsEnvOverridePresent: process.env.PUBLIC_DISPLAY_SETTINGS !== undefined,
	visibleNavigation: visibleLinks,
	comment: { selected: commentConfig.type, policy: "Already enabled by ADR-XB-005; real approved article interaction untested; settings unchanged" },
	dynamic: { page: siteConfig.pages.dynamic, memosEnabled: dynamicConfig.memos.enable, showComment: dynamicConfig.showComment, data: dynamicConfig.apiUrl },
	music: { navbar: musicPlayerConfig.showInNavbar, sidebar: musicPlayerConfig.showInSidebar, mode: musicPlayerConfig.mode, lyrics: musicPlayerConfig.showLyrics, localAssetsPresent: musicAssets },
	analytics: {
		googleConfigured: Boolean(analyticsConfig.googleAnalyticsId),
		clarityConfigured: Boolean(analyticsConfig.microsoftClarityId),
		umamiConfigured: Boolean(analyticsConfig.umamiAnalytics.websiteId),
		la51Configured: Boolean(analyticsConfig.la51Analytics.Id),
	},
	decorative: { spine: spineModelConfig.enable, live2d: live2dWidgetConfig.enable, sakura: sakuraConfig.enable },
	displaySettings: displaySettingsConfig,
	sidebar: { enabled: sidebarLayoutConfig.enable, announcementConfigured: sidebarLayoutConfig.leftComponents.some((item) => item.type === "announcement" && item.enable) },
	plantuml: { enabled: plantumlConfig.enable, publicArticleDiagramRuntime: "No public article, no current diagram request observed/claimed" },
	configHashes,
	boundary: "Only resolved policy, public local asset paths and hashes are recorded. No credential values, service activation, external fetch or account operation."
};
writeFileSync("references/p4-capabilities-2026-10-02/config-inventory.json", JSON.stringify(inventory, null, 2) + "\n");
console.log(JSON.stringify({ status: inventory.status, disabledPages: Object.keys(siteConfig.pages).length, visibleNavigation: visibleLinks.length, configsPreserved: Object.keys(configHashes).length, comment: commentConfig.type }));
