<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/atoms/Button.svelte';
	import FeedbackBanner from '$lib/components/molecules/FeedbackBanner.svelte';
	import SettingsSection from '$lib/components/molecules/SettingsSection.svelte';
	import { bindSubmitting } from '$lib/utils/form-submit-feedback';
	import { CHURN_REASONS } from '$lib/domain/product-feedback';
	import { t } from '$lib/i18n';

	interface Props {
		feedbackSuccess: boolean;
		feedbackErrors: Record<string, string[] | undefined>;
	}

	let { feedbackSuccess, feedbackErrors }: Props = $props();

	let feedbackSubmitting = $state(false);
</script>

<SettingsSection
	id="settings-feedback"
	title={t('settings.feedback.title')}
	description={t('settings.feedback.description')}
>
	{#if feedbackSuccess}
		<div class="feedback-panel">
			<FeedbackBanner tone="success" message={t('settings.feedback.thanks')} />
		</div>
	{/if}
	<form
		method="POST"
		action="?/submitProductFeedback"
		class="feedback-form"
		use:enhance={bindSubmitting((v) => (feedbackSubmitting = v))}
	>
		<input type="hidden" name="source" value="settings" />
		<label class="feedback-field">
			<span>{t('settings.feedback.topicQuestion')}</span>
			<select name="churnReason">
				<option value="">{t('settings.feedback.topicOptional')}</option>
				{#each CHURN_REASONS as reason}
					<option value={reason}>{t(`settings.feedback.topicReasons.${reason}`)}</option>
				{/each}
			</select>
		</label>
		<label class="feedback-field">
			<span>{t('settings.feedback.messageLabel')}</span>
			<textarea
				name="message"
				required
				minlength="3"
				maxlength="2000"
				rows="4"
				placeholder={t('settings.feedback.messagePlaceholder')}
			></textarea>
			{#if feedbackErrors.message?.[0]}
				<p class="feedback-error" role="alert">{t('settings.feedback.messageTooShort')}</p>
			{/if}
		</label>
		<Button type="submit" loading={feedbackSubmitting} loadingLabel={t('common.saving')}>
			{t('feedback.submit')}
		</Button>
	</form>
</SettingsSection>

<style>
	.feedback-panel {
		padding: var(--space-md) var(--space-lg);
		border-top: 1px solid var(--color-border);
	}

	.feedback-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
		padding: var(--space-md) var(--space-lg);
	}

	.feedback-field {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		font-size: 0.9rem;
	}

	.feedback-field select,
	.feedback-field textarea {
		padding: 0.6rem 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-surface);
		color: var(--color-text);
		font: inherit;
	}

	.feedback-error {
		margin: 0;
		font-size: 0.82rem;
		color: var(--color-danger, #b42318);
	}
</style>
