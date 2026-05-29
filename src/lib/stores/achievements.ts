// Achievements: 50 Stück, rein abgeleitet aus Favoriten, Watchlist und Streamzeit.
// Freischalt-Meldungen laufen über In-App-Toasts (keine Windows-Benachrichtigungen).
import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';
import { loadState, saveState } from '$lib/persistence';
import { favorites } from './providers';
import { watchlist } from './watchlist';
import { totalWatchMs, openCount, distinctProvidersWatched } from './tracking';
import { pushToast } from './toasts';

export interface Achievement {
	id: string;
	name: string;
	desc: string;
	icon: string;
	metric: 'opens' | 'distinct' | 'favs' | 'wl' | 'hours';
	value: number;
	goal: number;
	progress: number;
	unlocked: boolean;
}

type Tier = { goal: number; name: string };

const OPENS: Tier[] = [
	{ goal: 1, name: 'Erstes Mal' }, { goal: 5, name: 'Reinschnuppern' }, { goal: 10, name: 'Stammgast' },
	{ goal: 25, name: 'Vielnutzer' }, { goal: 50, name: 'Power-User' }, { goal: 100, name: 'Dauergast' },
	{ goal: 200, name: 'Klick-König' }, { goal: 500, name: 'Klick-Profi' }, { goal: 1000, name: 'Klick-Legende' }
];
const DISTINCT: Tier[] = [
	{ goal: 2, name: 'Neugierig' }, { goal: 3, name: 'Entdecker' }, { goal: 5, name: 'Wanderer' },
	{ goal: 8, name: 'Vielseitig' }, { goal: 10, name: 'Allesseher' }, { goal: 15, name: 'Dienste-Sammler' },
	{ goal: 20, name: 'Kenner' }, { goal: 24, name: 'Komplettist' }
];
const FAVS: Tier[] = [
	{ goal: 1, name: 'Erster Favorit' }, { goal: 2, name: 'Zwei Lieblinge' }, { goal: 3, name: 'Lieblinge' },
	{ goal: 5, name: 'Treue Auswahl' }, { goal: 8, name: 'Großer Fan' }, { goal: 10, name: 'Fan-Club' },
	{ goal: 15, name: 'Super-Fan' }, { goal: 20, name: 'Maximal-Fan' }
];
const WL: Tier[] = [
	{ goal: 1, name: 'Erster Merker' }, { goal: 3, name: 'Kleine Liste' }, { goal: 5, name: 'Sammler' },
	{ goal: 10, name: 'Listen-Freund' }, { goal: 20, name: 'Listen-Profi' }, { goal: 35, name: 'Vielmerker' },
	{ goal: 50, name: 'Listen-Meister' }, { goal: 75, name: 'Mega-Liste' }, { goal: 100, name: 'Listen-Legende' }
];
const HOURS: Tier[] = [
	{ goal: 0.5, name: 'Erste Minuten' }, { goal: 1, name: 'Couch-Potato' }, { goal: 2, name: 'Warmgelaufen' },
	{ goal: 5, name: 'Serien-Snack' }, { goal: 10, name: 'Marathon-Starter' }, { goal: 15, name: 'Marathon' },
	{ goal: 25, name: 'Vielseher' }, { goal: 50, name: 'Halbtags-Streamer' }, { goal: 75, name: 'Dauerseher' },
	{ goal: 100, name: 'Hundert Stunden' }, { goal: 150, name: 'Bingewatcher' }, { goal: 200, name: 'Profi-Seher' },
	{ goal: 300, name: 'Couch-Veteran' }, { goal: 500, name: 'Streaming-Meister' }, { goal: 750, name: 'Streaming-Halbgott' },
	{ goal: 1000, name: 'Streaming-Legende' }
];

function iconFor(metric: Achievement['metric'], goal: number): string {
	if (metric === 'hours') return goal >= 500 ? '👑' : goal >= 100 ? '🏆' : '🛋️';
	if (metric === 'opens') return goal >= 500 ? '👑' : '🎬';
	if (metric === 'distinct') return '🧭';
	if (metric === 'favs') return goal >= 15 ? '💛' : '⭐';
	return goal >= 75 ? '📚' : '🔖';
}
function descFor(metric: Achievement['metric'], goal: number): string {
	switch (metric) {
		case 'opens': return `${goal} Streams gestartet`;
		case 'distinct': return `${goal} verschiedene Anbieter genutzt`;
		case 'favs': return `${goal} Favoriten markiert`;
		case 'wl': return `${goal} Titel auf der Watchlist`;
		case 'hours': return goal < 1 ? `${goal * 60} Minuten gestreamt` : `${goal} Stunden gestreamt`;
	}
}

function build(metric: Achievement['metric'], tiers: Tier[], value: number): Achievement[] {
	return tiers.map((t, i) => ({
		id: `${metric}-${i}`,
		name: t.name,
		desc: descFor(metric, t.goal),
		icon: iconFor(metric, t.goal),
		metric,
		value,
		goal: t.goal,
		progress: Math.max(0, Math.min(1, value / t.goal)),
		unlocked: value >= t.goal
	}));
}

export const achievements = derived(
	[favorites, watchlist, totalWatchMs, openCount, distinctProvidersWatched],
	([$fav, $wl, $total, $opens, $distinct]) => {
		const hours = $total / 3_600_000;
		return [
			...build('opens', OPENS, $opens),
			...build('distinct', DISTINCT, $distinct),
			...build('favs', FAVS, $fav.length),
			...build('wl', WL, $wl.length),
			...build('hours', HOURS, hours)
		];
	}
);

export const unlockedCount = derived(achievements, ($a) => $a.filter((x) => x.unlocked).length);

// --- Freischalt-Meldungen pro Profil (nur In-App-Toast) ---
export const celebrated = writable<string[]>([]);
let pid: string | null = null;
let celebReady = false;

export async function loadCelebratedForProfile(profileId: string, currentlyUnlockedIds: string[]): Promise<void> {
	pid = profileId;
	let saved = await loadState<string[] | null>(`celebrated:${profileId}`, null);
	if (saved == null) saved = currentlyUnlockedIds; // Baseline: keine Flut beim Profilwechsel
	celebrated.set(saved);
	celebReady = true;
}

export function maybeNotify(list: Achievement[], enabled: boolean): void {
	if (!celebReady || !browser) return;
	const seen = get(celebrated);
	const newly = list.filter((a) => a.unlocked && !seen.includes(a.id));
	if (newly.length === 0) return;
	celebrated.update((c) => [...c, ...newly.map((a) => a.id)]);
	if (!enabled) return;
	for (const a of newly) {
		pushToast('🏆 Achievement freigeschaltet', `${a.name} – ${a.desc}`, a.icon);
	}
}

if (browser) {
	celebrated.subscribe(($c) => { if (celebReady && pid) void saveState(`celebrated:${pid}`, $c); });
}
