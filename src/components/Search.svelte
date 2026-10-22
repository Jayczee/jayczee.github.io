<script lang="ts">
import Icon from "@iconify/svelte";
import { url } from "@utils/url-utils.ts";
import { onDestroy, onMount, tick } from "svelte";
import type { SearchResult } from "@/global";

let { class: className = "" }: { class?: string } = $props();

let isOpen = $state(false);
let keyword = $state("");
let result: SearchResult[] = $state([]);
let isSearching = $state(false);
let pagefindLoaded = $state(false);
let initialized = $state(false);
let inputElement: HTMLInputElement | null = $state(null);
let searchDebounceTimer: any = null;

const fakeResult: SearchResult[] = [
	{
		url: url("/posts/skyworth-tv-debloat/"),
		meta: {
			title: "给创维电视去广告：不 root，只用 ADB",
		},
		excerpt: "在开发环境下模拟检索结果：通过 ADB 停用系统预装开机与桌面<mark>广告</mark>组件。",
	},
	{
		url: url("/posts/wechat-decrypt/"),
		meta: {
			title: "微信数据库是怎么解密的？聊聊 wechat-decrypt 的实现原理",
		},
		excerpt: "从进程内存中的候选密钥，到 SQLCipher 页解密、HMAC 验证与 WAL <mark>处理</mark>。",
	},
	{
		url: url("/blog/"),
		meta: {
			title: "生产环境将激活实时 Pagefind 索引",
		},
		excerpt: "运行 <mark>pnpm build && pnpm preview</mark> 可体验完整的离线分词高速检索。",
	},
];

const openModal = async () => {
	isOpen = true;
	await tick();
	inputElement?.focus();
	inputElement?.select();
};

const closeModal = () => {
	isOpen = false;
};

const handleKeydown = (e: KeyboardEvent) => {
	// Global toggle shortcut: ⌘K or Ctrl+K
	if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
		e.preventDefault();
		if (isOpen) {
			closeModal();
		} else {
			openModal();
		}
		return;
	}

	// Press / to search when not typing in an input
	if (
		e.key === "/" &&
		!isOpen &&
		document.activeElement?.tagName !== "INPUT" &&
		document.activeElement?.tagName !== "TEXTAREA"
	) {
		e.preventDefault();
		openModal();
		return;
	}

	if (!isOpen) return;

	if (e.key === "Escape") {
		e.preventDefault();
		closeModal();
	}
};

const portal = (node: HTMLElement) => {
	document.body.appendChild(node);
	return {
		destroy() {
			if (node.parentNode) {
				node.parentNode.removeChild(node);
			}
		},
	};
};

const navigateTo = (destUrl: string) => {
	closeModal();
	window.location.href = destUrl;
};

const performSearch = async (kw: string): Promise<void> => {
	const trimmed = kw.trim();
	if (!trimmed) {
		result = [];
		return;
	}

	if (!initialized) return;

	isSearching = true;

	try {
		let searchResults: SearchResult[] = [];

		if (import.meta.env.PROD && pagefindLoaded && window.pagefind) {
			const response = await window.pagefind.search(trimmed);
			searchResults = await Promise.all(
				response.results.slice(0, 15).map((item) => item.data()),
			);
		} else if (import.meta.env.DEV) {
			searchResults = fakeResult.filter(
				(item) =>
					item.meta.title.toLowerCase().includes(trimmed.toLowerCase()) ||
					item.excerpt.toLowerCase().includes(trimmed.toLowerCase()),
			);
			if (searchResults.length === 0) {
				searchResults = fakeResult;
			}
		} else {
			searchResults = [];
		}

		result = searchResults;
	} catch (error) {
		console.error("Terminal search error:", error);
		result = [];
	} finally {
		isSearching = false;
	}
};

const onInput = () => {
	if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
	searchDebounceTimer = setTimeout(() => {
		performSearch(keyword);
	}, 120);
};

onMount(() => {
	const initializeSearch = () => {
		initialized = true;
		pagefindLoaded =
			typeof window !== "undefined" &&
			!!window.pagefind &&
			typeof window.pagefind.search === "function";
	};

	if (import.meta.env.DEV) {
		initializeSearch();
	} else {
		document.addEventListener("pagefindready", initializeSearch);
		document.addEventListener("pagefindloaderror", initializeSearch);
		setTimeout(() => {
			if (!initialized) initializeSearch();
		}, 1500);
	}

	window.addEventListener("keydown", handleKeydown);
});

onDestroy(() => {
	if (typeof window !== "undefined") {
		window.removeEventListener("keydown", handleKeydown);
	}
	if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
});
</script>

<!-- Desktop Navbar Trigger Button -->
<button
  type="button"
  onclick={openModal}
  aria-label="Open Terminal Search (⌘K)"
  class="hidden lg:flex items-center gap-2.5 h-11 px-3.5 mr-2 rounded-xl
         bg-black/[0.04] hover:bg-black/[0.08] focus:bg-black/[0.08]
         dark:bg-white/[0.05] dark:hover:bg-white/[0.1] dark:focus:bg-white/[0.1]
         border border-black/10 dark:border-white/10 hover:border-[var(--primary)]/60
         transition-all duration-200 group cursor-pointer select-none"
>
  <span class="text-[var(--primary)] font-mono font-bold text-sm leading-none">>_</span>
  <span class="font-mono text-xs text-black/70 dark:text-white/70 tracking-wider">QUERY TERMINAL</span>
  <kbd class="ml-1.5 px-1.5 py-0.5 text-[10px] font-mono font-semibold rounded-md
              bg-black/[0.06] dark:bg-white/10 text-black/50 dark:text-white/50
              border border-black/10 dark:border-white/10 group-hover:text-[var(--primary)]
              group-hover:border-[var(--primary)]/40 transition">
    ⌘K
  </kbd>
</button>

<!-- Mobile Navbar Trigger Button -->
<button
  type="button"
  onclick={openModal}
  aria-label="Open Terminal Search"
  class="btn-plain scale-animation lg:!hidden rounded-xl w-11 h-11 active:scale-90 flex items-center justify-center font-mono font-bold text-[var(--primary)] text-sm border border-black/10 dark:border-white/10 bg-black/[0.04] dark:bg-white/[0.05]"
>
  >_
</button>

<!-- Terminal Modal Overlay -->
{#if isOpen}
  <!-- Backdrop -->
  <div
    use:portal
    role="dialog"
    aria-modal="true"
    tabindex="-1"
    class="terminal-overlay fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-md animate-fade-in"
    onclick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
    onkeydown={(e) => { if (e.key === 'Escape') closeModal(); }}
  >
    <!-- Terminal Window Frame -->
    <div
      class="terminal-window relative w-full max-w-2xl max-h-[85vh] flex flex-col
             bg-[#0d1219]/95 dark:bg-[#080d14]/98 text-[#cdd9e5]
             border border-[var(--primary)]/40 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.85),0_0_30px_rgba(var(--primary-rgb),0.12)]
             overflow-hidden font-mono"
    >
      <!-- Titlebar Header -->
      <div class="terminal-titlebar flex items-center justify-between px-4 py-2.5 bg-black/40 border-b border-white/10 select-none">
        <!-- Traffic Light Buttons -->
        <div class="flex items-center gap-2">
          <button
            type="button"
            onclick={closeModal}
            aria-label="Close terminal"
            class="w-3 h-3 rounded-full bg-[#ff5f56] hover:brightness-125 transition cursor-pointer shadow-sm"
          ></button>
          <div class="w-3 h-3 rounded-full bg-[#ffbd2e] opacity-80"></div>
          <div class="w-3 h-3 rounded-full bg-[#27c93f] opacity-80"></div>
        </div>

        <!-- Terminal Title -->
        <div class="flex items-center gap-2 text-xs font-bold text-white/80 tracking-wider">
          <span class="text-[var(--primary)]">>_</span>
          <span>SYS://ARCHIVE_SEARCH_CONSOLE.sh</span>
        </div>

        <!-- Status Light -->
        <div class="flex items-center gap-1.5 text-[10px] text-[var(--primary)]">
          <span class="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-pulse shadow-[0_0_6px_var(--primary)]"></span>
          <span class="hidden sm:inline">ONLINE</span>
        </div>
      </div>

      <!-- Command Line Prompt Input -->
      <div class="terminal-cli flex items-center gap-2 px-4 py-3 bg-black/25 border-b border-white/10">
        <div class="flex items-center gap-1 text-xs shrink-0 select-none font-bold">
          <span class="text-[var(--primary)]">guest@jayczee</span>
          <span class="text-white/40">:</span>
          <span class="text-blue-400">~</span>
          <span class="text-white/60">$</span>
          <span class="text-white/40 ml-1">find</span>
          <span class="text-[var(--primary)]/80">-k</span>
        </div>

        <input
          bind:this={inputElement}
          bind:value={keyword}
          oninput={onInput}
          type="text"
          placeholder="type keyword... (e.g. adb, docker, sql)"
          class="flex-1 bg-transparent border-0 outline-none text-white text-sm font-mono placeholder-white/30 caret-[var(--primary)]"
          autocomplete="off"
          spellcheck="false"
        />

        {#if isSearching}
          <div class="flex items-center gap-1.5 text-xs text-[var(--primary)] shrink-0 animate-pulse">
            <span class="w-2 h-2 rounded-full bg-[var(--primary)]"></span>
            <span class="text-[11px] hidden sm:inline">GREP...</span>
          </div>
        {:else if keyword}
          <button
            type="button"
            onclick={() => { keyword = ''; performSearch(''); inputElement?.focus(); }}
            class="text-xs text-white/40 hover:text-white/80 px-1.5 py-0.5 rounded hover:bg-white/10 transition"
          >
            CLEAR
          </button>
        {/if}
      </div>

      <!-- Results Terminal Output Feed -->
      <div class="terminal-body flex-1 overflow-y-auto max-h-[55vh] p-2 space-y-1.5 divide-y divide-white/[0.04]">
        {#if result.length > 0}
          {#each result as item, index}
            <div
              role="button"
              tabindex="0"
              id={`search-item-${index}`}
              onclick={() => navigateTo(item.url)}
              class="group block rounded-xl p-3 cursor-pointer transition-all duration-150 border bg-white/[0.02] hover:bg-white/[0.06] hover:border-[var(--primary)]/40 hover:translate-x-1"
            >
              <div class="flex items-center justify-between gap-2 mb-1">
                <div class="flex items-center gap-2 text-sm font-bold">
                  <span class="text-[10px] text-white/40 font-mono">[{String(index + 1).padStart(2, '0')}]</span>
                  <span class="text-white group-hover:text-[var(--primary)] transition">
                    {item.meta.title}
                  </span>
                </div>
                <span class="text-[10px] text-white/40 group-hover:text-[var(--primary)] shrink-0 font-mono">
                  OPEN →
                </span>
              </div>
              <div class="terminal-excerpt text-xs text-white/60 line-clamp-2 leading-relaxed">
                {@html item.excerpt}
              </div>
            </div>
          {/each}
        {:else if keyword.trim()}
          <div class="p-8 text-center text-xs text-white/40 font-mono space-y-2">
            <div class="text-[var(--primary)] text-sm">>_ STATUS: NO_MATCHES_FOUND</div>
            <p>Query pattern '{keyword}' did not match any stored records in local sectors.</p>
            <p class="text-[11px] text-white/30">Tip: Check spelling or try a broader keyword.</p>
          </div>
        {:else}
          <!-- Initial Welcome CLI Help Screen -->
          <div class="p-6 text-xs text-white/50 font-mono space-y-3">
            <div class="flex items-center gap-2 text-[var(--primary)] font-bold text-sm">
              <span>●</span>
              <span>INDEXED SYSTEM READY // AWAITING COMMAND</span>
            </div>
            <div class="text-white/70 leading-relaxed text-[13px]">
              Type keywords above to search all articles, tags, system notes, and guides.
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-[11px] text-white/40 border-t border-white/10">
              <div class="flex items-center gap-1.5">
                <kbd class="px-1.5 py-0.5 rounded bg-white/10 text-white/70">ESC</kbd>
                <span>Dismiss terminal</span>
              </div>
              <div class="flex items-center gap-1.5">
                <kbd class="px-1.5 py-0.5 rounded bg-white/10 text-white/70">⌘K</kbd>
                <span>Global shortcut</span>
              </div>
            </div>
          </div>
        {/if}
      </div>

      <!-- Terminal Status Footer -->
      <div class="terminal-footer flex items-center justify-between px-4 py-2 bg-black/40 border-t border-white/10 text-[10px] text-white/40 select-none">
        <div class="flex items-center gap-2">
          <span>MATCHES: {result.length}</span>
          <span>//</span>
          <span>PAGEFIND_CORE: {pagefindLoaded || import.meta.env.DEV ? 'READY' : 'STANDBY'}</span>
        </div>
        <div class="flex items-center gap-2">
          <span>[ESC] CLOSE</span>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  :global(.terminal-excerpt mark) {
    background-color: rgba(255, 170, 0, 0.25);
    color: #ffc247;
    padding: 0.1rem 0.25rem;
    border-radius: 0.25rem;
    font-weight: 600;
  }
  :global(.terminal-overlay) {
    animation: fadeIn 0.15s ease-out;
  }
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: scale(0.98);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
</style>
