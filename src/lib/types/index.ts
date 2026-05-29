// Zentrale Typdefinitionen für OmniHub.

export type Quality = '4K' | '1080p' | 'HD' | 'SD';

export interface Provider {
	id: string;
	name: string;
	subtitle: string;       // z.B. "Anime & Manga", "Live-TV & Mediatheken"
	url: string;
	category: 'film-serien' | 'anime' | 'live-tv' | 'mediathek' | 'sport' | 'musik' | 'video' | 'eigene';
	color: string;          // Markenfarbe, Basis der Karte
	color2?: string;        // optionale 2. Farbe für Verlauf
	quality: Quality;
	icon?: string;          // ID aus icons.ts oder Daten-URL bei eigenen Anbietern
	custom?: boolean;
	hidden?: boolean;
	favorite?: boolean;
}

export interface Profile {
	id: string;
	name: string;
	avatar?: string;
	pinHash: string | null;
}

export interface ClockSettings {
	enabled: boolean;
	type: 'digital' | 'analog';
	showSeconds: boolean;
	color: string;
	transparency: number;
	size: number;
	x: number | null;
	y: number | null;
}

export interface NotificationSettings {
	pauseReminder: boolean;
	sound: boolean;
	updateHint: boolean;
	achievementUnlocked: boolean;
	watchlistReminder: boolean;
}

export interface AppearanceSettings {
	backgroundImage: string | null;
	accentColor: string;
	accentText: string;
	theme: 'dark' | 'light' | 'system';
	fontFamily: string;
	fontSize: number;
	radius: number;
	sidebarWidth: number;
	glassmorphism: boolean;
	particles: boolean;
	particleCount: number;
	particleSpeed: number;
	particleColor: string;
	particleShapes: string[];
	particleSize: number;
	streamMode: 'embedded' | 'window';
	cardShadow: boolean;
	cardHoverZoom: boolean;
	animations: boolean;
	language: 'de' | 'en';
	backgroundOpacity: number;
}

export interface PluginSettings {
	sleepTimerEnabled: boolean;
	sleepTimerMinutes: number;
	sleepTimerCloseStream: boolean;
	continueWatching: boolean;
	discordEnabled: boolean;
	discordClientId: string;
}

export interface Settings {
	appearance: AppearanceSettings;
	clock: ClockSettings;
	notifications: NotificationSettings;
	plugins: PluginSettings;
	onboardingDone: boolean;
}

export interface WatchlistItem {
	tmdbId: number;
	mediaType: 'movie' | 'tv';
	title: string;
	poster: string | null;
	overview: string;
	releaseDate: string | null;
	addedAt: number;
}

export interface TmdbItem {
	id: number;
	media_type: string;
	title: string;
	overview: string;
	poster: string | null;
	backdrop: string | null;
	release_date: string | null;
	vote_average: number | null;
}
