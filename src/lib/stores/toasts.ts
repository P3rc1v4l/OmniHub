// In-App-Benachrichtigungen (Toasts). Ersetzt die nativen Windows-Meldungen –
// alle Hinweise erscheinen nur innerhalb der App.
import { writable } from 'svelte/store';

export interface Toast {
	id: number;
	title: string;
	body?: string;
	icon?: string;
}

export const toasts = writable<Toast[]>([]);

let counter = 0;
export function pushToast(title: string, body?: string, icon = '🔔', timeoutMs = 5000): void {
	const id = ++counter;
	toasts.update(($t) => [...$t, { id, title, body, icon }]);
	if (timeoutMs > 0) {
		setTimeout(() => dismissToast(id), timeoutMs);
	}
}

export function dismissToast(id: number): void {
	toasts.update(($t) => $t.filter((x) => x.id !== id));
}
