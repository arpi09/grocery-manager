<script lang="ts">
	interface Props {
		checked?: boolean;
		disabled?: boolean;
		label?: string;
		size?: 'sm' | 'md';
		id?: string;
		/** Accessible name when no visible label is provided. */
		'aria-label'?: string;
		onCheckedChange?: (checked: boolean) => void;
	}

	let {
		checked = false,
		disabled = false,
		label,
		size = 'md',
		id,
		'aria-label': ariaLabel,
		onCheckedChange
	}: Props = $props();

	const switchId = $derived(
		id ??
			(label ?? ariaLabel)?.replace(/\s+/g, '-').toLowerCase().replace(/[^a-z0-9-]/g, '')
	);

	function activateToggle() {
		if (disabled) return;
		onCheckedChange?.(!checked);
	}
</script>

<!-- Label `for` + sibling button — label text taps work on iOS without nesting. -->
<div
	class={['toggle', size === 'sm' ? 'toggle-sm' : 'toggle-md', disabled ? 'toggle-disabled' : ''].filter(Boolean).join(' ')}
>
	<button
		type="button"
		role="switch"
		id={switchId}
		class="toggle-switch"
		aria-checked={checked}
		aria-disabled={disabled}
		aria-label={label ? undefined : ariaLabel}
		disabled={disabled}
		onclick={activateToggle}
	>
		<span class="toggle-track" aria-hidden="true">
			<span class="toggle-thumb"></span>
		</span>
	</button>
	{#if label}
		<label class="toggle-label" for={switchId}>{label}</label>
	{/if}
</div>

<style>
	.toggle {
		display: inline-flex;
		align-items: center;
		gap: var(--space-sm);
	}

	.toggle-disabled {
		cursor: not-allowed;
	}

	.toggle-disabled .toggle-label {
		color: var(--color-text-muted);
	}

	.toggle-disabled .toggle-track {
		background: color-mix(in srgb, var(--color-border) 72%, var(--color-surface-muted));
	}

	.toggle-switch {
		flex-shrink: 0;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: var(--touch-target-min, 2.75rem);
		min-height: var(--touch-target-min, 2.75rem);
		margin: 0;
		padding: 0;
		border: 0;
		background: transparent;
		cursor: pointer;
		border-radius: 999px;
	}

	.toggle-switch:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
	}

	.toggle-disabled .toggle-switch {
		cursor: not-allowed;
	}

	.toggle-track {
		display: block;
		position: relative;
		border-radius: 999px;
		background: var(--color-border);
		transition: background-color 0.2s ease;
	}

	.toggle-switch[aria-checked='true'] .toggle-track {
		background: var(--color-primary);
	}

	.toggle-thumb {
		display: block;
		border-radius: 50%;
		background: var(--color-on-primary);
		box-shadow: var(--shadow-sm);
		transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.toggle-md .toggle-track {
		width: 2.75rem;
		height: 1.5rem;
		padding: 0.125rem;
	}

	.toggle-md .toggle-thumb {
		width: 1.25rem;
		height: 1.25rem;
		transform: translateX(0);
	}

	.toggle-md .toggle-switch[aria-checked='true'] .toggle-thumb {
		transform: translateX(1.25rem);
	}

	.toggle-sm .toggle-track {
		width: 2.25rem;
		height: 1.25rem;
		padding: 0.125rem;
	}

	.toggle-sm .toggle-thumb {
		width: 1rem;
		height: 1rem;
		transform: translateX(0);
	}

	.toggle-sm .toggle-switch[aria-checked='true'] .toggle-thumb {
		transform: translateX(1rem);
	}

	.toggle-label {
		font-size: 0.9rem;
		line-height: 1.35;
		color: var(--color-text);
		cursor: pointer;
	}
</style>
