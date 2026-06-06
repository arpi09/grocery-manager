<script lang="ts">
	import { browser } from '$app/environment';
	import Button from '$lib/components/atoms/Button.svelte';
	import CelebrationBurst from '$lib/components/atoms/CelebrationBurst.svelte';
	import GamificationIllustration from '$lib/components/atoms/GamificationIllustration.svelte';
	import Modal from '$lib/components/molecules/Modal.svelte';
	import {
		celebrationMomentStore,
		dismissCelebrationMoment
	} from '$lib/utils/present-celebration.svelte';
	import { t } from '$lib/i18n';

	const active = $derived(celebrationMomentStore.active);
	const open = $derived(browser && active != null);

	function handleClose() {
		dismissCelebrationMoment();
	}
</script>

<Modal
	{open}
	onClose={handleClose}
	title={active?.title ?? ''}
	variant="center"
	dismissible={true}
	data-testid="celebration-moment"
>
	<div class="moment-body">
		<div class="moment-visual">
			<CelebrationBurst active={open} particleCount={8} />
			{#if active}
				<GamificationIllustration variant={active.illustration} size={110} />
			{/if}
		</div>
		{#if active}
			<p class="moment-copy">{active.body}</p>
		{/if}
	</div>
	{#snippet footer()}
		<div class="moment-actions">
			{#if active?.statsHref}
				<a class="stats-link" href="/statistik" onclick={handleClose}>
					{t('gamification.viewStats')}
				</a>
			{/if}
			<Button type="button" onclick={handleClose}>
				{t('gamification.celebrationDismiss')}
			</Button>
		</div>
	{/snippet}
</Modal>

<style>
	.moment-body {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-md);
		text-align: center;
		padding: var(--space-sm) 0;
	}

	.moment-visual {
		position: relative;
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 7rem;
	}

	.moment-copy {
		margin: 0;
		font-size: 0.95rem;
		line-height: 1.5;
		color: var(--color-text-muted);
		max-width: 32ch;
	}

	.moment-actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-sm);
		justify-content: center;
		width: 100%;
	}

	.stats-link {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 2.5rem;
		padding: 0 var(--space-md);
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-primary);
		text-decoration: none;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface-muted);
	}

	.stats-link:hover {
		text-decoration: none;
		border-color: color-mix(in srgb, var(--color-primary) 35%, var(--color-border));
	}
</style>
