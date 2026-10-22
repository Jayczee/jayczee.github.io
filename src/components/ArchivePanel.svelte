<script lang="ts">
import { onMount } from "svelte";
import I18nKey from "../i18n/i18nKey";
import { i18n } from "../i18n/translation";
import { getPostUrlBySlug, url } from "../utils/url-utils";
import type { PostForList as Post } from "../utils/content-utils";

let {
	tags = [],
	categories = [],
	sortedPosts = [],
}: {
	tags?: string[];
	categories?: string[];
	sortedPosts?: Post[];
} = $props();

let activeTags = $state<string[]>(tags);
let activeCategories = $state<string[]>(categories);
let isUncategorized = $state(false);

interface Group {
	year: number;
	posts: Post[];
}

let groups = $state<Group[]>([]);
let totalFilteredCount = $state(0);

function formatDate(date: Date) {
	const month = (date.getMonth() + 1).toString().padStart(2, "0");
	const day = date.getDate().toString().padStart(2, "0");
	return `${month}-${day}`;
}

function clearFilter() {
	activeTags = [];
	activeCategories = [];
	isUncategorized = false;
	window.history.replaceState({}, "", window.location.pathname);
	applyFilter();
}

function applyFilter() {
	let filteredPosts: Post[] = sortedPosts;

	if (activeTags.length > 0) {
		filteredPosts = filteredPosts.filter(
			(post) =>
				Array.isArray(post.data.tags) &&
				post.data.tags.some((tag) => activeTags.includes(tag)),
		);
	}

	if (activeCategories.length > 0) {
		filteredPosts = filteredPosts.filter(
			(post) => post.data.category && activeCategories.includes(post.data.category),
		);
	}

	if (isUncategorized) {
		filteredPosts = filteredPosts.filter((post) => !post.data.category);
	}

	totalFilteredCount = filteredPosts.length;

	const grouped = filteredPosts.reduce(
		(acc, post) => {
			const year = new Date(post.data.published).getFullYear();
			if (!acc[year]) {
				acc[year] = [];
			}
			acc[year].push(post);
			return acc;
		},
		{} as Record<number, Post[]>,
	);

	const groupedPostsArray = Object.keys(grouped).map((yearStr) => ({
		year: Number.parseInt(yearStr, 10),
		posts: grouped[Number.parseInt(yearStr, 10)],
	}));

	groupedPostsArray.sort((a, b) => b.year - a.year);
	groups = groupedPostsArray;
}

onMount(() => {
	const params = new URLSearchParams(window.location.search);
	if (params.has("tag")) {
		activeTags = params.getAll("tag");
	}
	if (params.has("category")) {
		activeCategories = params.getAll("category");
	}
	if (params.get("uncategorized")) {
		isUncategorized = true;
	}

	applyFilter();
});
</script>

<div class="card-base p-5 md:p-8 relative overflow-hidden font-sans">
    <!-- Top Cassette Vault HUD Header -->
    <div class="mb-8 p-4 rounded-2xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/10 dark:border-white/10 font-mono">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 select-none">
            <div class="flex items-center gap-2.5">
                <span class="w-2.5 h-2.5 rounded-full bg-[var(--primary)] shadow-[0_0_8px_var(--primary)] animate-pulse"></span>
                <span class="font-extrabold text-[var(--primary)] tracking-wider text-sm">
                    TAPE_VAULT // 磁带档案库
                </span>
                <span class="text-xs px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/10 text-black/60 dark:text-white/60 font-mono">
                    INDEX_SYS
                </span>
            </div>

            <!-- Stats & Filter Chip -->
            <div class="flex items-center gap-2 text-xs flex-wrap">
                {#if activeTags.length > 0 || activeCategories.length > 0 || isUncategorized}
                    <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--primary)]/15 border border-[var(--primary)]/30 text-[var(--primary)] font-bold">
                        <span>FILTER:</span>
                        {#if activeTags.length > 0}
                            <span>#{activeTags.join(", #")}</span>
                        {/if}
                        {#if activeCategories.length > 0}
                            <span>[{activeCategories.join(", ")}]</span>
                        {/if}
                        {#if isUncategorized}
                            <span>[未分类]</span>
                        {/if}
                        <button
                            onclick={clearFilter}
                            class="ml-1 hover:opacity-75 cursor-pointer underline text-[10px]"
                            title="清除筛选"
                        >
                            [✕ RESET]
                        </button>
                    </div>
                {/if}
                <div class="px-2.5 py-1 rounded-lg bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-black/70 dark:text-white/70">
                    LOADED: <strong class="text-[var(--primary)]">{totalFilteredCount}</strong> TAPES
                </div>
            </div>
        </div>
    </div>

    <!-- Empty State -->
    {#if groups.length === 0}
        <div class="py-16 text-center font-mono text-black/40 dark:text-white/40 select-none">
            <div class="text-4xl mb-3">📼</div>
            <div class="text-base font-bold tracking-wider mb-2">NO TAPES IN VAULT // 档案架空空如也</div>
            <p class="text-xs mb-4">没有找到符合当前筛选条件的磁带记录。</p>
            <button
                onclick={clearFilter}
                class="px-4 py-1.5 rounded-xl bg-[var(--primary)] text-white dark:text-black font-bold text-xs shadow-md hover:scale-105 active:scale-95 transition cursor-pointer"
            >
                RESET FILTER // 重置筛选
            </button>
        </div>
    {/if}

    <!-- Yearly Drawers -->
    <div class="space-y-10">
        {#each groups as group, groupIndex}
            <div class="relative">
                <!-- Drawer Machine Section Header -->
                <div class="flex items-center justify-between mb-4 pb-2 border-b-2 border-black/10 dark:border-white/10 font-mono select-none">
                    <div class="flex items-center gap-3">
                        <span class="text-xs font-bold px-2 py-0.5 rounded bg-[var(--primary)] text-white dark:text-black tracking-widest">
                            DRAWER
                        </span>
                        <h2 class="text-2xl font-black tracking-tight text-black/90 dark:text-white/90">
                            {group.year}
                        </h2>
                        <span class="text-xs text-black/40 dark:text-white/40 hidden sm:inline">
                            // VOL.{String(groups.length - groupIndex).padStart(2, '0')}
                        </span>
                    </div>

                    <div class="flex items-center gap-2 text-xs font-mono text-black/50 dark:text-white/50">
                        <span class="inline-block w-1.5 h-1.5 rounded-full bg-[var(--primary)]"></span>
                        <span>{group.posts.length} {i18n(group.posts.length === 1 ? I18nKey.postCount : I18nKey.postsCount)}</span>
                    </div>
                </div>

                <!-- Tape Spine Cards in this Drawer -->
                <div class="grid grid-cols-1 gap-2.5">
                    {#each group.posts as post, index}
                        <a
                            href={getPostUrlBySlug(post.slug)}
                            aria-label={post.data.title}
                            class="group relative flex items-center justify-between p-3 sm:px-4 sm:py-3 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.015] dark:bg-white/[0.02] hover:bg-white dark:hover:bg-white/[0.06] hover:border-[var(--primary)]/60 hover:shadow-[0_4px_16px_rgba(var(--primary-rgb),0.12)] hover:-translate-y-0.5 hover:translate-x-1 transition-all duration-200 cursor-pointer overflow-hidden"
                        >
                            <!-- Left Accent Color Indicator (VHS Tape Spine Color Bar) -->
                            <div class="absolute left-0 top-0 bottom-0 w-1 bg-black/10 dark:bg-white/10 group-hover:bg-[var(--primary)] transition-colors duration-200"></div>

                            <!-- Left: Date & Index & Category -->
                            <div class="flex items-center gap-3 min-w-0 pr-2">
                                <!-- Date Pill -->
                                <span class="shrink-0 font-mono text-xs px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-black/60 dark:text-white/60 group-hover:text-[var(--primary)] group-hover:border-[var(--primary)]/30 transition-colors">
                                    {formatDate(new Date(post.data.published))}
                                </span>

                                <!-- Tape Title -->
                                <span class="font-bold text-sm sm:text-base text-black/85 dark:text-white/85 group-hover:text-[var(--primary)] transition-colors truncate">
                                    {post.data.title}
                                </span>

                                <!-- Category Badge (Washi Tape Sticker) -->
                                {#if post.data.category}
                                    <span class="hidden md:inline-flex shrink-0 items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-black/60 dark:text-white/60 group-hover:border-[var(--primary)]/30 group-hover:text-[var(--primary)]">
                                        [{post.data.category}]
                                    </span>
                                {/if}
                            </div>

                            <!-- Right: Tags & Action Play Icon -->
                            <div class="flex items-center gap-3 shrink-0">
                                <!-- Tag List (Desktop) -->
                                {#if post.data.tags && post.data.tags.length > 0}
                                    <div class="hidden lg:flex items-center gap-1.5 text-xs font-mono text-black/40 dark:text-white/40">
                                        {#each post.data.tags.slice(0, 2) as t}
                                            <span class="hover:text-[var(--primary)] transition-colors">#{t}</span>
                                        {/each}
                                        {#if post.data.tags.length > 2}
                                            <span class="opacity-50">+{post.data.tags.length - 2}</span>
                                        {/if}
                                    </div>
                                {/if}

                                <!-- Play Reel Icon / Arrow -->
                                <div class="w-7 h-7 rounded-lg bg-black/5 dark:bg-white/5 group-hover:bg-[var(--primary)] group-hover:text-white dark:group-hover:text-black flex items-center justify-center text-xs font-mono text-black/50 dark:text-white/50 transition-all duration-200 shadow-sm">
                                    <span class="group-hover:translate-x-0.5 transition-transform">▷</span>
                                </div>
                            </div>
                        </a>
                    {/each}
                </div>
            </div>
        {/each}
    </div>
</div>
