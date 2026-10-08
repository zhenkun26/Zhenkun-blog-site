import type { APIRoute } from "astro";
import { url } from "@/utils/url-utils";

export const prerender = true;
const siteRoot = new URL(import.meta.env.BASE_URL, import.meta.env.SITE);

const robotsTxt = `
User-agent: *
Disallow: ${url("/_astro/")}
Disallow: ${url("/archive/?tag=")}
Disallow: ${url("/archive/?category=")}
Disallow: ${url("/archive/?uncategorized=")}
Disallow: ${url("/en/archive/?tag=")}
Disallow: ${url("/en/archive/?category=")}
Disallow: ${url("/en/archive/?uncategorized=")}

Sitemap: ${new URL("sitemap-index.xml", siteRoot).href}
`.trim();

export const GET: APIRoute = () => {
	return new Response(robotsTxt, {
		headers: {
			"Content-Type": "text/plain; charset=utf-8",
		},
	});
};
