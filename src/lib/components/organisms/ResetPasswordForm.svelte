<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/atoms/Button.svelte';
	import FeedbackBanner from '$lib/components/molecules/FeedbackBanner.svelte';
	import FormField from '$lib/components/molecules/FormField.svelte';
	import { bindSubmitting } from '$lib/utils/form-submit-feedback';
	import { t } from '$lib/i18n';

	interface Props {
		errors?: Record<string, string[]>;
		message?: string;
	}

	let { errors = {}, message }: Props = $props();
	let submitting = $state(false);
</script>

<form method="POST" class="form" use:enhance={bindSubmitting((v) => (submitting = v))}>
	{#if message}
		<FeedbackBanner tone="error" message={message} />
	{/if}

	<FormField
		label={t('auth.password')}
		name="password"
		type="password"
		autocomplete="new-password"
		error={errors.password?.[0]}
	/>
	<FormField
		label={t('auth.confirmPassword')}
		name="confirmPassword"
		type="password"
		autocomplete="new-password"
		error={errors.confirmPassword?.[0]}
	/>

	<Button type="submit" fullWidth loading={submitting} loadingLabel={t('auth.resetPassword.submitting')}>
		{t('auth.resetPassword.submit')}
	</Button>
</form>

<style>
	.form {
		width: 100%;
	}
</style>
