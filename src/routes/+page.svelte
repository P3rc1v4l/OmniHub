<script lang="ts">
	import { visibleProviders, favoriteProviders, recentProviders, favorites, toggleFavorite, providerOrder, setProviderOrder } from '$lib/stores/providers';
	import { settings } from '$lib/stores/settings';
	import ProviderCard from '$lib/components/ProviderCard.svelte';
	import Logo from '$lib/components/Logo.svelte';
	import AddProviderModal from '$lib/components/AddProviderModal.svelte';
	import { tmdb } from '$lib/tmdb';
	import { addToWatchlist, watchlist, isInWatchlist } from '$lib/stores/watchlist';
	import type { TmdbItem } from '$lib/types';
	import { openProvider } from '$lib/embedded';

	let search = $state('');
	let view: 'grid' | 'list' = $state('grid');
	let showAdd = $state(false);
	let tmdbResults = $state<TmdbItem[]>([]);
	let searching = $state(false);
	let searchToken = 0;
	let dragId = $state<string | null>(null);

	// "Alle Anbieter": ohne Suche werden Favoriten ausgeblendet (sie stehen oben in
	// der Favoriten-Reihe). Reihenfolge: eigene (Drag&Drop) sonst alphabetisch.
	const sortedFiltered = $derived.by(() => {
		const q = search.trim().toLowerCase();
		let list = $visibleProviders.filter((p) =>
			!q || p.name.toLowerCase().includes(q) || p.subtitle.toLowerCase().includes(q)
		);
		if (!q) list = list.filter((p) => !$favorites.includes(p.id));
		const order = $providerOrder;
		if (order.length) {
			list = [...list].sort((a, b) => {
				const ia = order.indexOf(a.id), ib = order.indexOf(b.id);
				if (ia === -1 && ib === -1) return a.name.localeCompare(b.name, 'de');
				if (ia === -1) return 1;
				if (ib === -1) return -1;
				return ia - ib;
			});
		} else {
			list = [...list].sort((a, b) => a.name.localeCompare(b.name, 'de'));
		}
		return list;
	});

	function onDrop(targetId: string) {
		if (!dragId || dragId === targetId) { dragId = null; return; }
		const ids = sortedFiltered.map((p) => p.id);
		const from = ids.indexOf(dragId), to = ids.indexOf(targetId);
		if (from === -1 || to === -1) { dragId = null; return; }
		ids.splice(to, 0, ids.splice(from, 1)[0]);
		setProviderOrder(ids);
		dragId = null;
	}

	// Wenn die Suche keine Anbieter findet -> TMDB anfragen (mit Debounce)
	$effect(() => {
		const q = search.trim();
		if (q.length < 3) { tmdbResults = []; return; }
		const token = ++searchToken;
		const t = setTimeout(async () => {
			searching = true;
			const res = (await tmdb.search(q)) ?? [];
			if (token === searchToken) { tmdbResults = res.slice(0, 12); searching = false; }
		}, 350);
		return () => clearTimeout(t);
	});
</script>

<AddProviderModal open={showAdd} close={() => (showAdd = false)} />

<div class="page">
	<header class="top">
		<div class="search">
			<span class="ic">🔎</span>
			<input
				data-omni-search
				type="text"
				placeholder="Anbieter, Film, Serie, YouTube-URL…"
				bind:value={search}
			/>
		</div>
		<div class="tools">
			<button class="tool" title="Wieder alphabetisch sortieren (eigene Reihenfolge verwerfen)" onclick={() => setProviderOrder([])}>A↓Z</button>
			<button class="primary" onclick={() => (showAdd = true)}><span>＋</span> Anbieter</button>
			<div class="view">
				<button class:active={view === 'grid'} onclick={() => (view = 'grid')} aria-label="Rasteransicht" title="Raster">▦</button>
				<button class:active={view === 'list'} onclick={() => (view = 'list')} aria-label="Listenansicht" title="Liste">≡</button>
			</div>
		</div>
	</header>

	{#if $recentProviders.length && !search && $settings.plugins.continueWatching}
		<div class="section-label">Zuletzt geöffnet</div>
		<div class="chips">
			{#each $recentProviders as p (p.id)}
				<button class="chip" onclick={() => openProvider(p)} style="--c1: {p.color}; --c2: {p.color2 ?? p.color}">
					<Logo provider={p} size={24} />
					<span>{p.name}</span>
				</button>
			{/each}
		</div>
	{/if}

	{#if $favoriteProviders.length && !search}
		<div class="section-label">⭐ Favoriten</div>
		<div class="grid favs">
			{#each $favoriteProviders as p (p.id)}
				<ProviderCard provider={p} />
			{/each}
		</div>
	{/if}

	<div class="section-label">Alle Anbieter <span class="hint-inline">· Griff oben links zum Sortieren ziehen</span></div>
	{#if view === 'grid'}
		<div class="grid all">
			{#each sortedFiltered as p (p.id)}
				<div
					class="dragwrap"
					class:dragging={dragId === p.id}
					role="listitem"
					ondragover={(e) => e.preventDefault()}
					ondrop={(e) => { e.preventDefault(); onDrop(p.id); }}
				>
					<div
						class="drag-handle"
						draggable="true"
						role="button"
						tabindex="-1"
						title="Zum Sortieren ziehen"
						ondragstart={() => (dragId = p.id)}
						ondragend={() => (dragId = null)}
					>⠿</div>
					<ProviderCard provider={p} size="large" />
				</div>
			{/each}
		</div>
	{:else}
		<div class="list">
			{#each sortedFiltered as p (p.id)}
				<div
					class="lrow"
					class:dragging={dragId === p.id}
					ondragover={(e) => e.preventDefault()}
					ondrop={(e) => { e.preventDefault(); onDrop(p.id); }}
					style="--c1: {p.color}; --c2: {p.color2 ?? p.color}"
				>
					<span
						class="lgrip"
						draggable="true"
						role="button"
						tabindex="-1"
						title="Zum Sortieren ziehen"
						ondragstart={() => (dragId = p.id)}
						ondragend={() => (dragId = null)}
					>⠿</span>
					<button class="lopen" onclick={() => openProvider(p)} title={`${p.name} öffnen`}>
						<Logo provider={p} size={34} />
						<span class="lname">{p.name}</span>
						<span class="lsub">{p.subtitle}</span>
					</button>
					<span class="lq">{p.quality}</span>
					<button
						class="lfav"
						class:on={$favorites.includes(p.id)}
						onclick={() => toggleFavorite(p.id)}
						aria-label="Favorit umschalten"
						title={$favorites.includes(p.id) ? 'Favorit' : 'Zu Favoriten'}
					>{$favorites.includes(p.id) ? '★' : '☆'}</button>
				</div>
			{/each}
		</div>
	{/if}

	{#if search.trim().length >= 3}
		<div class="section-label" style="margin-top: 26px">Filme & Serien (TMDB)</div>
		{#if searching}
			<p class="muted">Suche läuft…</p>
		{:else if tmdbResults.length === 0}
			<p class="muted">Keine TMDB-Treffer. Ist der API-Key in <code>src-tauri/src/tmdb.rs</code> eingetragen?</p>
		{:else}
			<div class="tmdb">
				{#each tmdbResults as t (t.media_type + '-' + t.id)}
					<div class="tcard omni-card">
						{#if t.poster}
							<img src={t.poster} alt={t.title} loading="lazy" />
						{:else}
							<div class="noimg">?</div>
						{/if}
						<div class="tmeta">
							<div class="tt">{t.title}</div>
							<div class="ts">{t.media_type === 'tv' ? 'Serie' : 'Film'}{t.release_date ? ' · ' + t.release_date.slice(0, 4) : ''}</div>
							<button
								class="add"
								disabled={isInWatchlist($watchlist, t.id, t.media_type)}
								onclick={() => addToWatchlist(t)}
							>
								{isInWatchlist($watchlist, t.id, t.media_type) ? '✓ gemerkt' : '+ Watchlist'}
							</button>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	{/if}
</div>

<style>
	.page { padding: 22px 28px 36px; max-width: none; width: 100%; box-sizing: border-box; }
	.hint-inline { font-size: 11px; font-weight: 500; color: var(--text-dim); }
	.dragwrap { position: relative; }
	.drag-handle {
		position: absolute; top: 8px; left: 8px; z-index: 6;
		width: 26px; height: 22px; border-radius: 7px;
		display: grid; place-items: center;
		background: color-mix(in srgb, var(--bg-elev) 70%, transparent);
		color: var(--text-muted); font-size: 13px; cursor: grab;
		opacity: 0; transition: opacity 0.15s;
		backdrop-filter: blur(4px);
	}
	.dragwrap:hover .drag-handle { opacity: 1; }
	.drag-handle:active { cursor: grabbing; }
	.dragwrap.dragging, .lrow.dragging { opacity: 0.45; }
	.top { display: flex; gap: 14px; align-items: center; margin-bottom: 22px; }
	.search { flex: 1; display: flex; align-items: center; gap: 10px; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius); padding: 9px 16px; }
	.search input { flex: 1; background: transparent; border: 0; outline: 0; color: var(--text); font-size: 14px; font-family: inherit; }
	.ic { color: var(--text-muted); font-size: 14px; }
	.tools { display: flex; gap: 8px; align-items: center; }
	.tool, .view button, .primary {
		background: var(--bg-card); border: 1px solid var(--border);
		color: var(--text-muted); padding: 9px 14px; border-radius: 12px;
		cursor: pointer; font-family: inherit; font-size: 13px; font-weight: 600;
	}
	.primary { background: var(--accent-soft); color: var(--accent); border-color: var(--accent); display: inline-flex; gap: 6px; align-items: center; }
	.view { display: flex; gap: 4px; }
	.view button { padding: 8px 12px; }
	.view button.active { background: var(--accent-soft); color: var(--accent); border-color: var(--accent); }

	.chips { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
	.chip {
		display: inline-flex; align-items: center; gap: 8px;
		padding: 5px 12px 5px 5px;
		background: var(--bg-card); border: 1px solid var(--border);
		border-radius: 999px; cursor: pointer; color: var(--text); font-size: 13px;
	}
	.chip:hover { border-color: var(--border-strong); }

	.grid.favs { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 14px; margin-bottom: 22px; }
	.grid.all { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 14px; }

	.list { display: flex; flex-direction: column; gap: 8px; }
	.lrow {
		display: flex; align-items: center; gap: 14px;
		background: var(--bg-card); border: 1px solid var(--border);
		border-radius: 12px; padding: 8px 14px 8px 8px;
		border-left: 3px solid var(--c1);
	}
	.lrow:hover { border-color: var(--border-strong); }
	.lgrip { color: var(--text-dim); font-size: 14px; cursor: grab; padding: 0 2px; user-select: none; }
	.lgrip:active { cursor: grabbing; }
	.lopen {
		display: flex; align-items: center; gap: 12px; flex: 1;
		background: transparent; border: 0; color: var(--text); cursor: pointer;
		text-align: left; font-family: inherit; min-width: 0;
	}
	.lname { font-weight: 700; font-size: 14px; }
	.lsub { color: var(--text-muted); font-size: 12.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
	.lq { font-size: 11px; font-weight: 700; color: var(--text-muted); background: var(--bg-card-2); padding: 3px 8px; border-radius: 999px; }
	.lfav { background: transparent; border: 0; color: var(--text-dim); font-size: 18px; cursor: pointer; }
	.lfav.on { color: #facc15; }

	.tmdb { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 12px; }
	.tcard { padding: 0; overflow: hidden; display: flex; flex-direction: column; }
	.tcard img { width: 100%; aspect-ratio: 2/3; object-fit: cover; }
	.noimg { aspect-ratio: 2/3; display: grid; place-items: center; background: var(--bg-card-2); color: var(--text-dim); font-size: 32px; }
	.tmeta { padding: 10px 12px; display: flex; flex-direction: column; gap: 4px; }
	.tt { font-weight: 600; font-size: 13px; line-height: 1.25; }
	.ts { color: var(--text-muted); font-size: 11.5px; }
	.add {
		margin-top: 6px; background: var(--accent-soft); color: var(--accent);
		border: 1px solid var(--accent); padding: 6px 10px; border-radius: 8px;
		cursor: pointer; font-size: 12px; font-weight: 600;
	}
	.add:disabled { opacity: 0.6; cursor: default; }
	.muted { color: var(--text-muted); font-size: 13px; }
	code { background: var(--bg-card); padding: 1px 6px; border-radius: 5px; }
</style>
