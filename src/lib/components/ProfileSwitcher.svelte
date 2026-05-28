<script lang="ts">
	import { profiles, activeProfileId, switchProfile, addProfile, verifyPin, MAX_PROFILES } from '$lib/stores/profiles';
	import type { Profile } from '$lib/types';

	let { openProfiles }: { openProfiles: () => void } = $props();

	let open = $state(false);
	let pinFor = $state<Profile | null>(null);
	let pinValue = $state('');
	let pinError = $state(false);

	const active = $derived($profiles.find((p) => p.id === $activeProfileId) ?? $profiles[0]);

	async function select(p: Profile) {
		if (p.id === $activeProfileId) { open = false; return; }
		if (p.pinHash) { pinFor = p; pinValue = ''; pinError = false; return; }
		await switchProfile(p.id);
		open = false;
	}

	async function submitPin() {
		if (!pinFor) return;
		if (await verifyPin(pinValue, pinFor.pinHash)) {
			await switchProfile(pinFor.id);
			pinFor = null; open = false;
		} else {
			pinError = true;
		}
	}

	async function quickAdd() {
		const id = addProfile(`Profil ${$profiles.length + 1}`);
		if (id) { await switchProfile(id); open = false; }
	}

	function toggle() { open = !open; pinFor = null; }
</script>

<div class="wrap">
	{#if open}
		<button class="scrim" aria-label="Schließen" onclick={() => (open = false)}></button>
		<div class="menu omni-card">
			{#if pinFor}
				<div class="pin">
					<div class="pin-title">PIN für „{pinFor.name}"</div>
					<input
						type="password" inputmode="numeric" autocomplete="off"
						bind:value={pinValue} class:err={pinError}
						placeholder="PIN" onkeydown={(e) => e.key === 'Enter' && submitPin()}
					/>
					{#if pinError}<div class="pin-err">Falsche PIN</div>{/if}
					<div class="pin-actions">
						<button class="ghost" onclick={() => (pinFor = null)}>Zurück</button>
						<button class="primary" onclick={submitPin}>Wechseln</button>
					</div>
				</div>
			{:else}
				<div class="list">
					{#each $profiles as p (p.id)}
						<button class="row" class:active={p.id === $activeProfileId} onclick={() => select(p)}>
							<span class="av">👤</span>
							<span class="nm">{p.name}</span>
							{#if p.pinHash}<span class="lock">🔒</span>{/if}
							{#if p.id === $activeProfileId}<span class="check">✓</span>{/if}
						</button>
					{/each}
				</div>
				<div class="sep"></div>
				{#if $profiles.length < MAX_PROFILES}
					<button class="action" onclick={quickAdd}><span>＋</span> Profil hinzufügen</button>
				{/if}
				<button class="action" onclick={() => { open = false; openProfiles(); }}><span>⚙️</span> Profile verwalten…</button>
			{/if}
		</div>
	{/if}

	<button class="profile" onclick={toggle}>
		<span class="avatar">👤</span>
		<span class="pname">{active?.name ?? 'User'}</span>
		<span class="chev">{open ? '▴' : '▾'}</span>
	</button>
</div>

<style>
	.wrap { position: relative; }
	.scrim { position: fixed; inset: 0; background: transparent; border: 0; z-index: 40; cursor: default; }
	.menu {
		position: absolute; bottom: calc(100% + 8px); left: 0; right: 0;
		z-index: 50; background: var(--bg-elev); padding: 8px;
		box-shadow: 0 12px 30px -8px rgba(0,0,0,0.55);
	}
	.list { display: flex; flex-direction: column; gap: 2px; max-height: 220px; overflow: auto; }
	.row {
		display: flex; align-items: center; gap: 10px; width: 100%;
		background: transparent; border: 0; color: var(--text);
		padding: 9px 10px; border-radius: 9px; cursor: pointer; font-family: inherit; font-size: 13px;
	}
	.row:hover { background: var(--bg-card); }
	.row.active { background: var(--accent-soft); color: var(--accent); }
	.av { width: 22px; height: 22px; border-radius: 50%; background: var(--bg-card-2); display: grid; place-items: center; font-size: 12px; }
	.nm { flex: 1; text-align: left; font-weight: 600; }
	.lock, .check { font-size: 12px; }
	.sep { height: 1px; background: var(--border); margin: 6px 4px; }
	.action {
		display: flex; align-items: center; gap: 10px; width: 100%;
		background: transparent; border: 0; color: var(--text-muted);
		padding: 9px 10px; border-radius: 9px; cursor: pointer; font-family: inherit; font-size: 13px;
	}
	.action:hover { background: var(--bg-card); color: var(--text); }
	.action span { width: 22px; text-align: center; }

	.pin { padding: 6px; }
	.pin-title { font-size: 13px; font-weight: 600; margin-bottom: 8px; }
	.pin input { width: 100%; box-sizing: border-box; padding: 9px 12px; background: var(--bg-card); border: 1px solid var(--border); color: var(--text); border-radius: 9px; font-size: 15px; letter-spacing: 4px; }
	.pin input.err { border-color: #f87171; }
	.pin-err { color: #f87171; font-size: 12px; margin-top: 6px; }
	.pin-actions { display: flex; gap: 8px; margin-top: 10px; }
	.pin-actions button { flex: 1; padding: 8px; border-radius: 9px; cursor: pointer; font-family: inherit; font-size: 13px; }

	.ghost { background: var(--bg-card); border: 1px solid var(--border); color: var(--text); }
	.primary { background: var(--accent); color: var(--accent-text); border: 0; font-weight: 700; }

	.profile {
		display: flex; align-items: center; gap: 10px; width: 100%;
		background: var(--bg-card); border: 1px solid var(--border);
		padding: 8px 10px; border-radius: 10px; cursor: pointer;
		color: var(--text); font-family: inherit;
	}
	.profile:hover { border-color: var(--border-strong); }
	.avatar { width: 26px; height: 26px; border-radius: 50%; background: var(--accent-soft); color: var(--accent); display: grid; place-items: center; font-size: 13px; }
	.pname { flex: 1; text-align: left; font-size: 13px; font-weight: 600; }
	.chev { color: var(--text-muted); font-size: 10px; }
</style>
