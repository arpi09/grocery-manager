<script lang="ts">
	import FeedbackBanner from '$lib/components/molecules/FeedbackBanner.svelte';
	import { t } from '$lib/i18n';
	import type { AddMissingFeedbackTone } from '$lib/utils/recipe-add-missing';

	interface Props {
		feedback: { message: string; tone: AddMissingFeedbackTone; showListLink?: boolean } | null;
	}

	let { feedback }: Props = $props();
</script>

{#if feedback}
	<FeedbackBanner tone={feedback.tone} message={feedback.message} />
	{#if feedback.showListLink}
		<p class="list-link">
			<a href="/inkop">{t('recipe.viewShoppingList')}</a>
		</p>
	{/if}
{/if}

<style>
	.list-link {
		margin: calc(-1 * var(--space-sm)) 0 var(--space-md);
		font-size: 0.875rem;
		font-weight: 600;
	}

	.list-link a {
		color: var(--color-primary);
		text-decoration: none;
	}

	.list-link a:hover {
		text-decoration: underline;
	}
</style>
