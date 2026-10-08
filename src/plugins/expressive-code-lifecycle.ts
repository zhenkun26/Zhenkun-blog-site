import { pluginCollapsible } from "expressive-code-collapsible";

const originalObserver = `        // Debounced MutationObserver to avoid excessive calls
        const debouncedInit = debounce(initCollapseButtons, 100);
        new MutationObserver(debouncedInit).observe(document.body, { childList: true, subtree: true });`;
const relevantObserver = `        // Text animations elsewhere must not postpone binding newly inserted controls.
        new MutationObserver((mutations) => {
          const selector = '.ec-collapse, .ec-collapse__toggle, .ec-collapse__header-toggle';
          if (mutations.some(mutation => Array.from(mutation.addedNodes).some(node =>
            node.nodeType === 1 && (node.matches(selector) || node.querySelector(selector))
          ))) initCollapseButtons();
        }).observe(document.body, { childList: true, subtree: true });`;

/** Preserve the installed plugin's renderer/CSS/toggle ownership; narrow its observer. */
export function pluginCollapsibleWithLifecycle(
	options: Parameters<typeof pluginCollapsible>[0],
): ReturnType<typeof pluginCollapsible> {
	const plugin = pluginCollapsible(options);
	if (
		!Array.isArray(plugin.jsModules) ||
		plugin.jsModules.length !== 1 ||
		typeof plugin.jsModules[0] !== "string" ||
		plugin.jsModules[0].split(originalObserver).length !== 2
	) {
		throw new Error(
			"Collapsible observer contract changed; review lifecycle adapter",
		);
	}
	return {
		...plugin,
		jsModules: [
			plugin.jsModules[0].replace(originalObserver, relevantObserver),
		],
	};
}
