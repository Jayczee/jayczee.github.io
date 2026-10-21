<script lang="ts">
import Icon from "@iconify/svelte";
import { onMount } from "svelte";

interface Day {
	date: string;
	count: number;
	level: 0 | 1 | 2 | 3 | 4;
}

interface Props {
	username?: string;
	class?: string;
}

let { username = "Jayczee", class: className = "" }: Props = $props();

let loading = $state(true);
let error = $state(false);
let total = $state(0);
let weeks: Day[][] = $state([]);
let monthLabels: { index: number; name: string }[] = $state([]);
let hoveredDay: Day | null = $state(null);
let scrollContainer: HTMLDivElement | null = $state(null);

const monthNames = [
	"1月",
	"2月",
	"3月",
	"4月",
	"5月",
	"6月",
	"7月",
	"8月",
	"9月",
	"10月",
	"11月",
	"12月",
];

function getLevelClass(level: number): string {
	switch (level) {
		case 1:
			return "commit-level-1";
		case 2:
			return "commit-level-2";
		case 3:
			return "commit-level-3";
		case 4:
			return "commit-level-4";
		default:
			return "commit-level-0";
	}
}

async function fetchContributions() {
	loading = true;
	error = false;
	try {
		const res = await fetch(
			`https://github-contributions-api.jogruber.de/v4/${username}?y=last`,
		);
		if (!res.ok) throw new Error("Failed to fetch contribution data");
		const data = await res.json();
		total = data.total?.lastYear ?? 0;

		const days: Day[] = data.contributions ?? [];
		const parsedWeeks: Day[][] = [];
		let currentWeek: Day[] = [];

		days.forEach((day: Day) => {
			currentWeek.push(day);
			if (currentWeek.length === 7) {
				parsedWeeks.push(currentWeek);
				currentWeek = [];
			}
		});
		if (currentWeek.length > 0) {
			parsedWeeks.push(currentWeek);
		}
		weeks = parsedWeeks;

		// Calculate month labels
		const labels: { index: number; name: string }[] = [];
		let lastMonth = -1;
		let lastIndex = -4;

		parsedWeeks.forEach((w, i) => {
			if (!w[0]) return;
			const m = new Date(w[0].date + "T00:00:00Z").getUTCMonth();
			if (m !== lastMonth && i - lastIndex >= 3) {
				labels.push({ index: i, name: monthNames[m] });
				lastMonth = m;
				lastIndex = i;
			}
		});
		monthLabels = labels;

		loading = false;

		// Scroll to right on mobile so latest commits are visible
		setTimeout(() => {
			if (scrollContainer) {
				scrollContainer.scrollLeft = scrollContainer.scrollWidth;
			}
		}, 80);
	} catch (e) {
		console.error("Error fetching GitHub contributions:", e);
		error = true;
		loading = false;
	}
}

onMount(() => {
	fetchContributions();
});
</script>

<div class="card-base p-5 md:p-6 onload-animation {className}">
	<!-- 顶部标题与统计 -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
		<div class="flex items-center gap-2.5">
			<Icon icon="fa6-brands:github" class="text-xl text-[var(--primary)]" />
			<div class="flex items-baseline gap-2">
				<h2 class="text-base md:text-lg font-bold text-90">Commit Activities</h2>
			</div>
		</div>

		<a
			href={`https://github.com/${username}`}
			target="_blank"
			rel="noreferrer"
			class="inline-flex items-center gap-1.5 text-xs text-50 hover:text-[var(--primary)] transition self-start sm:self-auto"
		>
			<span>@{username}</span>
			<Icon icon="fa6-solid:arrow-up-right-from-square" class="text-[0.7rem]" />
		</a>
	</div>

	<!-- 加载状态：骨架屏 -->
	{#if loading}
		<div class="overflow-x-auto pb-2 scrollbar-slim">
			<div class="flex flex-col gap-1 min-w-[700px] animate-pulse">
				<div class="h-3 w-48 bg-neutral-200/60 dark:bg-neutral-800/60 rounded mb-1"></div>
				<div class="flex gap-[3px]">
					{#each Array(53) as _}
						<div class="flex flex-col gap-[3px]">
							{#each Array(7) as _}
								<div class="w-[11px] h-[11px] sm:w-[12px] sm:h-[12px] rounded-[2px] bg-neutral-200/60 dark:bg-neutral-800/60"></div>
							{/each}
						</div>
					{/each}
				</div>
			</div>
		</div>
	{:else if error}
		<!-- 异常兜底展示 -->
		<div class="py-4 flex flex-col items-center justify-center text-center gap-3">
			<p class="text-75 text-sm">未能实时拉取动态数据，已加载静态提交图谱：</p>
			<div class="overflow-x-auto max-w-full p-2 bg-[var(--btn-regular-bg)] rounded-xl border border-[var(--line-divider)]">
				<img
					src={`https://ghchart.rshah.org/${username}`}
					alt={`${username}'s GitHub Chart`}
					class="max-w-none h-24 opacity-85"
					loading="lazy"
				/>
			</div>
			<button
				type="button"
				onclick={fetchContributions}
				class="btn-regular rounded-lg px-3 py-1 text-xs text-50 hover:text-[var(--primary)] transition"
			>
				重新加载
			</button>
		</div>
	{:else}
		<!-- 真实渲染：热力图日历 -->
		<div class="overflow-x-auto pb-1 scrollbar-slim" bind:this={scrollContainer}>
			<div class="flex gap-2 min-w-max">
				<!-- 星期指示标签 -->
				<div class="flex flex-col text-[9px] text-50 shrink-0 pt-4 gap-[3px]">
					<div class="h-[11px] sm:h-[12px] flex items-center justify-center"></div>
					<div class="h-[11px] sm:h-[12px] flex items-center justify-center">周一</div>
					<div class="h-[11px] sm:h-[12px] flex items-center justify-center"></div>
					<div class="h-[11px] sm:h-[12px] flex items-center justify-center">周三</div>
					<div class="h-[11px] sm:h-[12px] flex items-center justify-center"></div>
					<div class="h-[11px] sm:h-[12px] flex items-center justify-center">周五</div>
					<div class="h-[11px] sm:h-[12px] flex items-center justify-center"></div>
				</div>

				<!-- 网格主体：月份行 + 53 周方块 -->
				<div class="flex flex-col gap-1">
					<!-- 月份标题行 -->
					<div class="flex gap-[3px] h-3.5 relative">
						{#each weeks as _, i}
							{@const label = monthLabels.find((m) => m.index === i)}
							<div class="w-[11px] sm:w-[12px] relative shrink-0">
								{#if label}
									<span class="absolute left-0 top-0 text-[10px] text-50 leading-none whitespace-nowrap select-none">
										{label.name}
									</span>
								{/if}
							</div>
						{/each}
					</div>

					<!-- 方块矩阵 -->
					<div class="flex gap-[3px]" role="grid" aria-label="GitHub Contributions">
						{#each weeks as week}
							<div class="flex flex-col gap-[3px] shrink-0" role="row">
								{#each week as day}
									<div
										role="gridcell"
										tabindex="0"
										aria-label={`${day.date}: ${day.count} contributions`}
										class="w-[11px] h-[11px] sm:w-[12px] sm:h-[12px] rounded-[2px] transition-all duration-150 cursor-pointer {getLevelClass(day.level)} hover:ring-2 hover:ring-[var(--primary)] hover:scale-125 z-0 hover:z-10"
										onmouseenter={() => (hoveredDay = day)}
										onmouseleave={() => (hoveredDay = null)}
									></div>
								{/each}
							</div>
						{/each}
					</div>
				</div>
			</div>
		</div>

		<!-- 底部提示与图例 -->
		<div class="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-50 gap-2 mt-3 pt-2.5 border-t border-[var(--line-divider)]">
			<div class="flex items-center gap-1.5 h-5">
				{#if hoveredDay}
					<span class="text-90 font-medium text-[var(--primary)]">{hoveredDay.date}</span>
					<span>·</span>
					<span class="text-75">{hoveredDay.count > 0 ? `${hoveredDay.count} 次提交` : "无提交记录"}</span>
				{:else}
					<span class="text-50">悬停方格可查看当日具体 Commit 数量</span>
				{/if}
			</div>

			<div class="flex items-center gap-1.5 self-end sm:self-auto select-none">
				<span class="text-[11px] text-50">少</span>
				<div class="w-[10px] h-[10px] rounded-[2px] {getLevelClass(0)}"></div>
				<div class="w-[10px] h-[10px] rounded-[2px] {getLevelClass(1)}"></div>
				<div class="w-[10px] h-[10px] rounded-[2px] {getLevelClass(2)}"></div>
				<div class="w-[10px] h-[10px] rounded-[2px] {getLevelClass(3)}"></div>
				<div class="w-[10px] h-[10px] rounded-[2px] {getLevelClass(4)}"></div>
				<span class="text-[11px] text-50">多</span>
			</div>
		</div>
	{/if}
</div>

<style>
	/* 提交块色阶：完全契合当前页面主题色 (动态联动 --hue 与 --primary) */
	.commit-level-0 {
		background-color: var(--btn-regular-bg);
		border: 1px solid var(--line-divider);
	}
	:global(.dark) .commit-level-0 {
		background-color: oklch(0.20 0.015 var(--hue));
		border: 1px solid oklch(0.28 0.02 var(--hue));
	}

	.commit-level-1 {
		background-color: oklch(0.88 0.05 var(--hue));
	}
	:global(.dark) .commit-level-1 {
		background-color: oklch(0.32 0.05 var(--hue));
	}

	.commit-level-2 {
		background-color: oklch(0.78 0.09 var(--hue));
	}
	:global(.dark) .commit-level-2 {
		background-color: oklch(0.44 0.08 var(--hue));
	}

	.commit-level-3 {
		background-color: oklch(0.68 0.13 var(--hue));
	}
	:global(.dark) .commit-level-3 {
		background-color: oklch(0.58 0.11 var(--hue));
	}

	.commit-level-4 {
		background-color: var(--primary);
		box-shadow: 0 0 6px oklch(0.75 0.14 var(--hue) / 0.4);
	}

	/* 细滚动条 */
	.scrollbar-slim::-webkit-scrollbar {
		height: 4px;
	}
	.scrollbar-slim::-webkit-scrollbar-track {
		background: transparent;
	}
	.scrollbar-slim::-webkit-scrollbar-thumb {
		background: var(--line-divider);
		border-radius: 9999px;
	}
	.scrollbar-slim::-webkit-scrollbar-thumb:hover {
		background: var(--primary);
	}
</style>
