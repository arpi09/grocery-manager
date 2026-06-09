import {
	computeTargetDimensions,
	isAcceptedAvatarMimeType,
	loadImageFromFile,
	renderToJpegBlob
} from '$lib/utils/resize-image';

/** Allow large phone photos; client-side prep shrinks before upload. */
export const PHOTO_ROUND_PREP_MAX_INPUT_BYTES = 15 * 1024 * 1024;

/** Target max JPEG size per photo after resize (keeps 3-photo uploads well under server limit). */
export const PHOTO_ROUND_PREP_MAX_OUTPUT_BYTES = 2 * 1024 * 1024;

/** Longest edge in pixels — enough for label/expiry text without huge uploads. */
export const PHOTO_ROUND_PREP_MAX_DIMENSION = 1920;

export const PHOTO_ROUND_PREP_JPEG_QUALITY = 0.88;

export type PhotoRoundImageErrorCode = 'too_large' | 'invalid_type' | 'processing_failed';

export class PhotoRoundImageError extends Error {
	readonly code: PhotoRoundImageErrorCode;

	constructor(code: PhotoRoundImageErrorCode) {
		super(code);
		this.name = 'PhotoRoundImageError';
		this.code = code;
	}
}

function blobToFile(blob: Blob, originalName: string): File {
	const baseName = originalName.replace(/\.[^.]+$/, '') || 'photo';
	return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg', lastModified: Date.now() });
}

/**
 * Resize and compress a photo for photo-round upload. Returns a JPEG File.
 * Skips re-encoding when the source is already small enough.
 */
export async function resizeImageForPhotoRound(file: File): Promise<File> {
	if (!isAcceptedAvatarMimeType(file.type)) {
		throw new PhotoRoundImageError('invalid_type');
	}

	if (file.size > PHOTO_ROUND_PREP_MAX_INPUT_BYTES) {
		throw new PhotoRoundImageError('too_large');
	}

	const img = await loadImageFromFile(file);
	let { width, height } = computeTargetDimensions(
		img.naturalWidth,
		img.naturalHeight,
		PHOTO_ROUND_PREP_MAX_DIMENSION
	);

	const needsResize =
		width !== img.naturalWidth ||
		height !== img.naturalHeight ||
		file.type !== 'image/jpeg' ||
		file.size > PHOTO_ROUND_PREP_MAX_OUTPUT_BYTES;

	if (!needsResize) {
		return file;
	}

	let quality = PHOTO_ROUND_PREP_JPEG_QUALITY;
	let blob = await renderToJpegBlob(img, width, height, quality);

	while (blob.size > PHOTO_ROUND_PREP_MAX_OUTPUT_BYTES && quality > 0.55) {
		quality = Math.round((quality - 0.08) * 100) / 100;
		blob = await renderToJpegBlob(img, width, height, quality);
	}

	while (blob.size > PHOTO_ROUND_PREP_MAX_OUTPUT_BYTES && Math.max(width, height) > 960) {
		width = Math.max(1, Math.round(width * 0.88));
		height = Math.max(1, Math.round(height * 0.88));
		blob = await renderToJpegBlob(img, width, height, quality);
	}

	if (blob.size > PHOTO_ROUND_PREP_MAX_OUTPUT_BYTES) {
		throw new PhotoRoundImageError('too_large');
	}

	return blobToFile(blob, file.name);
}
