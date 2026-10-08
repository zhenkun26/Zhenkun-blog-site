/** Native tests transform the actual TypeScript catalogs, including their enum. */

import { existsSync, readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import { fileURLToPath } from "node:url";
import { transformSync } from "esbuild";
export const hooks = registerHooks({
	resolve(specifier, context, next) {
		if (
			specifier === "../config" &&
			context.parentURL?.endsWith("/i18n/translation.ts")
		)
			return {
				url: "data:text/javascript,export const siteConfig={lang:'zh_CN'}",
				shortCircuit: true,
			};
		if (specifier.startsWith(".")) {
			const url = new URL(specifier, context.parentURL);
			if (url.protocol === "file:" && existsSync(fileURLToPath(url) + ".ts"))
				return next(specifier + ".ts", context);
		}
		return next(specifier, context);
	},
	load(url, context, next) {
		if (url.startsWith("file:") && url.endsWith(".ts"))
			return {
				format: "module",
				source: transformSync(readFileSync(new URL(url), "utf8"), {
					loader: "ts",
					format: "esm",
				}).code,
				shortCircuit: true,
			};
		return next(url, context);
	},
});
