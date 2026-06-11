<script lang="ts">
	import { onMount } from 'svelte';
	import Badge from '$lib/components/atoms/Badge.svelte';
	import Card from '$lib/components/atoms/Card.svelte';
	import {
		trackProductEvent,
		trackPublicAcquisitionEvent
	} from '$lib/client/product-events';
	import { daysUntilExpiry, formatDaysLeft } from '$lib/domain/expiry';
	import { getLocale, t } from '$lib/i18n';
	import { locationLabel } from '$lib/i18n/domain-labels';

	let { data } = $props();

	const locale = getLocale();
	let expandedShareId = $state<string | null>(null);

	function cityHref(slug: string): string {
		return `/delningar?stad=${slug}`;
	}

	function toggleShare(shareId: string): void {
		const willExpand = expandedShareId !== shareId;
		expandedShareId = willExpand ? shareId : null;

		if (willExpand) {
			void trackPublicAcquisitionEvent('public_city_feed_item_clicked', {
				shareId,
				city: data.feed.city.slug,
				acquisition_source: 'city_feed'
			});
		}
	}

	async function handleSignupClick(): Promise<void> {
		await trackPublicAcquisitionEvent('public_city_feed_signup_clicked', {
			city: data.feed.city.slug,
			acquisition_source: 'city_feed'
		});
		await trackProductEvent('register_click', { acquisition_source: 'city_feed' });
	}

	onMount(() => {
		void trackPublicAcquisitionEvent('public_city_feed_viewed', {
			city: data.feed.city.slug,
			hasSupply: data.feed.hasSupply,
			acquisition_source: 'city_feed'
		});
	});
</script>

<svelte:head>
	<title>{t('publicCityFeed.pageTitle', { city: data.feed.city.label })}</title>
	<meta name="robots" content="noindex,nofollow" />
</svelte:head>

<main class="feed-page">
	<div class="feed-shell">
		<header class="feed-header">
			<p class="eyebrow">{t('publicCityFeed.eyebrow')}</p>
			<h1>{t('publicCityFeed.title', { city: data.feed.city.label })}</h1>
			<p>{t('publicCityFeed.lead')}</p>
		</header>

		<nav class="city-nav" aria-label={t('publicCityFeed.cityNavAria')}>
			{#each data.feed.cities as city (city.slug)}
				<a
					class="city-link"
					class:city-link--active={city.slug === data.feed.city.slug}
					href={cityHref(city.slug)}
				>
					{city.label}
				</a>
			{/each}
		</nav>

		{#if !data.feed.hasSupply}
			<section class="soft-landing">
				<h2>{t('publicCityFeed.softLandingTitle', { city: data.feed.city.label })}</h2>
				<p>{t('publicCityFeed.softLandingLead')}</p>
				<a class="signup-cta-btn signup-cta-btn--primary" href={data.registerUrl} onclick={handleSignupClick}>
					{t('publicCityFeed.signupBtn')}
				</a>
			</section>
		{:else}
			<ul class="share-list">
				{#each data.feed.items as share (share.id)}
					<li>
						<Card class="share-card">
							<button
								type="button"
								class="share-summary"
								aria-expanded={expandedShareId === share.id}
								onclick={() => toggleShare(share.id)}
							>
								<div class="share-summary-main">
									<span class="share-count">
										{t('publicCityFeed.itemCount', { count: share.itemCount })}
									</span>
									<ul class="preview-names">
										{#each share.previewItems as item, index (index)}
											<li>{item.name}</li>
										{/each}
									</ul>
									{#if share.itemCount > share.previewItems.length}
										<p class="more-items">
											{t('publicCityFeed.moreItems', {
												count: share.itemCount - share.previewItems.length
											})}
										</p>
									{/if}
								</div>
								<span class="expand-hint">
									{expandedShareId === share.id
										? t('publicCityFeed.collapse')
										: t('publicCityFeed.expand')}
								</span>
							</button>

							{#if expandedShareId === share.id}
								<ul class="item-list">
									{#each share.items as item, index (index)}
										<li class="item-row">
											<div class="item-main">
												<span class="item-name">{item.name}</span>
												<span class="item-location">{locationLabel(locale, item.location)}</span>
											</div>
											<div class="item-meta">
												{#if item.expiresOn}
													{@const daysLeft = daysUntilExpiry(item.expiresOn)}
													<Badge tone="warning">{formatDaysLeft(daysLeft, locale)}</Badge>
												{/if}
												<span class="quantity"
													>{item.quantity}{item.unit ? ` ${item.unit}` : ''}</span
												>
											</div>
										</li>
									{/each}
								</ul>
							{/if}
						</Card>
					</li>
				{/each}
			</ul>
		{/if}

		<p class="gdpr-note" role="note">{t('publicCityFeed.gdprNote')}</p>

		<section class="signup-cta">
			<h2>{t('publicCityFeed.signupTitle')}</h2>
			<p>{t('publicCityFeed.signupLead')}</p>
			<a class="signup-cta-btn" href={data.registerUrl} onclick={handleSignupClick}>
				{t('publicCityFeed.signupBtn')}
			</a>
		</section>
	</div>
</main>

<style>
	.feed-page {
		min-height: 100dvh;
		padding: calc(var(--space-xl) + env(safe-area-inset-top, 0)) var(--page-padding-x)
			calc(var(--space-xl) + env(safe-area-inset-bottom, 0));
		overflow-x: clip;
		background:
			radial-gradient(
				ellipse 80% 50% at 50% -10%,
				color-mix(in srgb, var(--color-primary) 8%, transparent),
				transparent
			),
			var(--color-bg);
	}

	.feed-shell {
		max-width: 36rem;
		margin: 0 auto;
		display: grid;
		gap: var(--space-lg);
	}

	.feed-header {
		display: grid;
		gap: var(--space-sm);
	}

	.eyebrow {
		margin: 0;
		font-size: var(--text-sm);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--color-primary);
	}

	h1 {
		margin: 0;
	}

	.city-nav {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-xs);
	}

	.city-link {
		padding: 0.45rem 0.85rem;
		border-radius: var(--radius-sm);
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		color: var(--color-text);
		font-size: var(--text-sm);
		font-weight: 600;
		text-decoration: none;
	}

	.city-link--active {
		border-color: var(--color-primary);
		background: color-mix(in srgb, var(--color-primary) 10%, var(--color-surface));
	}

	.soft-landing,
	.signup-cta {
		display: grid;
		gap: var(--space-sm);
		padding: var(--space-lg);
		border-radius: var(--radius-md);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
	}

	.soft-landing h2,
	.signup-cta h2 {
		margin: 0;
		font-size: 1.125rem;
	}

	.soft-landing p,
	.signup-cta p {
		margin: 0;
		color: var(--color-text-muted);
		font-size: var(--text-sm);
	}

	.share-list {
		margin: 0;
		padding: 0;
		list-style: none;
		display: grid;
		gap: var(--space-sm);
	}

	:global(.share-card) {
		display: grid;
		gap: var(--space-sm);
	}

	.share-summary {
		display: flex;
		justify-content: space-between;
		gap: var(--space-md);
		align-items: flex-start;
		width: 100%;
		padding: 0;
		border: 0;
		background: transparent;
		color: inherit;
		text-align: left;
		cursor: pointer;
	}

	.share-count {
		font-weight: 600;
	}

	.preview-names {
		margin: var(--space-xs) 0 0;
		padding-left: 1.1rem;
		color: var(--color-text-muted);
		font-size: var(--text-sm);
	}

	.more-items {
		margin: var(--space-xs) 0 0;
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	.expand-hint {
		flex-shrink: 0;
		font-size: var(--text-sm);
		color: var(--color-primary);
		font-weight: 600;
	}

	.item-list {
		margin: 0;
		padding: 0;
		list-style: none;
		display: grid;
		gap: var(--space-xs);
		border-top: 1px solid var(--color-border);
		padding-top: var(--space-sm);
	}

	.item-row {
		display: flex;
		justify-content: space-between;
		gap: var(--space-md);
		align-items: center;
	}

	.item-main {
		display: grid;
		gap: var(--space-2xs);
	}

	.item-name {
		font-weight: 600;
		overflow-wrap: anywhere;
	}

	.item-location,
	.quantity {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	.item-meta {
		display: grid;
		justify-content: end;
		gap: var(--space-xs);
		flex-shrink: 0;
	}

	.signup-cta-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 2.75rem;
		padding: 0.65rem 1.1rem;
		border-radius: var(--radius-sm);
		border: 1px solid var(--color-border);
		background: var(--color-surface-muted);
		color: var(--color-text);
		font-weight: 600;
		text-decoration: none;
		text-align: center;
	}

	.signup-cta-btn--primary {
		background: var(--color-primary);
		border-color: var(--color-primary);
		color: var(--color-on-primary, #fff);
	}

	.gdpr-note {
		margin: 0;
		padding: var(--space-md);
		border-radius: var(--radius-md);
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		background: color-mix(in srgb, var(--color-primary) 6%, var(--color-surface));
		border: 1px solid color-mix(in srgb, var(--color-primary) 18%, var(--color-border));
	}

	@media (max-width: 480px) {
		.item-row {
			flex-direction: column;
			align-items: flex-start;
		}

		.item-meta {
			width: 100%;
			grid-template-columns: 1fr auto;
			align-items: center;
		}

		.quantity {
			justify-self: end;
		}
	}
</style>
