<script lang="ts">
	import { onMount } from 'svelte';
	import { settings, sleepTimerEndsAt } from '$lib/stores/settings';

	let now = $state(Date.now());
	onMount(() => {
		const id = setInterval(() => (now = Date.now()), 1000);
		return () => clearInterval(id);
	});

	const remaining = $derived.by(() => {
		const ends = $sleepTimerEndsAt;
		if (!ends) return null;
		const ms = ends - now;
		if (ms <= 0) return null;
		const t = Math.ceil(ms / 1000);
		const h = Math.floor(t / 3600);
		const m = Math.floor((t % 3600) / 60);
		const s = t % 60;
		return h > 0
			? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
			: `${m}:${String(s).padStart(2, '0')}`;
	});

	function cancel() {
		settings.update((st) => ({ ...st, plugins: { ...st.plugins, sleepTimerEnabled: false } }));
	}
</script>

{#if remaining}
	<button class="sleep" onclick={cancel} title="Sleep-Timer abbrechen">
		<span class="z">😴</span>
		<span class="t">{remaining}</span>
		<span class="x">✕</span>
	</button>
{/if}

<style>
	.sleep {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		width: 100%;
		box-sizing: border-box;
		margin: 0 0 8px;
		background: var(--accent-soft);
		border: 1px solid color-mix(in srgb, var(--accent) 40%, transparent);
		color: var(--text);
		border-radius: 10px;
		padding: 9px 12px;
		font-family: inherit;
		font-size: 13px;
		font-weight: 700;
		cursor: pointer;
		font-variant-numeric: tabular-nums;
		transition: border-color 0.15s, background 0.15s;
	}
	.sleep:hover { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 22%, transparent); }
	.t { color: var(--accent); }
	.x { font-size: 11px; color: var(--text-muted); opacity: 0; transition: opacity 0.15s; }
	.sleep:hover .x { opacity: 1; }
</style>
