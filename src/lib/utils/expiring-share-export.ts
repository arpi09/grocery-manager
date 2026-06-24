import { formatExpiryDate } from '$lib/domain/expiry';
import type { Locale } from '$lib/i18n/locale';
import { DEFAULT_PALETTE_TRACK, mergePalette } from '$lib/design/brand-colors';

const SHARE_PALETTE = mergePalette(DEFAULT_PALETTE_TRACK).light;

const SHARE_WIDTH = 1080;
const SHARE_HEIGHT = 1920;

export const MAX_EXPIRING_SHARE_CARD_ITEMS = 8;

export interface ExpiringShareItemRow {
	name: string;
	dateLabel: string;
}

export interface ExpiringShareExportLabels {
	brand: string;
	badge: string;
	headline: string;
	items: ExpiringShareItemRow[];
	overflowText?: string;
	footer: string;
}

export function buildExpiringShareCardRows(
	items: Array<{ name: string; expiresOn: string | null }>,
	locale: Locale,
	maxItems = MAX_EXPIRING_SHARE_CARD_ITEMS
): { rows: ExpiringShareItemRow[]; overflowCount: number } {
	const sorted = [...items].sort((a, b) => {
		if (!a.expiresOn && !b.expiresOn) {
			return a.name.localeCompare(b.name, locale);
		}
		if (!a.expiresOn) {
			return 1;
		}
		if (!b.expiresOn) {
			return -1;
		}
		const byDate = a.expiresOn.localeCompare(b.expiresOn);
		return byDate !== 0 ? byDate : a.name.localeCompare(b.name, locale);
	});

	const visible = sorted.slice(0, maxItems);
	const overflowCount = Math.max(0, sorted.length - maxItems);

	return {
		rows: visible.map((item) => ({
			name: item.name,
			dateLabel: item.expiresOn ? formatExpiryDate(item.expiresOn, locale) : '—'
		})),
		overflowCount
	};
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
	const words = text.split(/\s+/);
	const lines: string[] = [];
	let current = '';

	for (const word of words) {
		const candidate = current ? `${current} ${word}` : word;
		if (ctx.measureText(candidate).width > maxWidth && current) {
			lines.push(current);
			current = word;
		} else {
			current = candidate;
		}
	}

	if (current) {
		lines.push(current);
	}

	return lines;
}

function truncateText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
	if (ctx.measureText(text).width <= maxWidth) {
		return text;
	}

	let trimmed = text;
	while (trimmed.length > 1 && ctx.measureText(`${trimmed}…`).width > maxWidth) {
		trimmed = trimmed.slice(0, -1);
	}

	return `${trimmed}…`;
}

export async function renderExpiringShareCardPng(
	labels: ExpiringShareExportLabels
): Promise<Blob> {
	const canvas = document.createElement('canvas');
	canvas.width = SHARE_WIDTH;
	canvas.height = SHARE_HEIGHT;
	const ctx = canvas.getContext('2d');
	if (!ctx) {
		throw new Error('Canvas not supported');
	}

	const gradient = ctx.createLinearGradient(0, 0, SHARE_WIDTH, SHARE_HEIGHT);
	gradient.addColorStop(0, SHARE_PALETTE.bg);
	gradient.addColorStop(0.45, SHARE_PALETTE.surfaceMuted);
	gradient.addColorStop(1, SHARE_PALETTE.surface);
	ctx.fillStyle = gradient;
	ctx.fillRect(0, 0, SHARE_WIDTH, SHARE_HEIGHT);

	ctx.fillStyle = 'rgba(201, 162, 74, 0.16)';
	ctx.beginPath();
	ctx.arc(SHARE_WIDTH * 0.85, SHARE_HEIGHT * 0.14, 200, 0, Math.PI * 2);
	ctx.fill();

	ctx.fillStyle = 'rgba(47, 107, 79, 0.1)';
	ctx.beginPath();
	ctx.arc(SHARE_WIDTH * 0.18, SHARE_HEIGHT * 0.78, 240, 0, Math.PI * 2);
	ctx.fill();

	ctx.fillStyle = SHARE_PALETTE.success;
	ctx.font = '700 52px system-ui, -apple-system, Segoe UI, sans-serif';
	ctx.textAlign = 'center';
	ctx.fillText(labels.brand, SHARE_WIDTH / 2, 160);

	const badgeWidth = ctx.measureText(labels.badge).width + 80;
	ctx.fillStyle = 'rgba(201, 120, 40, 0.14)';
	ctx.beginPath();
	ctx.roundRect(SHARE_WIDTH / 2 - badgeWidth / 2, 210, badgeWidth, 64, 32);
	ctx.fill();

	ctx.fillStyle = SHARE_PALETTE.warning;
	ctx.font = '700 34px system-ui, -apple-system, Segoe UI, sans-serif';
	ctx.fillText(labels.badge, SHARE_WIDTH / 2, 254);

	ctx.fillStyle = SHARE_PALETTE.text;
	ctx.font = '800 72px system-ui, -apple-system, Segoe UI, sans-serif';
	const headlineLines = wrapText(ctx, labels.headline, SHARE_WIDTH - 160);
	headlineLines.forEach((line, index) => {
		ctx.fillText(line, SHARE_WIDTH / 2, 400 + index * 84);
	});

	const listTop = 520;
	const rowHeight = 96;
	const nameX = 120;
	const dateX = SHARE_WIDTH - 120;
	const nameMaxWidth = SHARE_WIDTH - 420;

	ctx.textAlign = 'left';
	for (const [index, item] of labels.items.entries()) {
		const y = listTop + index * rowHeight;

		ctx.fillStyle = 'rgba(31, 42, 36, 0.06)';
		ctx.beginPath();
		ctx.roundRect(100, y - 8, SHARE_WIDTH - 200, rowHeight - 16, 20);
		ctx.fill();

		ctx.fillStyle = SHARE_PALETTE.text;
		ctx.font = '600 42px system-ui, -apple-system, Segoe UI, sans-serif';
		ctx.fillText(truncateText(ctx, item.name, nameMaxWidth), nameX, y + 52);

		ctx.textAlign = 'right';
		ctx.fillStyle = SHARE_PALETTE.warning;
		ctx.font = '600 36px system-ui, -apple-system, Segoe UI, sans-serif';
		ctx.fillText(item.dateLabel, dateX, y + 52);
		ctx.textAlign = 'left';
	}

	if (labels.overflowText) {
		const overflowY = listTop + labels.items.length * rowHeight + 24;
		ctx.textAlign = 'center';
		ctx.fillStyle = 'rgba(31, 42, 36, 0.55)';
		ctx.font = '500 36px system-ui, -apple-system, Segoe UI, sans-serif';
		ctx.fillText(labels.overflowText, SHARE_WIDTH / 2, overflowY);
	}

	ctx.strokeStyle = 'rgba(47, 107, 79, 0.35)';
	ctx.lineWidth = 4;
	ctx.beginPath();
	ctx.roundRect(120, SHARE_HEIGHT - 340, SHARE_WIDTH - 240, 220, 36);
	ctx.stroke();

	ctx.textAlign = 'center';
	ctx.fillStyle = 'rgba(31, 42, 36, 0.7)';
	ctx.font = '500 38px system-ui, -apple-system, Segoe UI, sans-serif';
	const footerLines = wrapText(ctx, labels.footer, SHARE_WIDTH - 200);
	footerLines.forEach((line, index) => {
		ctx.fillText(line, SHARE_WIDTH / 2, SHARE_HEIGHT - 260 + index * 52);
	});

	return new Promise((resolve, reject) => {
		canvas.toBlob((blob) => {
			if (!blob) {
				reject(new Error('Failed to export PNG'));
				return;
			}
			resolve(blob);
		}, 'image/png');
	});
}

export { downloadBlob } from '$lib/utils/wrapped-share-export';
