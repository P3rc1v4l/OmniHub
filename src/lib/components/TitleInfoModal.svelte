<script lang="ts">
	import { titleInfo, closeTitleInfo, tmdb } from '$lib/tmdb';
	import { watchlist, addToWatchlist, removeFromWatchlist, isInWatchlist } from '$lib/stores/watchlist';
	import { openUrlInApp } from '$lib/embedded';

	let details = $state<Record<string, any> | null>(null);
	let loading = $state(false);
	let loadedId = 0; // nicht-reaktiver Lade-Merker

	$effect(() => {
		const item = $titleInfo;
		if (!item) { details = null; loadedId = 0; return; }
		if (item.id === loadedId) return;
		loadedId = item.id;
		loading = true;
		details = null;
		const mt = (item.media_type === 'tv' ? 'tv' : 'movie') as 'movie' | 'tv';
		tmdb.details(mt, item.id).then((d) => {
			if ($titleInfo?.id === item.id) {
				details = d as Record<string, any>;
				loading = false;
			}
		});
	});

	const trailerKey = $derived.by(() => {
		const vids: any[] = details?.videos?.results ?? [];
		const yt = vids.filter((v) => v.site === 'YouTube');
		const t = yt.find((v) => v.type === 'Trailer') || yt.find((v) => v.type === 'Teaser') || yt[0];
		return t?.key ?? null;
	});

	// Bekannte Anbieter -> Suche/Startseite (Login-Sitzung wird über die id geteilt,
	// passend zu den Anbieter-Kacheln in OmniHub). Unbekannte -> JustWatch-Link des Titels.
	const PROVIDER_MAP: Record<string, { id: string; url: (t: string) => string }> = {
		'Netflix': { id: 'netflix', url: (t) => `https://www.netflix.com/search?q=${encodeURIComponent(t)}` },
		'Amazon Prime Video': { id: 'prime-video', url: (t) => `https://www.amazon.de/s?k=${encodeURIComponent(t)}&i=instant-video` },
		'Amazon Video': { id: 'prime-video', url: (t) => `https://www.amazon.de/s?k=${encodeURIComponent(t)}&i=instant-video` },
		'Disney Plus': { id: 'disney-plus', url: (t) => `https://www.disneyplus.com/search?q=${encodeURIComponent(t)}` },
		'Crunchyroll': { id: 'crunchyroll', url: (t) => `https://www.crunchyroll.com/search?q=${encodeURIComponent(t)}` },
		'WOW': { id: 'wow', url: () => 'https://www.wowtv.de/' },
		'Apple TV Plus': { id: 'apple-tv-plus', url: (t) => `https://tv.apple.com/search?term=${encodeURIComponent(t)}` },
		'Apple TV': { id: 'apple-tv-plus', url: (t) => `https://tv.apple.com/search?term=${encodeURIComponent(t)}` },
		'RTL+': { id: 'rtl-plus', url: (t) => `https://plus.rtl.de/suche?q=${encodeURIComponent(t)}` },
		'Joyn': { id: 'joyn', url: (t) => `https://www.joyn.de/suche?q=${encodeURIComponent(t)}` },
		'Joyn Plus': { id: 'joyn', url: (t) => `https://www.joyn.de/suche?q=${encodeURIComponent(t)}` },
		'MagentaTV': { id: 'magenta-tv', url: () => 'https://web.magentatv.de/' },
		'Paramount Plus': { id: 'paramount-plus', url: (t) => `https://www.paramountplus.com/search/?query=${encodeURIComponent(t)}` },
		'YouTube': { id: 'youtube', url: (t) => `https://www.youtube.com/results?search_query=${encodeURIComponent(t)}` }
	};
	function resolveTarget(name: string, title: string, fallback: string | null): { url: string; id: string } {
		const m = PROVIDER_MAP[name];
		if (m) return { url: m.url(title), id: m.id };
		return { url: fallback || `https://www.google.com/search?q=${encodeURIComponent(`${title} ${name} stream`)}`, id: 'web-info' };
	}

	const providers = $derived.by(() => {
		const wp = details?.['watch/providers']?.results ?? {};
		const region = wp['DE'] ?? wp['US'] ?? null;
		if (!region) return [] as { name: string; logo: string; url: string; id: string }[];
		const link: string | null = region.link ?? null;
		const title = $titleInfo?.title ?? '';
		const seen = new Set<number>();
		const out: { name: string; logo: string; url: string; id: string }[] = [];
		for (const key of ['flatrate', 'free', 'ads', 'rent', 'buy']) {
			for (const p of region[key] ?? []) {
				if (seen.has(p.provider_id)) continue;
				seen.add(p.provider_id);
				const t = resolveTarget(p.provider_name, title, link);
				out.push({ name: p.provider_name, logo: `https://image.tmdb.org/t/p/w92${p.logo_path}`, url: t.url, id: t.id });
			}
		}
		return out;
	});

	const IMG = 'https://image.tmdb.org/t/p';
	const poster = $derived($titleInfo?.poster || (details?.poster_path ? `${IMG}/w342${details.poster_path}` : null));
	const backdrop = $derived($titleInfo?.backdrop || (details?.backdrop_path ? `${IMG}/w780${details.backdrop_path}` : null));
	const overview = $derived($titleInfo?.overview || details?.overview || '');
	const year = $derived(($titleInfo?.release_date || details?.release_date || details?.first_air_date || '').slice(0, 4));
	const genres = $derived(((details?.genres ?? []) as any[]).map((g) => g.name).slice(0, 4));
	const runtime = $derived(details?.runtime || details?.episode_run_time?.[0] || null);
	const ratingRaw = $derived($titleInfo?.vote_average ?? details?.vote_average ?? null);
	const rating = $derived(ratingRaw ? Math.round(ratingRaw * 10) / 10 : null);

	function toggleWatchlist() {
		const item = $titleInfo;
		if (!item) return;
		const mt = (item.media_type === 'tv' ? 'tv' : 'movie') as 'movie' | 'tv';
		if (isInWatchlist($watchlist, item.id, item.media_type)) removeFromWatchlist(item.id, mt);
		else addToWatchlist(item);
	}
	function onKey(e: KeyboardEvent) { if (e.key === 'Escape') closeTitleInfo(); }

	function openProviderLink(p: { name: string; url: string; id: string }) {
		const title = $titleInfo?.title ?? '';
		closeTitleInfo();
		openUrlInApp(title, p.url, p.id, p.name);
	}
</script>

<svelte:window onkeydown={onKey} />

{#if $titleInfo}
	{@const item = $titleInfo}
	<div class="overlay" onclick={closeTitleInfo} role="presentation">
		<div class="modal" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
			<button class="close" onclick={closeTitleInfo} aria-label="Schließen">✕</button>

			<div class="hero">
				{#if backdrop}<img class="backdrop" src={backdrop} alt="" />{/if}
				<div class="hero-fade"></div>
				<div class="hero-row">
					{#if poster}<img class="poster" src={poster} alt="" />{/if}
					<div class="hero-meta">
						<h2>{item.title}</h2>
						<div class="chips">
							<span class="kind">{item.media_type === 'tv' ? 'Serie' : 'Film'}</span>
							{#if year}<span>{year}</span>{/if}
							{#if rating}<span class="star">★ {rating}</span>{/if}
							{#if runtime}<span>{runtime} Min</span>{/if}
						</div>
						{#if genres.length}
							<div class="genres">{#each genres as g}<span class="genre">{g}</span>{/each}</div>
						{/if}
					</div>
				</div>
			</div>

			<div class="content">
				{#if loading}
					<p class="muted">Lade Details …</p>
				{/if}

				{#if overview}
					<p class="overview">{overview}</p>
				{:else if !loading}
					<p class="muted">Keine Beschreibung verfügbar.</p>
				{/if}

				{#if trailerKey}
					<div class="block">
						<div class="block-label">Trailer</div>
						<div class="video">
							<iframe
								src={`https://www.youtube-nocookie.com/embed/${trailerKey}`}
								title="Trailer"
								loading="lazy"
								allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
								allowfullscreen
							></iframe>
						</div>
					</div>
				{/if}

				{#if providers.length}
					<div class="block">
						<div class="block-label">Wo streamen (DE)</div>
						<div class="provs">
							{#each providers as p (p.name)}
								<button class="prov" title={`${p.name} öffnen`} onclick={() => openProviderLink(p)}>
									<img src={p.logo} alt={p.name} loading="lazy" />
								</button>
							{/each}
						</div>
						<p class="src">Klick öffnet den Anbieter in OmniHub (sofern angemeldet) · Anbieterdaten: JustWatch via TMDB</p>
					</div>
				{:else if !loading}
					<p class="muted small">Keine Streaming-Info für Deutschland gefunden.</p>
				{/if}

				<div class="footer">
					<button class="wl" class:on={isInWatchlist($watchlist, item.id, item.media_type)} onclick={toggleWatchlist}>
						{isInWatchlist($watchlist, item.id, item.media_type) ? '✓ Gemerkt' : '+ Merken'}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.overlay { position: fixed; inset: 0; z-index: 1000; background: rgba(0,0,0,0.66); backdrop-filter: blur(6px); display: grid; place-items: center; padding: 24px; animation: fade 0.18s ease; }
	.modal {
		width: min(720px, 96vw); max-height: 90vh; overflow-y: auto; position: relative;
		background: var(--bg-elev); border: 1px solid var(--border); border-radius: 18px; box-shadow: 0 30px 80px -30px rgba(0,0,0,0.85);
		animation: pop 0.2s cubic-bezier(0.2, 0.8, 0.3, 1);
	}
	.modal::-webkit-scrollbar { width: 10px; } .modal::-webkit-scrollbar-thumb { background: var(--border); border-radius: 8px; }
	.close { position: absolute; top: 12px; right: 12px; z-index: 3; width: 34px; height: 34px; border-radius: 50%; background: rgba(0,0,0,0.55); color: #fff; border: 1px solid rgba(255,255,255,0.18); cursor: pointer; font-size: 14px; backdrop-filter: blur(4px); }
	.close:hover { background: rgba(0,0,0,0.8); }

	.hero { position: relative; }
	.backdrop { width: 100%; height: 240px; object-fit: cover; display: block; opacity: 0.55; }
	.hero-fade { position: absolute; inset: 0; background: linear-gradient(180deg, transparent 20%, color-mix(in srgb, var(--bg-elev) 70%, transparent) 70%, var(--bg-elev)); }
	.hero-row { position: absolute; left: 0; right: 0; bottom: 0; display: flex; gap: 18px; padding: 22px; align-items: flex-end; }
	.poster { width: 104px; height: 156px; object-fit: cover; border-radius: 12px; flex-shrink: 0; box-shadow: 0 12px 30px -10px rgba(0,0,0,0.8); border: 1px solid var(--border); }
	.hero-meta { min-width: 0; padding-bottom: 4px; }
	h2 { margin: 0 0 8px; font-size: 24px; font-weight: 800; line-height: 1.15; letter-spacing: -0.02em; }
	.chips { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; font-size: 13px; color: var(--text-muted); }
	.chips .kind { color: var(--accent); font-weight: 700; }
	.chips .star { color: #fbbf24; font-weight: 700; }
	.genres { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
	.genre { font-size: 11px; font-weight: 600; color: var(--text); background: color-mix(in srgb, var(--accent) 14%, transparent); border: 1px solid color-mix(in srgb, var(--accent) 30%, transparent); padding: 3px 9px; border-radius: 999px; }

	.content { padding: 6px 22px 22px; }
	.overview { line-height: 1.6; color: var(--text); margin: 6px 0 0; }
	.muted { color: var(--text-muted); } .small { font-size: 13px; }
	.block { margin-top: 22px; }
	.block-label { font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-muted); margin-bottom: 10px; }
	.video { position: relative; width: 100%; aspect-ratio: 16 / 9; border-radius: 12px; overflow: hidden; background: #000; border: 1px solid var(--border); }
	.video iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; }
	.provs { display: flex; flex-wrap: wrap; gap: 10px; }
	.prov { padding: 0; border: 0; background: none; cursor: pointer; border-radius: 11px; transition: transform 0.15s ease; }
	.prov:hover { transform: translateY(-2px); }
	.prov img { width: 46px; height: 46px; border-radius: 11px; object-fit: cover; border: 1px solid var(--border); display: block; transition: border-color 0.15s ease, box-shadow 0.15s ease; }
	.prov:hover img { border-color: color-mix(in srgb, var(--accent) 60%, transparent); box-shadow: 0 6px 16px -6px rgba(0,0,0,0.6); }
	.src { font-size: 11px; color: var(--text-muted); margin-top: 10px; }
	.footer { margin-top: 24px; display: flex; gap: 10px; }
	.wl { background: var(--accent); color: #00110f; border: none; border-radius: 10px; padding: 11px 20px; font-family: inherit; font-weight: 700; font-size: 14px; cursor: pointer; transition: filter 0.15s ease; }
	.wl:hover { filter: brightness(1.06); }
	.wl.on { background: color-mix(in srgb, var(--accent) 22%, var(--bg-card)); color: var(--accent); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--accent) 45%, transparent); }

	@keyframes fade { from { opacity: 0; } }
	@keyframes pop { from { opacity: 0; transform: scale(0.96) translateY(10px); } }
</style>
