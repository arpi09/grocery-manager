<script lang="ts">
	interface Props {
		value: number | null | undefined;
		placeholder?: string;
	}

	let { value, placeholder = '—' }: Props = $props();

	let displayed = $state(placeholder);
	let pop = $state(false);

	$effect(() => {
		const next = value == null ? placeholder : String(value);
		if (next === displayed) {
			return;
		}

		displayed = next;
		pop = true;

		if (typeof window === 'undefined') {
			pop = false;
			return;
		}

		const timer = window.setTimeout(() => {
			pop = false;
		}, 420);

		return () => window.clearTimeout(timer);
	});
</script>

<span class="animated-number" class:pop aria-live="polite">{displayed}</span>

<style>
	.animated-number {
		display: inline-block;
		font-variant-numeric: tabular-nums;
		transition: color 0.2s ease;
	}

	.animated-number.pop {
		animation: number-pop 0.42s cubic-bezier(0.33, 1, 0.68, 1);
	}

	@keyframes number-pop {
		0% {
			transform: scale(0.92);
			opacity: 0.65;
		}
		55% {
			transform: scale(1.06);
		}
		100% {
			transform: scale(1);
			opacity: 1;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.animated-number.pop {
			animation: none;
		}
	}
</style>
