<script lang="ts">
	import { updateState, installUpdate, dismissUpdate } from '$lib/stores/updater';
	import { APP_VERSION } from '$lib/version';
</script>

{#if $updateState.available && !$updateState.dismissed}
	<div class="banner">
		<span class="ic">⬆️</span>
		<div class="text">
			<strong>Update verfügbar: v{$updateState.version}</strong>
			<span class="cur">Du nutzt v{APP_VERSION}</span>
			{#if $updateState.notes}<span class="notes">{$updateState.notes}</span>{/if}
		</div>

		{#if $updateState.downloading}
			<div class="prog">
				<div class="bar" style="width: {Math.round($updateState.progress * 100)}%"></div>
				<span class="pct">{Math.round($updateState.progress * 100)}%</span>
			</div>
		{:else}
			<button class="install" onclick={installUpdate}>Herunterladen & installieren</button>
			<button class="later" onclick={dismissUpdate}>Später</button>
		{/if}
	</div>
{/if}

<style>
	.banner {
		display: flex; align-items: center; gap: 14px;
		padding: 10px 18px;
		background: linear-gradient(90deg, color-mix(in srgb, var(--accent) 28%, var(--bg-elev)), var(--bg-elev));
		border-bottom: 1px solid var(--accent);
		flex-shrink: 0;
	}
	.ic { font-size: 18px; }
	.text { display: flex; flex-direction: column; flex: 1; min-width: 0; gap: 1px; }
	.text strong { font-size: 14px; }
	.cur { color: var(--text-muted); font-size: 12px; }
	.notes { color: var(--text-muted); font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 60ch; }
	.install { background: var(--accent); color: var(--accent-text); border: 0; padding: 9px 16px; border-radius: 9px; font-weight: 700; cursor: pointer; font-size: 13px; }
	.later { background: transparent; border: 1px solid var(--border-strong); color: var(--text); padding: 9px 14px; border-radius: 9px; cursor: pointer; font-size: 13px; }
	.prog { display: flex; align-items: center; gap: 10px; min-width: 220px; }
	.prog .bar { height: 8px; background: var(--accent); border-radius: 999px; transition: width 0.2s; }
	.prog { position: relative; background: var(--bg-card); border-radius: 999px; padding: 0; height: 8px; flex: 0 0 200px; }
	.prog .bar { display: block; }
	.pct { position: absolute; right: -38px; font-size: 12px; color: var(--text-muted); font-variant-numeric: tabular-nums; }
</style>
