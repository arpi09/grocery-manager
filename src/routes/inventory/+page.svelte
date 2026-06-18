<script lang="ts">
	import AppLayout from '$lib/components/templates/AppLayout.svelte';
	import AppHeader from '$lib/components/organisms/AppHeader.svelte';
	import PageContainer from '$lib/components/molecules/PageContainer.svelte';
	import { buildPantryShelfView } from '$lib/domain/pantry-shelf';
	import { t } from '$lib/i18n';

	let { data } = $props();

	const shelf = $derived(buildPantryShelfView(data.items));
</script>

<AppLayout user={data.user}>
	<AppHeader title={t('pantry.v2.title')} />

	<PageContainer>
		<section class="pantry-v2-stub" aria-label={t('pantry.v2.heroAria')} data-testid="pantry-v2-stub">
			<p class="lead">{t('pantry.v2.metaDescription')}</p>
			<p class="meta">
				{shelf.totalActiveCount}
				{shelf.useSoon.length > 0 ? ` · ${t('pantry.v2.useSoon.title', { count: shelf.useSoon.length })}` : ''}
			</p>
		</section>
	</PageContainer>
</AppLayout>

<style>
	.pantry-v2-stub {
		padding: var(--space-md) 0;
	}

	.lead {
		margin: 0 0 var(--space-sm);
		color: var(--color-text-muted);
	}

	.meta {
		margin: 0;
		font-weight: 600;
	}
</style>
