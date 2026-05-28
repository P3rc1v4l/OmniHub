<script lang="ts">
	import { settings } from '$lib/stores/settings';
	import { resetProviders } from '$lib/stores/providers';
	import {
		profiles, activeProfileId, addProfile, renameProfile, deleteProfile,
		setPin, clearPin, MAX_PROFILES, MIN_PROFILES
	} from '$lib/stores/profiles';
	import { APP_VERSION, LINKS } from '$lib/version';

	let { open = false, initialTab = 'appearance', close }: { open?: boolean; initialTab?: string; close: () => void } = $props();

	const tabs = [
		{ id: 'appearance', label: 'Design', icon: '🎨' },
		{ id: 'account', label: 'Profile', icon: '🔑' },
		{ id: 'clock', label: 'Uhr', icon: '🕐' },
		{ id: 'notifications', label: 'Benachrichtigungen', icon: '🔔' },
		{ id: 'plugins', label: 'Plugins', icon: '🧩' },
		{ id: 'advanced', label: 'Mehr', icon: '⚙️' }
	];
	let active = $state('appearance');
	let tabSearch = $state('');

	// Profilverwaltung
	let pinEditFor = $state<string | null>(null);
	let pinInput = $state('');

	// Beim Öffnen den gewünschten Tab aktivieren.
	$effect(() => { if (open) active = initialTab; });

	const filteredTabs = $derived(
		tabs.filter((t) => t.label.toLowerCase().includes(tabSearch.toLowerCase()))
	);

	async function savePin(id: string) {
		if (pinInput.trim().length < 4) return;
		await setPin(id, pinInput.trim());
		pinEditFor = null; pinInput = '';
	}

	function onBackdrop(e: MouseEvent) { if (e.target === e.currentTarget) close(); }
</script>

{#if open}
	<div class="backdrop" onclick={onBackdrop} role="presentation">
		<div class="dialog" role="dialog" aria-modal="true" aria-label="Einstellungen">
			<aside class="side">
				<div class="head">
					<span class="emoji">⚙️</span><h2>Einstellungen</h2>
				</div>
				<div class="search">
					<input type="text" placeholder="Suchen…" bind:value={tabSearch} />
				</div>
				<nav>
					{#each filteredTabs as t}
						<button class:active={active === t.id} onclick={() => (active = t.id)}>
							<span class="i">{t.icon}</span><span>{t.label}</span>
						</button>
					{/each}
				</nav>
				<div class="version">v{APP_VERSION}</div>
			</aside>

			<section class="main">
				<div class="main-head">
					<h3>{tabs.find((t) => t.id === active)?.icon} {tabs.find((t) => t.id === active)?.label}</h3>
					<button class="x" onclick={close} aria-label="Schließen">×</button>
				</div>

				<div class="content">
					{#if active === 'appearance'}
						<div class="grid">
							<div class="field">
								<label>Hintergrundbild</label>
								<button class="ghost" disabled>Bild wählen (folgt v0.3)</button>
							</div>
							<div class="field">
								<label>Akzentfarbe</label>
								<div class="row">
									<input type="color" bind:value={$settings.appearance.accentColor} />
									<input type="text" class="hex" bind:value={$settings.appearance.accentColor} />
								</div>
							</div>
							<div class="field">
								<label>Schriftart</label>
								<select bind:value={$settings.appearance.fontFamily}>
									<option value="'DM Sans', ui-sans-serif, system-ui, sans-serif">DM Sans</option>
									<option value="ui-sans-serif, system-ui, sans-serif">System</option>
									<option value="ui-monospace, 'Consolas', monospace">Monospace</option>
								</select>
							</div>

							<div class="field">
								<label>Schriftgröße: {$settings.appearance.fontSize}px</label>
								<input type="range" min="12" max="22" bind:value={$settings.appearance.fontSize} />
							</div>
							<div class="field">
								<label>Eckenradius: {$settings.appearance.radius}px</label>
								<input type="range" min="0" max="28" bind:value={$settings.appearance.radius} />
							</div>
							<div class="field">
								<label>Sidebar-Breite: {$settings.appearance.sidebarWidth}px</label>
								<input type="range" min="180" max="320" bind:value={$settings.appearance.sidebarWidth} />
							</div>

							<div class="field">
								<label>Glassmorphismus</label>
								<input type="checkbox" bind:checked={$settings.appearance.glassmorphism} />
							</div>
							<div class="field">
								<label>Partikel-Hintergrund</label>
								<input type="checkbox" bind:checked={$settings.appearance.particles} />
							</div>
							<div class="field">
								<label>Sprache</label>
								<div class="row">
									<button class:active={$settings.appearance.language === 'de'} onclick={() => ($settings.appearance.language = 'de')}>DE</button>
									<button class:active={$settings.appearance.language === 'en'} onclick={() => ($settings.appearance.language = 'en')}>EN</button>
								</div>
							</div>
						</div>

						<div class="block">
							<div class="block-label">Weitere Optik-Optionen</div>
							<div class="row3">
								<label class="toggle"><input type="checkbox" bind:checked={$settings.appearance.cardShadow}/> Karten-Schatten</label>
								<label class="toggle"><input type="checkbox" bind:checked={$settings.appearance.cardHoverZoom}/> Karten-Hover-Zoom</label>
								<label class="toggle"><input type="checkbox" bind:checked={$settings.appearance.animations}/> Animationen</label>
							</div>
						</div>
					{:else if active === 'notifications'}
						<div class="grid">
							<label class="toggle"><input type="checkbox" bind:checked={$settings.notifications.pauseReminder}/> Pause-Erinnerung (nach 2h)</label>
							<label class="toggle"><input type="checkbox" bind:checked={$settings.notifications.sound}/> Benachrichtigungston</label>
							<label class="toggle"><input type="checkbox" bind:checked={$settings.notifications.updateHint}/> Update-Hinweis</label>
							<label class="toggle"><input type="checkbox" bind:checked={$settings.notifications.achievementUnlocked}/> Achievement freigeschaltet</label>
							<label class="toggle"><input type="checkbox" bind:checked={$settings.notifications.watchlistReminder}/> Watchlist-Erinnerung</label>
						</div>
					{:else if active === 'clock'}
						<div class="grid">
							<label class="toggle"><input type="checkbox" bind:checked={$settings.clock.enabled}/> Uhr anzeigen</label>
							<div class="field">
								<label>Typ</label>
								<select bind:value={$settings.clock.type}>
									<option value="digital">Digital</option>
									<option value="analog">Analog</option>
								</select>
							</div>
							<label class="toggle"><input type="checkbox" bind:checked={$settings.clock.showSeconds}/> Sekunden anzeigen</label>
							<div class="field">
								<label>Farbe</label>
								<input type="color" bind:value={$settings.clock.color}/>
							</div>
							<div class="field">
								<label>Transparenz: {$settings.clock.transparency}%</label>
								<input type="range" min="0" max="100" bind:value={$settings.clock.transparency}/>
							</div>
							<div class="field">
								<label>Größe: {$settings.clock.size}px</label>
								<input type="range" min="20" max="96" bind:value={$settings.clock.size}/>
							</div>
						</div>
					{:else if active === 'advanced'}
						<div class="actions">
							<button class="ghost" onclick={resetProviders}>Anbieterkarten zurücksetzen</button>
							<button class="ghost" onclick={() => ($settings.onboardingDone = false)}>Onboarding erneut starten</button>
							<a class="ghost link" href={LINKS.discord} target="_blank" rel="noreferrer">Discord – Feedback & Support</a>
							<a class="ghost link" href={LINKS.githubReleases} target="_blank" rel="noreferrer">Nach Updates suchen (GitHub Releases)</a>
						</div>
						<p class="hint">VPN, Watchlist-Import/Export und WideVine-Status folgen in einer späteren Version.</p>
					{:else if active === 'account'}
						<p class="acc-intro">Jedes Profil hat eigene Favoriten, Watchlist, Streamzeit und – beim Streamen – getrennte Logins.</p>
						<div class="plist">
							{#each $profiles as p (p.id)}
								<div class="prow">
									<span class="pav">👤</span>
									<input class="pname-in" value={p.name} oninput={(e) => renameProfile(p.id, (e.currentTarget as HTMLInputElement).value)} />
									{#if p.id === $activeProfileId}<span class="pbadge">aktiv</span>{/if}

									{#if pinEditFor === p.id}
										<input class="pin-in" type="password" inputmode="numeric" placeholder="neue PIN (min. 4)" bind:value={pinInput} onkeydown={(e) => e.key === 'Enter' && savePin(p.id)} />
										<button class="mini primary" onclick={() => savePin(p.id)}>OK</button>
										<button class="mini" onclick={() => { pinEditFor = null; pinInput = ''; }}>✕</button>
									{:else}
										<button class="mini" onclick={() => { pinEditFor = p.id; pinInput = ''; }}>{p.pinHash ? 'PIN ändern' : 'PIN setzen'}</button>
										{#if p.pinHash}<button class="mini" onclick={() => clearPin(p.id)}>PIN entfernen</button>{/if}
									{/if}

									<button class="mini danger" disabled={$profiles.length <= MIN_PROFILES} onclick={() => deleteProfile(p.id)} title={$profiles.length <= MIN_PROFILES ? 'Mindestens ein Profil nötig' : 'Profil löschen'}>🗑</button>
								</div>
							{/each}
						</div>
						<button class="ghost" disabled={$profiles.length >= MAX_PROFILES} onclick={() => addProfile(`Profil ${$profiles.length + 1}`)}>
							＋ Profil hinzufügen {#if $profiles.length >= MAX_PROFILES}(max. {MAX_PROFILES}){/if}
						</button>
						<p class="hint">Profil wechseln kannst du unten links über den Profil-Button.</p>
					{:else}
						<p class="hint">Dieser Tab wird in einer kommenden Version ausgebaut.</p>
					{/if}
				</div>
			</section>
		</div>
	</div>
{/if}

<style>
	.backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.55); display: grid; place-items: center; z-index: 90; backdrop-filter: blur(4px); }
	.dialog {
		width: min(1080px, 92vw);
		height: min(680px, 86vh);
		background: var(--bg-elev);
		border-radius: calc(var(--radius) + 4px);
		border: 1px solid var(--border);
		display: flex;
		overflow: hidden;
	}
	.side {
		width: 240px; flex-shrink: 0;
		border-right: 1px solid var(--border);
		display: flex; flex-direction: column;
		padding: 18px 14px;
	}
	.head { display: flex; align-items: center; gap: 8px; padding: 0 6px 14px; }
	.head h2 { margin: 0; font-size: 16px; font-weight: 700; }
	.search input {
		width: 100%; padding: 8px 12px;
		background: var(--bg-card); border: 1px solid var(--border);
		color: var(--text); border-radius: 10px; font-size: 13px;
	}
	nav { display: flex; flex-direction: column; gap: 2px; margin-top: 14px; flex: 1; }
	nav button {
		background: transparent; border: 0; color: var(--text-muted);
		display: flex; align-items: center; gap: 10px; padding: 9px 10px;
		border-radius: 10px; cursor: pointer; text-align: left; font-size: 13.5px;
	}
	nav button:hover { background: var(--bg-card); color: var(--text); }
	nav button.active { background: var(--accent-soft); color: var(--accent); font-weight: 600; }
	nav button .i { width: 18px; text-align: center; }
	.version { color: var(--text-dim); font-size: 11px; text-align: center; padding-top: 8px; }

	.main { flex: 1; display: flex; flex-direction: column; }
	.main-head { display: flex; justify-content: space-between; align-items: center; padding: 18px 24px; border-bottom: 1px solid var(--border); }
	.main-head h3 { margin: 0; font-weight: 700; font-size: 17px; }
	.x { background: transparent; border: 0; color: var(--text-muted); font-size: 26px; cursor: pointer; line-height: 1; }
	.content { padding: 20px 24px; overflow: auto; }
	.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px 18px; }
	.field { background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; padding: 12px 14px; display: flex; flex-direction: column; gap: 8px; }
	.field > label { font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-muted); }
	.field input[type='range'] { width: 100%; }
	.field select, .field .hex {
		width: 100%; background: var(--bg-elev); color: var(--text);
		border: 1px solid var(--border); padding: 7px 10px; border-radius: 8px; font-size: 13px;
	}
	.field input[type='color'] { width: 32px; height: 32px; padding: 0; border: 1px solid var(--border); border-radius: 8px; background: transparent; }
	.row { display: flex; gap: 8px; align-items: center; }
	.row button { background: var(--bg-elev); color: var(--text-muted); border: 1px solid var(--border); padding: 6px 12px; border-radius: 8px; cursor: pointer; }
	.row button.active { background: var(--accent-soft); color: var(--accent); border-color: var(--accent); }
	.toggle { display: flex; align-items: center; gap: 8px; background: var(--bg-card); padding: 10px 14px; border: 1px solid var(--border); border-radius: 12px; font-size: 13px; cursor: pointer; }
	.block { margin-top: 16px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; padding: 14px 16px; }
	.block-label { font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-muted); margin-bottom: 10px; }
	.row3 { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 8px; }
	.actions { display: flex; flex-wrap: wrap; gap: 10px; }
	.ghost { background: var(--bg-card); border: 1px solid var(--border); color: var(--text); padding: 10px 14px; border-radius: 10px; cursor: pointer; text-decoration: none; font-size: 13.5px; display: inline-block; }
	.ghost:hover { border-color: var(--border-strong); }
	.ghost.link { color: var(--accent); }
	.hint { color: var(--text-muted); font-size: 13px; }

	/* Profile-Tab */
	.acc-intro { color: var(--text-muted); font-size: 13px; margin: 0 0 14px; }
	.plist { display: flex; flex-direction: column; gap: 8px; margin-bottom: 14px; }
	.prow { display: flex; align-items: center; gap: 8px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; padding: 8px 10px; flex-wrap: wrap; }
	.pav { width: 26px; height: 26px; border-radius: 50%; background: var(--bg-card-2); display: grid; place-items: center; font-size: 13px; flex-shrink: 0; }
	.pname-in { flex: 1; min-width: 120px; background: var(--bg-elev); border: 1px solid var(--border); color: var(--text); border-radius: 8px; padding: 7px 10px; font-size: 13.5px; font-family: inherit; }
	.pbadge { font-size: 10px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--accent); background: var(--accent-soft); padding: 3px 8px; border-radius: 999px; }
	.pin-in { width: 150px; background: var(--bg-elev); border: 1px solid var(--border); color: var(--text); border-radius: 8px; padding: 7px 10px; font-size: 13px; letter-spacing: 3px; font-family: inherit; }
	.mini { background: var(--bg-elev); border: 1px solid var(--border); color: var(--text-muted); padding: 7px 10px; border-radius: 8px; cursor: pointer; font-size: 12.5px; font-family: inherit; }
	.mini:hover { color: var(--text); border-color: var(--border-strong); }
	.mini.primary { background: var(--accent); color: var(--accent-text); border: 0; font-weight: 700; }
	.mini.danger:hover { color: #f87171; border-color: #f87171; }
	.mini:disabled { opacity: 0.4; cursor: not-allowed; }
</style>
