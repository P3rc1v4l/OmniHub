// Frontend-Wrapper für den AniList-Plan (src-tauri/src/anilist.rs).
import { browser } from '$app/environment';

export interface AiringItem {
	id: number;
	title: string;
	cover: string | null;
	episode: number;
	airingAt: number; // Unix-Sekunden
	crunchyrollUrl: string | null;
	siteUrl: string;
}

async function callPage(start: number, end: number, page: number): Promise<any | null> {
	if (!browser) return null;
	try {
		const { invoke } = await import('@tauri-apps/api/core');
		return await invoke('anilist_schedule', { start, end, page });
	} catch (e) {
		console.warn('[anilist] Plan-Abruf fehlgeschlagen:', e);
		return null;
	}
}

// Holt den Ausstrahlungsplan der nächsten 7 Tage (ab jetzt), über mehrere Seiten.
export async function fetchWeekSchedule(): Promise<AiringItem[]> {
	const now = Math.floor(Date.now() / 1000);
	const end = now + 7 * 24 * 3600;
	const items: AiringItem[] = [];
	for (let page = 1; page <= 6; page++) {
		const data = await callPage(now, end, page);
		const p = data?.data?.Page;
		if (!p) break;
		for (const s of p.airingSchedules ?? []) {
			const m = s.media ?? {};
			const links: Array<{ site: string; url: string }> = m.externalLinks ?? [];
			const cr = links.find((l) => l.site === 'Crunchyroll');
			items.push({
				id: m.id,
				title: m.title?.english || m.title?.romaji || 'Unbekannt',
				cover: m.coverImage?.medium ?? null,
				episode: s.episode,
				airingAt: s.airingAt,
				crunchyrollUrl: cr?.url ?? null,
				siteUrl: m.siteUrl ?? ''
			});
		}
		if (!p.pageInfo?.hasNextPage) break;
	}
	return items;
}
