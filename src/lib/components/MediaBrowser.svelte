<script lang="ts">
	import { tmdb, openTitleInfo, titleInfo } from '$lib/tmdb';
	import { hiddenTitles, isHidden, hideTitle, showHidden } from '$lib/stores/hidden';
	import type { TmdbItem } from '$lib/types';

	let { kind = 'news' }: { kind?: 'news' | 'upcoming' } = $props();

	type Cat = 'movie' | 'tv' | 'anime';
	type Mode = 'trending' | 'new';

	let category = $state<Cat>('movie');
	let mode = $state<Mode>('trending');
	let items = $state<TmdbItem[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let focused = $state(0);
	let paused = $state(false);
	let stripEl = $state<HTMLDivElement | null>(null);

	const cache = new Map<string, TmdbItem[]>();
	const today = new Date().toISOString().slice(0, 10);

	function queryFor(cat: Cat, m: Mode): { path: string; params: [string, string][]; fb: 'movie' | 'tv' } {
		if (kind === 'upcoming') {
			if (cat === 'movie') return { path: '/movie/upcoming', params: [['region', 'DE']], fb: 'movie' };
			if (cat === 'tv')
				return { path: '/discover/tv', params: [['sort_by', 'first_air_date.asc'], ['first_air_date.gte', today]], fb: 'tv' };
			return {
				path: '/discover/tv',
				params: [['with_genres', '16'], ['with_origin_country', 'JP'], ['first_air_date.gte', today], ['sort_by', 'first_air_date.asc']],
				fb: 'tv'
			};
		}
		if (cat === 'movie')
			return m === 'new'
				? { path: '/movie/now_playing', params: [['region', 'DE']], fb: 'movie' }
				: { path: '/trending/movie/week', params: [['region', 'DE']], fb: 'movie' };
		if (cat === 'tv')
			return m === 'new'
				? { path: '/tv/on_the_air', params: [['region', 'DE']], fb: 'tv' }
				: { path: '/trending/tv/week', params: [['region', 'DE']], fb: 'tv' };
		return m === 'new'
			? { path: '/discover/tv', params: [['with_genres', '16'], ['with_origin_country', 'JP'], ['sort_by', 'first_air_date.desc']], fb: 'tv' }
			: { path: '/discover/tv', params: [['with_genres', '16'], ['with_origin_country', 'JP'], ['sort_by', 'popularity.desc']], fb: 'tv' };
	}

	async function load(cat: Cat, m: Mode) {
		const key = `${kind}-${cat}-${m}`;
		if (cache.has(key)) {
			items = cache.get(key)!;
			focused = 0;
			paused = false;
			loading = false;
			error = null;
			return;
		}
		loading = true;
		error = null;
		const { path, params, fb } = queryFor(cat, m);
		const res = await tmdb.list(path, params, fb);
		if (!res || res.length === 0) {
			error = 'Keine Daten von TMDB. Ist der API-Key in src-tauri/src/tmdb.rs eingetragen und besteht eine Internetverbindung?';
			items = [];
		} else {
			cache.set(key, res);
			items = res;
		}
		focused = 0;
		paused = false;
		loading = false;
	}

	// Bei Wechsel von Kategorie/Modus (und initial) laden.
	$effect(() => {
		const c = category;
		const m = mode;
		load(c, m);
	});

	const visible = $derived(items.filter((t) => !isHidden($hiddenTitles, t.id, t.media_type)));
	const clamped = $derived(visible.length ? Math.min(focused, visible.length - 1) : 0);
	const hero = $derived(visible[clamped] ?? null);
	const heroImg = $derived(hero ? (hero.backdrop ?? hero.poster ?? '') : '');
	const heroRating = $derived(hero?.vote_average ? hero.vote_average.toFixed(1) : null);

	// Fokussiertes Poster in Sicht scrollen.
	$effect(() => {
		const i = clamped;
		const el = stripEl?.querySelector(`[data-i="${i}"]`) as HTMLElement | null;
		el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
	});

	// Automatischer Wechsel alle 7 s – pausiert bei Klick, bei offenem Fenster
	// und wenn es nur einen Titel gibt.
	$effect(() => {
		if (paused || $showHidden || $titleInfo) return;
		const n = visible.length;
		if (n <= 1) return;
		const id = setInterval(() => {
			const m = visible.length;
			if (m > 1) focused = (clamped + 1) % m;
		}, 7000);
		return () => clearInterval(id);
	});

	function go(d: number) {
		paused = true;
		const n = visible.length;
		if (!n) return;
		focused = (clamped + d + n) % n;
	}
	function pick(i: number) {
		paused = true;
		focused = i;
	}
	function openHero() {
		paused = true;
		if (hero) openTitleInfo(hero);
	}
	function hide(e: Event, t: TmdbItem) {
		e.stopPropagation();
		paused = true;
		hideTitle(t);
	}

	const cats: { id: Cat; label: string }[] = [
		{ id: 'movie', label: 'Filme' },
		{ id: 'tv', label: 'Serien' },
		{ id: 'anime', label: 'Anime' }
	];
	const year = (d: string | null) => (d && d.length >= 4 ? d.slice(0, 4) : '');
	const fallbackTitle = kind === 'upcoming' ? 'Upcoming' : 'Neuigkeiten';
</script>

<div class="browser">
	<div class="topbar">
		<div class="tabs">
			{#each cats as c (c.id)}
				<button class="tab" class:on={category === c.id} onclick={() => (category = c.id)}>{c.label}</button>
			{/each}
		</div>

		<div class="title">{hero?.title ?? fallbackTitle}</div>

		<div class="right">
			{#if kind === 'news'}
				<div class="seg">
					<button class="s" class:on={mode === 'trending'} onclick={() => (mode = 'trending')}>Trending</button>
					<button class="s" class:on={mode === 'new'} onclick={() => (mode = 'new')}>Neu</button>
				</div>
			{/if}
			<button class="eye" onclick={() => showHidden.set(true)} title="Ausgeblendete Titel" aria-label="Ausgeblendete Titel">
				<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8">
					<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" /><circle cx="12" cy="12" r="3" />
				</svg>
				{#if $hiddenTitles.length}<span class="cnt">{$hiddenTitles.length}</span>{/if}
			</button>
		</div>
	</div>

	<div class="hero">
		{#if loading}
			<div class="state">Lädt…</div>
		{:else if error}
			<div class="state err">{error}</div>
		{:else if !hero}
			<div class="state">Keine Titel – alle ausgeblendet? Über das Auge oben rechts wieder einblenden.</div>
		{:else}
			{#if heroImg}<div class="back" style="background-image: url({heroImg})"></div>{/if}
			<div class="shade"></div>
			<button class="open" onclick={openHero} title="Details anzeigen" aria-label={`Infos zu ${hero.title}`}></button>
			<button class="nav left" onclick={() => go(-1)} aria-label="Vorheriger Titel">‹</button>
			<button class="nav right" onclick={() => go(1)} aria-label="Nächster Titel">›</button>

			{#key hero.media_type + '-' + hero.id}
				<div class="info">
					<h2 class="htitle">{hero.title}</h2>
					<div class="meta">
						{#if heroRating}<span class="rate">★ {heroRating}</span>{/if}
						{#if year(hero.release_date)}<span>{year(hero.release_date)}</span>{/if}
						<span>{hero.media_type === 'tv' ? 'Serie' : 'Film'}</span>
					</div>
					{#if hero.overview}<p class="desc">{hero.overview}</p>{/if}
					<button class="details" onclick={openHero}>Details ansehen</button>
				</div>
			{/key}
		{/if}
	</div>

	{#if !loading && !error && visible.length}
		<div class="strip" bind:this={stripEl}>
			{#each visible as t, i (t.media_type + '-' + t.id)}
				<div class="cell" data-i={i}>
					<div class="thumb" class:on={i === clamped}>
						<button class="pbtn" onclick={() => pick(i)} title={t.title} aria-label={t.title}>
							{#if t.poster}<img src={t.poster} alt={t.title} loading="lazy" />{:else}<div class="noimg">?</div>{/if}
						</button>
						<button class="hidebtn" onclick={(e) => hide(e, t)} title="Ausblenden" aria-label="Titel ausblenden">
							<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.9">
								<path d="M3 3l18 18M10.6 5.1A10.9 10.9 0 0 1 12 5c7 0 11 7 11 7a18 18 0 0 1-3.2 4M6.6 6.6A18 18 0 0 0 1 12s4 7 11 7a10.9 10.9 0 0 0 4-.7" />
							</svg>
						</button>
					</div>
					<div class="cardt">{t.title}</div>
					<div class="cardy">{year(t.release_date)}</div>
				</div>
			{/each}
		</div>

		<div class="dots">
			{#each visible as t, i (t.media_type + '-d-' + t.id)}
				<button class="dot" class:on={i === clamped} onclick={() => pick(i)} aria-label={`Titel ${i + 1}`}></button>
			{/each}
		</div>
	{/if}
</div>

<style>
	.browser { height: 100%; display: flex; flex-direction: column; background: #0b0c10; color: #fff; position: relative; min-height: 0; }

	.topbar { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 12px; padding: 12px 20px; }
	.tabs { justify-self: start; display: flex; gap: 18px; }
	.tab { background: none; border: 0; color: var(--text-muted); font-family: inherit; font-weight: 700; font-size: 15px; padding: 2px 0; cursor: pointer; border-bottom: 2px solid transparent; transition: color 0.15s, border-color 0.15s; }
	.tab.on { color: #fff; border-bottom-color: var(--accent); }
	.tab:hover { color: #fff; }
	.title { justify-self: center; text-align: center; font-weight: 800; font-size: 17px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 42vw; }
	.right { justify-self: end; display: flex; align-items: center; gap: 10px; }

	.seg { display: inline-flex; background: var(--bg-elev); border: 1px solid var(--border); border-radius: 999px; padding: 3px; }
	.s { border: 0; background: none; color: var(--text-muted); font-family: inherit; font-weight: 700; font-size: 13px; padding: 5px 15px; border-radius: 999px; cursor: pointer; }
	.s.on { background: var(--accent); color: #00110f; }
	.eye { position: relative; background: var(--bg-elev); border: 1px solid var(--border); color: var(--text); width: 38px; height: 32px; border-radius: 9px; display: grid; place-items: center; cursor: pointer; }
	.eye:hover { border-color: color-mix(in srgb, var(--accent) 55%, transparent); }
	.cnt { position: absolute; top: -6px; right: -6px; background: var(--accent); color: #00110f; font-size: 10px; font-weight: 800; min-width: 16px; height: 16px; border-radius: 999px; display: grid; place-items: center; padding: 0 4px; }

	.hero { position: relative; flex: 1; min-height: 0; overflow: hidden; }
	.back { position: absolute; inset: 0; background-size: cover; background-position: center 18%; }
	.shade { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(11,12,16,0.25) 0%, rgba(11,12,16,0.12) 45%, rgba(11,12,16,0.85) 100%); }
	.open { position: absolute; inset: 0; z-index: 2; background: none; border: 0; cursor: pointer; }
	.nav { position: absolute; top: 50%; transform: translateY(-50%); z-index: 5; width: 42px; height: 66px; border-radius: 10px; background: rgba(0,0,0,0.32); border: 0; color: #fff; font-size: 30px; line-height: 1; cursor: pointer; display: grid; place-items: center; transition: background 0.15s; }
	.nav.left { left: 14px; }
	.nav.right { right: 14px; }
	.nav:hover { background: rgba(0,0,0,0.6); }
	.state { position: absolute; inset: 0; display: grid; place-items: center; color: var(--text-muted); padding: 24px; text-align: center; }
	.state.err { color: #fca5a5; max-width: 640px; margin: 0 auto; }

	.info { position: absolute; left: 48px; right: 48px; bottom: 26px; z-index: 3; max-width: 640px; animation: heroFade 0.45s ease; }
	.htitle { margin: 0 0 8px; font-size: 30px; font-weight: 800; line-height: 1.1; text-shadow: 0 2px 14px rgba(0, 0, 0, 0.65); }
	.meta { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; font-size: 13px; color: rgba(255, 255, 255, 0.9); margin-bottom: 10px; text-shadow: 0 1px 6px rgba(0, 0, 0, 0.6); }
	.rate { color: #facc15; font-weight: 800; }
	.desc { margin: 0 0 14px; font-size: 14px; line-height: 1.5; color: rgba(255, 255, 255, 0.88); display: -webkit-box; -webkit-line-clamp: 3; line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; text-shadow: 0 1px 6px rgba(0, 0, 0, 0.55); }
	.details { background: var(--accent); color: #00110f; border: 0; border-radius: 9px; padding: 9px 18px; font-family: inherit; font-weight: 700; font-size: 13.5px; cursor: pointer; }
	.details:hover { filter: brightness(1.08); }
	@keyframes heroFade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

	.strip { display: flex; gap: 14px; overflow-x: auto; padding: 14px 20px 4px; }
	.cell { flex: 0 0 132px; width: 132px; }
	.thumb { position: relative; width: 100%; aspect-ratio: 2 / 3; border-radius: 10px; overflow: hidden; border: 2px solid transparent; box-sizing: border-box; background: var(--bg-card-2); transition: border-color 0.15s, transform 0.15s; }
	.thumb:hover { transform: translateY(-2px); }
	.thumb.on { border-color: var(--accent); }
	.pbtn { display: block; width: 100%; height: 100%; padding: 0; border: 0; background: none; cursor: pointer; }
	.pbtn img { width: 100%; height: 100%; object-fit: cover; display: block; }
	.noimg { width: 100%; height: 100%; display: grid; place-items: center; background: var(--bg-card-2); font-size: 28px; color: var(--text-dim); }
	.hidebtn { position: absolute; top: 6px; right: 6px; width: 26px; height: 26px; border-radius: 7px; background: rgba(0,0,0,0.55); border: 0; color: #fff; display: grid; place-items: center; cursor: pointer; opacity: 0; transition: opacity 0.15s, background 0.15s; }
	.thumb:hover .hidebtn { opacity: 1; }
	.hidebtn:hover { background: rgba(220,45,45,0.85); }
	.cardt { margin-top: 7px; font-size: 12.5px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
	.cardy { font-size: 11px; color: var(--text-muted); }

	.dots { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; padding: 8px 20px 14px; }
	.dot { width: 7px; height: 7px; border-radius: 999px; background: rgba(255,255,255,0.25); border: 0; cursor: pointer; padding: 0; transition: width 0.15s, background 0.15s; }
	.dot.on { background: var(--accent); width: 18px; }
</style>
