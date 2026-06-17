<script lang="ts">
	import { computeMetricBarWidths, type MetricBarSegment } from '$lib/utils/metric-bar';

	interface Props {
		segments: MetricBarSegment[];
		ariaLabel: string;
		testId?: string;
	}

	let { segments, ariaLabel, testId = 'metric-bar' }: Props = $props();

	const widths = $derived(computeMetricBarWidths(segments));
	const hasData = $derived(widths.some((segment) => segment.value > 0));
</script>

<div
	class="metric-bar"
	role="img"
	aria-label={ariaLabel}
	data-testid={testId}
>
	<div class="metric-bar-track" aria-hidden="true">
		{#if hasData}
			{#each widths as segment (segment.key)}
				{#if segment.widthPercent > 0}
					<span
						class="metric-bar-segment"
						style="width: {segment.widthPercent}%; background: {segment.color};"
						title={segment.label}
					></span>
				{/if}
			{/each}
		{:else}
			<span class="metric-bar-empty"></span>
		{/if}
	</div>
</div>

<style>
	.metric-bar {
		width: 100%;
		min-width: 0;
	}

	.metric-bar-track {
		display: flex;
		width: 100%;
		height: 0.375rem;
		border-radius: 999px;
		overflow: hidden;
		background: color-mix(in srgb, var(--color-border) 65%, transparent);
	}

	.metric-bar-segment {
		display: block;
		height: 100%;
		min-width: 0;
		transition: width 0.45s cubic-bezier(0.33, 1, 0.68, 1);
	}

	.metric-bar-empty {
		display: block;
		width: 100%;
		height: 100%;
		background: color-mix(in srgb, var(--color-border) 45%, transparent);
	}

	@media (prefers-reduced-motion: reduce) {
		.metric-bar-segment {
			transition: none;
		}
	}
</style>
