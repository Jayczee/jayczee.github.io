<script lang="ts">
import { AUTO_MODE, DARK_MODE, LIGHT_MODE } from "@constants/constants.ts";
import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";
import Icon from "@iconify/svelte";
import {
	applyThemeToDocument,
	getStoredTheme,
	setTheme,
} from "@utils/setting-utils.ts";
import { onMount } from "svelte";
import type { LIGHT_DARK_MODE } from "@/types/config.ts";

let { class: className = "" }: { class?: string } = $props();

const seq: LIGHT_DARK_MODE[] = [LIGHT_MODE, DARK_MODE, AUTO_MODE];
let mode: LIGHT_DARK_MODE = $state(AUTO_MODE);

onMount(() => {
	mode = getStoredTheme();
	const darkModePreference = window.matchMedia("(prefers-color-scheme: dark)");
	const changeThemeWhenSchemeChanged: Parameters<
		typeof darkModePreference.addEventListener<"change">
	>[1] = (_e) => {
		applyThemeToDocument(mode);
	};
	darkModePreference.addEventListener("change", changeThemeWhenSchemeChanged);
	return () => {
		darkModePreference.removeEventListener(
			"change",
			changeThemeWhenSchemeChanged,
		);
	};
});

function switchScheme(newMode: LIGHT_DARK_MODE) {
	mode = newMode;
	setTheme(newMode);
}

function toggleScheme() {
	let i = 0;
	for (; i < seq.length; i++) {
		if (seq[i] === mode) {
			break;
		}
	}
	switchScheme(seq[(i + 1) % seq.length]);
}

function showPanel() {
	const panel = document.querySelector("#light-dark-panel");
	panel?.classList.remove("float-panel-closed");
}

function hidePanel() {
	const panel = document.querySelector("#light-dark-panel");
	panel?.classList.add("float-panel-closed");
}
</script>

<!-- z-50 makes the panel higher than other float panels -->
<div class={`relative z-50 ${className}`} role="menu" tabindex="-1" onmouseleave={hidePanel}>
    <!-- Navbar Trigger Button with Active State Dot -->
    <button
        aria-label="Light/Dark Mode"
        role="menuitem"
        class="relative btn-plain scale-animation rounded-xl h-11 w-11 active:scale-90 border border-black/10 dark:border-white/10 hover:border-[var(--primary)]/50 transition-all flex items-center justify-center cursor-pointer"
        id="scheme-switch"
        onclick={toggleScheme}
        onmouseenter={showPanel}
    >
        <!-- Icons -->
        <div class="transition-transform duration-200" class:opacity-0={mode !== LIGHT_MODE} class:scale-75={mode !== LIGHT_MODE} class:absolute={mode !== LIGHT_MODE}>
            <Icon icon="material-symbols:wb-sunny-rounded" class="text-[1.25rem] text-amber-500"></Icon>
        </div>
        <div class="transition-transform duration-200" class:opacity-0={mode !== DARK_MODE} class:scale-75={mode !== DARK_MODE} class:absolute={mode !== DARK_MODE}>
            <Icon icon="material-symbols:dark-mode-rounded" class="text-[1.25rem] text-[var(--primary)]"></Icon>
        </div>
        <div class="transition-transform duration-200" class:opacity-0={mode !== AUTO_MODE} class:scale-75={mode !== AUTO_MODE} class:absolute={mode !== AUTO_MODE}>
            <Icon icon="material-symbols:hdr-auto-outline-rounded" class="text-[1.25rem] text-blue-400"></Icon>
        </div>

        <!-- Micro Status LED in corner -->
        <span
            class={`absolute bottom-1.5 right-1.5 w-1.5 h-1.5 rounded-full transition-all duration-300 shadow-sm ${mode === LIGHT_MODE ? 'bg-amber-400 shadow-[0_0_6px_#f59e0b]' : mode === DARK_MODE ? 'bg-[var(--primary)] shadow-[0_0_6px_var(--primary)]' : 'bg-blue-400 shadow-[0_0_6px_#60a5fa]'}`}
        ></span>
    </button>

    <!-- Retro Phosphor Lumen Control Dropdown -->
    <div id="light-dark-panel" class="hidden lg:block absolute transition-all float-panel-closed top-11 -right-2 pt-3">
        <div class="card-base float-panel p-2.5 w-52 rounded-2xl bg-[var(--card-bg)] border border-black/10 dark:border-white/10 shadow-2xl font-mono">
            <!-- HUD Header -->
            <div class="flex items-center justify-between px-2 py-1.5 mb-2 border-b border-black/10 dark:border-white/10 text-[10px] select-none">
                <span class="font-bold text-[var(--primary)] flex items-center gap-1.5 tracking-wider">
                    <span class="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-pulse"></span>
                    PHOSPHOR // LUMEN
                </span>
                <span class="text-[9px] text-black/40 dark:text-white/40">MODE</span>
            </div>

            <!-- Mode Buttons -->
            <div class="space-y-1">
                <!-- Dark Mode -->
                <button
                    type="button"
                    class={`flex transition-all items-center justify-between w-full rounded-xl px-2.5 py-2 text-xs font-mono group active:scale-95 border cursor-pointer ${mode === DARK_MODE ? 'bg-[var(--primary)]/15 border-[var(--primary)]/50 text-[var(--primary)] shadow-[0_0_12px_rgba(var(--primary-rgb),0.15)] font-bold' : 'border-transparent text-black/70 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5'}`}
                    onclick={() => switchScheme(DARK_MODE)}
                >
                    <div class="flex items-center gap-2">
                        <Icon icon="material-symbols:dark-mode-rounded" class="text-base text-[var(--primary)] group-hover:scale-110 transition-transform"></Icon>
                        <span>NIGHT // 赛博暗夜</span>
                    </div>
                    {#if mode === DARK_MODE}
                        <span class="w-2 h-2 rounded-full bg-[var(--primary)] shadow-[0_0_6px_var(--primary)] animate-pulse"></span>
                    {/if}
                </button>

                <!-- Light Mode -->
                <button
                    type="button"
                    class={`flex transition-all items-center justify-between w-full rounded-xl px-2.5 py-2 text-xs font-mono group active:scale-95 border cursor-pointer ${mode === LIGHT_MODE ? 'bg-amber-400/15 border-amber-400/50 text-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.2)] font-bold' : 'border-transparent text-black/70 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5'}`}
                    onclick={() => switchScheme(LIGHT_MODE)}
                >
                    <div class="flex items-center gap-2">
                        <Icon icon="material-symbols:wb-sunny-rounded" class="text-base text-amber-500 group-hover:scale-110 transition-transform"></Icon>
                        <span>DAY // 街头白日</span>
                    </div>
                    {#if mode === LIGHT_MODE}
                        <span class="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_#f59e0b] animate-pulse"></span>
                    {/if}
                </button>

                <!-- Auto Mode -->
                <button
                    type="button"
                    class={`flex transition-all items-center justify-between w-full rounded-xl px-2.5 py-2 text-xs font-mono group active:scale-95 border cursor-pointer ${mode === AUTO_MODE ? 'bg-blue-400/15 border-blue-400/50 text-blue-500 shadow-[0_0_12px_rgba(96,165,250,0.2)] font-bold' : 'border-transparent text-black/70 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5'}`}
                    onclick={() => switchScheme(AUTO_MODE)}
                >
                    <div class="flex items-center gap-2">
                        <Icon icon="material-symbols:hdr-auto-outline-rounded" class="text-base text-blue-400 group-hover:scale-110 transition-transform"></Icon>
                        <span>AUTO // 矩阵自适</span>
                    </div>
                    {#if mode === AUTO_MODE}
                        <span class="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_6px_#60a5fa] animate-pulse"></span>
                    {/if}
                </button>
            </div>
        </div>
    </div>
</div>
