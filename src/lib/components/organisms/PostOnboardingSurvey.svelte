<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import { enhance } from '$app/forms';
	import Button from '$lib/components/atoms/Button.svelte';
	import Modal from '$lib/components/molecules/Modal.svelte';
	import ModalHeader from '$lib/components/molecules/ModalHeader.svelte';
	import FeedbackBanner from '$lib/components/molecules/FeedbackBanner.svelte';
	import { CHURN_REASONS } from '$lib/domain/product-feedback';
	import { t } from '$lib/i18n';
	import {
		clearPostOnboardingSurveyPending,
		dismissPostOnboardingSurvey,
		isOnboardingExcludedPath,
		shouldShowPostOnboardingSurvey
	} from '$lib/utils/onboarding';

	let open = $state(false);
	let submitting = $state(false);
	let submitted = $state(false);

	const pathname = $derived(page.url.pathname);
	const userId = $derived(page.data.user?.id ?? null);

	function tryOpenSurvey() {
		if (!browser || !userId || isOnboardingExcludedPath(pathname) || !shouldShowPostOnboardingSurvey(userId)) {
			open = false;
			return;
		}
		open = true;
	}

	function skipSurvey() {
		dismissPostOnboardingSurvey(userId);
		open = false;
	}

	function onSubmitted() {
		submitted = true;
		clearPostOnboardingSurveyPending(userId);
		dismissPostOnboardingSurvey(userId);
		open = false;
	}

	$effect(() => {
		if (!browser) {
			return;
		}

		void pathname;
		void userId;
		tryOpenSurvey();
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
				<button type="button" class="skip-link" onclick={skipSurvey}>
					{t('feedback.postOnboarding.skip')}
				</button>
			{/snippet}
		</ModalHeader>
	{/snippet}

	{#if submitted}
		<FeedbackBanner tone="success" message={t('feedback.postOnboarding.thanks')} />
	{:else}
		<form
			method="POST"
			action="/settings?/submitProductFeedback"
			class="survey-form"
			use:enhance={() => {
				submitting = true;
				return async ({ result, update }) => {
					submitting = false;
					if (result.type === 'success') {
						onSubmitted();
						return;
					}
					await update();
				};
			}}
		>
			<input type="hidden" name="source" value="post_onboarding" />
			<label class="survey-field">
				<span>{t('feedback.churnQuestion')}</span>
				<select name="churnReason">
					<option value="">{t('feedback.churnOptional')}</option>
					{#each CHURN_REASONS as reason}
						<option value={reason}>{t(`feedback.churnReasons.${reason}`)}</option>
					{/each}
				</select>
			</label>
			<label class="survey-field">
				<span>{t('feedback.messageOptional')}</span>
				<textarea
					name="message"
					rows="3"
					maxlength="2000"
					placeholder={t('feedback.messagePlaceholder')}
				></textarea>
			</label>
			<div class="survey-actions">
				<Button type="button" variant="secondary" onclick={skipSurvey}>
					{t('feedback.postOnboarding.skip')}
				</Button>
				<Button type="submit" loading={submitting} loadingLabel={t('common.saving')}>
					{t('feedback.submit')}
				</Button>
			</div>
		</form>
	{/if}
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

	.survey-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.survey-field {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		font-size: 0.9rem;
	}

	.survey-field select,
	.survey-field textarea {
		padding: 0.6rem 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-surface);
		color: var(--color-text);
		font: inherit;
	}

	.survey-actions {
		display: flex;
		justify-content: flex-end;
		gap: var(--space-sm);
		flex-wrap: wrap;
	}
</style>
