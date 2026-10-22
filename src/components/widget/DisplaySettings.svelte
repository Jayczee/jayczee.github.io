<script lang="ts">
import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";
import Icon from "@iconify/svelte";
import { getDefaultHue, getHue, setHue } from "@utils/setting-utils";

let { class: className = "" }: { class?: string } = $props();

let hue = $state(getHue());
const defaultHue = getDefaultHue();

function resetHue() {
	hue = getDefaultHue();
}

$effect(() => {
	if (hue || hue === 0) {
		setHue(hue);
	}
});

interface ColorPreset {
	name: string;
	label: string;
	hue: number;
	color: string;
}

const presets: ColorPreset[] = [
	{ name: "ZZZ", label: "燥橙", hue: 48, color: "oklch(0.75 0.14 48)" },
	{ name: "ACID", label: "酸绿", hue: 135, color: "oklch(0.75 0.14 135)" },
	{ name: "CYBER", label: "青霓", hue: 185, color: "oklch(0.75 0.14 185)" },
	{ name: "VAPOR", label: "魅紫", hue: 310, color: "oklch(0.75 0.14 310)" },
	{ name: "AMBER", label: "琥珀", hue: 35, color: "oklch(0.75 0.14 35)" },
];
</script>

<div id="display-setting" class={`float-panel float-panel-closed absolute transition-all w-88 right-4 px-4 py-4 rounded-2xl bg-white/95 dark:bg-[#0c121cf5] backdrop-blur-xl border border-black/10 dark:border-white/10 shadow-2xl font-mono z-50 ${className}`}>
    <!-- HUD Header -->
    <div class="flex items-center justify-between pb-3 mb-3 border-b border-black/10 dark:border-white/10 select-none">
        <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-[var(--primary)] animate-pulse shadow-[0_0_8px_var(--primary)]"></span>
            <span class="text-xs font-bold text-black/90 dark:text-white/90 tracking-wider">SIGNAL // HUE_TUNER</span>
        </div>
        <div class="flex items-center gap-2">
            <div class="px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10 text-xs font-bold text-[var(--primary)] font-mono tracking-wider">
                FREQ: {String(hue).padStart(3, '0')}°
            </div>
            {#if hue !== defaultHue}
                <button
                    type="button"
                    aria-label="Reset to Default"
                    onclick={resetHue}
                    class="px-2 py-0.5 rounded-md bg-[var(--primary)]/15 border border-[var(--primary)]/30 text-[var(--primary)] hover:bg-[var(--primary)]/25 text-[10px] font-bold transition flex items-center gap-1 active:scale-95 cursor-pointer"
                >
                    <Icon icon="fa6-solid:rotate-left" class="text-[9px]" />
                    RESET
                </button>
            {/if}
        </div>
    </div>

    <!-- Quick Snap Color Tapes Presets -->
    <div class="mb-4">
        <div class="text-[10px] font-mono text-black/50 dark:text-white/40 mb-2 tracking-wider flex items-center justify-between select-none">
            <span>PRESET_TAPES</span>
            <span class="text-[9px] opacity-60">QUICK SNAP</span>
        </div>
        <div class="grid grid-cols-5 gap-1.5">
            {#each presets as p}
                <button
                    type="button"
                    onclick={() => { hue = p.hue; }}
                    class={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all border group relative active:scale-95 cursor-pointer ${Math.abs(hue - p.hue) <= 4 ? 'border-[var(--primary)] bg-[var(--primary)]/15 shadow-[0_0_12px_rgba(var(--primary-rgb),0.2)]' : 'border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] hover:border-black/30 dark:hover:border-white/30'}`}
                >
                    <span
                        class="w-4 h-4 rounded-full mb-1.5 border border-black/20 dark:border-white/20 shadow-sm transition-transform group-hover:scale-110"
                        style={`background-color: ${p.color};`}
                    ></span>
                    <span class="text-[10px] font-bold text-black/85 dark:text-white/85 group-hover:text-[var(--primary)] leading-tight">{p.name}</span>
                    <span class="text-[9px] text-black/40 dark:text-white/40 leading-tight">{p.label}</span>
                </button>
            {/each}
        </div>
    </div>

    <!-- Analog Frequency Fader Slider -->
    <div>
        <div class="text-[10px] font-mono text-black/50 dark:text-white/40 mb-1.5 tracking-wider flex items-center justify-between select-none">
            <span>ANALOG_FADER</span>
            <span class="text-[9px] opacity-60">0° — 360°</span>
        </div>
        <div class="w-full px-1 py-1 bg-black/5 dark:bg-black/40 rounded-xl border border-black/10 dark:border-white/10 select-none mb-1.5">
            <input
                aria-label={i18n(I18nKey.themeColor)}
                type="range"
                min="0"
                max="360"
                bind:value={hue}
                class="slider w-full cursor-pointer"
                id="colorSlider"
                step="1"
            />
        </div>
        <!-- Calibration Ticks -->
        <div class="flex justify-between px-1 text-[8px] font-mono text-black/35 dark:text-white/30 select-none tracking-wider">
            <span>| 0°</span>
            <span>| 90°</span>
            <span>| 180°</span>
            <span>| 270°</span>
            <span>| 360°</span>
        </div>
    </div>
</div>

<style>
#display-setting input[type="range"] {
  -webkit-appearance: none;
  appearance: none;
  height: 1.25rem;
  border-radius: 0.5rem;
  background-image: var(--color-selection-bar);
  transition: background-image 0.15s ease-in-out;
  outline: none;
}

#display-setting input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  height: 1.35rem;
  width: 0.65rem;
  border-radius: 0.25rem;
  background: linear-gradient(to bottom, #ffffff, #cfd6df);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.4), inset 0 1px 1px #fff, inset 0 -1px 1px #888;
  border: 1px solid rgba(0, 0, 0, 0.3);
  cursor: ew-resize;
  transition: transform 0.1s;
}

#display-setting input[type="range"]::-webkit-slider-thumb:hover {
  transform: scale(1.1);
}

#display-setting input[type="range"]::-webkit-slider-thumb:active {
  transform: scale(0.95);
}

#display-setting input[type="range"]::-moz-range-thumb {
  height: 1.35rem;
  width: 0.65rem;
  border-radius: 0.25rem;
  border: 1px solid rgba(0, 0, 0, 0.3);
  background: linear-gradient(to bottom, #ffffff, #cfd6df);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.4);
  cursor: ew-resize;
}
</style>
