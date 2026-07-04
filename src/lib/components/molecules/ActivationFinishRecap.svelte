<script lang="ts">
	import AnimatedNumber from '$lib/components/atoms/AnimatedNumber.svelte';
	import SetupCheckMark from '$lib/components/atoms/SetupCheckMark.svelte';
	import { t } from '$lib/i18n';
	import type { ActivationSeedSource } from '$lib/utils/onboarding';

	interface Props {
		seeded: boolean;
		seedSource: ActivationSeedSource | null;
		seedCount: number;
		inviteState: 'invited' | 'solo' | 'members';
		memberCount: number;
	}

	let { seeded, seedSource, seedCount, inviteState, memberCount }: Props = $props();

	const seedSuffix = $derived(
		seedSource === 'receipt'
			? t('onboarding.activation.finish.recapReceiptSuffix')
			: t('onboarding.activation.finish.recapItemsSuffix')
	);
	const seedLabel = $derived(
		seedSource === 'receipt'
			? t('onboarding.activation.finish.recapReceipt', { count: seedCount })
			: t('onboarding.activation.finish.recapItems', { count: seedCount })
	);
</script>

<ul class="recap" aria-label={t('onboarding.activation.finish.recapAria')}>
	{#if seeded}
		<li class="recap-row" data-testid="activation-recap-seed">
			<SetupCheckMark />
			<span class="recap-text">
				{#if seedCount > 0}
					<AnimatedNumber value={seedCount} />
					{seedSuffix}
				{:else}
					{seedLabel}
				{/if}
			</span>
		</li>
	{:else}
		<li class="recap-row muted" data-testid="activation-recap-empty">
			<span class="recap-text">{t('onboarding.activation.finish.recapEmpty')}</span>
		</li>
	{/if}

	{#if inviteState === 'invited'}
		<li class="recap-row" data-testid="activation-recap-invite">
			<SetupCheckMark />
			<span class="recap-text">{t('onboarding.activation.finish.recapInvite')}</span>
		</li>
	{:else if inviteState === 'members'}
		<li class="recap-row" data-testid="activation-recap-members">
			<SetupCheckMark />
			<span class="recap-text">
				{t('onboarding.activation.finish.recapMembers', { count: memberCount })}
			</span>
		</li>
	{/if}
</ul>

<style>
	.recap {
		margin: 0;
		padding: 0;
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}

	.recap-row {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		padding: var(--space-xs) var(--space-sm);
		border-radius: var(--radius-md);
		background: var(--color-surface-muted);
		font-size: 0.9375rem;
	}

	.recap-row.muted .recap-text {
		color: var(--color-text-muted);
		font-size: 0.875rem;
	}

	.recap-text {
		display: inline-flex;
		align-items: baseline;
		gap: 0.3rem;
		min-width: 0;
	}
</style>
