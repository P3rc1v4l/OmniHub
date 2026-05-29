<script lang="ts">
	import { addCustomProvider } from '$lib/stores/providers';
	import type { Quality } from '$lib/types';

	let { open = false, close }: { open?: boolean; close: () => void } = $props();

	let name = $state('');
	let url = $state('');
	let subtitle = $state('');
	let color = $state('#30c5bb');
	let quality = $state<Quality>('HD');

	function reset() { name = ''; url = ''; subtitle = ''; color = '#30c5bb'; quality = 'HD'; }

	function save() {
		if (!name.trim() || !url.trim()) return;
		addCustomProvider({ name, url, subtitle, color, quality });
		reset();
		close();
	}
	function onBackdrop(e: MouseEvent) { if (e.target === e.currentTarget) close(); }
</script>

{#if open}
	<div class="backdrop" onclick={onBackdrop} role="presentation">
		<div class="dialog omni-card" role="dialog" aria-modal="true" aria-label="Anbieter hinzufügen">
			<header>
				<h2>Eigenen Anbieter hinzufügen</h2>
				<button class="x" onclick={close} aria-label="Schließen">×</button>
			</header>
			<div class="body">
				<label class="f"><span>Name</span>
					<input type="text" bind:value={name} placeholder="z. B. Mein Dienst" />
				</label>
				<label class="f"><span>Adresse (URL)</span>
					<input type="text" bind:value={url} placeholder="https://…" />
				</label>
				<label class="f"><span>Beschreibung (optional)</span>
					<input type="text" bind:value={subtitle} placeholder="z. B. Filme & Serien" />
				</label>
				<div class="row">
					<label class="f"><span>Farbe</span>
						<input type="color" bind:value={color} />
					</label>
					<label class="f"><span>Qualität</span>
						<select bind:value={quality}>
							<option value="4K">4K</option>
							<option value="1080p">1080p</option>
							<option value="HD">HD</option>
							<option value="SD">SD</option>
						</select>
					</label>
				</div>
				<p class="hint">Das Logo wird aus dem Namen erzeugt; ein eigenes Logo lässt sich später im Karteneditor setzen.</p>
			</div>
			<footer>
				<button class="ghost" onclick={close}>Abbrechen</button>
				<button class="primary" disabled={!name.trim() || !url.trim()} onclick={save}>Hinzufügen</button>
			</footer>
		</div>
	</div>
{/if}

<style>
	.backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.55); display: grid; place-items: center; z-index: 110; backdrop-filter: blur(4px); }
	.dialog { width: min(480px, 92vw); background: var(--bg-elev); }
	header { display: flex; justify-content: space-between; align-items: center; padding: 18px 22px; border-bottom: 1px solid var(--border); }
	h2 { margin: 0; font-size: 17px; font-weight: 700; }
	.x { background: transparent; border: 0; color: var(--text-muted); font-size: 24px; cursor: pointer; line-height: 1; }
	.body { padding: 18px 22px; display: flex; flex-direction: column; gap: 12px; }
	.f { display: flex; flex-direction: column; gap: 6px; flex: 1; }
	.f > span { font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--text-muted); }
	.f input[type='text'], .f select { background: var(--bg-card); border: 1px solid var(--border); color: var(--text); border-radius: 9px; padding: 9px 12px; font-size: 14px; }
	.f input[type='color'] { width: 44px; height: 38px; padding: 2px; border: 1px solid var(--border); border-radius: 9px; background: transparent; }
	.row { display: flex; gap: 12px; }
	.hint { color: var(--text-muted); font-size: 12px; margin: 0; }
	footer { display: flex; justify-content: flex-end; gap: 10px; padding: 14px 22px 20px; border-top: 1px solid var(--border); }
	.ghost { background: var(--bg-card); border: 1px solid var(--border); color: var(--text); padding: 10px 16px; border-radius: 10px; cursor: pointer; }
	.primary { background: var(--accent); color: var(--accent-text); border: 0; padding: 10px 18px; border-radius: 10px; cursor: pointer; font-weight: 700; }
	.primary:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
