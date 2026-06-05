<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import MarketingFooter from '$lib/components/marketing/MarketingFooter.svelte';
	import MarketingHeader from '$lib/components/marketing/MarketingHeader.svelte';
	import { initLocale, type Locale } from '$lib/i18n';
	import { APP_HOME_PATH } from '$lib/navigation/app-home';
	import { t } from '$lib/i18n';

	let { children, data } = $props();

	const marketingLocale = $derived(
		(data.marketingLocale === 'en' ? 'en' : 'sv') satisfies Locale
	);

	initLocale(marketingLocale);

	$effect.pre(() => {
		initLocale(marketingLocale);
	});

	const isLoggedIn = $derived(Boolean(page.data.user?.id));
	const appHomeUrl = APP_HOME_PATH;

	$effect.pre(() => {
		if (!browser) {
			return;
		}
		document.documentElement.dataset.theme = 'light';
	});
</script>

<div class="marketing-shell">
	<a href="#main-content" class="skip-to-main">{t('a11y.skipToContent')}</a>
	<MarketingHeader
		content={data.marketing}
		loginUrl={data.loginUrl}
		{appHomeUrl}
		{isLoggedIn}
		currentPath={page.url.pathname}
	/>
	<main id="main-content" class="marketing-main" tabindex="-1">
		{@render children()}
	</main>
	<MarketingFooter content={data.marketing} loginUrl={data.loginUrl} />
</div>

<style>
	.marketing-shell {
		position: relative;
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
		background:
			radial-gradient(ellipse 80% 50% at 50% -10%, color-mix(in srgb, var(--color-primary) 8%, transparent), transparent),
			var(--color-bg);
	}

	.marketing-main {
		flex: 1;
		scroll-margin-top: var(--header-height-desktop);
	}

	.marketing-main:focus {
		outline: none;
	}
</style>
