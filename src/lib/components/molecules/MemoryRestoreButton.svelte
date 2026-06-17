<script lang="ts">
	import Button from '$lib/components/atoms/Button.svelte';
	import { t } from '$lib/i18n';
	import { showClientToast } from '$lib/utils/client-toast.svelte';

	interface Props {
		normalizedKey: string;
		afterRestore?: () => void;
	}

	let { normalizedKey, afterRestore }: Props = $props();

	let restoring = $state(false);

	async function restoreSuggestions() {
		if (restoring) return;
		restoring = true;
		try {
			const response = await fetch('/api/brain/feedback/restore', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ normalizedKey })
			});
			if (!response.ok) {
				throw new Error('restore_failed');
			}
			showClientToast(t('memory.buyAgain.restoreSuccess'));
			afterRestore?.();
		} catch {
			showClientToast(t('memory.buyAgain.restoreFailed'), { variant: 'error' });
		} finally {
			restoring = false;
		}
	}
</script>

<Button
	variant="secondary"
	fullWidth
	disabled={restoring}
	data-testid="memory-restore-suggestions"
	onclick={restoreSuggestions}
>
	{t('memory.buyAgain.restore')}
</Button>
