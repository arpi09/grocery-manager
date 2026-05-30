/** Square crop output size before JPEG compression. */
export const AVATAR_CROP_OUTPUT_SIZE = 512;

/** Preview viewport size in CSS pixels. */
export const AVATAR_CROP_VIEWPORT_SIZE = 280;

export const AVATAR_CROP_MIN_ZOOM = 1;
export const AVATAR_CROP_MAX_ZOOM = 3;

export interface AvatarCropParams {
	offsetX: number;
	offsetY: number;
	zoom: number;
}

export function defaultAvatarCropParams(): AvatarCropParams {
	return { offsetX: 0, offsetY: 0, zoom: 1 };
}

export function clampAvatarCropParams(
	imageWidth: number,
	imageHeight: number,
	cropSize: number,
	params: AvatarCropParams
): AvatarCropParams {
	const zoom = Math.min(AVATAR_CROP_MAX_ZOOM, Math.max(AVATAR_CROP_MIN_ZOOM, params.zoom));
	const baseScale = Math.max(cropSize / imageWidth, cropSize / imageHeight) * zoom;
	const displayWidth = imageWidth * baseScale;
	const displayHeight = imageHeight * baseScale;
	const maxOffsetX = Math.max(0, (displayWidth - cropSize) / 2);
	const maxOffsetY = Math.max(0, (displayHeight - cropSize) / 2);

	return {
		zoom,
		offsetX: Math.min(maxOffsetX, Math.max(-maxOffsetX, params.offsetX)),
		offsetY: Math.min(maxOffsetY, Math.max(-maxOffsetY, params.offsetY))
	};
}

export function drawAvatarCrop(
	ctx: CanvasRenderingContext2D,
	image: CanvasImageSource & { width?: number; height?: number },
	imageWidth: number,
	imageHeight: number,
	params: AvatarCropParams,
	cropSize: number
): void {
	const clamped = clampAvatarCropParams(imageWidth, imageHeight, cropSize, params);
	const baseScale = Math.max(cropSize / imageWidth, cropSize / imageHeight) * clamped.zoom;
	const displayWidth = imageWidth * baseScale;
	const displayHeight = imageHeight * baseScale;
	const x = cropSize / 2 - displayWidth / 2 + clamped.offsetX;
	const y = cropSize / 2 - displayHeight / 2 + clamped.offsetY;

	ctx.clearRect(0, 0, cropSize, cropSize);
	ctx.drawImage(image, x, y, displayWidth, displayHeight);
}

export function cropAvatarToCanvas(
	image: HTMLImageElement,
	params: AvatarCropParams,
	outputSize: number = AVATAR_CROP_OUTPUT_SIZE
): HTMLCanvasElement {
	const canvas = document.createElement('canvas');
	canvas.width = outputSize;
	canvas.height = outputSize;

	const ctx = canvas.getContext('2d');
	if (!ctx) {
		throw new Error('Canvas not supported');
	}

	drawAvatarCrop(
		ctx,
		image,
		image.naturalWidth,
		image.naturalHeight,
		params,
		outputSize
	);

	return canvas;
}

export function cropAvatarToBlob(
	image: HTMLImageElement,
	params: AvatarCropParams,
	outputSize: number = AVATAR_CROP_OUTPUT_SIZE,
	quality = 0.92
): Promise<Blob> {
	const canvas = cropAvatarToCanvas(image, params, outputSize);

	return new Promise((resolve, reject) => {
		canvas.toBlob(
			(blob) => {
				if (!blob) {
					reject(new Error('Failed to crop image'));
					return;
				}
				resolve(blob);
			},
			'image/jpeg',
			quality
		);
	});
}

export function loadImageElement(src: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => resolve(img);
		img.onerror = () => reject(new Error('Failed to load image'));
		img.src = src;
	});
}
