<script lang="ts">
	import { browser } from '$app/environment';
	import '../app.css';
	import NavigationProgress from '$lib/components/molecules/NavigationProgress.svelte';
	import { resolveTheme, type ThemePreference } from '$lib/domain/theme';
	import { initLocale } from '$lib/i18n';

	let { children, data } = $props();

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

<NavigationProgress />
{@render children()}