<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import { initScrollOnNavigate } from '$lib/navigation/scroll-on-navigate';
	import '../app.css';
	import CookieConsentBanner from '$lib/components/molecules/CookieConsentBanner.svelte';
	import NavigationProgress from '$lib/components/molecules/NavigationProgress.svelte';
	import { resolveTheme, type ThemePreference } from '$lib/domain/theme';
	import { initLocale } from '$lib/i18n';
	import { pwaInfo } from 'virtual:pwa-info';
	import { initPwaInstallListeners } from '$lib/utils/pwa';

	let { children, data } = $props();

	const webManifest = $derived(pwaInfo?.webManifest);

	onMount(() => {
		initScrollOnNavigate();
		initPwaInstallListeners();

		if (!pwaInfo) {
			return;
		}

		void import('virtual:pwa-register').then(({ registerSW }) => {
			registerSW({ immediate: true });
		});
	});

	// SSR: effects do not run on the server; sync init uses layout load locale (cookie).
	initLocale(data.locale);

	$effect.pre(() => {
		initLocale(data.locale);
	});

	function applyResolvedTheme(preference: ThemePreference) {
		if (!browser) {
			return;
		}
		const resolved = resolveTheme(
			preference,
			window.matchMedia('(prefers-color-scheme: dark)').matches
		);
		document.documentElement.dataset.theme = resolved;
	}

	$effect(() => {
		if (!browser || !data.user || !data.themePreference) {
			return;
		}

		applyResolvedTheme(data.themePreference);

		if (data.themePreference !== 'system') {
			return;
		}

		const media = window.matchMedia('(prefers-color-scheme: dark)');
		const onChange = () => applyResolvedTheme('system');
		media.addEventListener('change', onChange);
		return () => media.removeEventListener('change', onChange);
	});
</script>

<svelte:head>
	{#if webManifest}
		<link rel="manifest" href={webManifest.href} crossorigin={webManifest.useCredentials ? 'use-credentials' : undefined} />
	{/if}
</svelte:head>

<NavigationProgress />
{@render children()}
<CookieConsentBanner cookieConsent={data.cookieConsent ?? null} />