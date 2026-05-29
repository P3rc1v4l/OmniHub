// Punkt 3: Echter In-App-Updater (Tauri Updater Plugin).
// Prüft beim Start und auf Knopfdruck gegen die GitHub-Releases. Gibt es eine
// neuere, signierte Version, kann sie direkt heruntergeladen und installiert werden.
import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { pushToast } from './toasts';

export interface UpdateState {
	checking: boolean;
	available: boolean;
	version: string | null;
	notes: string | null;
	downloading: boolean;
	progress: number; // 0..1
	error: string | null;
	dismissed: boolean;
}

export const updateState = writable<UpdateState>({
	checking: false,
	available: false,
	version: null,
	notes: null,
	downloading: false,
	progress: 0,
	error: null,
	dismissed: false
});

// Das vom Plugin gelieferte Update-Objekt (mit downloadAndInstall).
let pending: { version: string; body?: string; downloadAndInstall: (cb?: (e: unknown) => void) => Promise<void> } | null = null;

export async function checkForUpdate(manual = false): Promise<void> {
	if (!browser) return;
	updateState.update((s) => ({ ...s, checking: true, error: null }));
	try {
		const { check } = await import('@tauri-apps/plugin-updater');
		const result = await check();
		if (result) {
			pending = result as typeof pending;
			updateState.set({
				checking: false,
				available: true,
				version: result.version,
				notes: result.body ?? null,
				downloading: false,
				progress: 0,
				error: null,
				dismissed: false
			});
		} else {
			pending = null;
			updateState.update((s) => ({ ...s, checking: false, available: false }));
			if (manual) pushToast('Kein Update verfügbar', 'Du verwendest bereits die neueste Version.', '✅');
		}
	} catch (e) {
		updateState.update((s) => ({ ...s, checking: false, error: String(e) }));
		if (manual) pushToast('Update-Prüfung fehlgeschlagen', String(e), '⚠️');
		else console.warn('[updater] check fehlgeschlagen:', e);
	}
}

export async function installUpdate(): Promise<void> {
	if (!browser || !pending) return;
	updateState.update((s) => ({ ...s, downloading: true, progress: 0, error: null }));
	try {
		let total = 0;
		let downloaded = 0;
		await pending.downloadAndInstall((event: unknown) => {
			const e = event as { event: string; data?: { contentLength?: number; chunkLength?: number } };
			if (e.event === 'Started') {
				total = e.data?.contentLength ?? 0;
			} else if (e.event === 'Progress') {
				downloaded += e.data?.chunkLength ?? 0;
				updateState.update((s) => ({ ...s, progress: total ? downloaded / total : 0 }));
			} else if (e.event === 'Finished') {
				updateState.update((s) => ({ ...s, progress: 1 }));
			}
		});
		// Update installiert -> App neu starten.
		const { relaunch } = await import('@tauri-apps/plugin-process');
		await relaunch();
	} catch (e) {
		updateState.update((s) => ({ ...s, downloading: false, error: String(e) }));
		pushToast('Update fehlgeschlagen', String(e), '⚠️');
	}
}

export function dismissUpdate(): void {
	updateState.update((s) => ({ ...s, dismissed: true }));
}
