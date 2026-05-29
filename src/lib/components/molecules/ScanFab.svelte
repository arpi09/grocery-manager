<script lang="ts">
	interface Props {
		canWrite: boolean;
		href: string;
	}

	let { canWrite, href }: Props = $props();
</script>

{#if canWrite}
	<a class="scan-fab" {href} aria-label="Skanna streckkod">
		<span class="icon" aria-hidden="true">📷</span>
		<span>Skanna</span>
	</a>
{/if}

<style>
	.scan-fab {
		position: fixed;
		right: var(--space-md);
		bottom: calc(5.5rem + env(safe-area-inset-bottom, 0px));
		z-index: 40;
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.75rem 1.1rem;
		background: var(--color-primary);
		color: #fff;
		font-weight: 700;
		border-radius: 999px;
		text-decoration: none;
		box-shadow: var(--shadow-md);
	}

	.scan-fab:hover {
		background: var(--color-primary-hover);
		text-decoration: none;
	}

	.icon {
		font-size: 1.1rem;
	}
</style>
