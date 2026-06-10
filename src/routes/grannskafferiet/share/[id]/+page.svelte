<script lang="ts">
	import { goto } from '$app/navigation';
	import AppLayout from '$lib/components/templates/AppLayout.svelte';
	import PageContainer from '$lib/components/molecules/PageContainer.svelte';
	import Badge from '$lib/components/atoms/Badge.svelte';
	import Button from '$lib/components/atoms/Button.svelte';
	import Card from '$lib/components/atoms/Card.svelte';
	import NearbyShareReportButton from '$lib/components/molecules/NearbyShareReportButton.svelte';
	import { daysUntilExpiry, formatDaysLeft } from '$lib/domain/expiry';
	import { getLocale, t } from '$lib/i18n';
	import { locationLabel } from '$lib/i18n/domain-labels';
	let { data } = $props();

	const locale = getLocale();
	const expiresAtLabel = $derived(
		new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(
			data.preview.expiresAt
		)
	);
</script>

<svelte:head>
	<title>{t('nearbySharing.sharePreviewTitle')}</title>
	<meta name="robots" content="noindex,nofollow" />
</svelte:head>

<AppLayout user={data.user}>
	<PageContainer>
		<header class="preview-header">
			<p class="eyebrow">{t('expiringShare.publicEyebrow')}</p>
			<h1>{t('nearbySharing.sharePreviewTitle')}</h1>
			<p class="expires">{t('expiringShare.publicExpires', { date: expiresAtLabel })}</p>
			<p class="gdpr-note">{t('expiringShare.publicGdprNote')}</p>
		</header>

		<ul class="item-list">
			{#each data.preview.items as item, index (index)}
				<li>
					<Card class="item-card">
						<div class="item-main">
							<span class="item-name">{item.name}</span>
							<span class="item-location">{locationLabel(locale, item.location)}</span>
						</div>
						<div class="item-meta">
							{#if item.expiresOn}
								{@const daysLeft = daysUntilExpiry(item.expiresOn)}
								<Badge tone="warning">{formatDaysLeft(daysLeft, locale)}</Badge>
							{/if}
							<span class="quantity">{item.quantity}{item.unit ? ` ${item.unit}` : ''}</span>
						</div>
					</Card>
				</li>
			{/each}
		</ul>

		<div class="actions">
			<Button type="button" variant="secondary" onclick={() => goto('/grannskafferiet')}>
				{t('nearbySharing.backToMapBtn')}
			</Button>
			<NearbyShareReportButton shareId={data.shareId} variant="secondary" />
		</div>
	</PageContainer>
</AppLayout>

<style>
	.preview-header {
		display: grid;
		gap: var(--space-sm);
		margin-bottom: var(--space-lg);
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

	.expires,
	.gdpr-note {
		margin: 0;
		color: var(--color-text-muted);
		font-size: var(--text-sm);
	}

	.item-list {
		margin: 0;
		padding: 0;
		list-style: none;
		display: grid;
		gap: var(--space-sm);
	}

	:global(.item-card) {
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
		justify-items: end;
		gap: var(--space-xs);
		flex-shrink: 0;
	}

	.actions {
		margin-top: var(--space-lg);
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-sm);
	}
</style>
