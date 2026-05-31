// Punkt 8: Anbieter IM Hauptfenster anzeigen, als echtes eingebettetes Webview
// (kein iframe -> keine "Verbindung verweigert"-Sperre). Pro Profil+Anbieter ein
// eigenes Label -> getrennte, dauerhafte Logins je Profil.
//
// Defensiv: Klappt das Einbetten zur Laufzeit nicht (z.B. Plattform ohne
// Unterstützung), wird automatisch wieder ein separates Fenster geöffnet.
import { browser } from '$app/environment';
import { get, writable } from 'svelte/store';
import { goto } from '$app/navigation';
import type { Provider } from '$lib/types';
import { activeStream, markOpened } from '$lib/stores/providers';
import { recordOpen } from '$lib/stores/continue';
import { activeProfileId } from '$lib/stores/profiles';
import { settings } from '$lib/stores/settings';
import { startSession, endSession, incrementOpenCount } from '$lib/stores/tracking';
import { openInWindow } from '$lib/streamWindow';

export interface Rect { x: number; y: number; width: number; height: number; }

// Zeigt der Stream-Seite, ob der Anbieter eingebettet läuft oder (Fallback) als Fenster.
export const streamMode = writable<'embedded' | 'window' | null>(null);

// Vollbild-/Immersiv-Modus: blendet die OmniHub-Oberfläche (Titelleiste, Seitenleiste)
// aus, sodass der Stream das ganze Fenster füllt.
export const immersive = writable(false);

let currentLabel: string | null = null;
let currentProviderId: string | null = null;
let usingFallback = false;
let creatingLabel: string | null = null;

// Vom Nutzer ausgelöstes Öffnen: aktiven Stream setzen und zur Stream-Seite,
// die das Einbetten übernimmt.
export function openProvider(p: Provider): void {
	markOpened(p.id);
	recordOpen({ label: p.name, subtitle: p.subtitle ?? '', url: p.url, id: p.id, color: p.color, color2: p.color2 ?? p.color, poster: null });
	activeStream.set(p);
	goto('/stream');
}

// Öffnet eine beliebige URL IM Programm (nicht im externen Browser) – z.B. einen
// Crunchyroll-Titel aus dem Kalender. Nutzt dieselbe Stream-Mechanik wie Anbieter
// (eingebettet bzw. – je nach Einstellung – eigenes Fenster). Bei id 'crunchyroll'
// wird die bestehende Crunchyroll-Anmeldung mitbenutzt.
export async function openUrlInApp(
	name: string,
	url: string,
	id = 'web-view-cal',
	subtitle = '',
	color = '#30c5bb',
	color2 = '#1f6f6a',
	poster: string | null = null
): Promise<void> {
	// Bestehende Einbettung schließen, damit die neue URL frisch geladen wird
	// (die Anmeldedaten je Label bleiben erhalten).
	await closeEmbedded();
	if (id === 'crunchyroll') markOpened('crunchyroll');
	recordOpen({ label: name, subtitle, url, id, color, color2, poster });
	activeStream.set({
		id,
		name,
		subtitle,
		url,
		category: 'anime',
		color,
		color2,
		quality: '1080p'
	});
	goto('/stream');
}

async function getWebviewApi() {
	const webview = await import('@tauri-apps/api/webview');
	const dpi = await import('@tauri-apps/api/dpi');
	const win = await import('@tauri-apps/api/window');
	return { webview, dpi, win };
}

export async function showEmbedded(p: Provider, rect: Rect): Promise<void> {
	if (!browser) return;
	// Nutzer-Einstellung: explizit "Eigenes Fenster" -> gar nicht erst einbetten.
	if (get(settings).appearance.streamMode === 'window') {
		usingFallback = true;
		streamMode.set('window');
		await openInWindow(p);
		return;
	}
	const pid = get(activeProfileId) ?? 'default';
	const label = `embed-${pid}-${p.id}`;
	try {
		const { webview, dpi, win } = await getWebviewApi();
		const { Webview } = webview;
		const { LogicalPosition, LogicalSize } = dpi;

		// Anderen Anbieter offen? -> schließen (eine Einbettung gleichzeitig).
		if (currentLabel && currentLabel !== label) {
			await closeEmbedded();
		}

		const existing = await Webview.getByLabel(label);
		if (existing) {
			await existing.setPosition(new LogicalPosition(rect.x, rect.y));
			await existing.setSize(new LogicalSize(rect.width, rect.height));
			await existing.show();
			await existing.setFocus();
			currentLabel = label;
			currentProviderId = p.id;
			usingFallback = false;
			streamMode.set('embedded');
			return;
		}

		// Schutz gegen gleichzeitiges Erzeugen desselben Webviews
		if (creatingLabel === label) return;
		creatingLabel = label;

		const appWindow = win.getCurrentWindow();
		const wv = new Webview(appWindow, label, {
			url: p.url,
			x: Math.round(rect.x),
			y: Math.round(rect.y),
			width: Math.round(rect.width),
			height: Math.round(rect.height)
		});
		wv.once('tauri://created', () => {
			incrementOpenCount();
			startSession(p.id);
			creatingLabel = null;
		});
		wv.once('tauri://error', (e: unknown) => {
			console.error('[embed]', e);
			creatingLabel = null;
		});
		currentLabel = label;
		currentProviderId = p.id;
		usingFallback = false;
		streamMode.set('embedded');
	} catch (e) {
		// Einbetten nicht möglich -> Fallback auf separates Fenster.
		console.warn('[embed] Einbetten fehlgeschlagen, öffne Fenster:', e);
		usingFallback = true;
		creatingLabel = null;
		streamMode.set('window');
		await openInWindow(p);
	}
}

export async function repositionEmbedded(rect: Rect): Promise<void> {
	if (!browser || !currentLabel || usingFallback) return;
	try {
		const { webview, dpi } = await getWebviewApi();
		const wv = await webview.Webview.getByLabel(currentLabel);
		if (wv) {
			await wv.setPosition(new dpi.LogicalPosition(rect.x, rect.y));
			await wv.setSize(new dpi.LogicalSize(rect.width, rect.height));
		}
	} catch {
		/* ignore */
	}
}

export async function hideEmbedded(): Promise<void> {
	if (!browser || !currentLabel || usingFallback) return;
	try {
		const { webview } = await getWebviewApi();
		const wv = await webview.Webview.getByLabel(currentLabel);
		if (wv) await wv.hide();
	} catch {
		/* ignore */
	}
}

// Zeigt das aktuell eingebettete Webview wieder an (z.B. nachdem die
// Einstellungen geschlossen wurden, die es vorübergehend verdeckt hätten).
export async function unhideEmbedded(): Promise<void> {
	if (!browser || !currentLabel || usingFallback) return;
	try {
		const { webview } = await getWebviewApi();
		const wv = await webview.Webview.getByLabel(currentLabel);
		if (wv) {
			await wv.show();
			await wv.setFocus();
		}
	} catch {
		/* ignore */
	}
}

// Esc als globalen Shortcut, um den Vollbildmodus zu verlassen – nötig, weil der
// Stream (natives Webview) den Tastatur-Fokus hat und OmniHub sonst kein Esc bekäme.
async function registerEscExit(): Promise<void> {
	if (!browser) return;
	try {
		const gs = await import('@tauri-apps/plugin-global-shortcut');
		if (!(await gs.isRegistered('Escape'))) {
			await gs.register('Escape', (e: { state?: string }) => {
				if (!e || e.state === 'Pressed') void setImmersive(false);
			});
		}
	} catch {
		/* ignore */
	}
}
async function unregisterEscExit(): Promise<void> {
	if (!browser) return;
	try {
		const gs = await import('@tauri-apps/plugin-global-shortcut');
		if (await gs.isRegistered('Escape')) await gs.unregister('Escape');
	} catch {
		/* ignore */
	}
}

// Vollbild umschalten: OmniHub-Oberfläche ausblenden (über den Store) und das
// Fenster in den OS-Vollbild setzen, damit der Stream alles ausfüllt.
export async function setImmersive(on: boolean): Promise<void> {
	immersive.set(on);
	if (!browser) return;
	try {
		const { win } = await getWebviewApi();
		await win.getCurrentWindow().setFullscreen(on);
	} catch {
		/* ignore */
	}
	if (on) await registerEscExit();
	else await unregisterEscExit();
}

export async function closeEmbedded(): Promise<void> {
	if (!browser) return;
	void setImmersive(false);
	if (currentLabel && !usingFallback) {
		try {
			const { webview } = await getWebviewApi();
			const wv = await webview.Webview.getByLabel(currentLabel);
			if (wv) await wv.close();
		} catch {
			/* ignore */
		}
	}
	if (currentProviderId) endSession(currentProviderId);
	currentLabel = null;
	currentProviderId = null;
	usingFallback = false;
	creatingLabel = null;
	streamMode.set(null);
}
