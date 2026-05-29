import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
import { DEFAULT_PROVIDERS } from '$lib/data/providers';
import { loadState, saveState } from '$lib/persistence';
import type { Provider, Quality } from '$lib/types';

// Katalog = global (welche Anbieter existieren, URL, Farbe, sichtbar/versteckt).
export const providers = writable<Provider[]>([]);
// Favoriten & "zuletzt geöffnet" = PRO PROFIL (nur IDs).
export const favorites = writable<string[]>([]);
export const recentProviderIds = writable<string[]>([]);

export const visibleProviders = derived(providers, ($p) => $p.filter((x) => !x.hidden));
export const favoriteProviders = derived([providers, favorites], ([$p, $f]) =>
	$p.filter((x) => $f.includes(x.id) && !x.hidden)
);
export const recentProviders = derived([providers, recentProviderIds], ([$p, $ids]) =>
	($ids.map((id) => $p.find((x) => x.id === id)).filter(Boolean) as Provider[])
);

export function resetProviders(): void {
	providers.set(structuredClone(DEFAULT_PROVIDERS));
}

export function toggleFavorite(id: string): void {
	favorites.update(($f) => ($f.includes(id) ? $f.filter((x) => x !== id) : [...$f, id]));
}

export function markOpened(id: string): void {
	recentProviderIds.update(($r) => [id, ...$r.filter((x) => x !== id)].slice(0, 5));
}

export function addCustomProvider(data: {
	name: string; url: string; subtitle?: string; color?: string; quality?: Quality;
}): void {
	const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
	const id = `custom-${slug || 'anbieter'}-${Date.now().toString(36)}`;
	let url = data.url.trim();
	if (url && !/^https?:\/\//i.test(url)) url = `https://${url}`;
	const color = data.color || '#30c5bb';
	providers.update(($p) => [
		...$p,
		{
			id, name: data.name.trim() || 'Eigener Anbieter',
			subtitle: (data.subtitle || 'Eigener Anbieter').trim(),
			url, category: 'eigene', color, color2: color,
			quality: data.quality || 'HD', custom: true
		}
	]);
}

export function removeCustomProvider(id: string): void {
	providers.update(($p) => $p.filter((x) => x.id !== id));
}

// --- Katalog (global) ---
let catalogReady = false;
export async function hydrateCatalog(): Promise<void> {
	if (catalogReady || !browser) return;
	catalogReady = true;
	const saved = await loadState<Provider[] | null>('providers', null);
	if (saved && Array.isArray(saved) && saved.length) {
		// Standard-Anbieter mit aktuellen Metadaten, aber gespeicherter Sichtbarkeit.
		const merged = DEFAULT_PROVIDERS.map((def) => {
			const old = saved.find((x) => x.id === def.id);
			return old ? { ...def, hidden: old.hidden } : def;
		});
		const customs = saved.filter((x) => x.custom);
		providers.set([...merged, ...customs]);
	} else {
		providers.set(structuredClone(DEFAULT_PROVIDERS));
	}
}

// --- Profilbezogene Daten (Favoriten / zuletzt geöffnet) ---
let pid: string | null = null;
let profReady = false;
export async function loadProviderProfileData(profileId: string): Promise<void> {
	pid = profileId;
	favorites.set(await loadState<string[]>(`favorites:${profileId}`, []));
	recentProviderIds.set(await loadState<string[]>(`recent:${profileId}`, []));
	profReady = true;
}

if (browser) {
	providers.subscribe(($p) => { if (catalogReady) void saveState('providers', $p); });
	favorites.subscribe(($f) => { if (profReady && pid) void saveState(`favorites:${pid}`, $f); });
	recentProviderIds.subscribe(($r) => { if (profReady && pid) void saveState(`recent:${pid}`, $r); });
}

export const activeStream = writable<Provider | null>(null);
