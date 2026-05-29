<script lang="ts">
	import { settings } from '$lib/stores/settings';
	import { pushToast } from '$lib/stores/toasts';
	import { activeStream } from '$lib/stores/providers';
	import { closeEmbedded } from '$lib/embedded';
	import { goto } from '$app/navigation';
	import { get } from 'svelte/store';

	// Startet/erneuert den Timer, wenn er aktiviert wird oder die Minuten sich ändern.
	$effect(() => {
		const enabled = $settings.plugins.sleepTimerEnabled;
		const mins = $settings.plugins.sleepTimerMinutes;
		if (!enabled || mins <= 0) return;
		const id = setTimeout(() => {
			const close = get(settings).plugins.sleepTimerCloseStream;
			pushToast('Sleep-Timer abgelaufen', close ? 'Der Stream wird geschlossen.' : 'Die eingestellte Zeit ist um.', '😴', 7000);
			if (close) {
				void closeEmbedded();
				activeStream.set(null);
				void goto('/');
			}
			// Timer ist einmalig – danach wieder ausschalten.
			settings.update((s) => ({ ...s, plugins: { ...s.plugins, sleepTimerEnabled: false } }));
		}, mins * 60 * 1000);
		return () => clearTimeout(id);
	});
</script>
