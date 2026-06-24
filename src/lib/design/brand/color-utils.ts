/** Hex/RGB helpers for canvas exports and generated shadows. */

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
	const h = hex.replace('#', '');
	return {
		r: parseInt(h.slice(0, 2), 16),
		g: parseInt(h.slice(2, 4), 16),
		b: parseInt(h.slice(4, 6), 16)
	};
}

export function rgbaFromHex(hex: string, alpha: number): string {
	const { r, g, b } = hexToRgb(hex);
	return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
