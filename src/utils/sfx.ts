/**
 * Procedural Mechanical Sound Synthesizer via Web Audio API.
 * Zero external audio files, 0KB asset download.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
	if (typeof window === "undefined") return null;
	if (!audioCtx) {
		const AudioContextClass =
			window.AudioContext ||
			(window as unknown as { webkitAudioContext: typeof AudioContext })
				.webkitAudioContext;
		if (AudioContextClass) {
			audioCtx = new AudioContextClass();
		}
	}
	if (audioCtx && audioCtx.state === "suspended") {
		audioCtx.resume();
	}
	return audioCtx;
}

export function isSfxEnabled(): boolean {
	if (typeof window === "undefined") return false;
	return localStorage.getItem("vhs_sfx_enabled") === "true";
}

export function setSfxEnabled(enabled: boolean): void {
	if (typeof window === "undefined") return;
	localStorage.setItem("vhs_sfx_enabled", enabled ? "true" : "false");
}

export function playSfx(type: "click" | "switch" | "fader" = "click"): void {
	if (!isSfxEnabled()) return;
	const ctx = getAudioContext();
	if (!ctx) return;

	const now = ctx.currentTime;

	if (type === "click") {
		// Cassette button click: high damped sine + subtle bandpass noise
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.type = "sine";
		osc.frequency.setValueAtTime(1200, now);
		osc.frequency.exponentialRampToValueAtTime(120, now + 0.035);

		gain.gain.setValueAtTime(0.08, now);
		gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

		osc.connect(gain);
		gain.connect(ctx.destination);

		osc.start(now);
		osc.stop(now + 0.04);
	} else if (type === "switch") {
		// Mechanical relay toggle snap
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.type = "triangle";
		osc.frequency.setValueAtTime(800, now);
		osc.frequency.exponentialRampToValueAtTime(80, now + 0.045);

		gain.gain.setValueAtTime(0.06, now);
		gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

		osc.connect(gain);
		gain.connect(ctx.destination);

		osc.start(now);
		osc.stop(now + 0.05);
	} else if (type === "fader") {
		// Micro fader calibration tick
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.type = "sine";
		osc.frequency.setValueAtTime(2400, now);
		osc.frequency.exponentialRampToValueAtTime(600, now + 0.015);

		gain.gain.setValueAtTime(0.03, now);
		gain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);

		osc.connect(gain);
		gain.connect(ctx.destination);

		osc.start(now);
		osc.stop(now + 0.02);
	}
}
