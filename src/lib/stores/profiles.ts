import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';
import type { Profile } from '$lib/types';
import { loadState, saveState } from '$lib/persistence';
import { loadProviderProfileData } from './providers';
import { loadWatchlistForProfile } from './watchlist';
import { loadTrackingForProfile, resetSessions } from './tracking';
import { loadCelebratedForProfile, achievements } from './achievements';

export async function hashPin(pin: string): Promise<string> {
	const data = new TextEncoder().encode(`omnihub:${pin}`);
	const digest = await crypto.subtle.digest('SHA-256', data);
	return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPin(pin: string, hash: string | null): Promise<boolean> {
	if (!hash) return true;
	return (await hashPin(pin)) === hash;
}

export const MAX_PROFILES = 5;
export const MIN_PROFILES = 1;

function newId(): string {
	return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `p-${Date.now()}`;
}
function defaultProfile(): Profile {
	return { id: newId(), name: 'Profil 1', pinHash: null };
}

export const profiles = writable<Profile[]>([]);
export const activeProfileId = writable<string | null>(null);

// --- Verwaltung ---
export function addProfile(name: string): string | null {
	const list = get(profiles);
	if (list.length >= MAX_PROFILES) return null;
	const id = newId();
	profiles.set([...list, { id, name: name.trim() || `Profil ${list.length + 1}`, pinHash: null }]);
	return id;
}

export function renameProfile(id: string, name: string): void {
	profiles.update(($p) => $p.map((x) => (x.id === id ? { ...x, name: name.trim() || x.name } : x)));
}

export async function deleteProfile(id: string): Promise<void> {
	const list = get(profiles);
	if (list.length <= MIN_PROFILES) return;
	const remaining = list.filter((x) => x.id !== id);
	// Falls das aktive Profil gelöscht wird: vorher auf ein anderes wechseln.
	if (get(activeProfileId) === id) {
		await switchProfile(remaining[0].id);
	}
	profiles.set(remaining);
}

export async function setPin(id: string, pin: string): Promise<void> {
	const hash = await hashPin(pin);
	profiles.update(($p) => $p.map((x) => (x.id === id ? { ...x, pinHash: hash } : x)));
}
export function clearPin(id: string): void {
	profiles.update(($p) => $p.map((x) => (x.id === id ? { ...x, pinHash: null } : x)));
}

// --- Profilbezogene Daten laden / wechseln ---
export async function loadProfileData(profileId: string): Promise<void> {
	await loadProviderProfileData(profileId);
	await loadWatchlistForProfile(profileId);
	await loadTrackingForProfile(profileId);
	// Achievement-Baseline NACH dem Laden von Favoriten/Watchlist/Streamzeit.
	await loadCelebratedForProfile(
		profileId,
		get(achievements).filter((a) => a.unlocked).map((a) => a.id)
	);
}

async function closeProfileWindows(profileId: string): Promise<void> {
	if (!browser) return;
	try {
		const { WebviewWindow } = await import('@tauri-apps/api/webviewWindow');
		const all = await WebviewWindow.getAll();
		await Promise.all(
			all.filter((w) => w.label.startsWith(`stream-${profileId}-`)).map((w) => w.close())
		);
	} catch {
		/* Browser-Vorschau */
	}
}

export async function switchProfile(profileId: string): Promise<void> {
	if (profileId === get(activeProfileId)) return;
	const oldPid = get(activeProfileId);
	// Laufende Streamzeit dem ALTEN Profil gutschreiben (pid noch alt).
	resetSessions();
	if (oldPid) await closeProfileWindows(oldPid);
	activeProfileId.set(profileId);
	await loadProfileData(profileId);
}

let loaded = false;
export async function hydrateProfiles(): Promise<void> {
	if (loaded || !browser) return;
	loaded = true;
	let list = await loadState<Profile[]>('profiles', []);
	if (!list.length) list = [defaultProfile()];
	profiles.set(list);
	const savedActive = await loadState<string | null>('activeProfileId', list[0].id);
	// Falls das gespeicherte aktive Profil nicht mehr existiert -> erstes nehmen.
	activeProfileId.set(list.some((p) => p.id === savedActive) ? savedActive : list[0].id);
}

if (browser) {
	profiles.subscribe(($p) => { if (loaded) void saveState('profiles', $p); });
	activeProfileId.subscribe(($a) => { if (loaded) void saveState('activeProfileId', $a); });
}
