import fs from 'node:fs';

const en = {
	hero: {
		defaultBody: "Here's what deserves your attention today.",
		cta: "See what's next",
		scanLink: 'Add items',
		morning: { title: 'Good morning 👋' },
		midday: { title: 'Good day 👋' },
		evening: { title: 'Good evening 👋' },
		night: { title: 'Welcome back 👋' },
		status: {
			healthy: 'Everything looks good today.',
			expiring: 'Something is worth using soon.',
			shopping: 'A few things are starting to run low.',
			empty: "Let's start building your pantry."
		}
	},
	forYou: {
		title: 'For you',
		replenishment: { body: 'You usually buy {name}.', cta: 'Add to shopping list' },
		expiring: { body: '{name} is worth using soon.', cta: 'View item' }
	},
	expiring: {
		title: 'Use soon',
		body: '{count, plural, one {# item worth using soon} other {# items worth using soon}}',
		link: 'View items'
	},
	shopping: {
		title: 'Shopping',
		body: '{count, plural, one {# item ready} other {# items ready}}',
		cadence: 'Next trip: {weekday}',
		link: 'Open shopping list'
	},
	pantry: {
		title: 'At home',
		body: '{count, plural, one {# item} other {# items}}',
		allGood: 'All good',
		needsAttention: 'Some items need attention',
		link: 'Open pantry'
	},
	household: {
		title: 'Household',
		body: 'Shared pantry and settings for your home.',
		link: 'Household settings'
	}
};

const sv = {
	hero: {
		defaultBody: 'Här är det som förtjänar din uppmärksamhet idag.',
		cta: 'Se vad som är näst',
		scanLink: 'Lägg till varor',
		morning: { title: 'God morgon 👋' },
		midday: { title: 'God dag 👋' },
		evening: { title: 'God kväll 👋' },
		night: { title: 'Välkommen tillbaka 👋' },
		status: {
			healthy: 'Allt ser bra ut idag.',
			expiring: 'Något är värt att använda snart.',
			shopping: 'En del börjar ta slut.',
			empty: 'Låt oss börja bygga ert skafferi.'
		}
	},
	forYou: {
		title: 'För dig',
		replenishment: { body: 'Du brukar köpa {name}.', cta: 'Lägg på inköpslistan' },
		expiring: { body: '{name} är värt att använda snart.', cta: 'Visa vara' }
	},
	expiring: {
		title: 'Använd snart',
		body: '{count, plural, one {# vara värd att använda snart} other {# varor värda att använda snart}}',
		link: 'Visa varor'
	},
	shopping: {
		title: 'Inköp',
		body: '{count, plural, one {# vara redo} other {# varor redo}}',
		cadence: 'Nästa tur: {weekday}',
		link: 'Öppna inköpslistan'
	},
	pantry: {
		title: 'Hemma',
		body: '{count, plural, one {# vara} other {# varor}}',
		allGood: 'Allt bra',
		needsAttention: 'En del varor behöver uppmärksamhet',
		link: 'Öppna skafferi'
	},
	household: {
		title: 'Hushåll',
		body: 'Delat skafferi och inställningar för ert hem.',
		link: 'Hushållsinställningar'
	}
};

for (const [loc, v5] of [
	['en', en],
	['sv', sv]
]) {
	const path = `src/lib/i18n/locales/${loc}.json`;
	const json = JSON.parse(fs.readFileSync(path, 'utf8'));
	json.home.v5 = v5;
	fs.writeFileSync(path, `${JSON.stringify(json, null, '\t')}\n`);
}
