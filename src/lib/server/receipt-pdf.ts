import { PDFParse } from 'pdf-parse';
import { RECEIPT_MIN_PDF_TEXT_CHARS } from '$lib/utils/receipt-file';

export type PdfTextExtractionResult =
	| { ok: true; text: string }
	| { ok: false; reason: 'empty' | 'too_short' | 'failed' };

export async function extractPdfText(bytes: Uint8Array): Promise<PdfTextExtractionResult> {
	let parser: PDFParse | undefined;

	try {
		parser = new PDFParse({ data: bytes });
		const result = await parser.getText();
		const text = result.text.replace(/\s+/g, ' ').trim();

		if (!text) {
			return { ok: false, reason: 'empty' };
		}

		if (text.length < RECEIPT_MIN_PDF_TEXT_CHARS) {
			return { ok: false, reason: 'too_short' };
		}

		return { ok: true, text };
	} catch (error) {
		const detail = error instanceof Error ? error.message : String(error);
		console.error(`[receipt] pdf-parse failed: ${detail.slice(0, 300)}`);
		return { ok: false, reason: 'failed' };
	} finally {
		await parser?.destroy().catch(() => undefined);
	}
}
