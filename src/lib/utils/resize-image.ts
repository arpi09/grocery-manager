/** Max file size before client-side resize (5 MB). */
export const AVATAR_MAX_INPUT_BYTES = 5 * 1024 * 1024;

/** Target max JPEG size after resize (500 KB). */
export const AVATAR_MAX_OUTPUT_BYTES = 500 * 1024;

/** Longest edge in pixels after resize. */
export const AVATAR_MAX_DIMENSION = 1024;

export const AVATAR_JPEG_QUALITY = 0.85;

/** Base64 data URLs for a ~500 KB JPEG need headroom (~700 KB string). */
export const AVATAR_MAX_DATA_URL_LENGTH = 700_000;

export const AVATAR_ACCEPTED_MIME_TYPES = [
	'image/jpeg',
	'image/png',
	'image/webp',
	'image/heic',
	'image/heif'
] as const;

export type AvatarImageErrorCode = 'too_large' | 'invalid_type' | 'processing_failed';

export class AvatarImageError extends Error {
	readonly code: AvatarImageErrorCode;

	constructor(code: AvatarImageErrorCode) {
		super(code);
		this.name = 'AvatarImageError';
		this.code = code;
	}
}

export function isAcceptedAvatarMimeType(mimeType: string): boolean {
	const normalized = mimeType.trim().toLowerCase();
	return (AVATAR_ACCEPTED_MIME_TYPES as readonly string[]).includes(normalized);
}

export function computeTargetDimensions(
	width: number,
	height: number,
	maxDimension: number = AVATAR_MAX_DIMENSION
): { width: number; height: number } {
	if (width <= 0 || height <= 0) {
		return { width: 0, height: 0 };
	}

	const longest = Math.max(width, height);
	if (longest <= maxDimension) {
		return { width, height };
	}

	const scale = maxDimension / longest;
	return {
		width: Math.max(1, Math.round(width * scale)),
		height: Math.max(1, Math.round(height * scale))
	};
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
			reject(new AvatarImageError('processing_failed'));
		};

		img.src = url;
	});
}

function renderToJpegBlob(
	source: CanvasImageSource,
	width: number,
	height: number,
	quality: number
): Promise<Blob> {
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;

	const context = canvas.getContext('2d');
	if (!context) {
		return Promise.reject(new AvatarImageError('processing_failed'));
	}

	context.drawImage(source, 0, 0, width, height);

	return new Promise((resolve, reject) => {
		canvas.toBlob(
			(blob) => {
				if (!blob) {
					reject(new AvatarImageError('processing_failed'));
					return;
				}
				resolve(blob);
			},
			'image/jpeg',
			quality
		);
	});
}

function blobToDataUrl(blob: Blob): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			if (typeof reader.result === 'string') {
				resolve(reader.result);
				return;
			}
			reject(new AvatarImageError('processing_failed'));
		};
		reader.onerror = () => reject(new AvatarImageError('processing_failed'));
		reader.readAsDataURL(blob);
	});
}

/**
 * Resize and compress an image for avatar upload. Returns a JPEG data URL.
 * Large phone photos are shrunk silently when possible.
 */
export async function resizeImageForAvatar(file: File): Promise<string> {
	if (!isAcceptedAvatarMimeType(file.type)) {
		throw new AvatarImageError('invalid_type');
	}

	if (file.size > AVATAR_MAX_INPUT_BYTES) {
		throw new AvatarImageError('too_large');
	}

	const img = await loadImageFromFile(file);
	let { width, height } = computeTargetDimensions(img.naturalWidth, img.naturalHeight);

	let quality = AVATAR_JPEG_QUALITY;
	let blob = await renderToJpegBlob(img, width, height, quality);

	while (blob.size > AVATAR_MAX_OUTPUT_BYTES && quality > 0.5) {
		quality = Math.round((quality - 0.1) * 10) / 10;
		blob = await renderToJpegBlob(img, width, height, quality);
	}

	while (blob.size > AVATAR_MAX_OUTPUT_BYTES && Math.max(width, height) > 256) {
		width = Math.max(1, Math.round(width * 0.85));
		height = Math.max(1, Math.round(height * 0.85));
		blob = await renderToJpegBlob(img, width, height, quality);
	}

	if (blob.size > AVATAR_MAX_OUTPUT_BYTES) {
		throw new AvatarImageError('too_large');
	}

	const dataUrl = await blobToDataUrl(blob);
	if (dataUrl.length > AVATAR_MAX_DATA_URL_LENGTH) {
		throw new AvatarImageError('too_large');
	}

	return dataUrl;
}
