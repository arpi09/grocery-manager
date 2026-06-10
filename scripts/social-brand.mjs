/** Shared brand tokens for social asset generators (LinkedIn, Facebook). */

export const PRIMARY = '#3d6b4f';

export const COLORS = {
	bgStart: '#f7f5f0',
	bgEnd: '#e8f0ea',
	primary: PRIMARY,
	title: '#1a2e22',
	subtitle: '#4a5c52',
	white: '#ffffff'
};

export const FONT = 'DM Sans, system-ui, -apple-system, sans-serif';

/** @param {string} text */
export function escapeXml(text) {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}
