<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/atoms/Button.svelte';
	import { bindSubmitting } from '$lib/utils/form-submit-feedback';
	import type { WaitlistSource } from '$lib/domain/waitlist';

	interface Props {
		action: string;
		source: WaitlistSource;
		title: string;
		description: string;
		emailLabel: string;
		submitLabel: string;
		successMessage: string;
		existsMessage: string;
		email?: string;
		emailReadonly?: boolean;
		form?: {
			waitlistSuccess?: boolean;
			waitlistAlreadySignedUp?: boolean;
			waitlistErrors?: { email?: string[] };
		} | null;
	}

	let {
		action,
		source,
		title,
		description,
		emailLabel,
		submitLabel,
		successMessage,
		existsMessage,
		email = '',
		emailReadonly = false,
		form
	}: Props = $props();
	let submitting = $state(false);
</script>

<section class="waitlist" aria-labelledby="waitlist-title">
	<h2 id="waitlist-title">{title}</h2>
	<p class="waitlist-lead">{description}</p>

	{#if form?.waitlistSuccess}
		<p class="waitlist-status success" role="status">
			{form.waitlistAlreadySignedUp ? existsMessage : successMessage}
		</p>
	{:else}
		<form
			method="POST"
			{action}
			class="waitlist-form"
			use:enhance={bindSubmitting((v) => (submitting = v))}
		>
			<input type="hidden" name="source" value={source} />
			<label class="waitlist-field">
				<span>{emailLabel}</span>
				<input
					type="email"
					name="email"
					required
					autocomplete="email"
					value={email}
					readonly={emailReadonly}
					disabled={emailReadonly}
				/>
			</label>
			<Button type="submit" disabled={submitting}>
				{submitLabel}
			</Button>
		</form>
		{#if form?.waitlistErrors?.email}
			<p class="waitlist-status error" role="alert">{form.waitlistErrors.email[0]}</p>
		{/if}
	{/if}
</section>

<style>
	.waitlist {
		margin-top: var(--space-xl);
		padding: var(--space-lg);
		border-radius: var(--radius-md);
		border: 1px solid var(--color-border);
		background: color-mix(in srgb, var(--color-primary) 6%, var(--color-surface));
	}

	.waitlist h2 {
		margin: 0;
		font-size: 1.15rem;
	}

	.waitlist-lead {
		margin: var(--space-sm) 0 var(--space-md);
		color: var(--color-text-muted);
		line-height: var(--line-height-body);
		font-size: var(--font-size-body-sm);
	}

	.waitlist-form {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-sm);
		align-items: flex-end;
	}

	.waitlist-field {
		flex: 1 1 14rem;
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
		font-size: var(--font-size-body-sm);
	}

	.waitlist-field input {
		padding: var(--space-sm) var(--space-md);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		font: inherit;
		background: var(--color-surface);
	}

	.waitlist-field input:read-only {
		opacity: 0.85;
		cursor: default;
	}

	.waitlist-status {
		margin: 0;
		font-size: var(--font-size-body-sm);
	}

	.waitlist-status.success {
		color: var(--color-success, #15803d);
	}

	.waitlist-status.error {
		color: var(--color-danger, #b91c1c);
	}
</style>
