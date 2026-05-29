// Frontend-Wrapper für die Discord-Rich-Presence-Commands aus src-tauri/src/discord.rs.
// Im Browser (Dev) sind alle Aufrufe wirkungslose No-Ops.
import { browser } from '$app/environment';

async function call(name: string, args: Record<string, unknown> = {}): Promise<void> {
	if (!browser) return;
	try {
		const { invoke } = await import('@tauri-apps/api/core');
		await invoke(name, args);
	} catch (e) {
		console.warn(`[discord] ${name} fehlgeschlagen:`, e);
	}
}

export function discordConnect(clientId: string) {
	return call('discord_connect', { clientId });
}

export function discordSetActivity(
	details: string,
	state: string,
	largeImage?: string,
	largeText?: string
) {
	return call('discord_set_activity', {
		details,
		stateText: state,
		largeImage: largeImage ?? null,
		largeText: largeText ?? null
	});
}

export function discordClear() {
	return call('discord_clear');
}

export function discordDisconnect() {
	return call('discord_disconnect');
}
