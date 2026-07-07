<script lang="ts">
	import Label from '$lib/components/atoms/Label.svelte';
	import Input from '$lib/components/atoms/Input.svelte';
	import { t } from '$lib/i18n';
	import type { HTMLInputAttributes } from 'svelte/elements';

	interface Props extends Omit<HTMLInputAttributes, 'value'> {
		label: string;
		error?: string;
		value?: string;
		/** Password fields only: show a visa/dölj toggle inside the field. */
		revealable?: boolean;
	}

	let {
		label,
		error,
		id,
		name,
		type,
		revealable = false,
		value = $bindable(''),
		...rest
	}: Props = $props();
	const fieldId = id ?? name ?? label.toLowerCase().replace(/\s+/g, '-');
	const errorId = `${fieldId}-error`;

	let revealed = $state(false);
	const canReveal = $derived(revealable && type === 'password');
	const effectiveType = $derived(canReveal && revealed ? 'text' : type);
</script>

<div class="field">
	<Label for={fieldId}>{label}</Label>
	<div class="control" class:with-toggle={canReveal}>
		<Input
			id={fieldId}
			{name}
			type={effectiveType}
			bind:value
			error={!!error}
			aria-invalid={error ? 'true' : undefined}
			aria-describedby={error ? errorId : undefined}
			{...rest}
		/>
		{#if canReveal}
			<button
				type="button"
				class="reveal-toggle"
				aria-label={revealed ? t('auth.hidePassword') : t('auth.showPassword')}
				aria-pressed={revealed}
				onclick={() => (revealed = !revealed)}
			>
				{#if revealed}
					<svg viewBox="0 0 24 24" aria-hidden="true">
						<path d="M3 3l18 18" />
						<path d="M10.6 5.1A9.8 9.8 0 0 1 12 5c5 0 9 4.5 10 7-.3.8-1 2-2.2 3.2M6.2 6.2C4 7.7 2.5 10 2 12c1 2.5 5 7 10 7 1.4 0 2.7-.3 3.9-.9" />
						<path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
					</svg>
				{:else}
					<svg viewBox="0 0 24 24" aria-hidden="true">
						<path d="M2 12c1-2.5 5-7 10-7s9 4.5 10 7c-1 2.5-5 7-10 7S3 14.5 2 12Z" />
						<circle cx="12" cy="12" r="3" />
					</svg>
				{/if}
			</button>
		{/if}
	</div>
	{#if error}
		<p class="error" id={errorId} role="alert">{error}</p>
	{/if}
</div>

<style>
	.field {
		margin-bottom: var(--space-md);
	}

	.control {
		position: relative;
	}

	.control.with-toggle :global(.input) {
		padding-right: 3rem;
	}

	.reveal-toggle {
		position: absolute;
		top: 0;
		right: 0;
		bottom: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.75rem;
		min-height: var(--touch-target-min, 2.75rem);
		padding: 0;
		border: none;
		background: transparent;
		color: var(--color-text-muted);
		cursor: pointer;
		border-radius: var(--radius-sm);
	}

	.reveal-toggle:hover {
		color: var(--color-text);
	}

	.reveal-toggle:focus-visible {
		outline: var(--focus-ring-width) solid var(--focus-ring-color);
		outline-offset: calc(-1 * var(--focus-ring-width));
	}

	.reveal-toggle svg {
		width: 1.25rem;
		height: 1.25rem;
		fill: none;
		stroke: currentColor;
		stroke-width: 1.75;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.error {
		margin: var(--space-xs) 0 0;
		font-size: 0.8rem;
		color: var(--color-danger);
	}
</style>
