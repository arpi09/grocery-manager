<script lang="ts">
	import EmptyState from '$lib/components/molecules/EmptyState.svelte';
	import type { HomeState } from '$lib/domain/home-state';
	import { t } from '$lib/i18n';

	interface Props {
		homeState: HomeState;
		shoppingListCount: number;
		expiringCount: number;
		canWrite: boolean;
		scanReceiptHref: string;
	}

	let {
		homeState,
		shoppingListCount,
		expiringCount,
		canWrite,
		scanReceiptHref,
	}: Props = $props();

	const showListaHero = $derived(
		homeState === 'lista_ready' || homeState === 'steady' || (homeState === 'expiry' && shoppingListCount > 0)
	);
	const showExpiryHero = $derived(homeState === 'expiry' && expiringCount > 0 && shoppingListCount === 0);
	const coldPrimaryHref = $derived(scanReceiptHref);
</script>

<section class="home-hero" data-testid="home-hero" data-home-state={homeState}>
	{#if homeState === 'cold'}
		{#if canWrite}
			<EmptyState
				iconId="box"
				title={t('home.v4.coldTitle')}
				description={t('home.emptyDescriptionShopping')}
				actionLabel={t('home.v4.coldAction')}
				actionHref="/inkop?quick=1"
				primaryAnalyticsId="home.empty_primary"
			/>
		{:else}
			<p class="readonly-empty">{t('home.readonlyEmpty')}</p>
		{/if}
	{:else if showListaHero}
		<div class="hero-card">
			<h2 class="hero-title">
				{t('home.hero.listaTitle', { count: shoppingListCount })}
			</h2>
			<a class="hero-cta" href="/inkop" data-analytics-id="home.weekly_shop_cta">
				{t('home.hero.listaCta')}
			</a>
		</div>
	{:else if showExpiryHero}
		<div class="hero-card">
			<h2 class="hero-title">{t('home.hero.expiryTitle')}</h2>
			<a class="hero-cta" href="/inventory/fridge?filter=expiring" data-analytics-id="home.expiry_cta">
				{t('home.hero.expiryCta')}
			</a>
		</div>
	{:else if canWrite}
		<div class="hero-card">
			<a class="hero-cta hero-cta--solo" href={coldPrimaryHref} data-analytics-id="home.cold_receipt">
				{t('home.hero.coldReceipt')}
			</a>
		</div>
	{/if}
</section>

<style>
	.home-hero {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.hero-card {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		padding: var(--space-md);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		background: var(--color-surface);
	}

	.hero-title {
		margin: 0;
		font-size: 1.125rem;
		font-weight: 650;
		line-height: 1.25;
	}

	.hero-cta {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		align-self: flex-start;
		min-height: var(--touch-target-min);
		padding: var(--space-sm) var(--space-lg);
		border-radius: var(--radius-md);
		background: var(--color-primary);
		color: var(--color-on-primary);
		font-size: var(--font-size-body-sm);
		font-weight: 600;
		text-decoration: none;
	}

	.hero-cta--solo {
		align-self: stretch;
		justify-content: center;
	}

	.readonly-empty {
		margin: 0;
		padding: var(--space-md);
		color: var(--color-text-muted);
		font-size: var(--font-size-body-sm);
	}
</style>
