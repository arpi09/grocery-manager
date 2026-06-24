<script lang="ts">
	import { navigateBack } from '$lib/navigation/navigate-back';

	interface Props {
		fallbackHref: string;
		label: string;
		testId?: string;
		class?: string;
		ariaLabel?: string;
	}

	let { fallbackHref, label, testId, class: className = '', ariaLabel }: Props = $props();

	function handleClick(event: MouseEvent) {
		event.preventDefault();
		void navigateBack(fallbackHref);
	}
</script>

<a
	href={fallbackHref}
	class="back-link {className}"
	data-testid={testId}
	aria-label={ariaLabel}
	onclick={handleClick}
>
	← {label}
</a>

<style>
	.back-link {
		display: inline-flex;
		align-items: center;
		min-height: 2.75rem;
		margin-bottom: var(--space-xs);
		color: var(--color-primary);
		font-weight: 600;
		font-size: 0.9rem;
		text-decoration: none;
	}

	.back-link:hover {
		text-decoration: none;
		opacity: 0.85;
	}
</style>
