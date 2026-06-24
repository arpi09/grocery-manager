import { rgbaFromBrandText } from '$lib/design/brand/layout';
import { DEFAULT_PALETTE_TRACK, mergePalette } from '$lib/design/brand-colors';

const SHARE_PALETTE = mergePalette(DEFAULT_PALETTE_TRACK).light;

const SHARE_WIDTH = 1080;
const SHARE_HEIGHT = 1920;

export interface WrappedShareExportLabels {
	monthLabel: string;
	headline: string;
	statsLine: string;
	footer: string;
	brand: string;
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

export async function renderWrappedShareCardPng(
	labels: WrappedShareExportLabels
): Promise<Blob> {
	const canvas = document.createElement('canvas');
	canvas.width = SHARE_WIDTH;
	canvas.height = SHARE_HEIGHT;
	const ctx = canvas.getContext('2d');
	if (!ctx) {
		throw new Error('Canvas not supported');
	}

	const gradient = ctx.createLinearGradient(0, 0, SHARE_WIDTH, SHARE_HEIGHT);
	gradient.addColorStop(0, SHARE_PALETTE.surfaceMuted);
	gradient.addColorStop(0.45, SHARE_PALETTE.surface);
	gradient.addColorStop(1, SHARE_PALETTE.bg);
	ctx.fillStyle = gradient;
	ctx.fillRect(0, 0, SHARE_WIDTH, SHARE_HEIGHT);

	ctx.fillStyle = 'rgba(47, 107, 79, 0.12)';
	ctx.beginPath();
	ctx.arc(SHARE_WIDTH * 0.82, SHARE_HEIGHT * 0.18, 220, 0, Math.PI * 2);
	ctx.fill();

	ctx.fillStyle = 'rgba(201, 162, 74, 0.14)';
	ctx.beginPath();
	ctx.arc(SHARE_WIDTH * 0.2, SHARE_HEIGHT * 0.72, 260, 0, Math.PI * 2);
	ctx.fill();

	ctx.fillStyle = SHARE_PALETTE.success;
	ctx.font = '700 52px system-ui, -apple-system, Segoe UI, sans-serif';
	ctx.textAlign = 'center';
	ctx.fillText(labels.brand, SHARE_WIDTH / 2, 180);

	ctx.fillStyle = `${SHARE_PALETTE.text}8c`;
	ctx.font = '600 40px system-ui, -apple-system, Segoe UI, sans-serif';
	ctx.fillText(labels.monthLabel, SHARE_WIDTH / 2, 250);

	ctx.fillStyle = SHARE_PALETTE.text;
	ctx.font = '800 88px system-ui, -apple-system, Segoe UI, sans-serif';
	const headlineLines = wrapText(ctx, labels.headline, SHARE_WIDTH - 160);
	headlineLines.forEach((line, index) => {
		ctx.fillText(line, SHARE_WIDTH / 2, 520 + index * 100);
	});

	ctx.fillStyle = SHARE_PALETTE.success;
	ctx.font = '700 56px system-ui, -apple-system, Segoe UI, sans-serif';
	const statsLines = wrapText(ctx, labels.statsLine, SHARE_WIDTH - 140);
	statsLines.forEach((line, index) => {
		ctx.fillText(line, SHARE_WIDTH / 2, 900 + index * 72);
	});

	ctx.strokeStyle = 'rgba(47, 107, 79, 0.35)';
	ctx.lineWidth = 4;
	ctx.beginPath();
	ctx.roundRect(120, 1180, SHARE_WIDTH - 240, 420, 36);
	ctx.stroke();

	ctx.fillStyle = rgbaFromBrandText(0.7);
	ctx.font = '500 38px system-ui, -apple-system, Segoe UI, sans-serif';
	const footerLines = wrapText(ctx, labels.footer, SHARE_WIDTH - 200);
	footerLines.forEach((line, index) => {
		ctx.fillText(line, SHARE_WIDTH / 2, 1360 + index * 52);
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

export function downloadBlob(blob: Blob, filename: string): void {
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement('a');
	anchor.href = url;
	anchor.download = filename;
	anchor.click();
	URL.revokeObjectURL(url);
}
