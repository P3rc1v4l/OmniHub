<script lang="ts">
	import { page } from '$app/stores';
	import { activeStream } from '$lib/stores/providers';
	import { settings } from '$lib/stores/settings';
	import { notifCenterOpen } from '$lib/stores/toasts';
	import ProfileSwitcher from './ProfileSwitcher.svelte';
	import SleepCountdown from './SleepCountdown.svelte';

	export let openSettings: () => void;
	export let openProfiles: () => void;

	const nav = [
		{ href: '/', label: 'Übersicht', icon: '🏠' },
		{ href: '/watchlist', label: 'Gemerkt', icon: '🔖' },
		{ href: '/news', label: 'Neuigkeiten', icon: '📡' },
		{ href: '/upcoming', label: 'Upcoming', icon: '📅' }
	];

	$: path = $page.url.pathname;

	function toggleTheme() {
		settings.update(($s) => ({
			...$s,
			appearance: { ...$s.appearance, theme: $s.appearance.theme === 'dark' ? 'light' : 'dark' }
		}));
	}
</script>

<aside class="sidebar" style="width: var(--sidebar-width)">
	<nav>
		{#each nav as item}
			<a href={item.href} class="nav-item" class:active={path === item.href}>
				<span class="icon">{item.icon}</span><span>{item.label}</span>
			</a>
		{/each}
		{#if $activeStream}
			<a href="/stream" class="nav-item" class:active={path === '/stream'}>
				<span class="icon">▶️</span><span>Schaut gerade</span>
			</a>
		{/if}
	</nav>

	<div class="bottom">
		<SleepCountdown />
		<a href="/cr-calendar" class="nav-item" class:active={path === '/cr-calendar'}>
			<span class="icon">⛩️</span><span>CR Kalender</span>
		</a>

		<div class="controls">
			<button class="ctrl" onclick={toggleTheme} title="Hell/Dunkel" aria-label="Theme">
				{$settings.appearance.theme === 'dark' ? '🌙' : '☀️'}
			</button>
			<button class="ctrl" onclick={() => notifCenterOpen.update((v) => !v)} title="Benachrichtigungen" aria-label="Benachrichtigungen">🔔</button>
		</div>

		<ProfileSwitcher {openProfiles} />

		<a href="/stats" class="nav-item" class:active={path === '/stats'}>
			<span class="icon">📊</span><span>Statistiken</span>
		</a>
		<button class="nav-item as-link" onclick={openSettings}>
			<span class="icon">⚙️</span><span>Einstellungen</span>
		</button>
	</div>
</aside>

<style>
	.sidebar {
		height: 100%;
		background: var(--bg-elev);
		border-right: 1px solid var(--border);
		display: flex; flex-direction: column;
		padding: 14px 12px;
		flex-shrink: 0; box-sizing: border-box;
	}
	nav { display: flex; flex-direction: column; gap: 2px; flex: 1; }
	.nav-item, .as-link {
		display: flex; align-items: center; gap: 12px;
		padding: 10px 12px; border-radius: 10px;
		color: var(--text-muted); text-decoration: none;
		font-size: 13.5px;
		background: transparent; border: 0;
		cursor: pointer; text-align: left; font-family: inherit;
		transition: background 0.12s, color 0.12s;
	}
	.nav-item:hover, .as-link:hover { background: var(--bg-card); color: var(--text); }
	.nav-item.active { background: var(--accent-soft); color: var(--accent); font-weight: 600; }
	.icon { width: 18px; text-align: center; font-size: 14px; }
	.bottom { display: flex; flex-direction: column; gap: 2px; }
	.controls { display: flex; gap: 6px; padding: 6px 4px; }
	.ctrl {
		flex: 1; background: var(--bg-card); border: 1px solid var(--border);
		color: var(--text-muted); border-radius: 9px;
		padding: 7px 8px; cursor: pointer; font-size: 14px;
	}
	.ctrl:hover { color: var(--text); border-color: var(--border-strong); }
</style>
