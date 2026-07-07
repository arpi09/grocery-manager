<script lang="ts">

	import { onMount } from 'svelte';

	import { enhance } from '$app/forms';

	import { invalidateAll } from '$app/navigation';

	import { page } from '$app/stores';

	import AppLogo from '$lib/components/atoms/AppLogo.svelte';
	import Card from '$lib/components/atoms/Card.svelte';

	import {
		trackProductEvent,
		trackPublicAcquisitionEvent
	} from '$lib/client/product-events';

	import { getLocale, t } from '$lib/i18n';

	import {
		buildListaLoginUrl,
		buildListaSignupUrl,
		tokenTelemetryPrefix
	} from '$lib/marketing/acquisition-attribution';

	const PREVIEW_ITEM_LIMIT = 5;

	let { data } = $props();

	const locale = getLocale();

	const signupUrl = $derived(buildListaSignupUrl($page.url.origin));

	const loginUrl = $derived(buildListaLoginUrl(data.token));

	const pageTitle = $derived(t(data.preview.title as Parameters<typeof t>[0]));

	const expiresAtLabel = $derived(
		new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(
			data.preview.expiresAt
		)
	);

	const snapshotAtLabel = $derived(
		new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(
			new Date(data.preview.snapshotAt)
		)
	);

	const tokenPrefix = $derived(tokenTelemetryPrefix(data.token));

	const previewItems = $derived(data.preview.items.slice(0, PREVIEW_ITEM_LIMIT));

	const remainingItemCount = $derived(
		Math.max(0, data.preview.items.length - PREVIEW_ITEM_LIMIT)
	);

	const hasItems = $derived(data.preview.items.length > 0);

	/* Live guest checkoff — falls back to the frozen snapshot when unavailable. */
	const liveItems = $derived(data.live?.items ?? null);

	const liveUnchecked = $derived((liveItems ?? []).filter((item) => !item.checked));

	const liveChecked = $derived((liveItems ?? []).filter((item) => item.checked));

	let togglingId = $state<string | null>(null);

	let toggleError = $state<string | null>(null);

	/* Receipt line for guest mutations — the guest gets the same visible
	 * confirmation contract as a member: nothing changes silently. */
	let toggleReceipt = $state<string | null>(null);

	let receiptTimeout: ReturnType<typeof setTimeout> | undefined;

	function showReceipt(message: string) {
		toggleReceipt = message;
		clearTimeout(receiptTimeout);
		receiptTimeout = setTimeout(() => {
			toggleReceipt = null;
		}, 6_000);
	}

	function toggleEnhance(itemId: string, itemName: string) {
		return () => {
			togglingId = itemId;
			toggleError = null;
			return async ({
				result
			}: {
				result: { type: string; data?: { code?: string; checked?: boolean } };
			}) => {
				togglingId = null;
				if (result.type === 'success') {
					/* Telemetry recorded server-side in the toggle action. */
					showReceipt(
						result.data?.checked === true
							? t('shoppingListShare.guestPickedReceipt', { name: itemName })
							: t('shoppingListShare.guestUnpickedReceipt', { name: itemName })
					);
					await invalidateAll();
					return;
				}
				toggleError =
					result.data?.code === 'rate_limited'
						? t('shoppingListShare.guestRateLimited')
						: t('shoppingListShare.guestToggleFailed');
			};
		};
	}

	onMount(() => {
		const surfaceMetadata = {
			surface: 'lista' as const,
			itemCount: data.preview.items.length,
			tokenPrefix,
			acquisition_source: 'shopping_share'
		};

		void trackPublicAcquisitionEvent('public_surface_viewed', surfaceMetadata);

		void trackPublicAcquisitionEvent('shared_list_opened', {
			itemCount: data.preview.items.length,
			tokenPrefix,
			acquisition_source: 'shopping_share'
		});

		void trackPublicAcquisitionEvent('shopping_list_share_viewed', {
			itemCount: data.preview.items.length,
			acquisition_source: 'shopping_share'
		});

		void trackProductEvent('list_link_opened', {
			surface: 'lista',
			itemCount: data.preview.items.length,
			tokenPrefix,
			acquisition_source: 'shopping_share'
		});
	});

	function trackJoinCtaClick() {
		void trackProductEvent('list_join_cta_clicked', {
			surface: 'lista',
			acquisition_source: 'shopping_share'
		});
	}

	function handleSignupClick() {
		const clickMetadata = {
			surface: 'lista' as const,
			acquisition_source: 'shopping_share'
		};

		void trackPublicAcquisitionEvent('public_surface_signup_clicked', clickMetadata);

		void trackPublicAcquisitionEvent('shared_list_signup_clicked', clickMetadata);

		void trackPublicAcquisitionEvent('shopping_list_share_cta_clicked', {
			acquisition_source: 'shopping_share'
		});

		void trackProductEvent('register_click', {
			acquisition_source: 'shopping_share'
		});

		trackJoinCtaClick();
	}

	function handleLoginClick() {
		trackJoinCtaClick();
	}

	function formatQuantity(item: (typeof data.preview.items)[number]): string {
		if (!item.quantity && !item.unit) {
			return '';
		}

		return `${item.quantity ?? ''}${item.unit ? ` ${item.unit}` : ''}`.trim();
	}
</script>

<svelte:head>
	<title>{pageTitle}</title>
	<meta name="robots" content="noindex,nofollow" />
</svelte:head>

<main class="share-page">
	<div class="share-shell">
		<header class="share-header">
			<div class="brand-row">
				<AppLogo class="brand-mark" />
				<div class="brand-copy">
					<p class="eyebrow">{t('shoppingListShare.publicEyebrow')}</p>
					<p class="brand-name">Skaffu</p>
				</div>
			</div>

			<h1>{pageTitle}</h1>

			<p class="lead">{t('shoppingListShare.publicLead')}</p>

			<p class="expires">{t('shoppingListShare.publicExpires', { date: expiresAtLabel })}</p>
		</header>

		<div class="signup-cta signup-cta--above-fold" data-testid="lista-signup-cta-above-fold">
			<p class="signup-cta-lead">{t('shoppingListShare.publicSignupAboveFold')}</p>

			<a
				class="signup-cta-btn signup-cta-btn--primary"
				href={signupUrl}
				onclick={handleSignupClick}
				data-testid="lista-signup-cta-primary"
			>
				{t('shoppingListShare.publicSignupBtn')}
			</a>

			<a class="signup-login-link" href={loginUrl} onclick={handleLoginClick}>
				{t('shoppingListShare.publicLoginLink')}
			</a>
		</div>

		{#if liveItems}
			<section class="preview-section" aria-label={t('shoppingListShare.publicPreviewAria')} data-testid="lista-live-list">
				<p class="live-hint">{t('shoppingListShare.guestLiveHint')}</p>

				{#if toggleError}
					<p class="toggle-error" role="alert">{toggleError}</p>
				{/if}

				<p class="toggle-receipt" class:toggle-receipt--visible={toggleReceipt} role="status" data-testid="lista-guest-receipt">
					{toggleReceipt ?? ''}
				</p>

				{#if liveUnchecked.length === 0 && liveChecked.length === 0}
					<p class="empty-note">{t('shoppingListShare.emptyList')}</p>
				{/if}

				<ul class="item-list">
					{#each liveUnchecked as item (item.id)}
						<li>
							<form method="POST" action="?/toggle" use:enhance={toggleEnhance(item.id, item.name)}>
								<input type="hidden" name="id" value={item.id} />
								<button
									type="submit"
									class="toggle-row"
									disabled={togglingId === item.id}
									data-testid="lista-guest-toggle"
									aria-label={t('shoppingListShare.guestPickAria', { name: item.name })}
								>
									<span class="toggle-box" aria-hidden="true"></span>
									<span class="item-name">{item.name}</span>
									{#if formatQuantity(item)}
										<span class="quantity">{formatQuantity(item)}</span>
									{/if}
								</button>
							</form>
						</li>
					{/each}
				</ul>

				{#if liveChecked.length > 0}
					<p class="picked-heading">{t('shoppingListShare.guestCheckedHeading', { count: liveChecked.length })}</p>
					<ul class="item-list item-list--picked">
						{#each liveChecked as item (item.id)}
							<li class="checked">
								<form method="POST" action="?/toggle" use:enhance={toggleEnhance(item.id, item.name)}>
									<input type="hidden" name="id" value={item.id} />
									<button
										type="submit"
										class="toggle-row toggle-row--picked"
										disabled={togglingId === item.id}
										data-testid="lista-guest-untoggle"
										aria-label={t('shoppingListShare.guestUnpickAria', { name: item.name })}
									>
										<span class="toggle-box toggle-box--checked" aria-hidden="true">✓</span>
										<span class="item-name">{item.name}</span>
									</button>
								</form>
							</li>
						{/each}
					</ul>
				{/if}
			</section>
		{:else if !hasItems}
			<p class="empty-note">{t('shoppingListShare.emptyList')}</p>
		{:else}
			<section class="preview-section" aria-label={t('shoppingListShare.publicPreviewAria')}>
				<ul class="item-list item-list--preview">
					{#each previewItems as item, index (index)}
						<li class:checked={item.checked}>
							<Card class="item-card">
								<div class="item-main">
									<span class="item-name">{item.name}</span>
									{#if item.checked}
										<span class="checked-badge">{t('shoppingListShare.checkedBadge')}</span>
									{/if}
								</div>
								{#if formatQuantity(item)}
									<span class="quantity">{formatQuantity(item)}</span>
								{/if}
							</Card>
						</li>
					{/each}
				</ul>

				{#if remainingItemCount > 0}
					<p class="preview-more">{t('shoppingListShare.publicPreviewMore', { count: remainingItemCount })}</p>
				{/if}

				<p class="snapshot-honesty">{t('shoppingListShare.publicSnapshotHonesty')}</p>

				<p class="snapshot-at">{t('shoppingListShare.publicSnapshotAt', { date: snapshotAtLabel })}</p>
			</section>
		{/if}

		<p class="gdpr-note" role="note">{t('shoppingListShare.publicGdprNote')}</p>
	</div>
</main>

<style>
	.share-page {
		--lista-brand: var(--color-primary);
		--lista-accent: var(--color-accent);

		min-height: 100dvh;
		padding: calc(var(--space-xl) + env(safe-area-inset-top, 0)) var(--page-padding-x)
			calc(var(--space-xl) + env(safe-area-inset-bottom, 0));
		overflow-x: clip;
		background:
			radial-gradient(
				ellipse 80% 50% at 50% -10%,
				color-mix(in srgb, var(--lista-brand) 12%, transparent),
				transparent
			),
			var(--color-bg);
		color: var(--color-text);
		font-family: var(--font, system-ui, sans-serif);
	}

	.share-shell {
		max-width: 36rem;
		margin: 0 auto;
		display: grid;
		gap: var(--space-lg);
	}

	.share-header {
		display: grid;
		gap: var(--space-sm);
	}

	.brand-row {
		display: flex;
		align-items: center;
		gap: var(--space-md);
	}

	.brand-mark {
		--logo-mark-size: 2.5rem;
		flex-shrink: 0;
		border-radius: 0.625rem;
		box-shadow: 0 2px 8px color-mix(in srgb, var(--lista-brand) 20%, transparent);
	}

	.brand-copy {
		display: grid;
		gap: var(--space-2xs);
	}

	.brand-name {
		margin: 0;
		font-size: 1.125rem;
		font-weight: 700;
		color: var(--lista-brand);
		letter-spacing: -0.02em;
	}

	.eyebrow {
		margin: 0;
		font-size: var(--text-sm);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--lista-accent);
	}

	h1 {
		margin: 0;
		font-size: clamp(1.5rem, 5vw, 1.875rem);
		line-height: 1.2;
		color: var(--lista-brand);
	}

	.lead {
		margin: 0;
		font-size: var(--text-sm);
		line-height: 1.55;
	}

	.expires {
		margin: 0;
		color: var(--color-text-muted);
		font-size: var(--text-sm);
	}

	.empty-note {
		margin: 0;
		padding: var(--space-md);
		border-radius: var(--radius-md);
		background: var(--color-surface-muted);
		color: var(--color-text-muted);
	}

	.signup-cta {
		display: grid;
		gap: var(--space-sm);
		padding: var(--space-lg);
		border-radius: var(--radius-md);
		background: var(--color-surface);
		border: 1px solid color-mix(in srgb, var(--lista-brand) 18%, var(--color-border));
		box-shadow: 0 4px 20px color-mix(in srgb, var(--lista-brand) 8%, transparent);
	}

	.signup-cta--above-fold {
		padding: var(--space-md);
		border-color: color-mix(in srgb, var(--lista-brand) 28%, var(--color-border));
		background: color-mix(in srgb, var(--lista-brand) 6%, var(--color-surface));
	}

	.signup-cta-lead {
		margin: 0;
		font-size: 0.9375rem;
		font-weight: 600;
		line-height: 1.45;
		color: var(--lista-brand);
	}

	.signup-cta h2 {
		margin: 0;
		font-size: 1.125rem;
		color: var(--lista-brand);
	}

	.signup-cta p {
		margin: 0;
		color: var(--color-text-muted);
		font-size: var(--text-sm);
	}

	.signup-cta-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 3rem;
		padding: 0.75rem 1.25rem;
		border-radius: var(--radius-sm);
		border: 1px solid var(--color-border);
		background: var(--color-surface-muted);
		color: var(--color-text);
		font-weight: 600;
		font-size: 1rem;
		text-decoration: none;
		text-align: center;
	}

	.signup-cta-btn--primary {
		background: var(--lista-brand);
		border-color: var(--lista-brand);
		color: var(--color-on-primary);
	}

	.signup-cta-btn--primary:active {
		background: color-mix(in srgb, var(--lista-brand) 88%, var(--color-text));
	}

	.signup-hint {
		margin: 0;
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	.signup-login-link {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: var(--touch-target-min, 2.75rem);
		font-size: var(--text-sm);
		font-weight: 600;
		color: var(--lista-brand);
		text-decoration: none;
		text-align: center;
	}

	.signup-login-link:hover {
		text-decoration: underline;
	}

	.gdpr-note {
		margin: 0;
		padding: var(--space-md);
		border-radius: var(--radius-md);
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		background: color-mix(in srgb, var(--lista-brand) 6%, var(--color-surface));
		border: 1px solid color-mix(in srgb, var(--lista-brand) 18%, var(--color-border));
	}

	.preview-section {
		display: grid;
		gap: var(--space-sm);
	}

	.snapshot-honesty {
		margin: 0;
		padding: var(--space-sm) var(--space-md);
		border-radius: var(--radius-sm);
		background: color-mix(in srgb, var(--lista-accent) 14%, var(--color-surface));
		border: 1px solid color-mix(in srgb, var(--lista-accent) 35%, var(--color-border));
		color: var(--color-text);
		font-size: var(--text-sm);
		font-weight: 500;
		line-height: 1.45;
	}

	.snapshot-at {
		margin: 0;
		color: var(--color-text-muted);
		font-size: var(--text-sm);
	}

	.preview-more {
		margin: 0;
		font-size: var(--text-sm);
		font-weight: 600;
		color: var(--color-text-muted);
	}

	.item-list {
		margin: 0;
		padding: 0;
		list-style: none;
		display: grid;
		gap: var(--space-sm);
	}

	.item-list li.checked :global(.item-card) {
		opacity: 0.65;
	}

	.item-list li.checked .item-name {
		text-decoration: line-through;
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
		min-width: 0;
	}

	.item-name {
		font-weight: 600;
		overflow-wrap: anywhere;
	}

	.checked-badge {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	.quantity {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		flex-shrink: 0;
	}

	.live-hint {
		margin: 0;
		padding: var(--space-sm) var(--space-md);
		border-radius: var(--radius-sm);
		background: color-mix(in srgb, var(--lista-brand) 10%, var(--color-surface));
		border: 1px solid color-mix(in srgb, var(--lista-brand) 25%, var(--color-border));
		font-size: var(--text-sm);
		font-weight: 600;
	}

	.toggle-receipt {
		margin: 0;
		min-height: 0;
		padding: 0;
		border-radius: var(--radius-sm);
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-primary);
		transition: opacity 150ms ease;
		opacity: 0;
	}

	.toggle-receipt--visible {
		padding: var(--space-xs) var(--space-sm);
		background: color-mix(in srgb, var(--color-primary) 10%, var(--color-surface));
		border: 1px solid color-mix(in srgb, var(--color-primary) 25%, var(--color-border));
		opacity: 1;
	}

	.toggle-error {
		margin: 0;
		color: var(--color-danger, #b3261e);
		font-size: var(--text-sm);
		font-weight: 600;
	}

	.item-list form {
		margin: 0;
	}

	.toggle-row {
		display: flex;
		align-items: center;
		gap: var(--space-md);
		width: 100%;
		min-height: var(--touch-target-min, 2.75rem);
		padding: var(--space-sm) var(--space-md);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface);
		font: inherit;
		text-align: left;
		cursor: pointer;
	}

	.toggle-row:disabled {
		opacity: 0.6;
		cursor: progress;
	}

	.toggle-row:focus-visible {
		outline: 2px solid var(--lista-brand);
		outline-offset: 2px;
	}

	.toggle-row .item-name {
		flex: 1;
		min-width: 0;
	}

	.toggle-box {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.5rem;
		height: 1.5rem;
		border: 2px solid var(--color-border);
		border-radius: var(--radius-sm);
		flex-shrink: 0;
		font-size: 0.9rem;
		color: var(--color-surface);
	}

	.toggle-box--checked {
		background: var(--lista-brand);
		border-color: var(--lista-brand);
	}

	.toggle-row--picked .item-name {
		text-decoration: line-through;
		color: var(--color-text-muted);
	}

	.picked-heading {
		margin: var(--space-md) 0 0;
		font-size: 0.8125rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--color-text-muted);
	}

	@media (max-width: 480px) {
		:global(.item-card) {
			flex-direction: column;
			align-items: flex-start;
		}

		.signup-cta--above-fold {
			position: sticky;
			top: calc(env(safe-area-inset-top, 0) + var(--space-sm));
			z-index: 2;
		}
	}
</style>
