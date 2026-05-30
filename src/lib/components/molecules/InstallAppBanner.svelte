<script lang="ts">
	import { onMount } from 'svelte';
	import Button from '$lib/components/atoms/Button.svelte';
	import MarketingButtonLink from '$lib/components/marketing/MarketingButtonLink.svelte';
	import { t } from '$lib/i18n';
	import {
		dismissInstallBanner,
		isInstallBannerDismissed,
		shouldOfferInstallExperience
	} from '$lib/utils/pwa';

	interface Props {
		installHref?: string;
	}

	let { installHref = '/install-app' }: Props = $props();

	let visible = $state(false);

	onMount(() => {
		visible = shouldOfferInstallExperience() && !isInstallBannerDismissed();
	});

	function handleDismiss() {
		dismissInstallBanner();
		visible = false;
	}
</script>

{#if visible}
	<aside class="install-banner" aria-label={t('pwa.banner.aria')}>
		<div class="banner-text">
			<strong>{t('pwa.banner.title')}</strong>
			<p>{t('pwa.banner.body')}</p>
		</div>
		<div class="banner-actions">
			<MarketingButtonLink href={installHref} variant="primary">
				{t('pwa.banner.cta')}
			</MarketingButtonLink>
			<Button type="button" variant="secondary" onclick={handleDismiss}>
				{t('pwa.banner.dismiss')}
			</Button>
		</div>
	</aside>
{/if}

<style>
	.install-banner {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		margin-bottom: var(--space-md);
		padding: var(--space-md);
		border-radius: var(--radius-md);
		border: 1px solid var(--color-border);
		background: var(--color-surface-muted);
	}

	.banner-text strong {
		display: block;
		margin-bottom: 0.25rem;
	}

	.banner-text p {
		margin: 0;
		font-size: 0.9rem;
		color: var(--color-text-muted);
		line-height: var(--line-height-body);
	}

	.banner-actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-sm);
	}
</style>
