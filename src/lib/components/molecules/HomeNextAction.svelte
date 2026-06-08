<script lang="ts">
	import { getContext } from 'svelte';
	import { t } from '$lib/i18n';
	import { scanModeHref } from '$lib/utils/scan-nav';
	import { OPEN_RECIPE_IDEAS } from '$lib/navigation/app-layout-context';

	interface Props {
		totalItems: number;
		expiringCount: number;
		staleCount: number;
		canWrite?: boolean;
		returnTo: string;
	}

	let {
		totalItems,
		expiringCount,
		staleCount,
		canWrite = false,
		returnTo
	}: Props = $props();

	const openRecipeIdeas = getContext<(() => void) | undefined>(OPEN_RECIPE_IDEAS);

	type CtaKind = 'sync' | 'recipe' | 'photo';

	const ctaKind = $derived.by((): CtaKind | null => {
		if (!canWrite || totalItems === 0) {
			return null;
		}
		if (staleCount > 0) {
			return 'sync';
		}
		if (expiringCount > 0) {
			return 'recipe';
		}
		return 'photo';
	});

	const href = $derived(
		ctaKind === 'sync'
			? '/inventory/synk'
			: ctaKind === 'photo'
				? scanModeHref('photo', returnTo)
				: null
	);

	const label = $derived(
		ctaKind === 'sync'
			? t('home.nextActionSync', { count: staleCount })
			: ctaKind === 'recipe'
				? t('home.nextActionExpiring', { count: expiringCount })
				: ctaKind === 'photo'
					? t('home.nextActionPhoto')
					: ''
	);

	const analyticsId = $derived(
		ctaKind === 'sync'
			? 'home.next_action_sync'
			: ctaKind === 'recipe'
				? 'home.next_action_recipe'
				: 'home.next_action_photo'
	);

	function handleRecipeClick() {
		openRecipeIdeas?.();
	}
</script>

{#if ctaKind}
	<div class="next-action" data-testid="home-primary-cta">
		{#if ctaKind === 'recipe'}
			<button
				type="button"
				class="cta-primary"
				data-analytics-id={analyticsId}
				onclick={handleRecipeClick}
			>
				{label}
			</button>
		{:else if href}
			<a class="cta-primary" {href} data-analytics-id={analyticsId}>
				{label}
			</a>
		{/if}
	</div>
{/if}

<style>
	.next-action {
		display: flex;
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
</style>
