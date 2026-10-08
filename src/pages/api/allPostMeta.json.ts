import type { APIContext } from "astro";
import { getSortedPosts } from "@/utils/content-utils";
import { getPageLocale } from "@/utils/deployment-contract";
import { getPostUrlBySlug } from "@/utils/url-utils";
export async function GET(context: APIContext): Promise<Response> {
	const locale = getPageLocale(context.url.pathname, import.meta.env.BASE_URL);
	const posts = await getSortedPosts(locale);

	const allPostsData = posts
		.map((post) => ({
			id: post.id,
			lang: locale,
			url: getPostUrlBySlug(post.id, locale),
			title: post.data.title,
			description: post.data.description,
			published: post.data.published.getTime(),
			category: post.data.category || "",
			password: !!post.data.password,
		}))
		// 日历按纯日期排序，忽略置顶
		.sort((a, b) => b.published - a.published);

	return new Response(JSON.stringify(allPostsData));
}
