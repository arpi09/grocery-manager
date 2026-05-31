/** Max receipt upload size (8 MB). */
export const RECEIPT_MAX_BYTES = 8 * 1024 * 1024;

/** Minimum extracted PDF text length to treat as a text-based receipt. */
export const RECEIPT_MIN_PDF_TEXT_CHARS = 40;

export const RECEIPT_IMAGE_MIME_TYPES = [
	'image/jpeg',
	'image/png',
	'image/webp',
	'image/heic',
	'image/heif'
] as const;

export const RECEIPT_ACCEPTED_MIME_TYPES = [
	...RECEIPT_IMAGE_MIME_TYPES,
	'application/pdf'
] as const;

export const RECEIPT_FILE_ACCEPT =
	'image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf,.pdf,.heic,.heif';

export const RECEIPT_CAMERA_ACCEPT = 'image/*';

export type ReceiptFileErrorCode = 'unsupported' | 'too_large' | 'processing_failed';

export class ReceiptFileError extends Error {
	readonly code: ReceiptFileErrorCode;

	constructor(code: ReceiptFileErrorCode) {
		super(code);
		this.name = 'ReceiptFileError';
		this.code = code;
	}
}

const EXTENSION_MIME: Record<string, (typeof RECEIPT_ACCEPTED_MIME_TYPES)[number]> = {
	jpg: 'image/jpeg',
	jpeg: 'image/jpeg',
	png: 'image/png',
	webp: 'image/webp',
	heic: 'image/heic',
	heif: 'image/heif',
	pdf: 'application/pdf'
};

export function inferReceiptMimeType(mimeType: string, fileName: string): string | null {
	const normalized = mimeType.trim().toLowerCase();
	if ((RECEIPT_ACCEPTED_MIME_TYPES as readonly string[]).includes(normalized)) {
		return normalized;
	}

	const extension = fileName.split('.').pop()?.toLowerCase();
	if (!extension) {
		return null;
	}

	return EXTENSION_MIME[extension] ?? null;
}

export function detectReceiptMimeFromBytes(bytes: Uint8Array): string | null {
	if (bytes.length >= 5 && new TextDecoder().decode(bytes.subarray(0, 5)) === '%PDF-') {
		return 'application/pdf';
	}

	if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
		return 'image/jpeg';
	}

	if (
		bytes.length >= 8 &&
		bytes[0] === 0x89 &&
		bytes[1] === 0x50 &&
		bytes[2] === 0x4e &&
		bytes[3] === 0x47
	) {
		return 'image/png';
	}

	if (
		bytes.length >= 12 &&
		new TextDecoder().decode(bytes.subarray(0, 4)) === 'RIFF' &&
		new TextDecoder().decode(bytes.subarray(8, 12)) === 'WEBP'
	) {
		return 'image/webp';
	}

	if (bytes.length >= 12) {
		const brand = new TextDecoder().decode(bytes.subarray(8, 12)).toLowerCase();
		if (brand.startsWith('heic') || brand.startsWith('heif') || brand.startsWith('mif1')) {
			return 'image/heic';
		}
	}

	return null;
}

export function resolveReceiptMimeType(
	mimeType: string,
	fileName: string,
	bytes?: Uint8Array
): string | null {
	const fromMeta = inferReceiptMimeType(mimeType, fileName);
	if (fromMeta) {
		return fromMeta;
	}

	if (bytes) {
		return detectReceiptMimeFromBytes(bytes);
	}

	return null;
}

export function isReceiptPdf(mimeType: string): boolean {
	return mimeType === 'application/pdf';
}

export function isReceiptImage(mimeType: string): boolean {
	return (RECEIPT_IMAGE_MIME_TYPES as readonly string[]).includes(
		mimeType as (typeof RECEIPT_IMAGE_MIME_TYPES)[number]
	);
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const url = URL.createObjectURL(file);
		const img = new Image();

		img.onload = () => {
			URL.revokeObjectURL(url);
			resolve(img);
		};

		img.onerror = () => {
			URL.revokeObjectURL(url);
			reject(new ReceiptFileError('processing_failed'));
		};

		img.src = url;
	});
}

async function convertImageFileToJpeg(file: File): Promise<File> {
	const img = await loadImageFromFile(file);
	const canvas = document.createElement('canvas');
	canvas.width = img.naturalWidth;
	canvas.height = img.naturalHeight;

	const context = canvas.getContext('2d');
	if (!context) {
		throw new ReceiptFileError('processing_failed');
	}

	context.drawImage(img, 0, 0);

	const blob = await new Promise<Blob>((resolve, reject) => {
		canvas.toBlob(
			(result) => {
				if (!result) {
					reject(new ReceiptFileError('processing_failed'));
					return;
				}
				resolve(result);
			},
			'image/jpeg',
			0.92
		);
	});

	const baseName = file.name.replace(/\.[^.]+$/, '') || 'receipt';
	return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' });
}

/** Validates and normalizes a receipt file before upload (HEIC → JPEG when needed). */
export async function prepareReceiptFileForUpload(file: File): Promise<File> {
	if (file.size > RECEIPT_MAX_BYTES) {
		throw new ReceiptFileError('too_large');
	}

	let mime = resolveReceiptMimeType(file.type, file.name);
	if (!mime && file.size > 0) {
		const header = new Uint8Array(await file.slice(0, 16).arrayBuffer());
		mime = detectReceiptMimeFromBytes(header);
	}
	if (!mime) {
		throw new ReceiptFileError('unsupported');
	}

	if (mime === 'image/heic' || mime === 'image/heif') {
		return convertImageFileToJpeg(file);
	}

	if (!file.type || file.type !== mime) {
		return new File([file], file.name, { type: mime });
	}

	return file;
}
