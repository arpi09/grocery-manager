<script lang="ts">
	import Button from '$lib/components/atoms/Button.svelte';
	import { t } from '$lib/i18n';
	import { showClientToast } from '$lib/utils/client-toast.svelte';

	interface Props {
		threadId: string;
		variant?: 'ghost' | 'secondary';
	}

	let { threadId, variant = 'ghost' }: Props = $props();

	let reporting = $state(false);

	async function reportChat() {
		reporting = true;
		try {
			const response = await fetch(`/api/market/chat/${threadId}/report`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					reason: 'inappropriate',
					blockCounterpart: true
				})
			});

			if (!response.ok) {
				showClientToast(t('marketV01.reportChatFailed'), { variant: 'error' });
				return;
			}

			showClientToast(t('marketV01.reportChatSuccess'), { variant: 'success' });
		} catch {
			showClientToast(t('marketV01.reportChatFailed'), { variant: 'error' });
		} finally {
			reporting = false;
		}
	}
</script>

<Button
	type="button"
	{variant}
	loading={reporting}
	loadingLabel={t('common.loading')}
	onclick={reportChat}
	data-testid="market-chat-report-btn"
>
	{t('marketV01.reportChatBtn')}
</Button>
