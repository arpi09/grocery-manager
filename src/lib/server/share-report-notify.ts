import { getErrorAlertTo, sendOwnerErrorAlert } from '$lib/server/email';

interface ShareReportNotifyInput {
	shareId: string;
	householdId: string;
	reporterUserId: string;
	reason: string | null;
}

/** Best-effort owner notification when ERROR_ALERT_TO / PMF_DIGEST_TO is configured. */
export async function notifyOwnerExpiringShareReport(input: ShareReportNotifyInput): Promise<void> {
	const subject = 'Grannskafferiet: delning rapporterad';
	const text = [
		'En användare rapporterade en utgående-delning.',
		`shareId: ${input.shareId}`,
		`householdId: ${input.householdId}`,
		`reporterUserId: ${input.reporterUserId}`,
		`reason: ${input.reason ?? 'unspecified'}`
	].join('\n');

	const to = getErrorAlertTo();
	if (!to) {
		console.info('[share-report] Owner notify skipped: ERROR_ALERT_TO not configured');
		return;
	}

	try {
		const result = await sendOwnerErrorAlert({
			to,
			subject,
			text,
			html: `<pre>${text}</pre>`
		});
		if (!result.ok && result.reason) {
			console.info(`[share-report] Owner notify skipped: ${result.reason}`);
		}
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		console.error(`[share-report] Owner notify failed: ${message}`);
	}
}
