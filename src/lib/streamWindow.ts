// Öffnet einen Anbieter in einem ECHTEN WebviewWindow (kein iframe).
// - Umgeht X-Frame-Options/CSP-Sperren, nutzt das native Edge WebView (inkl. DRM).
// - Pro Profil ein eigenes dataDirectory -> getrennte Cookies/Logins je Profil.
import { browser } from '$app/environment';
import { get } from 'svelte/store';
import type { Provider } from '$lib/types';
import { startSession, endSession, incrementOpenCount } from '$lib/stores/tracking';
import { activeProfileId } from '$lib/stores/profiles';

export async function openInWindow(p: Provider): Promise<void> {
	if (!browser) return;
	const pid = get(activeProfileId) ?? 'default';
	try {
		const { WebviewWindow } = await import('@tauri-apps/api/webviewWindow');
		// Fenster-Label enthält das Profil -> jedes Profil hat sein eigenes Fenster.
		const label = `stream-${pid}-${p.id}`;

		const existing = await WebviewWindow.getByLabel(label);
		if (existing) {
			await existing.show();
			await existing.setFocus();
			return;
		}

		// Getrenntes Daten-Verzeichnis je Profil (Windows/WebView2). Absoluter,
		// beschreibbarer Pfad im App-Datenordner.
		let dataDirectory: string | undefined;
		try {
			const { appLocalDataDir, join } = await import('@tauri-apps/api/path');
			dataDirectory = await join(await appLocalDataDir(), 'webviews', pid);
		} catch {
			dataDirectory = undefined;
		}

		const win = new WebviewWindow(label, {
			url: p.url,
			title: `${p.name} – OmniHub`,
			width: 1280,
			height: 800,
			resizable: true,
			decorations: true,
			focus: true,
			...(dataDirectory ? { dataDirectory } : {})
		});

		win.once('tauri://created', () => {
			incrementOpenCount();
			startSession(p.id);
		});
		win.once('tauri://destroyed', () => endSession(p.id));
		win.once('tauri://error', (e: unknown) =>
			console.error(`[stream-window] ${p.name}:`, e)
		);
	} catch (e) {
		// Browser-Vorschau (kein Tauri): Fallback in neuem Tab, Tracking simulieren.
		incrementOpenCount();
		startSession(p.id);
		window.open(p.url, '_blank', 'noopener');
	}
}
