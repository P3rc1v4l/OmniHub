<script lang="ts">
	import { onMount } from 'svelte';
	import { fetchWeekSchedule, type AiringItem } from '$lib/anilist';

	let items = $state<AiringItem[]>([]);
	let loading = $state(true);
	let failed = $state(false);
	let onlyCrunchyroll = $state(true);

	async function load() {
		loading = true;
		failed = false;
		try {
			items = await fetchWeekSchedule();
		} catch {
			failed = true;
		}
		loading = false;
	}
	onMount(load);

	const filtered = $derived(onlyCrunchyroll ? items.filter((i) => i.crunchyrollUrl) : items);

	function dayLabel(d: Date): string {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const dd = new Date(d);
		dd.setHours(0, 0, 0, 0);
		const diff = Math.round((dd.getTime() - today.getTime()) / 86400000);
		if (diff === 0) return 'Heute';
		if (diff === 1) return 'Morgen';
		return dd.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
	}
	function timeLabel(ts: number): string {
		return new Date(ts * 1000).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
	}

	const groups = $derived.by(() => {
		const m = new Map<string, { label: string; sort: number; items: AiringItem[] }>();
		for (const it of filtered) {
			const d = new Date(it.airingAt * 1000);
			const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
			if (!m.has(key)) {
				const dd = new Date(d);
				dd.setHours(0, 0, 0, 0);
				m.set(key, { label: dayLabel(d), sort: dd.getTime(), items: [] });
			}
			m.get(key)!.items.push(it);
		}
		const arr = [...m.values()].sort((a, b) => a.sort - b.sort);
		for (const g of arr) g.items.sort((a, b) => a.airingAt - b.airingAt);
		return arr;
	});
</script>

<div class="page">
	<div class="head">
		<div>
			<h1>CR Kalender</h1>
			<p class="sub">Anime-Ausstrahlungsplan der nächsten 7 Tage · Quelle: AniList</p>
		</div>
		<div class="controls">
			<label class="toggle"><input type="checkbox" bind:checked={onlyCrunchyroll} /> Nur Crunchyroll</label>
			<button class="refresh" onclick={load} disabled={loading}>↻ Aktualisieren</button>
		</div>
	</div>

	{#if loading}
		<div class="empty omni-card"><span class="emoji">⏳</span><p>Plan wird geladen …</p></div>
	{:else if failed}
		<div class="empty omni-card"><span class="emoji">⚠️</span><p>Konnte den Plan nicht laden. Internetverbindung prüfen und erneut versuchen.</p></div>
	{:else if groups.length === 0}
		<div class="empty omni-card">
			<span class="emoji">⛩️</span>
			<p>{onlyCrunchyroll ? 'Diese Woche keine als Crunchyroll markierten Anime gefunden. Tipp: „Nur Crunchyroll" ausschalten, um alle anstehenden Anime zu sehen.' : 'Diese Woche keine anstehenden Anime gefunden.'}</p>
		</div>
	{:else}
		{#each groups as g (g.label)}
			<div class="day">
				<div class="day-label">{g.label}</div>
				<div class="rows">
					{#each g.items as it (it.id + '-' + it.episode)}
						<div class="row omni-card">
							{#if it.cover}<img class="cover" src={it.cover} alt="" loading="lazy" />{/if}
							<div class="meta">
								<div class="title">{it.title}</div>
								<div class="line">Ep {it.episode} · {timeLabel(it.airingAt)}{#if it.crunchyrollUrl} · <span class="badge">Crunchyroll</span>{/if}</div>
							</div>
							{#if it.crunchyrollUrl}
								<a class="cr-btn" href={it.crunchyrollUrl} target="_blank" rel="noreferrer">▶ Crunchyroll</a>
							{:else if it.siteUrl}
								<a class="info-btn" href={it.siteUrl} target="_blank" rel="noreferrer">Info</a>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		{/each}
		<p class="foot">Crunchyroll-Markierung basiert auf AniList-Daten und kann unvollständig sein.</p>
	{/if}
</div>

<style>
	.page { padding: 22px 28px 36px; }
	.head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-bottom: 20px; }
	h1 { margin: 0; font-size: 26px; font-weight: 800; }
	.sub { color: var(--text-muted); margin: 4px 0 0; }
	.controls { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
	.toggle { display: inline-flex; align-items: center; gap: 8px; font-size: 14px; color: var(--text); cursor: pointer; }
	.refresh { background: var(--bg-elev); border: 1px solid var(--border); color: var(--text); border-radius: 8px; padding: 7px 12px; font-family: inherit; cursor: pointer; }
	.refresh:disabled { opacity: 0.5; cursor: default; }
	.empty { padding: 56px; text-align: center; color: var(--text-muted); }
	.emoji { font-size: 40px; display: block; margin-bottom: 10px; }
	.day { margin-bottom: 22px; }
	.day-label { font-size: 13px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--accent); margin-bottom: 10px; }
	.rows { display: flex; flex-direction: column; gap: 8px; }
	.row { display: flex; align-items: center; gap: 12px; padding: 8px 12px; }
	.cover { width: 44px; height: 62px; object-fit: cover; border-radius: 6px; flex-shrink: 0; }
	.meta { flex: 1; min-width: 0; }
	.title { font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
	.line { font-size: 13px; color: var(--text-muted); margin-top: 3px; }
	.badge { color: #f47521; font-weight: 700; }
	.cr-btn { background: #f47521; color: #fff; border-radius: 8px; padding: 7px 12px; font-size: 13px; font-weight: 600; text-decoration: none; white-space: nowrap; }
	.info-btn { background: var(--bg-elev); border: 1px solid var(--border); color: var(--text-muted); border-radius: 8px; padding: 7px 12px; font-size: 13px; text-decoration: none; white-space: nowrap; }
	.foot { color: var(--text-muted); font-size: 12px; margin-top: 18px; }
</style>
