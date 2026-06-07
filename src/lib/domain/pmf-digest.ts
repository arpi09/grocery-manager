import {
	PMF_TRACKED_METRIC_KEYS,
	PMF_TARGETS,
	type PmfMetricStatus,
	type PmfTrackedMetricKey,
	type PmfWeeklyReview
} from '$lib/domain/pmf';
import type { AdminDashboardStats } from '$lib/infrastructure/repositories/admin.repository';

const PRO_WAITLIST_TARGET = 50;

const METRIC_LABELS_SV: Record<PmfTrackedMetricKey, string> = {
	activationRate: 'Aktivering (24 h)',
	medianTimeToFirstScanMinutes: 'Tid till första scan',
	weeklyScanRate: 'Veckoscan-rate',
	d7Retention: 'D7-retention',
	d30Retention: 'D30-retention',
	multiMemberHouseholdRate: 'Hushåll 2+ aktiva',
	smartFillWeeklyRate: 'Smart fill / vecka'
};

const RECOMMENDED_ACTIONS_SV: Record<PmfTrackedMetricKey, string> = {
	activationRate:
		'Prioritera onboarding-friktion — kör 2 intervjuer med registrerade som inte nått 10 varor; notera om kvitto vs streckkod blockerar.',
	medianTimeToFirstScanMinutes:
		'Minska tid till första scan — granska onboarding-copy och gör scan/kvitto mer synligt direkt efter registrering.',
	weeklyScanRate:
		'Öka veckoscan — påminn aktiva användare om scan/kvitto (copy, push eller mejl) och mät om fler scannar denna vecka.',
	d7Retention:
		'Förbättra D7 — identifiera vad som händer dag 1–3 för nya användare och testa en enkel återkomst-påminnelse.',
	d30Retention:
		'Primär PMF-gate — fokusera på varför användare slutar efter första veckan; samla 2–3 intervjuer med churnade konton.',
	multiMemberHouseholdRate:
		'Öka flermedlemshushåll — förenkla inbjudningsflödet och uppmuntra ägare att bjuda in partner/familj.',
	smartFillWeeklyRate:
		'Öka smart fill — gör AI-fill mer synligt på inköpslistan och testa om fler WAU använder funktionen.'
};

export interface PmfDigestInput {
	review: PmfWeeklyReview;
	stats: AdminDashboardStats;
	waitlistCount: number;
	adminUrl: string;
	aiSummaryParagraph?: string | null;
}

export interface PmfDigestEmailContent {
	subject: string;
	html: string;
	text: string;
	recommendedMetric: PmfTrackedMetricKey | null;
}

export function pickRecommendedMetric(
	belowTarget: PmfMetricStatus[]
): PmfMetricStatus | null {
	for (const key of PMF_TRACKED_METRIC_KEYS) {
		const match = belowTarget.find((metric) => metric.key === key);
		if (match) {
			return match;
		}
	}
	return null;
}

export function getRecommendedActionText(metric: PmfMetricStatus | null): string {
	if (!metric) {
		return 'Alla spårade mätetal ligger på eller över mål — fortsätt veckorutinen och håll koll på pro-waitlist och feedback.';
	}
	return RECOMMENDED_ACTIONS_SV[metric.key];
}

function formatPercentSv(value: number): string {
	return new Intl.NumberFormat('sv-SE', {
		style: 'percent',
		maximumFractionDigits: 1
	}).format(value);
}

function formatMinutesSv(value: number | null): string {
	if (value === null) {
		return 'Ingen data';
	}
	const rounded = Math.round(value * 10) / 10;
	return `${rounded} min`;
}

function formatTargetSv(key: PmfTrackedMetricKey, target: number): string {
	if (key === 'medianTimeToFirstScanMinutes') {
		return `≤${target} min`;
	}
	return formatPercentSv(target);
}

export function formatMetricValueSv(key: PmfTrackedMetricKey, value: number | null): string {
	if (value === null) {
		return 'Ingen data';
	}
	if (key === 'medianTimeToFirstScanMinutes') {
		return formatMinutesSv(value);
	}
	return formatPercentSv(value);
}

export function formatDeltaSv(status: PmfMetricStatus): string {
	if (status.delta === null) {
		return 'ingen föregående data';
	}
	if (status.deltaDirection === 'flat') {
		return 'oförändrat';
	}

	if (status.key === 'medianTimeToFirstScanMinutes') {
		const rounded = Math.round(Math.abs(status.delta) * 10) / 10;
		if (status.deltaDirection === 'up') {
			return `−${rounded} min (förbättring)`;
		}
		return `+${rounded} min (sämre)`;
	}

	const points = Math.abs(status.delta * 100);
	const formatted = new Intl.NumberFormat('sv-SE', {
		maximumFractionDigits: 1,
		minimumFractionDigits: 0
	}).format(points);

	if (status.deltaDirection === 'up') {
		return `+${formatted} pp`;
	}
	return `−${formatted} pp`;
}

function formatWeekEndSv(date: Date): string {
	return new Intl.DateTimeFormat('sv-SE', { dateStyle: 'medium' }).format(date);
}

function metricDetailSv(key: PmfTrackedMetricKey, review: PmfWeeklyReview): string {
	const snapshot = review.current;
	switch (key) {
		case 'activationRate':
			return `${snapshot.activatedUsers}/${snapshot.eligibleUsers} användare`;
		case 'weeklyScanRate':
			return `${snapshot.weeklyScanners}/${snapshot.wauCount} WAU`;
		case 'd7Retention':
			return `${snapshot.d7EligibleUsers} eligible`;
		case 'd30Retention':
			return `${snapshot.d30EligibleUsers} eligible`;
		case 'multiMemberHouseholdRate':
			return `${snapshot.multiMemberActiveHouseholds}/${snapshot.activeHouseholds} hushåll`;
		case 'smartFillWeeklyRate':
			return `${snapshot.weeklyFillUsers}/${snapshot.wauCount} WAU`;
		default:
			return '';
	}
}

function buildMetricsText(review: PmfWeeklyReview): string {
	return review.metrics
		.map((metric) => {
			const label = METRIC_LABELS_SV[metric.key];
			const current = formatMetricValueSv(metric.key, metric.current);
			const target = formatTargetSv(metric.key, metric.target);
			const delta = formatDeltaSv(metric);
			const detail = metricDetailSv(metric.key, review);
			const onTarget = metric.onTarget ? '✓' : '✗';
			const detailSuffix = detail ? ` (${detail})` : '';
			return `| ${label} | ${current}${detailSuffix} | ${target} | ${delta} | ${onTarget} |`;
		})
		.join('\n');
}

export function buildPmfDigestEmailContent(input: PmfDigestInput): PmfDigestEmailContent {
	const { review, stats, waitlistCount, adminUrl, aiSummaryParagraph } = input;
	const recommended = pickRecommendedMetric(review.belowTarget);
	const recommendedMetric = recommended?.key ?? null;
	const recommendedAction = getRecommendedActionText(recommended);
	const weekEnd = formatWeekEndSv(review.currentWeekEnd);
	const events = review.current.eventCounts;

	const subject = `Skaffu PMF — ${review.onTargetCount}/${review.totalTracked} på mål (${weekEnd})`;

	const metricsBlock = buildMetricsText(review);

	const text = [
		`Skaffu — veckovis PMF-sammanfattning`,
		`Vecka till ${weekEnd}`,
		``,
		`Hälsa`,
		`- Användare: ${stats.userCount}`,
		`- Hushåll: ${stats.householdCount}`,
		`- Lagerposter: ${stats.inventoryCount}`,
		`- Aktiva nu: ${stats.activeNowCount}`,
		`- Fel (7 d): ${stats.errorCount7Days}`,
		`- Pro-waitlist: ${waitlistCount} / ${PRO_WAITLIST_TARGET}`,
		``,
		`PMF vs mål (${review.onTargetCount}/${review.totalTracked} på mål)`,
		`| Metric | Nu | Mål | WoW Δ | På mål? |`,
		`|--------|-----|-----|-------|---------|`,
		metricsBlock,
		``,
		`Event counts (7 d): scan ${events.scan_completed} · kvitto ${events.receipt_parsed} · smart fill ${events.fill_suggestions_added}`,
		...(aiSummaryParagraph
			? ['', 'AI-sammanfattning:', aiSummaryParagraph]
			: []),
		``,
		recommendedMetric
			? `Föreslagen åtgärd (${METRIC_LABELS_SV[recommendedMetric]}):`
			: `Föreslagen åtgärd:`,
		recommendedAction,
		``,
		`Öppna admin:`,
		adminUrl,
		``,
		`Automatiskt mejl från Skaffu PMF-cron. Se docs/PMF_WEEKLY.md.`
	].join('\n');

	const metricsRows = review.metrics
		.map((metric) => {
			const label = METRIC_LABELS_SV[metric.key];
			const current = formatMetricValueSv(metric.key, metric.current);
			const target = formatTargetSv(metric.key, metric.target);
			const delta = formatDeltaSv(metric);
			const detail = metricDetailSv(metric.key, review);
			const statusClass = metric.onTarget ? 'on-target' : 'below-target';
			const detailHtml = detail ? `<br /><span class="detail">${detail}</span>` : '';
			return `<tr class="${statusClass}">
  <td>${escapeHtml(label)}</td>
  <td><strong>${escapeHtml(current)}</strong>${detailHtml}</td>
  <td>${escapeHtml(target)}</td>
  <td>${escapeHtml(delta)}</td>
  <td>${metric.onTarget ? '✓' : '✗'}</td>
</tr>`;
		})
		.join('');

	const html = `<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(subject)}</title>
  <style>
    body { font-family: 'Segoe UI', system-ui, sans-serif; color: #1f2a24; background: #f7f5f0; margin: 0; padding: 24px 16px; }
    .card { max-width: 640px; margin: 0 auto; background: #fff; border: 1px solid #dde5d8; border-radius: 16px; overflow: hidden; }
    .header { background: #3d6b4f; color: #fff; padding: 24px 28px; }
    .header h1 { margin: 0 0 8px; font-size: 22px; }
    .header p { margin: 0; opacity: 0.9; font-size: 14px; }
    .body { padding: 28px; }
    h2 { font-size: 16px; margin: 24px 0 12px; }
    h2:first-child { margin-top: 0; }
    .stats { margin: 0; padding-left: 20px; line-height: 1.7; }
    table { width: 100%; border-collapse: collapse; font-size: 14px; }
    th, td { padding: 10px 8px; border-bottom: 1px solid #dde5d8; text-align: left; vertical-align: top; }
    th { font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; color: #5c6b62; }
    tr.below-target td:first-child { color: #9a3412; }
    .detail { font-size: 12px; color: #5c6b62; }
    .action { background: #eef2eb; border: 1px solid #dde5d8; border-radius: 12px; padding: 16px; margin-top: 8px; line-height: 1.55; }
    .events { font-size: 13px; color: #5c6b62; margin-top: 8px; }
    .cta { display: inline-block; margin-top: 24px; padding: 12px 24px; background: #3d6b4f; color: #fff !important; text-decoration: none; border-radius: 10px; font-weight: 600; }
    .footer { padding: 16px 28px 24px; font-size: 12px; color: #5c6b62; border-top: 1px solid #dde5d8; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>PMF veckosammanfattning</h1>
      <p>Vecka till ${escapeHtml(weekEnd)} · ${review.onTargetCount}/${review.totalTracked} mätetal på mål</p>
    </div>
    <div class="body">
      <h2>Hälsa</h2>
      <ul class="stats">
        <li>Användare: ${stats.userCount}</li>
        <li>Hushåll: ${stats.householdCount}</li>
        <li>Lagerposter: ${stats.inventoryCount}</li>
        <li>Aktiva nu: ${stats.activeNowCount}</li>
        <li>Fel (7 d): ${stats.errorCount7Days}</li>
        <li>Pro-waitlist: ${waitlistCount} / ${PRO_WAITLIST_TARGET}</li>
      </ul>

      <h2>PMF vs mål</h2>
      <table>
        <thead>
          <tr>
            <th>Metric</th>
            <th>Nu</th>
            <th>Mål</th>
            <th>WoW Δ</th>
            <th>På mål?</th>
          </tr>
        </thead>
        <tbody>
          ${metricsRows}
        </tbody>
      </table>
      <p class="events">Event counts (7 d): scan ${events.scan_completed} · kvitto ${events.receipt_parsed} · smart fill ${events.fill_suggestions_added}</p>
      ${
				aiSummaryParagraph
					? `<h2>AI-sammanfattning</h2><div class="action">${escapeHtml(aiSummaryParagraph)}</div>`
					: ''
			}

      <h2>Föreslagen åtgärd${recommendedMetric ? ` — ${escapeHtml(METRIC_LABELS_SV[recommendedMetric])}` : ''}</h2>
      <div class="action">${escapeHtml(recommendedAction)}</div>

      <a class="cta" href="${escapeHtml(adminUrl)}">Öppna /admin</a>
    </div>
    <div class="footer">
      Automatiskt mejl från Skaffu PMF-cron. D30-mål: ${formatPercentSv(PMF_TARGETS.d30RetentionEarly)} (tidigt).
    </div>
  </div>
</body>
</html>`;

	return { subject, html, text, recommendedMetric };
}

function escapeHtml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}
