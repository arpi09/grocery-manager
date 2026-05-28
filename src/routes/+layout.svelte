<script lang="ts">
	import { browser } from '$app/environment';
	import '../app.css';
	import { resolveTheme, type ThemePreference } from '$lib/domain/theme';

	let { children, data } = $props();

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

{@render children()}