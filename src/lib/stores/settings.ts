import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import type { Settings } from '$lib/types';
import { loadState, saveState } from '$lib/persistence';

export const DEFAULT_SETTINGS: Settings = {
	appearance: {
		backgroundImage: null,
		accentColor: '#30c5bb',
		accentText: '#00201e',
		theme: 'dark',
		fontFamily: "'DM Sans', ui-sans-serif, system-ui, sans-serif",
		fontSize: 14,
		radius: 15,
		sidebarWidth: 220,
		glassmorphism: true,
		particles: false,
		particleCount: 50,
		particleSpeed: 1,
		particleColor: '#30c5bb',
		cardShadow: true,
		cardHoverZoom: true,
		animations: true,
		language: 'de',
		backgroundOpacity: 100
	},
	clock: { enabled: false, type: 'digital', showSeconds: true, color: '#ffffff', transparency: 50, size: 36 },
	notifications: {
		pauseReminder: true, sound: true, updateHint: true,
		achievementUnlocked: true, watchlistReminder: true
	},
	onboardingDone: false
};

export const settings = writable<Settings>(structuredClone(DEFAULT_SETTINGS));

export function applySettings(s: Settings): void {
	if (!browser) return;
	const root = document.documentElement;
	const a = s.appearance;
	root.style.setProperty('--accent', a.accentColor);
	root.style.setProperty('--accent-text', a.accentText);
	root.style.setProperty('--radius', `${a.radius}px`);
	root.style.setProperty('--font-size', `${a.fontSize}px`);
	root.style.setProperty('--sidebar-width', `${a.sidebarWidth}px`);
	root.style.setProperty('--font-family', a.fontFamily);
	// Optik-Schalter als data-Attribute -> CSS reagiert darauf (siehe app.css).
	root.setAttribute('data-glass', a.glassmorphism ? 'true' : 'false');
	root.setAttribute('data-shadow', a.cardShadow ? 'true' : 'false');
	root.setAttribute('data-hover-zoom', a.cardHoverZoom ? 'true' : 'false');
	root.setAttribute('data-animations', a.animations ? 'true' : 'false');
	let theme = a.theme;
	if (theme === 'system') {
		theme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
	}
	root.setAttribute('data-theme', theme);
}

let loaded = false;
export async function hydrateSettings(): Promise<void> {
	if (loaded || !browser) return;
	loaded = true;
	const saved = await loadState<Settings>('settings', DEFAULT_SETTINGS);
	// Defensive: fehlende Felder mit Defaults auffüllen
	const merged: Settings = {
		appearance: { ...DEFAULT_SETTINGS.appearance, ...saved.appearance },
		clock: { ...DEFAULT_SETTINGS.clock, ...saved.clock },
		notifications: { ...DEFAULT_SETTINGS.notifications, ...saved.notifications },
		onboardingDone: saved.onboardingDone ?? false
	};
	settings.set(merged);
	applySettings(merged);
}

if (browser) {
	settings.subscribe((s) => {
		applySettings(s);
		if (loaded) void saveState('settings', s);
	});
}
