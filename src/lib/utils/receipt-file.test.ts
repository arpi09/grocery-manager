import { describe, expect, it } from 'vitest';
import {
	detectReceiptMimeFromBytes,
	inferReceiptMimeType,
	isReceiptImage,
	isReceiptPdf,
	resolveReceiptMimeType
} from './receipt-file';

describe('inferReceiptMimeType', () => {
	it('accepts common receipt formats from mime type', () => {
		expect(inferReceiptMimeType('image/jpeg', 'receipt.jpg')).toBe('image/jpeg');
		expect(inferReceiptMimeType('application/pdf', 'kvitto.pdf')).toBe('application/pdf');
		expect(inferReceiptMimeType('image/heic', 'photo.heic')).toBe('image/heic');
	});

	it('falls back to file extension when mime is empty', () => {
		expect(inferReceiptMimeType('', 'kivra-kvitto.pdf')).toBe('application/pdf');
		expect(inferReceiptMimeType('', 'scan.heic')).toBe('image/heic');
	});

	it('rejects unsupported formats', () => {
		expect(inferReceiptMimeType('text/plain', 'notes.txt')).toBeNull();
	});
});

describe('detectReceiptMimeFromBytes', () => {
	it('detects PDF magic bytes', () => {
		const bytes = new TextEncoder().encode('%PDF-1.4\n');
		expect(detectReceiptMimeFromBytes(bytes)).toBe('application/pdf');
	});

	it('detects JPEG magic bytes', () => {
		expect(detectReceiptMimeFromBytes(new Uint8Array([0xff, 0xd8, 0xff, 0x00]))).toBe('image/jpeg');
	});
});

describe('resolveReceiptMimeType', () => {
	it('uses byte sniffing when metadata is missing', () => {
		const bytes = new TextEncoder().encode('%PDF-1.7');
		expect(resolveReceiptMimeType('', 'download', bytes)).toBe('application/pdf');
	});
});

describe('receipt kind helpers', () => {
	it('classifies pdf and image mime types', () => {
		expect(isReceiptPdf('application/pdf')).toBe(true);
		expect(isReceiptImage('image/png')).toBe(true);
		expect(isReceiptImage('application/pdf')).toBe(false);
	});
});
