<script lang="ts">
	import { settings } from '$lib/stores/settings';
	import { activeStream } from '$lib/stores/providers';
	import { discordConnect, discordSetActivity, discordClear, discordDisconnect } from '$lib/discord';
	import { DEFAULT_DISCORD_CLIENT_ID } from '$lib/version';
	import { get } from 'svelte/store';

	// Nicht-reaktiver Verbindungszustand (vermeidet Effekt-Schleifen).
	let connected = false;
	let lastClientId = '';

	// Eigene ID hat Vorrang, sonst die eingebaute OmniHub-ID.
	function effectiveId(): string {
		return (get(settings).plugins.discordClientId || DEFAULT_DISCORD_CLIENT_ID).trim();
	}

	function updatePresence() {
		const p = get(settings).plugins;
		if (!p.discordEnabled || !connected) return;
		const stream = get(activeStream);
		if (stream && stream.name) {
			discordSetActivity(`Schaut ${stream.name}`, stream.subtitle || 'über OmniHub', 'omnihub', 'OmniHub');
		} else {
			discordSetActivity('Durchstöbert OmniHub', 'Streaming-Hub', 'omnihub', 'OmniHub');
		}
	}

	// Verbindung auf-/abbauen, wenn das Modul oder die Client-ID sich ändert.
	$effect(() => {
		const enabled = $settings.plugins.discordEnabled;
		void $settings.plugins.discordClientId;
		const clientId = effectiveId();
		if (enabled && clientId) {
			if (!connected || clientId !== lastClientId) {
				lastClientId = clientId;
				discordConnect(clientId).then(() => {
					connected = true;
					updatePresence();
				});
			}
		} else if (connected) {
			connected = false;
			void discordClear();
			void discordDisconnect();
		}
	});

	// Aktivität bei Stream-Wechsel aktualisieren.
	$effect(() => {
		void $activeStream;
		void $settings.plugins.discordEnabled;
		updatePresence();
	});
</script>
