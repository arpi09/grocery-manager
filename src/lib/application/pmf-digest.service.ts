import { buildPmfDigestEmailContent } from '$lib/domain/pmf-digest';
import type { PmfService } from '$lib/application/pmf.service';
import type { AdminService } from '$lib/application/admin.service';
import type { WaitlistService } from '$lib/application/waitlist.service';
import { getPmfDigestTo, sendOwnerPmfDigest } from '$lib/server/email';
import { getAppOrigin } from '$lib/server/origin';

export interface PmfDigestRunResult {
	sent: boolean;
	skipped?: string;
	emailId?: string;
	recommendedMetric?: string | null;
	onTargetCount?: number;
	totalTracked?: number;
}

export class PmfDigestService {
	constructor(
		private readonly pmfService: PmfService,
		private readonly adminService: AdminService,
		private readonly waitlistService: WaitlistService
	) {}

	async runWeeklyDigest(): Promise<PmfDigestRunResult> {
		const to = getPmfDigestTo();
		if (!to) {
			console.warn('[pmf-digest] PMF_DIGEST_TO not configured; skipped');
			return { sent: false, skipped: 'PMF_DIGEST_TO not configured' };
		}

		const [review, stats, waitlistCount] = await Promise.all([
			this.pmfService.getWeeklyReview(),
			this.adminService.getDashboardStats(),
			this.waitlistService.count()
		]);

		const content = buildPmfDigestEmailContent({
			review,
			stats,
			waitlistCount,
			adminUrl: `${getAppOrigin()}/admin`
		});

		const result = await sendOwnerPmfDigest({
			to,
			subject: content.subject,
			html: content.html,
			text: content.text
		});

		if (!result.ok) {
			console.error(`[pmf-digest] Failed to send: ${result.reason}`);
			return {
				sent: false,
				skipped: result.reason,
				recommendedMetric: content.recommendedMetric,
				onTargetCount: review.onTargetCount,
				totalTracked: review.totalTracked
			};
		}

		console.info(`[pmf-digest] Sent weekly digest to ${to}`);
		return {
			sent: true,
			emailId: result.id,
			recommendedMetric: content.recommendedMetric,
			onTargetCount: review.onTargetCount,
			totalTracked: review.totalTracked
		};
	}
}
