<script lang="ts">
	import { watchlist } from '$lib/stores/watchlist';
	import { watchTime, totalWatchMs, openCount, distinctProvidersWatched, formatDuration } from '$lib/stores/tracking';
	import { achievements, unlockedCount } from '$lib/stores/achievements';
	import { providers, favorites } from '$lib/stores/providers';
	import Logo from '$lib/components/Logo.svelte';

	const favCount = $derived($favorites.length);

	// Top-Anbieter nach Streamzeit
	const topProviders = $derived.by(() => {
		const entries = Object.entries($watchTime)
			.filter(([, ms]) => ms > 0)
			.sort((a, b) => b[1] - a[1])
			.slice(0, 6);
		const max = entries.length ? entries[0][1] : 1;
		return entries.map(([id, ms]) => ({
			provider: $providers.find((p) => p.id === id),
			ms,
			pct: Math.round((ms / max) * 100)
		})).filter((x) => x.provider);
	});
</script>

<div class="page">
	<h1>Statistiken</h1>
	<p class="sub">Deine Nutzung und freigeschalteten Achievements.</p>

	<div class="cards">
		<div class="stat omni-card"><span class="big">{formatDuration($totalWatchMs)}</span><span>Gesamte Streamzeit</span></div>
		<div class="stat omni-card"><span class="big">{$openCount}</span><span>Gestartete Streams</span></div>
		<div class="stat omni-card"><span class="big">{$distinctProvidersWatched}</span><span>Genutzte Anbieter</span></div>
		<div class="stat omni-card"><span class="big">{favCount}</span><span>Favoriten</span></div>
		<div class="stat omni-card"><span class="big">{$watchlist.length}</span><span>Watchlist-Titel</span></div>
		<div class="stat omni-card"><span class="big">{$unlockedCount} / {$achievements.length}</span><span>Achievements</span></div>
	</div>

	{#if topProviders.length}
		<h2>Meistgenutzte Anbieter</h2>
		<div class="bars omni-card">
			{#each topProviders as t}
				<div class="bar-row">
					<div class="bl">
						<Logo provider={t.provider} size={26} />
						<span class="bn">{t.provider?.name}</span>
					</div>
					<div class="track"><div class="fill" style="width: {t.pct}%; background: {t.provider?.color}"></div></div>
					<span class="bt">{formatDuration(t.ms)}</span>
				</div>
			{/each}
		</div>
	{/if}

	<h2>Achievements</h2>
	<div class="ach">
		{#each $achievements as a (a.id)}
			<div class="aitem omni-card" class:on={a.unlocked}>
				<div class="badge">{a.unlocked ? a.icon : '🔒'}</div>
				<div class="ainfo">
					<div class="aname">{a.name}</div>
					<div class="adesc">{a.desc}</div>
					{#if !a.unlocked}
						<div class="aprog"><div class="afill" style="width: {a.progress * 100}%"></div></div>
					{/if}
				</div>
			</div>
		{/each}
	</div>

	<p class="hint">Streamzeit wird gemessen, solange ein Anbieter-Fenster offen ist (Aktualisierung alle 15 Sekunden sowie beim Schließen).</p>
</div>

<style>
	.page { padding: 22px 28px 36px; }
	h1 { margin: 0; font-size: 26px; font-weight: 800; }
	h2 { margin: 28px 0 10px; font-size: 16px; font-weight: 700; }
	.sub { color: var(--text-muted); margin: 4px 0 22px; }
	.cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; }
	.stat { padding: 18px; display: flex; flex-direction: column; gap: 4px; }
	.big { font-size: 22px; font-weight: 800; color: var(--accent); }
	.stat span:last-child { color: var(--text-muted); font-size: 12px; }

	.bars { padding: 16px 18px; display: flex; flex-direction: column; gap: 12px; }
	.bar-row { display: flex; align-items: center; gap: 12px; }
	.bl { display: flex; align-items: center; gap: 10px; width: 180px; flex-shrink: 0; }
	.bn { font-size: 13px; font-weight: 600; }
	.track { flex: 1; height: 10px; background: var(--bg-card-2); border-radius: 999px; overflow: hidden; }
	.fill { height: 100%; border-radius: 999px; }
	.bt { width: 80px; text-align: right; color: var(--text-muted); font-size: 12px; flex-shrink: 0; }

	.ach { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 10px; }
	.aitem { display: flex; gap: 12px; padding: 12px 14px; align-items: center; opacity: 0.6; }
	.aitem.on { opacity: 1; border-color: var(--accent); }
	.badge { font-size: 22px; flex-shrink: 0; }
	.ainfo { flex: 1; min-width: 0; }
	.aname { font-weight: 700; font-size: 13.5px; }
	.adesc { color: var(--text-muted); font-size: 12px; }
	.aprog { height: 5px; background: var(--bg-card-2); border-radius: 999px; margin-top: 6px; overflow: hidden; }
	.afill { height: 100%; background: var(--accent); border-radius: 999px; }
	.hint { color: var(--text-muted); font-size: 12.5px; margin-top: 18px; }
</style>
