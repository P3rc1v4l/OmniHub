<script lang="ts">
	import type { Provider } from '$lib/types';
	import Logo from './Logo.svelte';
	import { toggleFavorite, markOpened, activeStream, favorites } from '$lib/stores/providers';
	import { openInWindow } from '$lib/streamWindow';

	export let provider: Provider;
	export let size: 'large' | 'compact' = 'large';

	$: fav = $favorites.includes(provider.id);

	function open() {
		markOpened(provider.id);
		activeStream.set(provider);
		openInWindow(provider);
	}

	function favClick(e: Event) {
		e.stopPropagation();
		toggleFavorite(provider.id);
	}

	function editClick(e: Event) {
		e.stopPropagation();
		// Karteneditor wird in v0.3 ausgebaut.
	}

	function onKey(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			open();
		}
	}
</script>

<div
	class="card"
	class:large={size === 'large'}
	class:compact={size === 'compact'}
	style="--c1: {provider.color}; --c2: {provider.color2 ?? provider.color};"
	role="button"
	tabindex="0"
	onclick={open}
	onkeydown={onKey}
	title={`${provider.name} öffnen`}
>
	<span class="badge">{provider.quality}</span>

	<button
		class="bookmark"
		class:active={fav}
		onclick={favClick}
		aria-label={fav ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
		title={fav ? 'Favorit' : 'Zu Favoriten'}
	>
		{#if fav}
			<svg viewBox="0 0 16 16" width="16" height="16" fill="#facc15"><path d="M4 2h8v12l-4-2.5L4 14z"/></svg>
		{:else}
			<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M4 2h8v12l-4-2.5L4 14z"/></svg>
		{/if}
	</button>

	<button class="edit" onclick={editClick} aria-label="Karte bearbeiten" title="Karte bearbeiten">
		<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M11 2l3 3-8 8H3v-3l8-8z"/></svg>
	</button>

	<div class="logo-wrap"><Logo {provider} size={size === 'large' ? 64 : 44} /></div>

	<div class="meta">
		<div class="name">{provider.name}</div>
		<div class="sub">{provider.subtitle}</div>
	</div>

	<span class="arrow" aria-hidden="true">→</span>
</div>

<style>
	.card {
		position: relative;
		display: flex; flex-direction: column;
		gap: 10px;
		padding: 14px;
		border-radius: var(--radius);
		border: 1px solid var(--border);
		background:
			linear-gradient(180deg, rgba(0,0,0,0.0) 30%, rgba(0,0,0,0.55) 100%),
			radial-gradient(120% 80% at 50% 0%, var(--c1), var(--c2));
		color: #fff;
		text-align: left;
		cursor: pointer;
		overflow: hidden;
		transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
		min-height: 0;
	}
	.card.large { aspect-ratio: 1.65 / 1; }
	.card.compact { aspect-ratio: 1.45 / 1; }
	.card:hover {
		transform: translateY(-3px);
		border-color: color-mix(in srgb, var(--accent) 65%, var(--border));
		box-shadow: 0 12px 30px -10px rgba(0, 0, 0, 0.5);
	}
	.badge {
		position: absolute; top: 10px; left: 10px;
		background: rgba(0, 0, 0, 0.45);
		backdrop-filter: blur(6px);
		font-size: 10px; font-weight: 700;
		padding: 3px 8px; border-radius: 999px;
		letter-spacing: 0.05em;
	}
	.bookmark {
		position: absolute; top: 8px; right: 8px;
		width: 28px; height: 28px; border-radius: 8px;
		background: rgba(0, 0, 0, 0.35);
		border: 0; color: rgba(255, 255, 255, 0.85);
		display: grid; place-items: center;
		cursor: pointer;
		transition: background 0.15s;
	}
	.bookmark:hover { background: rgba(0, 0, 0, 0.55); }
	.bookmark.active { color: #facc15; }
	.edit {
		position: absolute; top: 42px; right: 8px;
		width: 28px; height: 28px; border-radius: 8px;
		background: rgba(0, 0, 0, 0.35);
		border: 0; color: rgba(255, 255, 255, 0.85);
		display: grid; place-items: center;
		cursor: pointer; opacity: 0;
		transition: opacity 0.15s, background 0.15s;
	}
	.card:hover .edit { opacity: 1; }
	.edit:hover { background: rgba(0, 0, 0, 0.55); }
	.logo-wrap { display: grid; place-items: center; flex: 1; padding: 8px 0; }
	.meta { display: flex; flex-direction: column; gap: 2px; padding-top: 4px; }
	.name { font-weight: 700; font-size: 15px; line-height: 1.1; }
	.sub { font-size: 11.5px; opacity: 0.78; }
	.arrow {
		position: absolute; right: 12px; bottom: 12px;
		opacity: 0; transition: opacity 0.15s, transform 0.15s;
		font-size: 16px;
	}
	.card:hover .arrow { opacity: 0.9; transform: translateX(3px); }
</style>
