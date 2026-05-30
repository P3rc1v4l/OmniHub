<script lang="ts">
	import type { Provider } from '$lib/types';
	import { brandIcons } from '$lib/data/brandIcons';

	export let provider: Provider;
	export let size: number = 64;

	// Initialen für den allerletzten Notfall (kein Bild, kein SVG, kein Favicon)
	const overrides: Record<string, string> = {
		'prime-video': 'P', 'disney-plus': 'D+', 'paramount-plus': 'P+', 'apple-tv-plus': 'tv',
		'magenta-tv': 'T', 'sky-go': 'sky', 'ard-mediathek': '1', 'zdf-mediathek': 'ZDF',
		'rtl-plus': 'RTL+', 'kika': 'KiKA', 'wow': 'W', 'mubi': 'm', 'max': 'm', 'twitch': '◣',
		'youtube': '▶', 'spotify': '♫', 'crunchyroll': 'cr', 'dazn': 'DA', 'funk': 'f',
		'waipu-tv': 'w', 'adn': 'A', 'joyn': 'joyn', 'netflix': 'N', 'arte': 'arte'
	};

	function hostOf(url: string): string | null {
		try {
			return new URL(url).hostname.replace(/^www\./, '');
		} catch {
			return null;
		}
	}

	let faviconFailed = false;
	// Bei Anbieterwechsel den Fehlerstatus zurücksetzen.
	$: { void provider.id; faviconFailed = false; }

	$: label = overrides[provider.id] ?? provider.name.slice(0, 2);
	$: fontSize = Math.max(14, size * 0.45);
	$: isImage = !!provider.icon && /^(data:|https?:)/i.test(provider.icon);
	$: brandPath = !isImage ? (brandIcons[provider.id] ?? null) : null;
	$: domain = !isImage && !brandPath ? hostOf(provider.url) : null;
	$: faviconUrl = domain ? `https://www.google.com/s2/favicons?sz=128&domain=${domain}` : null;
	$: useFavicon = !!faviconUrl && !faviconFailed;
</script>

{#if isImage}
	<img class="logo logo-img" src={provider.icon} alt={provider.name} style="width: {size}px; height: {size}px;" />
{:else if useFavicon}
	<div class="logo fav" style="width: {size}px; height: {size}px;" aria-hidden="true">
		<img
			class="fav-img"
			src={faviconUrl}
			alt={provider.name}
			style="width: {size * 0.62}px; height: {size * 0.62}px;"
			onerror={() => (faviconFailed = true)}
		/>
	</div>
{:else}
	<div
		class="logo"
		style="--bg1: {provider.color}; --bg2: {provider.color2 ?? provider.color}; width: {size}px; height: {size}px; font-size: {fontSize}px;"
		aria-hidden="true"
	>
		{#if brandPath}
			<svg class="brand" viewBox="0 0 24 24" style="width: {size * 0.52}px; height: {size * 0.52}px;" aria-hidden="true">
				<path d={brandPath} fill="currentColor" />
			</svg>
		{:else}
			<span>{label}</span>
		{/if}
	</div>
{/if}

<style>
	.logo {
		border-radius: 50%;
		display: grid;
		place-items: center;
		background: radial-gradient(circle at 30% 30%, var(--bg1), var(--bg2));
		color: #fff;
		font-weight: 800;
		font-family: 'DM Sans', system-ui, sans-serif;
		letter-spacing: -0.02em;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.15);
		flex-shrink: 0;
	}
	.logo span { line-height: 1; }
	.logo .brand { color: #fff; filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.25)); }
	/* Favicon-Modus: heller Icon-Hintergrund, damit bunte Favicons immer lesbar sind */
	.logo.fav { background: #fff; }
	.fav-img { object-fit: contain; border-radius: 4px; }
	.logo-img {
		border-radius: 50%;
		object-fit: cover;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.15);
		flex-shrink: 0;
		background: var(--bg-card-2);
	}
</style>
