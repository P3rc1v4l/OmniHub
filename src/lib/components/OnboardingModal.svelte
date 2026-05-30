<script lang="ts">
	import { settings } from '$lib/stores/settings';
	import { profiles } from '$lib/stores/profiles';
	import { providers } from '$lib/stores/providers';
	import type { Provider } from '$lib/types';

	let { open = false, close }: { open?: boolean; close: () => void } = $props();

	let step = $state(0);
	let profileName = $state('Profil 1');
	let providersList = $state<Provider[]>([]);
	$effect(() => { providersList = $providers; });
	// Beim Öffnen immer von vorn beginnen.
	$effect(() => { if (open) step = 0; });

	const accents = ['#30c5bb', '#ff5d3b', '#7c5cff', '#22c55e', '#f59e0b', '#ec4899'];

	function next() { step++; }
	function back() { if (step > 0) step--; }
	function finish() {
		// Profilname übernehmen, falls geändert
		profiles.update(($p) => {
			if ($p.length) $p[0].name = profileName.trim() || 'Profil 1';
			return $p;
		});
		// Provider-Sichtbarkeit speichern (Sichtbarkeit kommt aus providersList)
		providers.set(providersList);
		settings.update(($s) => ({ ...$s, onboardingDone: true }));
		close();
	}

	function toggleVisible(id: string) {
		providersList = providersList.map((p) => p.id === id ? { ...p, hidden: !p.hidden } : p);
	}
</script>

{#if open}
	<div class="backdrop" role="presentation">
		<div class="dialog omni-card" role="dialog" aria-modal="true">
			<header>
				<h2>Willkommen bei OmniHub</h2>
				<div class="dots">
					{#each Array(4) as _, i}<span class:on={i <= step}></span>{/each}
				</div>
			</header>

			<div class="body">
				{#if step === 0}
					<img class="welcome-logo" src="/logo.png" alt="OmniHub" />
					<p class="big">OmniHub bündelt deine Streaming-Dienste in einem Fenster.</p>
					<p>In den nächsten Schritten richten wir kurz dein Profil, dein Design und die sichtbaren Anbieter ein. Du kannst alles später jederzeit in den Einstellungen ändern.</p>
				{:else if step === 1}
					<p class="big">Wie soll dein erstes Profil heißen?</p>
					<input class="text" type="text" bind:value={profileName} placeholder="Profil 1" />
					<small>Du kannst später bis zu 5 Profile mit eigener Watchlist und Statistik anlegen.</small>
				{:else if step === 2}
					<p class="big">Wähle deine Akzentfarbe</p>
					<div class="swatches">
						{#each accents as c}
							<button
								class="sw"
								class:on={$settings.appearance.accentColor === c}
								style="background: {c}"
								onclick={() => ($settings.appearance.accentColor = c)}
								aria-label={c}
							></button>
						{/each}
					</div>
					<small>Beeinflusst Buttons, Hervorhebungen und die aktive Sidebar-Auswahl.</small>
				{:else if step === 3}
					<p class="big">Welche Anbieter sollen in der Übersicht erscheinen?</p>
					<div class="provs">
						{#each providersList as p (p.id)}
							<label class:off={p.hidden}>
								<input type="checkbox" checked={!p.hidden} onchange={() => toggleVisible(p.id)} />
								<span>{p.name}</span>
							</label>
						{/each}
					</div>
				{/if}
			</div>

			<footer>
				<button class="ghost" onclick={back} disabled={step === 0}>Zurück</button>
				{#if step < 3}
					<button class="primary" onclick={next}>Weiter</button>
				{:else}
					<button class="primary" onclick={finish}>Fertig</button>
				{/if}
			</footer>
		</div>
	</div>
{/if}

<style>
	.backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.65); display: grid; place-items: center; z-index: 120; }
	.dialog { width: min(640px, 92vw); max-height: 86vh; display: flex; flex-direction: column; background: var(--bg-elev); }
	header { padding: 20px 24px 4px; }
	h2 { margin: 0 0 12px; font-size: 22px; font-weight: 800; letter-spacing: -0.02em; }
	.dots { display: flex; gap: 6px; }
	.dots span { width: 24px; height: 4px; border-radius: 99px; background: var(--border); }
	.dots span.on { background: var(--accent); }
	.body { padding: 18px 24px; overflow: auto; flex: 1; }
	.welcome-logo { width: 88px; height: 88px; display: block; margin: 4px 0 16px; }
	.big { font-size: 17px; font-weight: 600; margin: 0 0 8px; }
	.body p { color: var(--text-muted); line-height: 1.5; }
	.body small { color: var(--text-dim); display: block; margin-top: 10px; }
	.text {
		width: 100%; padding: 10px 14px; background: var(--bg-card);
		border: 1px solid var(--border); color: var(--text);
		border-radius: 10px; font-size: 15px; margin-top: 10px;
	}
	.swatches { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 12px; }
	.sw { width: 36px; height: 36px; border-radius: 50%; border: 2px solid transparent; cursor: pointer; }
	.sw.on { border-color: #fff; box-shadow: 0 0 0 2px var(--accent); }
	.provs { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 6px; margin-top: 10px; max-height: 280px; overflow: auto; padding-right: 4px; }
	.provs label { display: flex; align-items: center; gap: 8px; padding: 8px 10px; background: var(--bg-card); border-radius: 8px; font-size: 13px; cursor: pointer; border: 1px solid var(--border); }
	.provs label.off { opacity: 0.55; }
	footer { display: flex; justify-content: space-between; gap: 12px; padding: 16px 24px 22px; border-top: 1px solid var(--border); }
	.ghost { background: var(--bg-card); border: 1px solid var(--border); color: var(--text); padding: 10px 16px; border-radius: 10px; cursor: pointer; }
	.ghost:disabled { opacity: 0.4; cursor: not-allowed; }
	.primary { background: var(--accent); color: var(--accent-text); border: 0; padding: 10px 20px; border-radius: 10px; cursor: pointer; font-weight: 700; }
</style>
