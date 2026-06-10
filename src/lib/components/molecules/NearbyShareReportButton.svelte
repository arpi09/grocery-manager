<script lang="ts">
	import Button from '$lib/components/atoms/Button.svelte';
	import { t } from '$lib/i18n';
	import { showClientToast } from '$lib/utils/client-toast.svelte';

	interface Props {
		shareId?: string;
		token?: string;
		variant?: 'ghost' | 'secondary';
	}

	let { shareId, token, variant = 'ghost' }: Props = $props();

	let reporting = $state(false);

	async function reportShare() {
		if (!shareId && !token) {
			return;
		}

		reporting = true;
		try {
			const response = await fetch('/api/expiring-share/report', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					shareId,
					token,
					blockHousehold: true,
					reason: 'inappropriate'
				})
			});

			if (response.status === 401) {
				showClientToast(t('nearbySharing.reportLoginRequired'), { variant: 'error' });
				return;
			}

			if (!response.ok) {
				showClientToast(t('nearbySharing.reportFailed'), { variant: 'error' });
				return;
			}

			showClientToast(t('nearbySharing.reportSuccess'), { variant: 'success' });
		} catch {
			showClientToast(t('nearbySharing.reportFailed'), { variant: 'error' });
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
	onclick={reportShare}
>
	{t('nearbySharing.reportBtn')}
</Button>
