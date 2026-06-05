<script lang="ts">
	import {
		marketingOgImageUrl,
		OG_IMAGE_HEIGHT,
		OG_IMAGE_WIDTH,
		SITE_NAME
	} from '$lib/seo/seo';

	interface Props {
		title: string;
		description: string;
		canonicalUrl: string;
		ogTitle?: string;
		ogDescription?: string;
		locale?: 'sv' | 'en' | string;
		ogImageUrl?: string;
		jsonLd?: Record<string, unknown> | Record<string, unknown>[];
		robots?: string;
	}

	let {
		title,
		description,
		canonicalUrl,
		ogTitle = title,
		ogDescription = description,
		locale = 'sv',
		ogImageUrl,
		jsonLd,
		robots = 'index, follow'
	}: Props = $props();

	const imageUrl = $derived(ogImageUrl ?? marketingOgImageUrl());
	const ogLocale = $derived(locale === 'en' ? 'en_US' : 'sv_SE');
	const jsonLdBlocks = $derived(jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : []);

	function jsonLdScriptTag(block: Record<string, unknown>): string {
		const close = '</' + 'script>';
		return '<script type="application/ld+json">' + JSON.stringify(block) + close;
	}
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<meta name="robots" content={robots} />
	<link rel="canonical" href={canonicalUrl} />
	<link rel="alternate" hreflang="sv" href={canonicalUrl} />
	<link rel="alternate" hreflang="en" href={canonicalUrl} />
	<link rel="alternate" hreflang="x-default" href={canonicalUrl} />
	<meta property="og:site_name" content={SITE_NAME} />
	<meta property="og:title" content={ogTitle} />
	<meta property="og:description" content={ogDescription} />
	<meta property="og:url" content={canonicalUrl} />
	<meta property="og:type" content="website" />
	<meta property="og:locale" content={ogLocale} />
	<meta property="og:locale:alternate" content={locale === 'en' ? 'sv_SE' : 'en_US'} />
	<meta property="og:image" content={imageUrl} />
	<meta property="og:image:width" content={String(OG_IMAGE_WIDTH)} />
	<meta property="og:image:height" content={String(OG_IMAGE_HEIGHT)} />
	<meta property="og:image:type" content="image/png" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={ogTitle} />
	<meta name="twitter:description" content={ogDescription} />
	<meta name="twitter:image" content={imageUrl} />
	{#each jsonLdBlocks as block, index (index)}
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{@html jsonLdScriptTag(block)}
	{/each}
</svelte:head>
