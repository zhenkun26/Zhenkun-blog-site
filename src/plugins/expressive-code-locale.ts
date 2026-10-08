import { pluginCollapsibleSectionsTexts } from "@expressive-code/plugin-collapsible-sections";
import type {
	ExpressiveCodePlugin,
	RehypeExpressiveCodeOptions,
} from "astro-expressive-code";
import { pluginFramesTexts } from "astro-expressive-code";
import { getClassNames, visit } from "astro-expressive-code/hast";
import I18nKey from "../i18n/i18nKey";
import { createTranslator } from "../i18n/translation";
import { htmlLocale, normalizeContentLocale } from "../utils/locale-contract";

/** Static catalogs are registered before creating any renderer, never per document. */
export function registerCodeLocaleTexts(): void {
	for (const locale of ["zh_CN", "en"] as const) {
		const t = createTranslator(locale);
		pluginFramesTexts.addLocale(htmlLocale(locale), {
			terminalWindowFallbackTitle: t(I18nKey.uiCodeTerminal),
			copyButtonTooltip: t(I18nKey.uiCodeCopy),
			copyButtonCopied: t(I18nKey.uiCodeCopied),
		});
		pluginCollapsibleSectionsTexts.addLocale(htmlLocale(locale), {
			collapsedLines: t(I18nKey.uiCodeCollapsedLines),
		});
	}
}
export const getCodeBlockLocale: NonNullable<
	RehypeExpressiveCodeOptions["getBlockLocale"]
> = ({ file }) => {
	const astro = file.data?.astro;
	if (
		!astro ||
		typeof astro !== "object" ||
		!("frontmatter" in astro) ||
		!astro.frontmatter ||
		typeof astro.frontmatter !== "object" ||
		Array.isArray(astro.frontmatter)
	) {
		throw new Error(
			"Document frontmatter context missing; Code components must pass locale explicitly",
		);
	}
	return htmlLocale(
		normalizeContentLocale((astro.frontmatter as Record<string, unknown>).lang),
	);
};
/** Original collapse behavior remains owned by its plugin; only output text is adapted. */
export function pluginCodeLocale(): ExpressiveCodePlugin {
	return {
		name: "Zhenkun code locale",
		hooks: {
			postprocessRenderedBlock(context) {
				const t = createTranslator(normalizeContentLocale(context.locale));
				visit(context.renderData.blockAst, "element", (node) => {
					const classes = getClassNames(node);
					if (classes.includes("ec-collapse__text-expand"))
						node.children = [
							{ type: "text", value: t(I18nKey.codeCollapsibleShowMore) },
						];
					if (classes.includes("ec-collapse__text-collapse"))
						node.children = [
							{ type: "text", value: t(I18nKey.codeCollapsibleShowLess) },
						];
					if (classes.includes("ec-collapse")) {
						node.properties.dataExpandedAnnouncement = t(
							I18nKey.codeCollapsibleExpanded,
						);
						node.properties.dataCollapsedAnnouncement = t(
							I18nKey.codeCollapsibleCollapsed,
						);
					}
				});
			},
		},
	};
}
