<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import Titlebar from '$lib/components/Titlebar.svelte';
	import SettingsModal from '$lib/components/SettingsModal.svelte';
	import ShortcutsModal from '$lib/components/ShortcutsModal.svelte';
	import OnboardingModal from '$lib/components/OnboardingModal.svelte';
	import { settings, hydrateSettings, applySettings } from '$lib/stores/settings';
	import { hydrateCatalog } from '$lib/stores/providers';
	import { hydrateProfiles, loadProfileData, activeProfileId } from '$lib/stores/profiles';
	import { achievements, maybeNotify } from '$lib/stores/achievements';
	import { get } from 'svelte/store';

	let { children } = $props();

	let showSettings = $state(false);
	let settingsTab = $state('appearance');
	let showShortcuts = $state(false);
	let showOnboarding = $state(false);

	function openSettings(tab = 'appearance') {
		settingsTab = tab;
		showSettings = true;
	}

	onMount(async () => {
		// Reihenfolge: Settings -> Profile (kennt aktives Profil) -> Katalog ->
		// profilbezogene Daten (Favoriten, Watchlist, Streamzeit, Achievements).
		await hydrateSettings();
		applySettings(get(settings));
		await hydrateProfiles();
		await hydrateCatalog();
		const pid = get(activeProfileId);
		if (pid) await loadProfileData(pid);

		if (!get(settings).onboardingDone) showOnboarding = true;
		window.addEventListener('keydown', onKey);
	});

	// Neu freigeschaltete Achievements melden (nur einmal je Achievement).
	$effect(() => {
		const list = $achievements;
		void maybeNotify(list, $settings.notifications.achievementUnlocked);
	});

	function onKey(e: KeyboardEvent) {
		const inField = (e.target as HTMLElement)?.matches?.('input,textarea,select');
		if (e.key === 'Escape') { showSettings = false; showShortcuts = false; return; }
		if (inField) return;
		if (e.key === 'F1') { e.preventDefault(); showShortcuts = true; }
		else if (e.key === ',' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); openSettings(); }
		else if (e.key === 'k' && (e.ctrlKey || e.metaKey)) {
			e.preventDefault();
			document.querySelector<HTMLInputElement>('input[data-omni-search]')?.focus();
		} else if (e.key === 'd' && (e.ctrlKey || e.metaKey)) {
			e.preventDefault();
			settings.update(($s) => ({ ...$s, appearance: { ...$s.appearance, theme: $s.appearance.theme === 'dark' ? 'light' : 'dark' } }));
		}
	}
</script>

<div class="root">
	<Titlebar onHelp={() => (showShortcuts = true)} />
	<div class="below">
		<Sidebar openSettings={() => openSettings()} openProfiles={() => openSettings('account')} />
		<main>{@render children()}</main>
	</div>
</div>

<SettingsModal open={showSettings} initialTab={settingsTab} close={() => (showSettings = false)} />
<ShortcutsModal open={showShortcuts} close={() => (showShortcuts = false)} />
<OnboardingModal open={showOnboarding} close={() => (showOnboarding = false)} />

<style>
	.root { display: flex; flex-direction: column; height: 100vh; width: 100vw; overflow: hidden; }
	.below { display: flex; flex: 1; min-height: 0; }
	main { flex: 1; overflow-y: auto; background: var(--bg); height: 100%; }
</style>
