<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import MarketingFooter from '$lib/components/marketing/MarketingFooter.svelte';
	import MarketingHeader from '$lib/components/marketing/MarketingHeader.svelte';

	let { children, data } = $props();

	$effect.pre(() => {
		if (!browser) {
			return;
		}
		document.documentElement.dataset.theme = 'light';
	});
</script>

<div class="marketing-shell">
	<MarketingHeader
		content={data.marketing}
		loginUrl={data.loginUrl}
		currentPath={page.url.pathname}
	/>
	<main class="marketing-main">
		{@render children()}
	</main>
	<MarketingFooter content={data.marketing} loginUrl={data.loginUrl} />
</div>

<style>
	.marketing-shell {
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
		background:
			radial-gradient(ellipse 80% 50% at 50% -10%, color-mix(in srgb, var(--color-primary) 8%, transparent), transparent),
			var(--color-bg);
	}

	.marketing-main {
		flex: 1;
	}
</style>
