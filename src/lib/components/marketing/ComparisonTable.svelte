<script lang="ts">
	import type { MarketingComparison } from '$lib/marketing/content';

	interface Props {
		comparison: MarketingComparison;
	}

	let { comparison }: Props = $props();
</script>

<div class="comparison-table-wrap">
	<table class="comparison-table">
		<thead>
			<tr>
				<th scope="col" class="col-app"></th>
				<th scope="col">{comparison.themColumn}</th>
				<th scope="col">{comparison.usColumn}</th>
			</tr>
		</thead>
		<tbody>
			{#each comparison.rows as row (row.competitor)}
				<tr>
					<th scope="row" class="col-app">{row.competitor}</th>
					<td>{row.theirStrength}</td>
					<td>{row.homePantry}</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<style>
	.comparison-table-wrap {
		overflow-x: auto;
		margin-top: var(--space-lg);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		background: var(--color-surface);
	}

	.comparison-table {
		width: 100%;
		min-width: 36rem;
		border-collapse: collapse;
		font-size: var(--font-size-body-sm);
		line-height: var(--line-height-body);
	}

	th,
	td {
		padding: var(--space-md) var(--space-lg);
		text-align: left;
		vertical-align: top;
		border-bottom: 1px solid var(--color-border);
	}

	tr:last-child th,
	tr:last-child td {
		border-bottom: none;
	}

	thead th {
		font-size: var(--font-size-label);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--color-text-muted);
		background: var(--color-surface-muted);
	}

	.col-app {
		width: 7rem;
		font-weight: 600;
		color: var(--color-text);
		white-space: nowrap;
	}

	tbody th.col-app {
		background: color-mix(in srgb, var(--color-surface-muted) 40%, transparent);
	}

	@media (max-width: 640px) {
		.comparison-table {
			min-width: 32rem;
		}

		th,
		td {
			padding: var(--space-sm) var(--space-md);
		}
	}
</style>
