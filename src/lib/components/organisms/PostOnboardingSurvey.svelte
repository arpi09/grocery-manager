<script lang="ts">
	import { browser } from '$app/environment';
	import { env as publicEnv } from '$env/dynamic/public';
	import { page } from '$app/state';
	import Button from '$lib/components/atoms/Button.svelte';
	import Modal from '$lib/components/molecules/Modal.svelte';
	import ModalHeader from '$lib/components/molecules/ModalHeader.svelte';
	import {
		POST_ONBOARDING_QUICK_OPTIONS,
		type PostOnboardingQuickOption
	} from '$lib/domain/product-feedback';
	import { t, type MessageKey } from '$lib/i18n';
	import {
		clearPostOnboardingSurveyPending,
		dismissPostOnboardingSurvey,
		isOnboardingExcludedPath,
		isPostOnboardingSurveyPath,
		shouldShowPostOnboardingSurvey
	} from '$lib/utils/onboarding';
	import { registerBlockingOverlay } from '$lib/utils/overlay-stack';

	let open = $state(false);
	let submitting = $state(false);
	let showMore = $state(false);
	let moreMessage = $state('');

	const pathname = $derived(page.url.pathname);
	const userId = $derived(page.data.user?.id ?? null);

	const quickLabelKeys: Record<string, MessageKey> = {
		going_well: 'feedback.postOnboarding.quick.going_well',
		too_much_work: 'feedback.postOnboarding.quick.too_much_work',
		missing_feature: 'feedback.postOnboarding.quick.missing_feature',
		forgot_habit: 'feedback.postOnboarding.quick.forgot_habit',
		other_app: 'feedback.postOnboarding.quick.other_app'
	};

	function tryOpenSurvey() {
		if (
			!browser ||
			publicEnv.PUBLIC_E2E_DISABLE_POST_SURVEY === 'true' ||
			!userId ||
			isOnboardingExcludedPath(pathname) ||
			!isPostOnboardingSurveyPath(pathname) ||
			!shouldShowPostOnboardingSurvey(userId)
		) {
			open = false;
			return;
		}
		open = true;
	}

	function skipSurvey() {
		dismissPostOnboardingSurvey(userId);
		open = false;
		showMore = false;
		moreMessage = '';
	}

	function closeAfterSubmit() {
		clearPostOnboardingSurveyPending(userId);
		dismissPostOnboardingSurvey(userId);
		open = false;
		showMore = false;
		moreMessage = '';
	}

	async function submitFeedback(option: PostOnboardingQuickOption | null, message = '') {
		if (!browser || submitting) {
			return;
		}

		const trimmedMessage = message.trim();
		const churnReason = option?.churnReason ?? null;
		const payloadMessage = trimmedMessage || option?.message?.trim() || '';

		if (!churnReason && payloadMessage.length < 3) {
			return;
		}

		submitting = true;
		const formData = new FormData();
		formData.set('source', 'post_onboarding');
		if (churnReason) {
			formData.set('churnReason', churnReason);
		}
		formData.set('message', payloadMessage);

		try {
			const response = await fetch('/settings?/submitProductFeedback', {
				method: 'POST',
				body: formData
			});
			if (response.ok) {
				closeAfterSubmit();
			}
		} finally {
			submitting = false;
		}
	}

	function submitMore() {
		void submitFeedback(null, moreMessage);
	}

	$effect(() => {
		if (!browser) {
			return;
		}

		void pathname;
		void userId;
		tryOpenSurvey();
	});

	$effect(() => {
		if (!open) {
			return;
		}
		return registerBlockingOverlay();
	});
</script>

<Modal
	{open}
	onClose={skipSurvey}
	variant="sheet"
	dismissible={true}
	panelClass="post-onboarding-survey-panel"
>
	{#snippet header()}
		<ModalHeader title={t('feedback.postOnboarding.title')} subtitle={t('feedback.postOnboarding.subtitle')}>
			{#snippet actions()}
				<button
					type="button"
					class="skip-link"
					data-testid="post-onboarding-survey-skip"
					onclick={skipSurvey}
				>
					{t('feedback.postOnboarding.skip')}
				</button>
			{/snippet}
		</ModalHeader>
	{/snippet}

	<div class="survey-body" aria-busy={submitting}>
		<p class="lead">{t('feedback.postOnboarding.lead')}</p>

		<div class="chip-grid" role="group" aria-label={t('feedback.postOnboarding.chipGroupAria')}>
			{#each POST_ONBOARDING_QUICK_OPTIONS as option (option.id)}
				<button
					type="button"
					class="chip"
					disabled={submitting}
					onclick={() => submitFeedback(option)}
				>
					{t(quickLabelKeys[option.id])}
				</button>
			{/each}
		</div>

		{#if !showMore}
			<button type="button" class="more-link" disabled={submitting} onclick={() => (showMore = true)}>
				{t('feedback.postOnboarding.more')}
			</button>
		{:else}
			<label class="more-field">
				<span class="sr-only">{t('feedback.postOnboarding.moreLabel')}</span>
				<textarea
					bind:value={moreMessage}
					rows="2"
					maxlength="500"
					placeholder={t('feedback.postOnboarding.morePlaceholder')}
					disabled={submitting}
				></textarea>
			</label>
			<Button
				type="button"
				fullWidth
				disabled={moreMessage.trim().length < 3}
				loading={submitting}
				loadingLabel={t('common.saving')}
				onclick={submitMore}
			>
				{t('feedback.submit')}
			</Button>
		{/if}
	</div>
</Modal>

<style>
	.skip-link {
		border: none;
		background: none;
		color: var(--color-text-muted);
		font-size: 0.85rem;
		cursor: pointer;
		text-decoration: underline;
	}

	.survey-body {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.lead {
		margin: 0;
		font-size: 0.95rem;
		color: var(--color-text-muted);
		line-height: 1.45;
	}

	.chip-grid {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-sm);
	}

	.chip {
		flex: 1 1 calc(50% - var(--space-sm));
		min-width: 8.5rem;
		padding: 0.65rem 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface);
		color: var(--color-text);
		font: inherit;
		font-size: 0.9rem;
		font-weight: 600;
		text-align: center;
		cursor: pointer;
		transition:
			border-color 0.15s ease,
			background 0.15s ease;
	}

	.chip:hover:not(:disabled) {
		border-color: var(--color-primary);
		background: var(--color-primary-soft, rgba(61, 107, 79, 0.08));
	}

	.chip:disabled {
		opacity: 0.6;
		cursor: wait;
	}

	.more-link {
		align-self: flex-start;
		border: none;
		background: none;
		padding: 0;
		color: var(--color-text-muted);
		font-size: 0.85rem;
		text-decoration: underline;
		cursor: pointer;
	}

	.more-field textarea {
		width: 100%;
		padding: 0.6rem 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-surface);
		color: var(--color-text);
		font: inherit;
		resize: vertical;
	}
</style>
