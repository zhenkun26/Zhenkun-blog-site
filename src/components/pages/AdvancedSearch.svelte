<script lang="ts">
import I18nKey from "@i18n/i18nKey";
import { onMount } from "svelte";
import Icon from "@/components/common/Icon.svelte";
import type { SearchResult } from "@/global";
import { createTranslator, getTranslation } from "@/i18n/translation";
import type { UiLocale } from "@/utils/locale-contract";
import { createSearchSession } from "@/utils/search-session";
export let locale: UiLocale = "zh_CN";
export let title = "";
export let description = "";
const i18n = (key: I18nKey) => createTranslator(locale)(key);
let keyword = "";
let results: SearchResult[] = [];
let isSearching = false;
let hasError = false;
let session: ReturnType<typeof createSearchSession<SearchResult>> | undefined;
const handleInput = () => session?.setQuery(keyword);
onMount(() => {
	session = createSearchSession<SearchResult>({
		search: async (query) => {
			await window.__loadPagefind?.();
			if (!window.pagefind) throw new Error("Pagefind is unavailable");
			const response = await window.pagefind.search(query);
			return Promise.all(response.results.map((item) => item.data()));
		},
		publish: (state) => {
			results = state.results;
			isSearching = state.status === "loading";
			hasError = state.status === "error";
		},
	});
	const readQuery = () => {
		keyword = new URLSearchParams(location.search).get("q") ?? "";
		session?.setQuery(keyword);
	};
	const cancel = () => session?.cancel();
	readQuery();
	window.addEventListener("popstate", readQuery);
	document.addEventListener("swup:visit:start", cancel);
	return () => {
		session?.dispose();
		window.removeEventListener("popstate", readQuery);
		document.removeEventListener("swup:visit:start", cancel);
	};
});
</script>

<div class="card-base px-6 py-6 md:px-9 md:py-6 mb-4 rounded-(--radius-large)">
    <!-- Title Section -->
    <div class="mb-4">
        <div class="flex items-center gap-3 mb-3">
            <div class="h-8 w-8 rounded-lg bg-(--primary) flex items-center justify-center text-white dark:text-black/70">
                <Icon icon="material-symbols:search" class="text-[1.5rem]"></Icon>
            </div>
            <div class="text-3xl font-bold text-90">
                {title}
            </div>
        </div>
        {#if description}
            <p class="text-base text-50 leading-relaxed">
                {description}
            </p>
        {/if}
    </div>

    <!-- Search Bar -->
    <div class="relative flex">
        <div class="relative flex-1">
            <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Icon icon="material-symbols:search" class="text-2xl text-50" />
            </div>
            <input
                type="text"
                class="block w-full p-4 pl-10 text-sm bg-transparent border border-black/10 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-(--primary) focus:border-(--primary) hover:border-black/20 dark:hover:border-white/20 text-75 placeholder:opacity-50 transition-colors outline-hidden"
                aria-label={i18n(I18nKey.search)} placeholder={i18n(I18nKey.search)}
                bind:value={keyword}
                on:input={handleInput}
            >
        </div>
    </div>
</div>

<div class="grid grid-cols-1 gap-4">
    <!-- Results Area -->
    <div>
        {#if isSearching}
            <div class="flex justify-center py-10">
                <Icon icon="svg-spinners:ring-resize" class="text-4xl text-(--primary)" />
            </div>
        {:else if hasError}
<div role="alert" class="card-base p-10 text-center">{getTranslation(locale).uiSearchError}</div>
{:else if results.length > 0}
            <div class="space-y-4">
                {#each results as result}
                    <div class="card-base p-6 block rounded-(--radius-large)">
                        <a href={result.url} class="block group">
                            <h5 class="mb-2 text-2xl font-bold tracking-tight text-90 group-hover:text-(--primary) transition-colors">
                                {@html result.meta.title}
                            </h5>
                            <p class="font-normal text-75">
                                {@html result.excerpt}
                            </p>
                        </a>
                    </div>
                {/each}
            </div>
        {:else if keyword}
            <div class="card-base p-10 text-center text-50 rounded-(--radius-large)">
                {i18n(I18nKey.searchNoResults)}
            </div>
        {:else}
             <div class="card-base p-10 text-center text-50 rounded-(--radius-large)">
                {i18n(I18nKey.searchTypeSomething)}
            </div>
        {/if}
    </div>
</div>

<style>
    /* 关键字高亮效果 - 主题色 */
    :global(mark) {
        background: transparent;
        color: var(--primary);
        font-weight: 600;
        padding: 0 0.1em;
    }
</style>