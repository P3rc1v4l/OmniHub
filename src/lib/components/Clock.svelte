<script lang="ts">
	import { onMount } from 'svelte';
	import { settings } from '$lib/stores/settings';

	let now = $state(new Date());
	onMount(() => {
		const id = setInterval(() => (now = new Date()), 1000);
		return () => clearInterval(id);
	});

	const c = $derived($settings.clock);
	const opacity = $derived(Math.max(0, Math.min(1, (100 - c.transparency) / 100)));

	const timeStr = $derived.by(() => {
		const h = String(now.getHours()).padStart(2, '0');
		const m = String(now.getMinutes()).padStart(2, '0');
		const s = String(now.getSeconds()).padStart(2, '0');
		return c.showSeconds ? `${h}:${m}:${s}` : `${h}:${m}`;
	});

	// Analog: Winkel der Zeiger
	const angles = $derived.by(() => {
		const sec = now.getSeconds();
		const min = now.getMinutes();
		const hr = now.getHours() % 12;
		return {
			s: sec * 6,
			m: min * 6 + sec * 0.1,
			h: hr * 30 + min * 0.5
		};
	});
</script>

{#if c.enabled}
	<div class="clock" style="opacity: {opacity}; color: {c.color};">
		{#if c.type === 'digital'}
			<span class="digital" style="font-size: {c.size}px;">{timeStr}</span>
		{:else}
			<svg viewBox="0 0 100 100" style="width: {c.size * 2.4}px; height: {c.size * 2.4}px;">
				<circle cx="50" cy="50" r="47" fill="none" stroke="currentColor" stroke-width="2" opacity="0.5" />
				{#each Array(12) as _, i}
					<line x1="50" y1="6" x2="50" y2="12" stroke="currentColor" stroke-width="1.5" transform="rotate({i * 30} 50 50)" opacity="0.6" />
				{/each}
				<line x1="50" y1="50" x2="50" y2="27" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" transform="rotate({angles.h} 50 50)" />
				<line x1="50" y1="50" x2="50" y2="16" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" transform="rotate({angles.m} 50 50)" />
				{#if c.showSeconds}
					<line x1="50" y1="55" x2="50" y2="14" stroke="currentColor" stroke-width="1" stroke-linecap="round" transform="rotate({angles.s} 50 50)" opacity="0.8" />
				{/if}
				<circle cx="50" cy="50" r="2.5" fill="currentColor" />
			</svg>
		{/if}
	</div>
{/if}

<style>
	.clock {
		position: fixed;
		top: calc(var(--titlebar-h) + 14px);
		right: 18px;
		z-index: 30;
		pointer-events: none;
		user-select: none;
		text-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
	}
	.digital { font-weight: 700; font-variant-numeric: tabular-nums; letter-spacing: 0.02em; }
</style>
