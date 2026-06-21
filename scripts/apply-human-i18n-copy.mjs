/**
 * Human i18n copy pass — warm, encouraging tone; ni in household UI.
 * Run: node scripts/apply-human-i18n-copy.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const HOUSEHOLD_PREFIXES = [
	'home.',
	'shopping.',
	'household.',
	'householdBriefing.',
	'householdInvite.',
	'inventory.',
	'pantry.',
	'planer.',
	'recipe.',
	'eatFirst.',
	'weeklyRitual.',
	'replenishment.',
	'memory.',
	'scan.',
	'scanFlow.',
	'receipt.',
	'receiptImport.',
	'receiptBulk.',
	'receiptAutomation.',
	'receiptAutopilot.',
	'shoppingListShare.',
	'expiringShare.',
	'nav.',
	'gamification.',
	'stats.',
	'wrapped.',
	'pageHints.',
	'pwa.',
	'pushNotifications.',
	'proUpgrade.',
	'nearbySharing.',
	'publicCityFeed.',
	'storeRecommendation.',
	'wastePrevention.',
	'pantryHealth.',
	'coreActionBar.',
	'merge.',
	'starter.',
	'photoRound.',
	'photoScan.',
	'consume.',
	'learning.',
	'expiring.',
	'expiry.',
	'skafferapport.',
	'rapport.',
	'item.',
	'location.',
	'demo.',
	'news.',
	'invite.',
	'email.',
	'calendar.',
	'staleness.',
	'priceMemory.',
	'pets.',
	'profile.',
	'favorites.',
	'actionToast.',
	'delete.',
	'errors.',
	'common.',
	'a11y.',
	'cookieConsent.',
	'captcha.',
	'ai.',
	'dashboard.',
	'dataGrid.',
	'pmf.',
	'pmfSurvey.',
	'feedback.',
	'onboarding.',
	'auth.',
	'settings.'
];

const PERSONAL_ONLY_PREFIXES = ['settings.', 'auth.', 'profile.', 'feedback.', 'delete.', 'pmfSurvey.'];

const ADMIN_PREFIX = 'admin.';

function isHouseholdPath(path) {
	return HOUSEHOLD_PREFIXES.some((p) => path.startsWith(p)) && !PERSONAL_ONLY_PREFIXES.some((p) => path.startsWith(p));
}

function walk(obj, fn, path = '') {
	if (typeof obj === 'string') {
		return fn(path, obj);
	}
	const out = Array.isArray(obj) ? [] : {};
	for (const [key, value] of Object.entries(obj)) {
		const childPath = path ? `${path}.${key}` : key;
		out[key] = walk(value, fn, childPath);
	}
	return out;
}

function preserveParams(original, next) {
	const origParams = [...original.matchAll(/\{[^}]+\}/g)].map((m) => m[0]).sort().join('|');
	const nextParams = [...next.matchAll(/\{[^}]+\}/g)].map((m) => m[0]).sort().join('|');
	return origParams === nextParams;
}

function applySvRules(path, value) {
	if (path.startsWith(ADMIN_PREFIX)) {
		return value
			.replace(/Låt oss /g, '')
			.replace(/naturligt steg/gi, 'nästa steg');
	}

	let v = value;

	// Remove emojis outside home welcome greetings
	if (!/^home\.(greeting(Morning|Day|Evening|Night)|dashboard\.greeting(Morning|Day|Evening|Night)Only)/.test(path)) {
		v = v.replace(/[\u{1F300}-\u{1FAFF}\u2600-\u27BF]/gu, '').replace(/\s{2,}/g, ' ').trim();
	}

	// AI slop → human
	v = v
		.replace(/Låt oss börja bygga ert skafferi\.?/gi, 'Tomt skafferi — börja med kvitto eller fotorunda.')
		.replace(/Låt oss /gi, '')
		.replace(/perfekt till/gi, 'bra till')
		.replace(/Perfekt till/gi, 'Bra till')
		.replace(/naturliga steg/gi, 'nästa steg')
		.replace(/naturligt steg/gi, 'nästa steg')
		.replace(/redo att handlas på/gi, 'ni brukar handla')
		.replace(/Här är det som förtjänar din uppmärksamhet idag\./g, 'Det här kan vara värt en koll idag.')
		.replace(/Se vad som är näst/g, 'Se vad som väntar')
		.replace(/Bra jobbat —/g, 'Snyggt —')
		.replace(/Hurra —/g, 'Bra —');

	if (isHouseholdPath(path)) {
		v = v
			.replace(/\bDu brukar\b/g, 'Ni brukar')
			.replace(/\bdu brukar\b/g, 'ni brukar')
			.replace(/\bDu har\b/g, 'Ni har')
			.replace(/\bdu har\b/g, 'ni har')
			.replace(/\bDitt skafferi\b/g, 'Ert skafferi')
			.replace(/\bditt skafferi\b/g, 'ert skafferi')
			.replace(/\bDin inköpslista\b/g, 'Er inköpslista')
			.replace(/\bdin inköpslista\b/g, 'er inköpslistan')
			.replace(/\bDig\b/g, 'Er')
			.replace(/\bdig\b/g, 'er');
	}

	// Namespace-specific polish
	if (path.startsWith('shopping.')) {
		v = v
			.replace(/Gemensam inköpslista med smarta förslag/g, 'Er gemensamma inköpslista')
			.replace(/AI föreslår/g, 'Skaffu föreslår')
			.replace(/Tom lista — lägg till det som saknas/g, 'Tom lista — lägg till det ni saknar');
	}

	if (path.startsWith('onboarding.')) {
		v = v
			.replace(/\bdu vill\b/gi, 'ni vill')
			.replace(/\bdu behöver\b/gi, 'ni behöver')
			.replace(/\bNu är du redo!/g, 'Nu är ni redo!')
			.replace(/\bBra start!/g, 'Bra start!')
			.replace(/Skaffu hjälper dig hålla koll/g, 'Skaffu hjälper er hålla koll');
	}

	if (path.startsWith('planer.')) {
		v = v.replace(/\bdu har\b/gi, 'ni har');
	}

	if (path.startsWith('recipe.')) {
		v = v.replace(/\bDu har\b/g, 'Ni har').replace(/\bdu har\b/g, 'ni har');
	}

	if (path.startsWith('household.')) {
		v = v.replace(/\bdu\b/gi, (m) => (m === 'Du' ? 'Ni' : 'ni'));
	}

	if (path.startsWith('settings.') || path.startsWith('auth.')) {
		// Keep personal du — undo household transforms inside personal namespaces
		return value
			.replace(/Låt oss /gi, '')
			.replace(/naturligt steg/gi, 'nästa steg');
	}

	if (path.startsWith('gamification.') || path.startsWith('stats.') || path.startsWith('wrapped.')) {
		v = v.replace(/\bdu\b/gi, (m) => (m === 'Du' ? 'Ni' : 'ni'));
	}

	if (path.startsWith('errors.')) {
		v = v.replace(/\bFörsök igen senare\b/g, 'Prova igen om en stund');
	}

	if (path.startsWith('nav.')) {
		v = v.replace(/\bÄta\b/g, 'Äta');
	}

	return v.trim() || value;
}

function applyEnRules(path, value) {
	if (path.startsWith(ADMIN_PREFIX)) {
		return value.replace(/Let's /g, '').replace(/natural next step/gi, 'next step');
	}

	let v = value;

	if (!/^home\.(greeting(Morning|Day|Evening|Night)|dashboard\.greeting(Morning|Day|Evening|Night)Only)/.test(path)) {
		v = v.replace(/[\u{1F300}-\u{1FAFF}\u2600-\u27BF]/gu, '').replace(/\s{2,}/g, ' ').trim();
	}

	v = v
		.replace(/Let's start building your pantry\.?/gi, 'Empty pantry — start with a receipt scan or photo round.')
		.replace(/Let's /gi, '')
		.replace(/Perfect for /gi, 'You usually shop on ')
		.replace(/perfect for /gi, 'you usually shop on ')
		.replace(/natural next step/gi, 'next step')
		.replace(/ready to shop on /gi, 'you usually shop on ')
		.replace(/Here's what deserves your attention today\./g, 'Worth a look today.')
		.replace(/See what's next/g, 'See what\'s waiting')
		.replace(/Great job —/g, 'Nice —');

	if (path.startsWith('shopping.')) {
		v = v
			.replace(/Shared shopping list with smart suggestions/g, 'Your shared shopping list')
			.replace(/AI suggests/g, 'Skaffu suggests')
			.replace(/Empty list — add what's missing/g, 'Empty list — add what you\'re missing');
	}

	if (path.startsWith('onboarding.')) {
		v = v.replace(/Skaffu helps you keep track/g, 'Skaffu helps you keep track');
	}

	if (path.startsWith('settings.') || path.startsWith('auth.')) {
		return value.replace(/Let's /gi, '').replace(/natural next step/gi, 'next step');
	}

	return v.trim() || value;
}

function polishTree(tree, locale) {
	const fn = locale === 'sv' ? applySvRules : applyEnRules;
	return walk(tree, (path, value) => {
		const next = fn(path, value);
		if (!preserveParams(value, next)) {
			console.warn(`[${locale}] param mismatch at ${path}, keeping original`);
			return value;
		}
		return next;
	});
}

for (const locale of ['sv', 'en']) {
	const file = join(root, `src/lib/i18n/locales/${locale}.json`);
	const raw = readFileSync(file, 'utf8');
	const tree = JSON.parse(raw);
	const polished = polishTree(tree, locale);
	writeFileSync(file, `${JSON.stringify(polished, null, '\t')}\n`, 'utf8');
	console.log(`Polished ${locale}.json`);
}
