<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import Titlebar from '$lib/components/Titlebar.svelte';
	import SettingsModal from '$lib/components/SettingsModal.svelte';
	import ShortcutsModal from '$lib/components/ShortcutsModal.svelte';
	import OnboardingModal from '$lib/components/OnboardingModal.svelte';
	import CardEditorModal from '$lib/components/CardEditorModal.svelte';
	import SleepTimer from '$lib/components/SleepTimer.svelte';
	import DiscordPresence from '$lib/components/DiscordPresence.svelte';
	import TitleInfoModal from '$lib/components/TitleInfoModal.svelte';
	import HiddenTitlesModal from '$lib/components/HiddenTitlesModal.svelte';
	import Toasts from '$lib/components/Toasts.svelte';
	import Clock from '$lib/components/Clock.svelte';
	import Particles from '$lib/components/Particles.svelte';
	import UpdateBanner from '$lib/components/UpdateBanner.svelte';
	import NotificationCenter from '$lib/components/NotificationCenter.svelte';
	import { checkForUpdate } from '$lib/stores/updater';
	import { hideEmbedded, unhideEmbedded } from '$lib/embedded';
	import { settings, hydrateSettings, applySettings, onboardingOpen } from '$lib/stores/settings';
	import { hydrateCatalog } from '$lib/stores/providers';
	import { hydrateProfiles, loadProfileData, activeProfileId } from '$lib/stores/profiles';
	import { achievements, maybeNotify } from '$lib/stores/achievements';
	import { get } from 'svelte/store';

	let { children } = $props();

	let showSettings = $state(false);
	let settingsTab = $state('appearance');
	let showShortcuts = $state(false);

	function openSettings(tab = 'appearance') {
		settingsTab = tab;
		showSettings = true;
		// Eingebetteter Stream liegt als natives Webview über dem HTML – fürs
		// Einstellungsfenster kurz ausblenden, danach wieder einblenden.
		void hideEmbedded();
	}
	function closeSettings() {
		showSettings = false;
		void unhideEmbedded();
	}

	onMount(async () => {
		// Reihenfolge: Settings -> Profile (kennt aktives Profil) -> Katalog ->
		// profilbezogene Daten. Jeder Schritt einzeln abgesichert, damit ein
		// Fehler (z.B. Update-Prüfung) nicht den Rest abbricht.
		try { await hydrateSettings(); applySettings(get(settings)); } catch (e) { console.error('[init] settings', e); }
		try { await hydrateProfiles(); } catch (e) { console.error('[init] profiles', e); }
		try { await hydrateCatalog(); } catch (e) { console.error('[init] catalog', e); }
		try {
			const pid = get(activeProfileId);
			if (pid) await loadProfileData(pid);
		} catch (e) { console.error('[init] profileData', e); }

		if (!get(settings).onboardingDone) onboardingOpen.set(true);
		window.addEventListener('keydown', onKey);

		// Automatisch beim Start nach einem Update suchen (still; Fehler werden geschluckt).
		try { void checkForUpdate(false); } catch (e) { console.error('[init] update', e); }
	});

	// Neu freigeschaltete Achievements melden (nur einmal je Achievement).
	$effect(() => {
		const list = $achievements;
		void maybeNotify(list, $settings.notifications.achievementUnlocked);
	});

	function onKey(e: KeyboardEvent) {
		const inField = (e.target as HTMLElement)?.matches?.('input,textarea,select');
		if (e.key === 'Escape') { if (showSettings) closeSettings(); showShortcuts = false; return; }
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
	<Particles />
	<Titlebar onHelp={() => (showShortcuts = true)} />
	<UpdateBanner />
	<div class="below">
		<Sidebar openSettings={() => openSettings()} openProfiles={() => openSettings('account')} />
		<main>{@render children()}</main>
	</div>
</div>

<Clock />
<Toasts />
<NotificationCenter />

<SettingsModal open={showSettings} initialTab={settingsTab} close={closeSettings} />
<ShortcutsModal open={showShortcuts} close={() => (showShortcuts = false)} />
<OnboardingModal open={$onboardingOpen} close={() => onboardingOpen.set(false)} />
<CardEditorModal />
<SleepTimer />
<DiscordPresence />
<TitleInfoModal />
<HiddenTitlesModal />

<style>
	.root { display: flex; flex-direction: column; height: 100vh; width: 100vw; overflow: hidden; position: relative; }
	.below { display: flex; flex: 1; min-height: 0; position: relative; z-index: 1; }
	main { flex: 1; overflow-y: auto; background: transparent; height: 100%; }
</style>
