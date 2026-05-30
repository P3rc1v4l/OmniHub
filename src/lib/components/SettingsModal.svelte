<script lang="ts">
	import { settings, clockEditing, DEFAULT_SETTINGS, onboardingOpen } from '$lib/stores/settings';
	import { resetProviders } from '$lib/stores/providers';
	import {
		profiles, activeProfileId, addProfile, renameProfile, deleteProfile,
		setPin, clearPin, verifyPin, MAX_PROFILES, MIN_PROFILES,
		mainProfileId, setMainProfile, adminCodeHash, setAdminCode, verifyAdminCode, clearAdminCode, resetPinWithAdmin
	} from '$lib/stores/profiles';
	import { APP_VERSION, APP_NAME, LINKS, DEFAULT_DISCORD_CLIENT_ID } from '$lib/version';
	import { updateState, checkForUpdate } from '$lib/stores/updater';
	import { pushToast } from '$lib/stores/toasts';

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

	const PARTICLE_SHAPES = [
		{ id: 'circle', label: '● Kreis' },
		{ id: 'square', label: '■ Quadrat' },
		{ id: 'triangle', label: '▲ Dreieck' },
		{ id: 'star', label: '★ Stern' }
	];
	function toggleShape(id: string) {
		settings.update((s) => {
			const cur = s.appearance.particleShapes ?? ['circle'];
			let next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
			if (next.length === 0) next = ['circle']; // mind. eine Form
			return { ...s, appearance: { ...s.appearance, particleShapes: next } };
		});
	}

	function onBgFile(e: Event) {
		const f = (e.target as HTMLInputElement).files?.[0];
		if (!f) return;
		const reader = new FileReader();
		reader.onload = () =>
			settings.update((s) => ({ ...s, appearance: { ...s.appearance, backgroundImage: reader.result as string } }));
		reader.readAsDataURL(f);
	}
	function clearBg() {
		settings.update((s) => ({ ...s, appearance: { ...s.appearance, backgroundImage: null } }));
	}

	function resetAppearance() {
		if (!confirm('Alle Design-Einstellungen auf Standard zurücksetzen?')) return;
		settings.update((s) => ({ ...s, appearance: structuredClone(DEFAULT_SETTINGS.appearance) }));
		pushToast('Design zurückgesetzt', 'Standard-Werte wiederhergestellt.', '↩️', 2500);
	}

	// Profilverwaltung – PIN-Bearbeitung mit Abfrage des alten PINs
	let pinEditFor = $state<string | null>(null);
	let oldPinInput = $state('');
	let newPinInput = $state('');
	let pinError = $state('');

	function openPinPanel(id: string) {
		pinEditFor = id; oldPinInput = ''; newPinInput = ''; pinError = '';
	}
	function closePinPanel() {
		pinEditFor = null; oldPinInput = ''; newPinInput = ''; pinError = '';
	}

	// Beim Öffnen den gewünschten Tab aktivieren.
	$effect(() => { if (open) active = initialTab; });
	// Uhr verschiebbar machen, solange der Uhr-Tab offen ist.
	$effect(() => { clockEditing.set(open && active === 'clock'); });

	const filteredTabs = $derived(
		tabs.filter((t) => t.label.toLowerCase().includes(tabSearch.toLowerCase()))
	);

	async function savePin(p: { id: string; pinHash: string | null }) {
		if (p.pinHash && !(await verifyPin(oldPinInput, p.pinHash))) { pinError = 'Alter PIN ist falsch.'; return; }
		if (newPinInput.trim().length < 4) { pinError = 'Neuer PIN braucht mindestens 4 Zeichen.'; return; }
		await setPin(p.id, newPinInput.trim());
		closePinPanel();
	}
	async function removePin(p: { id: string; pinHash: string | null }) {
		if (p.pinHash && !(await verifyPin(oldPinInput, p.pinHash))) { pinError = 'Alter PIN ist falsch.'; return; }
		clearPin(p.id);
		closePinPanel();
	}

	// --- Admin-Code (für PIN-Zurücksetzen) ---
	let adminInput = $state('');
	let oldAdminInput = $state('');
	let adminMsg = $state('');
	async function saveAdminCode() {
		// Bestehenden Code nur mit Kenntnis des alten ändern.
		if ($adminCodeHash && !(await verifyAdminCode(oldAdminInput.trim()))) { adminMsg = 'Alter Admin-Code ist falsch.'; return; }
		if (adminInput.trim().length < 4) { adminMsg = 'Admin-Code braucht mindestens 4 Zeichen.'; return; }
		await setAdminCode(adminInput.trim());
		adminInput = ''; oldAdminInput = '';
		adminMsg = 'Admin-Code gespeichert.';
		pushToast('Admin-Code gespeichert', undefined, '🛡️', 2200);
	}
	async function removeAdminCode() {
		if ($adminCodeHash && !(await verifyAdminCode(oldAdminInput.trim()))) { adminMsg = 'Alter Admin-Code ist falsch.'; return; }
		clearAdminCode();
		oldAdminInput = '';
		adminMsg = 'Admin-Code entfernt.';
	}

	// --- Haupt-Profil ändern (nur mit Admin-Code, sofern gesetzt) ---
	let mainChangeFor = $state<string | null>(null);
	let mainAdminInput = $state('');
	let mainMsg = $state('');
	function requestSetMain(id: string) {
		if (!$adminCodeHash) { setMainProfile(id); pushToast('Haupt-Profil geändert', undefined, '★', 2000); return; }
		mainChangeFor = id; mainAdminInput = ''; mainMsg = '';
	}
	async function confirmSetMain(id: string) {
		if (!(await verifyAdminCode(mainAdminInput.trim()))) { mainMsg = 'Admin-Code ist falsch.'; return; }
		setMainProfile(id);
		pushToast('Haupt-Profil geändert', undefined, '★', 2000);
		mainChangeFor = null; mainAdminInput = '';
	}
	function cancelSetMain() { mainChangeFor = null; mainAdminInput = ''; mainMsg = ''; }

	// --- PIN per Admin-Code zurücksetzen ---
	let resetPinFor = $state<string | null>(null);
	let resetAdminInput = $state('');
	let resetMsg = $state('');
	function openResetPanel(id: string) { resetPinFor = id; resetAdminInput = ''; resetMsg = ''; }
	function closeResetPanel() { resetPinFor = null; resetAdminInput = ''; resetMsg = ''; }
	async function doResetPin(id: string) {
		const ok = await resetPinWithAdmin(id, resetAdminInput.trim());
		if (ok) { pushToast('PIN zurückgesetzt', 'Du kannst jetzt einen neuen PIN setzen.', '🔓', 2600); closeResetPanel(); }
		else resetMsg = 'Admin-Code ist falsch.';
	}

	// Beim Schließen Hinweis zeigen (Einstellungen werden automatisch gespeichert).
	function doClose() {
		pushToast('Einstellungen gespeichert', undefined, '✅', 2200);
		close();
	}

	function onBackdrop(e: MouseEvent) { if (e.target === e.currentTarget) doClose(); }
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
					<button class="x" onclick={doClose} aria-label="Schließen">×</button>
				</div>

				<div class="content">
					{#if active === 'appearance'}
						<div class="grid">
							<div class="field">
								<label>Hintergrundbild</label>
								<div class="row">
									<label class="filebtn">
										Bild wählen
										<input type="file" accept="image/*" onchange={onBgFile} hidden />
									</label>
									{#if $settings.appearance.backgroundImage}
										<button class="ghost" onclick={clearBg}>Entfernen</button>
									{/if}
								</div>
								{#if $settings.appearance.backgroundImage}
									<label style="margin-top:8px">Bild-Deckkraft: {$settings.appearance.backgroundOpacity}%</label>
									<input type="range" min="10" max="100" bind:value={$settings.appearance.backgroundOpacity} />
								{/if}
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
									<option value="'Segoe UI', sans-serif">Segoe UI</option>
									<option value="Verdana, sans-serif">Verdana</option>
									<option value="Tahoma, sans-serif">Tahoma</option>
									<option value="'Trebuchet MS', sans-serif">Trebuchet MS</option>
									<option value="Georgia, serif">Georgia (Serif)</option>
									<option value="'Times New Roman', serif">Times New Roman</option>
									<option value="'Courier New', ui-monospace, monospace">Courier (Mono)</option>
									<option value="'Comic Sans MS', cursive">Comic Sans</option>
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
							<p class="hint">
								<b>Karten-Schatten:</b> legt einen weichen Schlagschatten unter die Anbieterkarten – sie wirken dadurch leicht „angehoben" über dem Hintergrund.
								<b>Karten-Hover-Zoom:</b> die Karte wird beim Drüberfahren leicht vergrößert.
								<b>Animationen:</b> sanfte Übergänge bei Hover/Verschieben (Karten gleiten/zoomen weich statt hart umzuspringen). Aus = alles sofort, ohne Bewegung.
							</p>
						</div>

						{#if $settings.appearance.particles}
							<div class="block">
								<div class="block-label">Partikel-Optionen</div>
								<div class="grid">
									<div class="field">
										<label>Anzahl: {$settings.appearance.particleCount}</label>
										<input type="range" min="10" max="150" bind:value={$settings.appearance.particleCount} />
									</div>
									<div class="field">
										<label>Geschwindigkeit: {$settings.appearance.particleSpeed.toFixed(1)}</label>
										<input type="range" min="0" max="1" step="0.1" bind:value={$settings.appearance.particleSpeed} />
									</div>
									<div class="field">
										<label>Größe: {$settings.appearance.particleSize}</label>
										<input type="range" min="1" max="8" step="1" bind:value={$settings.appearance.particleSize} />
									</div>
									<div class="field">
										<label>Partikel-Farbe</label>
										<div class="row">
											<input type="color" bind:value={$settings.appearance.particleColor} />
											<input type="text" class="hex" bind:value={$settings.appearance.particleColor} />
										</div>
									</div>
								</div>
								<div class="field" style="margin-top:6px">
									<label>Formen (mehrere möglich)</label>
									<div class="row3">
										{#each PARTICLE_SHAPES as sh}
											<label class="toggle">
												<input
													type="checkbox"
													checked={$settings.appearance.particleShapes?.includes(sh.id)}
													onchange={() => toggleShape(sh.id)}
												/> {sh.label}
											</label>
										{/each}
									</div>
								</div>
							</div>
						{/if}

						<div class="block">
							<div class="block-label">Anbieter öffnen als</div>
							<div class="row">
								<button class:active={$settings.appearance.streamMode === 'embedded'} onclick={() => ($settings.appearance.streamMode = 'embedded')}>Eingebettet (im Fenster)</button>
								<button class:active={$settings.appearance.streamMode === 'window'} onclick={() => ($settings.appearance.streamMode = 'window')}>Eigenes Fenster</button>
							</div>
							<p class="hint">„Eingebettet" zeigt den Anbieter direkt in OmniHub. Falls dabei nichts erscheint, stelle auf „Eigenes Fenster" – das öffnet ein separates Browser-Fenster (funktioniert immer).</p>
						</div>

						<div class="block">
							<button class="ghost danger" onclick={resetAppearance}>↩️ Design auf Standard zurücksetzen</button>
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
								<select value={$settings.clock.type} onchange={(e) => settings.update((s) => ({ ...s, clock: { ...s.clock, type: (e.currentTarget as HTMLSelectElement).value as 'digital' | 'analog' } }))}>
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
						<button class="ghost" onclick={() => settings.update((s) => ({ ...s, clock: { ...s.clock, x: null, y: null } }))}>Position zurücksetzen (oben rechts)</button>
						<p class="hint">Solange dieser Tab offen ist, wird die Uhr <b>ganz vorne</b> angezeigt und du kannst sie mit der Maus <b>verschieben</b> (gestrichelter Rahmen). Bei <b>100&nbsp;% Transparenz</b> wird die Uhr ausgeblendet.</p>
					{:else if active === 'advanced'}
						<div class="about">
							<div class="about-logo">👁️</div>
							<div class="about-tx">
								<div class="about-name">{APP_NAME}</div>
								<div class="about-ver">Version {APP_VERSION}</div>
							</div>
							{#if $updateState.available}<span class="up-pill">Update v{$updateState.version}</span>{/if}
						</div>

						<div class="opt-group">
							<div class="opt-group-title">Updates</div>
							<div class="opt">
								<div class="opt-ic">⬆️</div>
								<div class="opt-tx2"><div class="opt-t">Nach Updates suchen</div><div class="opt-d">Prüft GitHub auf eine neuere Version.</div></div>
								<button class="opt-btn" disabled={$updateState.checking} onclick={() => checkForUpdate(true)}>{$updateState.checking ? 'Prüfe…' : 'Suchen'}</button>
							</div>
							<a class="opt" href={LINKS.githubReleases} target="_blank" rel="noreferrer">
								<div class="opt-ic">🗒️</div>
								<div class="opt-tx2"><div class="opt-t">Alle Versionen</div><div class="opt-d">Changelog & Downloads auf GitHub.</div></div>
								<span class="opt-btn ghosty">Öffnen ↗</span>
							</a>
							{#if $updateState.available}
								<p class="hint">Update auf v{$updateState.version} verfügbar – das Banner oben bietet „Herunterladen & installieren".</p>
							{/if}
						</div>

						<div class="opt-group">
							<div class="opt-group-title">Daten & Ansicht</div>
							<div class="opt">
								<div class="opt-ic">🎴</div>
								<div class="opt-tx2"><div class="opt-t">Anbieterkarten zurücksetzen</div><div class="opt-d">Stellt die Standard-Anbieter wieder her.</div></div>
								<button class="opt-btn" onclick={resetProviders}>Zurücksetzen</button>
							</div>
							<div class="opt">
								<div class="opt-ic">👋</div>
								<div class="opt-tx2"><div class="opt-t">Onboarding erneut starten</div><div class="opt-d">Zeigt die Einführung beim nächsten Mal.</div></div>
								<button class="opt-btn" onclick={() => { close(); onboardingOpen.set(true); }}>Starten</button>
							</div>
						</div>

						<div class="opt-group">
							<div class="opt-group-title">Hilfe & Feedback</div>
							<a class="opt" href={LINKS.discord} target="_blank" rel="noreferrer">
								<div class="opt-ic">💬</div>
								<div class="opt-tx2"><div class="opt-t">Discord</div><div class="opt-d">Feedback, Hilfe und Neuigkeiten.</div></div>
								<span class="opt-btn ghosty">Beitreten ↗</span>
							</a>
						</div>

						<p class="copyright">© 2026 Luka Kalinka · {APP_NAME}</p>
					{:else if active === 'account'}
						<p class="acc-intro">Jedes Profil hat eigene Favoriten, Watchlist, Streamzeit und – beim Streamen – getrennte Logins.</p>
						<div class="plist">
							{#each $profiles as p (p.id)}
								<div class="prow">
									<span class="pav">👤</span>
									<input class="pname-in" value={p.name} oninput={(e) => renameProfile(p.id, (e.currentTarget as HTMLInputElement).value)} />
									{#if p.id === $mainProfileId}<span class="pbadge main">★ Haupt</span>{/if}
									{#if p.id === $activeProfileId}<span class="pbadge">aktiv</span>{/if}
									{#if p.id !== $mainProfileId}
										<button class="mini" onclick={() => requestSetMain(p.id)} title="Als Haupt-Profil festlegen (Admin-Code nötig)">★ Haupt</button>
									{/if}
									<button class="mini" onclick={() => openPinPanel(p.id)}>{p.pinHash ? '🔒 PIN ändern' : 'PIN setzen'}</button>
									{#if p.pinHash}
										<button class="mini" onclick={() => openResetPanel(p.id)} title="PIN vergessen? Mit Admin-Code zurücksetzen">PIN vergessen?</button>
									{/if}
									<button
										class="mini danger"
										disabled={$profiles.length <= MIN_PROFILES || p.id === $mainProfileId}
										onclick={() => deleteProfile(p.id)}
										title={p.id === $mainProfileId ? 'Haupt-Profil ist nicht löschbar' : ($profiles.length <= MIN_PROFILES ? 'Mindestens ein Profil nötig' : 'Profil löschen')}
									>🗑</button>

									{#if pinEditFor === p.id}
										<div class="pin-panel">
											{#if p.pinHash}
												<input class="pin-in" type="password" inputmode="numeric" placeholder="Alter PIN" bind:value={oldPinInput} />
											{/if}
											<input class="pin-in" type="password" inputmode="numeric" placeholder="Neuer PIN (min. 4)" bind:value={newPinInput} onkeydown={(e) => e.key === 'Enter' && savePin(p)} />
											<button class="mini primary" onclick={() => savePin(p)}>Speichern</button>
											{#if p.pinHash}<button class="mini danger" onclick={() => removePin(p)}>PIN entfernen</button>{/if}
											<button class="mini" onclick={closePinPanel}>Abbrechen</button>
											{#if pinError}<span class="pin-err">{pinError}</span>{/if}
										</div>
									{/if}

									{#if resetPinFor === p.id}
										<div class="pin-panel">
											<input class="pin-in" type="password" placeholder="Admin-Code" bind:value={resetAdminInput} onkeydown={(e) => e.key === 'Enter' && doResetPin(p.id)} />
											<button class="mini primary" onclick={() => doResetPin(p.id)}>PIN zurücksetzen</button>
											<button class="mini" onclick={closeResetPanel}>Abbrechen</button>
											{#if resetMsg}<span class="pin-err">{resetMsg}</span>{/if}
											{#if !$adminCodeHash}<span class="pin-err">Es ist noch kein Admin-Code gesetzt (siehe unten).</span>{/if}
										</div>
									{/if}

									{#if mainChangeFor === p.id}
										<div class="pin-panel">
											<input class="pin-in" type="password" placeholder="Admin-Code" bind:value={mainAdminInput} onkeydown={(e) => e.key === 'Enter' && confirmSetMain(p.id)} />
											<button class="mini primary" onclick={() => confirmSetMain(p.id)}>Als Haupt festlegen</button>
											<button class="mini" onclick={cancelSetMain}>Abbrechen</button>
											{#if mainMsg}<span class="pin-err">{mainMsg}</span>{/if}
										</div>
									{/if}
								</div>
							{/each}
						</div>
						{#if $profiles.length < MAX_PROFILES}
							<button class="ghost" onclick={() => addProfile(`Profil ${$profiles.length + 1}`)}>
								＋ Profil hinzufügen
							</button>
						{/if}

						<div class="block" style="margin-top:18px">
							<div class="block-label">🛡️ Admin-Code (für vergessene PINs)</div>
							<p class="hint" style="margin-top:0">Ein separater, frei wählbarer Code – unabhängig von Profil-PINs. Damit kannst du oben einen vergessenen Profil-PIN zurücksetzen und das Haupt-Profil ändern. Das Haupt-Profil (★) ist nicht löschbar.</p>
							<div class="admin-row">
								{#if $adminCodeHash}
									<input class="pin-in wide" type="password" placeholder="Alter Admin-Code" bind:value={oldAdminInput} />
								{/if}
								<input class="pin-in wide" type="password" placeholder={$adminCodeHash ? 'Neuer Admin-Code' : 'Admin-Code festlegen (min. 4)'} bind:value={adminInput} onkeydown={(e) => e.key === 'Enter' && saveAdminCode()} />
								<button class="mini primary" onclick={saveAdminCode}>{$adminCodeHash ? 'Ändern' : 'Setzen'}</button>
								{#if $adminCodeHash}<button class="mini danger" onclick={removeAdminCode}>Entfernen</button>{/if}
							</div>
							<div class="admin-status">Status: {$adminCodeHash ? '✅ Admin-Code ist gesetzt' : '⚠️ noch kein Admin-Code'}{#if adminMsg} · {adminMsg}{/if}</div>
						</div>

						<p class="hint">Profil wechseln kannst du unten links über den Profil-Button.</p>
					{:else if active === 'plugins'}
						<p class="acc-intro">Schalte eingebaute Zusatzfunktionen an oder aus.</p>

						<div class="plugin">
							<div class="plugin-head">
								<label class="toggle"><input type="checkbox" bind:checked={$settings.plugins.continueWatching}/> <b>Weiterschauen</b></label>
							</div>
							<p class="hint">Zeigt auf der Startseite die Reihe „Zuletzt geöffnet" für schnellen Wiedereinstieg.</p>
						</div>

						<div class="plugin">
							<div class="plugin-head">
								<label class="toggle"><input type="checkbox" bind:checked={$settings.plugins.sleepTimerEnabled}/> <b>Sleep-Timer</b></label>
							</div>
							<p class="hint">Nach Ablauf der Zeit wird ein Hinweis gezeigt – optional wird der laufende Stream geschlossen. Der Timer startet, sobald du ihn einschaltest.</p>
							{#if $settings.plugins.sleepTimerEnabled}
								<div class="plugin-opts">
									<label>Dauer:
										<select bind:value={$settings.plugins.sleepTimerMinutes}>
											<option value={15}>15 Minuten</option>
											<option value={30}>30 Minuten</option>
											<option value={60}>60 Minuten</option>
											<option value={90}>90 Minuten</option>
											<option value={120}>2 Stunden</option>
										</select>
									</label>
									<label class="toggle"><input type="checkbox" bind:checked={$settings.plugins.sleepTimerCloseStream}/> Stream danach schließen</label>
								</div>
							{/if}
						</div>

						<div class="plugin">
							<div class="plugin-head">
								<label class="toggle"><input type="checkbox" bind:checked={$settings.plugins.discordEnabled}/> <b>Discord-Status</b></label>
							</div>
							<p class="hint">Zeigt auf deinem Discord-Profil „Schaut …" an. <b>Kein Login nötig</b> – es nutzt deine bereits laufende Discord-App. Voraussetzung: Discord-Desktop-App ist offen.</p>
							{#if $settings.plugins.discordEnabled}
								<div class="plugin-opts">
									{#if DEFAULT_DISCORD_CLIENT_ID}
										<p class="hint" style="margin:0">✅ Es ist eine eingebaute OmniHub-Kennung hinterlegt – du musst nichts weiter eintragen.</p>
									{:else}
										<p class="hint" style="margin:0">ℹ️ Es ist noch keine eingebaute OmniHub-Kennung hinterlegt. Bis dahin bleibt der Status leer – oder du trägst unten eine eigene Application-ID ein.</p>
									{/if}
									<details style="flex-basis:100%; margin-top:8px">
										<summary style="cursor:pointer; color:var(--text-muted); font-size:13px">Erweitert: eigene Discord-Application-ID</summary>
										<input class="pin-in wide" style="display:block; margin-top:8px" type="text" inputmode="numeric" placeholder="optional – z.B. 1234567890123456789" bind:value={$settings.plugins.discordClientId} />
										<p class="hint" style="margin-top:4px">Nur nötig, wenn keine eingebaute Kennung vorhanden ist oder du eine eigene App verwenden willst. Anlegen unter <b>discord.com/developers/applications</b> → „New Application" → <b>Application ID</b> kopieren.</p>
									</details>
								</div>
							{/if}
						</div>

						<div class="block" style="margin-top:16px">
							<div class="block-label">Browser-Erweiterungen (z.B. AdBlock, Buster)</div>
							<p class="hint" style="margin-top:0">
								Echte Browser-Erweiterungen lassen sich hier <b>nicht installieren</b>: OmniHub nutzt die System-WebView (Edge/WebView2), nicht Chrome – es gibt keine Schnittstelle, um Erweiterungen wie AdBlock oder Buster zu laden. Captcha-Solver werden zudem bewusst nicht angeboten.
							</p>
						</div>
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
	nav button.active { background: var(--accent-soft); color: var(--accent); font-weight: 600; box-shadow: inset 3px 0 0 var(--accent); }
	nav button .i { width: 18px; text-align: center; }
	.version { color: var(--text-dim); font-size: 11px; text-align: center; padding-top: 8px; }

	.main { flex: 1; display: flex; flex-direction: column; }
	.main-head { display: flex; justify-content: space-between; align-items: center; padding: 18px 24px; border-bottom: 1px solid var(--border); }
	.main-head h3 { margin: 0; font-weight: 700; font-size: 17px; }
	.x { background: transparent; border: 0; color: var(--text-muted); font-size: 26px; cursor: pointer; line-height: 1; }
	.content { padding: 20px 24px; overflow: auto; }
	.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px 18px; }
	.field { background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; padding: 13px 15px; display: flex; flex-direction: column; gap: 8px; transition: border-color 0.15s; }
	.field:hover { border-color: var(--border-strong); }
	.field > label { font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-muted); }
	.field input[type='range'] { width: 100%; }
	input[type='range'], input[type='checkbox'] { accent-color: var(--accent); }
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
	.ghost.danger { color: #f87171; border-color: color-mix(in srgb, #f87171 40%, var(--border)); }
	.ghost.danger:hover { border-color: #f87171; }
	.filebtn {
		background: var(--bg-card); border: 1px solid var(--border); color: var(--text);
		padding: 10px 14px; border-radius: 10px; cursor: pointer; font-size: 13.5px;
		display: inline-block; font-family: inherit;
	}
	.filebtn:hover { border-color: var(--border-strong); }
	.hint { color: var(--text-muted); font-size: 13px; }

	/* Profile-Tab */
	.acc-intro { color: var(--text-muted); font-size: 13px; margin: 0 0 14px; }
	.plist { display: flex; flex-direction: column; gap: 8px; margin-bottom: 14px; }
	.prow { display: flex; align-items: center; gap: 8px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; padding: 8px 10px; flex-wrap: wrap; }
	.pav { width: 26px; height: 26px; border-radius: 50%; background: var(--bg-card-2); display: grid; place-items: center; font-size: 13px; flex-shrink: 0; }
	.pname-in { flex: 1; min-width: 120px; background: var(--bg-elev); border: 1px solid var(--border); color: var(--text); border-radius: 8px; padding: 7px 10px; font-size: 13.5px; font-family: inherit; }
	.pbadge { font-size: 10px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--accent); background: var(--accent-soft); padding: 3px 8px; border-radius: 999px; }
	.pin-in { width: 150px; background: var(--bg-elev); border: 1px solid var(--border); color: var(--text); border-radius: 8px; padding: 7px 10px; font-size: 13px; letter-spacing: 3px; font-family: inherit; }
	.pin-panel { flex-basis: 100%; display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-top: 6px; padding-top: 8px; border-top: 1px dashed var(--border); }
	.pbadge.main { color: #fbbf24; background: color-mix(in srgb, #fbbf24 18%, transparent); }
	.pin-in.wide { width: 240px; letter-spacing: normal; }
	.admin-row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
	.admin-status { font-size: 12px; color: var(--text-muted); margin-top: 8px; }
	.plugin { background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; padding: 12px 14px; margin-bottom: 10px; }
	.plugin-head { display: flex; align-items: center; justify-content: space-between; }
	.plugin .hint { margin: 6px 0 0; }
	.plugin-opts { display: flex; flex-wrap: wrap; gap: 14px; align-items: center; margin-top: 10px; padding-top: 10px; border-top: 1px dashed var(--border); }
	.plugin-opts select { background: var(--bg-elev); border: 1px solid var(--border); color: var(--text); border-radius: 8px; padding: 6px 10px; font-family: inherit; }
	.pin-err { color: #f87171; font-size: 12px; }
	.mini { background: var(--bg-elev); border: 1px solid var(--border); color: var(--text-muted); padding: 7px 10px; border-radius: 8px; cursor: pointer; font-size: 12.5px; font-family: inherit; }
	.mini:hover { color: var(--text); border-color: var(--border-strong); }
	.mini.primary { background: var(--accent); color: var(--accent-text); border: 0; font-weight: 700; }
	.mini.danger:hover { color: #f87171; border-color: #f87171; }
	.mini:disabled { opacity: 0.4; cursor: not-allowed; }

	/* Mehr-Tab */
	.about { display: flex; align-items: center; gap: 14px; background: linear-gradient(135deg, var(--accent-soft), transparent 70%); border: 1px solid var(--border); border-radius: 14px; padding: 16px 18px; margin-bottom: 20px; }
	.about-logo { width: 46px; height: 46px; flex-shrink: 0; border-radius: 12px; background: radial-gradient(circle at 30% 30%, var(--accent), color-mix(in srgb, var(--accent) 45%, #000)); display: grid; place-items: center; font-size: 24px; box-shadow: 0 6px 18px -6px var(--accent); }
	.about-name { font-size: 18px; font-weight: 800; }
	.about-ver { font-size: 12.5px; color: var(--text-muted); }
	.up-pill { margin-left: auto; background: var(--accent); color: var(--accent-text); font-size: 11.5px; font-weight: 700; padding: 5px 11px; border-radius: 999px; }
	.opt-group { margin-bottom: 18px; }
	.opt-group-title { font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-muted); margin: 0 2px 8px; }
	.opt { display: flex; align-items: center; gap: 12px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; padding: 12px 14px; margin-bottom: 8px; text-decoration: none; color: var(--text); transition: border-color 0.15s, transform 0.12s; }
	.opt:hover { border-color: var(--border-strong); }
	a.opt:hover { transform: translateY(-1px); }
	.opt-ic { width: 38px; height: 38px; flex-shrink: 0; border-radius: 10px; background: var(--bg-elev); display: grid; place-items: center; font-size: 19px; }
	.opt-tx2 { flex: 1; min-width: 0; }
	.opt-t { font-weight: 700; font-size: 14px; }
	.opt-d { font-size: 12px; color: var(--text-muted); margin-top: 1px; }
	.opt-btn { flex-shrink: 0; background: var(--accent); color: var(--accent-text); border: 0; border-radius: 9px; padding: 8px 15px; font-family: inherit; font-weight: 700; font-size: 12.5px; cursor: pointer; }
	.opt-btn:hover { filter: brightness(1.08); }
	.opt-btn:disabled { opacity: 0.5; cursor: not-allowed; }
	.opt-btn.ghosty { background: var(--bg-elev); color: var(--accent); border: 1px solid var(--border); }
	.copyright { text-align: center; color: var(--text-dim); font-size: 11.5px; margin-top: 8px; }
</style>
