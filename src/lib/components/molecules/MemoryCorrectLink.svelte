<script lang="ts">
	import Button from '$lib/components/atoms/Button.svelte';
	import { t } from '$lib/i18n';

	interface Props {
		itemId: string | null;
	}

	let { itemId }: Props = $props();
</script>

{#if itemId}
	<a class="correct-link" href="/item/{itemId}/edit">
		<Button variant="primary" fullWidth>{t('memory.correct')}</Button>
	</a>
{:else}
	<p class="disabled-hint">{t('memory.correctDisabled')}</p>
{/if}

<style>
	.correct-link {
		display: block;
		text-decoration: none;
	}

	.disabled-hint {
		margin: 0;
		font-size: 0.875rem;
		color: var(--color-text-muted);
		line-height: 1.45;
		text-align: center;
	}
</style>
