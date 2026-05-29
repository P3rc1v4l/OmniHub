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
// Vom Nutzer SELBST gewähltes Haupt-Profil (nicht löschbar, darf PINs zurücksetzen).
export const mainProfileId = writable<string | null>(null);
// Separater, frei wählbarer Admin-Code (gehasht) zum Zurücksetzen vergessener PINs.
export const adminCodeHash = writable<string | null>(null);

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

// Haupt-Profil festlegen (vom Nutzer wählbar).
export function setMainProfile(id: string): void {
	if (get(profiles).some((p) => p.id === id)) mainProfileId.set(id);
}

// Admin-Code setzen / prüfen / löschen (für PIN-Zurücksetzen).
export async function setAdminCode(code: string): Promise<void> {
	adminCodeHash.set(await hashPin(`admin:${code}`));
}
export async function verifyAdminCode(code: string): Promise<boolean> {
	const h = get(adminCodeHash);
	if (!h) return false;
	return (await hashPin(`admin:${code}`)) === h;
}
export function clearAdminCode(): void {
	adminCodeHash.set(null);
}

// PIN eines Profils per Admin-Code zurücksetzen (entfernt den PIN ohne alten PIN).
export async function resetPinWithAdmin(id: string, code: string): Promise<boolean> {
	if (!(await verifyAdminCode(code))) return false;
	profiles.update(($p) => $p.map((x) => (x.id === id ? { ...x, pinHash: null } : x)));
	return true;
}

export async function deleteProfile(id: string): Promise<void> {
	const list = get(profiles);
	if (list.length <= MIN_PROFILES) return;
	if (get(mainProfileId) === id) return; // Haupt-Profil ist nicht löschbar
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

// Schneller, zuverlässiger Sofort-Cache (überlebt Reloads sicher, synchron).
const LS_PROFILES = 'omnihub:profiles';
const LS_ACTIVE = 'omnihub:activeProfileId';
const LS_MAIN = 'omnihub:mainProfileId';
const LS_ADMIN = 'omnihub:adminCodeHash';
function lsGet<T>(key: string): T | null {
	if (!browser) return null;
	try {
		const raw = window.localStorage.getItem(key);
		return raw ? (JSON.parse(raw) as T) : null;
	} catch { return null; }
}
function lsSet(key: string, value: unknown): void {
	if (!browser) return;
	try { window.localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
}

let loaded = false;
export async function hydrateProfiles(): Promise<void> {
	if (loaded || !browser) return;
	loaded = true;
	// Quelle: zuerst localStorage (sofort), sonst Plugin-Store.
	let list = lsGet<Profile[]>(LS_PROFILES) ?? (await loadState<Profile[]>('profiles', []));
	if (!Array.isArray(list) || !list.length) list = [defaultProfile()];
	profiles.set(list);
	const savedActive =
		lsGet<string | null>(LS_ACTIVE) ?? (await loadState<string | null>('activeProfileId', list[0].id));
	// Falls das gespeicherte aktive Profil nicht mehr existiert -> erstes nehmen.
	activeProfileId.set(list.some((p) => p.id === savedActive) ? (savedActive as string) : list[0].id);

	// Haupt-Profil: gespeicherte Wahl, sonst erstes Profil als Standard.
	const savedMain =
		lsGet<string | null>(LS_MAIN) ?? (await loadState<string | null>('mainProfileId', list[0].id));
	mainProfileId.set(list.some((p) => p.id === savedMain) ? (savedMain as string) : list[0].id);

	// Admin-Code-Hash laden (falls gesetzt).
	const savedAdmin = lsGet<string | null>(LS_ADMIN) ?? (await loadState<string | null>('adminCodeHash', null));
	adminCodeHash.set(savedAdmin ?? null);
}

if (browser) {
	profiles.subscribe(($p) => {
		if (!loaded) return;
		lsSet(LS_PROFILES, $p);
		void saveState('profiles', $p);
	});
	activeProfileId.subscribe(($a) => {
		if (!loaded) return;
		lsSet(LS_ACTIVE, $a);
		void saveState('activeProfileId', $a);
	});
	mainProfileId.subscribe(($m) => {
		if (!loaded) return;
		lsSet(LS_MAIN, $m);
		void saveState('mainProfileId', $m);
	});
	adminCodeHash.subscribe(($h) => {
		if (!loaded) return;
		lsSet(LS_ADMIN, $h);
		void saveState('adminCodeHash', $h);
	});
}
