<script lang="ts">
	import Button from '$lib/components/atoms/Button.svelte';
	import Modal from '$lib/components/molecules/Modal.svelte';
	import type { MarketItemsAsDescribed } from '$lib/domain/market-lifecycle';
	import { MARKET_RATING_COMMENT_MAX_LENGTH } from '$lib/domain/market-lifecycle';
	import { t } from '$lib/i18n';

	interface Props {
		open: boolean;
		counterpartFirstName: string;
		submitting?: boolean;
		onClose: () => void;
		onSkip: () => void;
		onSubmit: (payload: {
			stars: number;
			comment: string | null;
			itemsAsDescribed: MarketItemsAsDescribed | null;
		}) => void;
	}

	let {
		open,
		counterpartFirstName,
		submitting = false,
		onClose,
		onSkip,
		onSubmit
	}: Props = $props();

	let stars = $state(0);
	let comment = $state('');
	let itemsAsDescribed = $state<MarketItemsAsDescribed | null>(null);

	const commentLength = $derived(comment.length);
	const canSubmit = $derived(stars >= 1 && stars <= 5 && !submitting);

	const itemsOptions: MarketItemsAsDescribed[] = ['yes', 'partial', 'no'];

	$effect(() => {
		if (!open) {
			stars = 0;
			comment = '';
			itemsAsDescribed = null;
		}
	});

	function itemsLabel(value: MarketItemsAsDescribed): string {
		return t(`marketV03.ratingItems.${value}`);
	}

	function handleSubmit() {
		if (!canSubmit) {
			return;
		}
		const trimmed = comment.trim();
		onSubmit({
			stars,
			comment: trimmed.length > 0 ? trimmed : null,
			itemsAsDescribed
		});
	}
</script>

<Modal
	{open}
	variant="sheet"
	title={t('marketV03.ratingTitle', { name: counterpartFirstName })}
	onClose={onClose}
	data-testid="market-rating-sheet"
>
	<p class="lead">{t('marketV03.ratingLead')}</p>

	<div class="stars" role="group" aria-label={t('marketV01.rateAria')}>
		{#each [1, 2, 3, 4, 5] as star}
			<button
				type="button"
				class={['star-btn', stars >= star ? 'selected' : ''].filter(Boolean).join(' ')}
				aria-pressed={stars >= star}
				disabled={submitting}
				onclick={() => {
					stars = star;
				}}
			>
				★
			</button>
		{/each}
	</div>

	<label class="field" for="market-rating-comment">
		<span>{t('marketV03.ratingCommentLabel')}</span>
		<textarea
			id="market-rating-comment"
			rows="3"
			maxlength={MARKET_RATING_COMMENT_MAX_LENGTH}
			bind:value={comment}
			placeholder={t('marketV03.ratingCommentPlaceholder')}
			disabled={submitting}
		></textarea>
		<span class="char-count" aria-live="polite">
			{t('marketV03.ratingCommentCount', {
				count: commentLength,
				max: MARKET_RATING_COMMENT_MAX_LENGTH
			})}
		</span>
	</label>

	<fieldset class="items-fieldset">
		<legend>{t('marketV03.ratingItemsLabel')}</legend>
		<div class="items-options" role="radiogroup" aria-label={t('marketV03.ratingItemsLabel')}>
			{#each itemsOptions as option (option)}
				<label class="items-option">
					<input
						type="radio"
						name="items-as-described"
						value={option}
						checked={itemsAsDescribed === option}
						disabled={submitting}
						onchange={() => {
							itemsAsDescribed = option;
						}}
					/>
					<span>{itemsLabel(option)}</span>
				</label>
			{/each}
		</div>
	</fieldset>

	<div class="actions">
		<Button type="button" fullWidth disabled={!canSubmit} loading={submitting} onclick={handleSubmit}>
			{submitting ? t('common.loading') : t('marketV03.ratingSubmitBtn')}
		</Button>
		<Button type="button" variant="ghost" fullWidth disabled={submitting} onclick={onSkip}>
			{t('marketV03.ratingSkipBtn')}
		</Button>
	</div>
</Modal>

<style>
	.lead {
		margin: 0 0 var(--space-md);
		color: var(--color-text-muted);
		font-size: 0.9375rem;
	}

	.stars {
		display: flex;
		justify-content: center;
		gap: var(--space-sm);
		margin-bottom: var(--space-lg);
	}

	.star-btn {
		border: none;
		background: transparent;
		font-size: 2.25rem;
		line-height: 1;
		color: var(--color-border);
		cursor: pointer;
		padding: var(--space-xs);
		min-width: 2.75rem;
		min-height: 2.75rem;
	}

	.star-btn.selected {
		color: var(--color-warning, #d4a017);
	}

	.field {
		display: grid;
		gap: var(--space-xs);
		margin-bottom: var(--space-md);
	}

	.field span {
		font-weight: 600;
		font-size: 0.875rem;
	}

	textarea {
		width: 100%;
		padding: var(--space-sm);
		border-radius: var(--radius-md);
		border: 1px solid var(--color-border);
		font: inherit;
		resize: vertical;
	}

	.char-count {
		font-size: 0.75rem;
		color: var(--color-text-muted);
		justify-self: end;
	}

	.items-fieldset {
		border: 0;
		margin: 0 0 var(--space-lg);
		padding: 0;
	}

	.items-fieldset legend {
		font-weight: 600;
		font-size: 0.875rem;
		margin-bottom: var(--space-xs);
	}

	.items-options {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-sm);
	}

	.items-option {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2xs);
		padding: var(--space-xs) var(--space-sm);
		border-radius: var(--radius-md);
		border: 1px solid var(--color-border);
		cursor: pointer;
		font-size: 0.875rem;
	}

	.items-option:has(input:checked) {
		border-color: var(--color-primary);
		background: color-mix(in srgb, var(--color-primary) 8%, var(--color-surface));
	}

	.actions {
		display: grid;
		gap: var(--space-sm);
	}
</style>
