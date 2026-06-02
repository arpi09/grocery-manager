<script lang="ts">
	import { t } from '$lib/i18n';
	import AppLayout from '$lib/components/templates/AppLayout.svelte';
	import AppHeader from '$lib/components/organisms/AppHeader.svelte';
	import PageContainer from '$lib/components/molecules/PageContainer.svelte';
	import SmartShoppingFill from '$lib/components/organisms/SmartShoppingFill.svelte';
	import ReceiptAutopilotSection from '$lib/components/organisms/ReceiptAutopilotSection.svelte';
	import ShoppingListPanel from '$lib/components/organisms/ShoppingListPanel.svelte';

	let { data, form } = $props();
</script>

<AppLayout user={data.user}>
	<AppHeader title={t('shopping.title')} subtitle={t('shopping.subtitle')} />

	<PageContainer>
		<SmartShoppingFill canEdit={data.canEdit} {form} />

		{#if data.canEdit}
			<ReceiptAutopilotSection
				suggestions={data.receiptAutopilotSuggestions ?? []}
				canEdit={data.canEdit}
				compact
			/>
		{/if}

		<ShoppingListPanel items={data.items} checkedCount={data.checkedCount} canEdit={data.canEdit} />
	</PageContainer>
</AppLayout>
