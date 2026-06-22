<script lang="ts">
	import MarketInboxList from '$lib/components/organisms/MarketInboxList.svelte';
	import { t } from '$lib/i18n';

	let { data } = $props();
</script>

<svelte:head>
	<meta name="robots" content="noindex,nofollow" />
	<title>{t('marketV05.inboxTitle')} · {t('marketV01.pageTitle')}</title>
</svelte:head>

<MarketInboxList nearbyOptedIn={data.nearbyOptedIn} />
