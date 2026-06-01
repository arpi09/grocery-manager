<script lang="ts">
	import MarketingSeoHead from '$lib/components/seo/MarketingSeoHead.svelte';
	import { marketingOgImageUrl } from '$lib/seo/seo';

	interface Props {
		title: string;
		description: string;
		canonicalUrl: string;
		locale?: 'sv' | 'en';
	}

	let { title, description, canonicalUrl, locale = 'sv' }: Props = $props();
</script>

<MarketingSeoHead
	{title}
	{description}
	{canonicalUrl}
	{locale}
	ogTitle={title}
	ogDescription={description}
	ogImageUrl={marketingOgImageUrl()}
/>
