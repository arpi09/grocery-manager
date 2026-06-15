<script lang="ts">
	import { t } from '$lib/i18n';
	import { scanModeHref } from '$lib/utils/scan-nav';

	interface Props {
		totalItems: number;
		expiringCount: number;
		staleCount: number;
		shoppingListCount?: number;
		canWrite?: boolean;
		returnTo: string;
		/** When secondary, sync/photo use outline style (primary CTA lives elsewhere on home). */
		variant?: 'primary' | 'secondary';
	}

	let {
		totalItems,
		expiringCount,
		staleCount,
		shoppingListCount = 0,
		canWrite = false,
		returnTo,
		variant = 'primary'
	}: Props = $props();

	type CtaKind = 'lista' | 'sync' | 'photo';

	const ctaKind = $derived.by((): CtaKind | null => {
		if (!canWrite || totalItems === 0) {
			return null;
		}
		if (staleCount > 0) {
			return 'sync';
		}
		if (shoppingListCount > 0) {
			return 'lista';
		}
		return 'photo';
	});

	const href = $derived(
		ctaKind === 'sync'
			? '/inventory/synk'
			: ctaKind === 'lista'
				? '/inkop'
				: ctaKind === 'photo'
					? scanModeHref('photo', returnTo)
					: null
	);

	const label = $derived(
		ctaKind === 'sync'
			? t('home.nextActionSync', { count: staleCount })
			: ctaKind === 'lista'
				? t('home.nextActionLista')
				: ctaKind === 'photo'
					? t('home.nextActionPhoto')
				: ''
	);

	const analyticsId = $derived(
		ctaKind === 'sync'
			? 'home.next_action_sync'
			: ctaKind === 'lista'
				? 'home.next_action_lista'
				: 'home.next_action_photo'
	);

	const showPlanerLink = $derived(canWrite && totalItems > 0 && expiringCount > 0);
</script>

{#if ctaKind || showPlanerLink}
	<div class="next-action" class:next-action--stacked={showPlanerLink && ctaKind}>
		{#if ctaKind && href}
			<a
				class={variant === 'secondary' ? 'cta-secondary' : 'cta-primary'}
				{href}
				data-analytics-id={analyticsId}
				data-testid="home-primary-cta"
			>
				{label}
			</a>
		{/if}
		{#if showPlanerLink}
			<a
				class="cta-secondary"
				href="/planer"
				data-analytics-id="home.next_action_planer"
				data-testid="home-planer-link"
			>
				{t('home.nextActionPlaner', { count: expiringCount })}
			</a>
		{/if}
	</div>
{/if}

<style>
	.next-action {
		display: flex;
	}

	.next-action--stacked {
		flex-direction: column;
		gap: var(--space-sm);
	}

	.cta-primary {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		min-height: var(--touch-target-min);
		padding: 0.75rem 1.25rem;
		border: 0;
		border-radius: var(--radius-md);
		background: var(--color-primary);
		color: var(--color-on-primary);
		font-size: 1rem;
		font-weight: 700;
		text-decoration: none;
		cursor: pointer;
		box-shadow: var(--shadow-sm);
		transition: background 0.15s ease;
	}

	.cta-primary:hover {
		background: color-mix(in srgb, var(--color-primary) 88%, var(--color-text));
		text-decoration: none;
		color: var(--color-on-primary);
	}

	.cta-primary:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
	}

	.cta-secondary {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		min-height: var(--touch-target-min);
		padding: 0.65rem 1.25rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: transparent;
		color: var(--color-primary);
		font-size: 0.9375rem;
		font-weight: 600;
		text-decoration: none;
		transition:
			background 0.15s ease,
			border-color 0.15s ease;
	}

	.cta-secondary:hover {
		border-color: color-mix(in srgb, var(--color-primary) 40%, var(--color-border));
		background: color-mix(in srgb, var(--color-primary) 8%, var(--color-surface));
		text-decoration: none;
		color: var(--color-primary);
	}

	.cta-secondary:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
	}
</style>
