<script lang="ts">
	import { page } from '$app/state';
	import { resolveAppPageTitle } from '$lib/seo/app-page-meta';
	import { robotsDirectiveForPath } from '$lib/seo/seo';

	let { locale }: { locale: 'sv' | 'en' } = $props();

	const pathname = $derived(page.url.pathname);
	const title = $derived(resolveAppPageTitle(pathname, locale));
	const robots = $derived(robotsDirectiveForPath(pathname));
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="robots" content={robots} />
</svelte:head>
