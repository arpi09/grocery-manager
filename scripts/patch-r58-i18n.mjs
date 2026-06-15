import fs from 'node:fs';

const svPath = 'src/lib/i18n/locales/sv.json';
const enPath = 'src/lib/i18n/locales/en.json';

const sv = JSON.parse(fs.readFileSync(svPath, 'utf8'));
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

// R58 recovery copy
sv.inventory.subtitle = 'Vad ni har hemma — uppdaterat efter veckohandeln.';
sv.inventory.bulkExpiryBanner = 'Några varor saknar datum — vi kan gissa utifrån varutyp.';
sv.inventory.bulkExpiryAction = 'Gissa datum';
sv.consume.swipeFinish = 'Klart';
sv.consume.swipePartial = 'Delvis';

en.inventory.subtitle = en.inventory.subtitle?.includes('updated')
	? en.inventory.subtitle
	: 'What you have at home — updated after weekly shopping.';
en.inventory.bulkExpiryBanner = 'Some items lack dates — we can guess from product type.';
en.inventory.bulkExpiryAction = 'Guess dates';
en.consume.swipeFinish = 'Done';
en.consume.swipePartial = 'Partial';

// Sprint keys
sv.home.hero = {
	listaTitle: '{count, plural, one {# sak att handla} other {# saker att handla}}',
	listaCta: 'Öppna inköpslistan',
	coldReceipt: 'Skanna kvitto',
	coldPhoto: 'Fota kyl/skafferi',
	expiryTitle: 'Något går ut snart',
	expiryCta: 'Se vad som går ut'
};
sv.home.memory = { ariaLabel: 'Hushållsminne', replenishmentHint: 'Ni brukar handla {name}' };
sv.home.expiring = {
	ariaLabel: 'Går ut snart',
	daysLeft: '{days, plural, one {# dag kvar} other {# dagar kvar}}',
	moreLink: 'Visa alla'
};

en.home.hero = {
	listaTitle: '{count, plural, one {# item to shop} other {# items to shop}}',
	listaCta: 'Open shopping list',
	coldReceipt: 'Scan receipt',
	coldPhoto: 'Photo fridge/pantry',
	expiryTitle: 'Something expires soon',
	expiryCta: 'See expiring items'
};
en.home.memory = { ariaLabel: 'Household memory', replenishmentHint: 'You usually buy {name}' };
en.home.expiring = {
	ariaLabel: 'Expiring soon',
	daysLeft: '{days, plural, one {# day left} other {# days left}}',
	moreLink: 'View all'
};

sv.inventory.addSheet = {
	title: 'Lägg till',
	receipt: 'Kvitto — hel handling',
	photo: 'Fota kyl/skafferi',
	barcode: 'Streckkod — en vara',
	manual: 'Manuellt'
};
sv.inventory.filterSheet = {
	title: 'Filter och sortering',
	apply: 'Klar',
	sections: 'Visa sektioner'
};
en.inventory.addSheet = {
	title: 'Add',
	receipt: 'Receipt — full shop',
	photo: 'Photo fridge/pantry',
	barcode: 'Barcode — one item',
	manual: 'Manual'
};
en.inventory.filterSheet = {
	title: 'Filter and sort',
	apply: 'Done',
	sections: 'Show sections'
};

sv.scan.choiceHub = {
	title: 'Vad vill du lägga till?',
	receipt: 'Kvitto — hel handling',
	photo: 'Fota kyl/skafferi — flera varor',
	barcode: 'Streckkod — en vara',
	manualLink: 'Manuellt'
};
en.scan.choiceHub = {
	title: 'What do you want to add?',
	receipt: 'Receipt — full shop',
	photo: 'Photo fridge/pantry — multiple items',
	barcode: 'Barcode — one item',
	manualLink: 'Manual'
};

sv.onboarding.beatWhatTitle = 'Det här är er gemensamma inköpslista';
sv.onboarding.beatLoopTitle = 'Checka av när ni handlar';
sv.onboarding.beatHowTitle = 'Kvitton bygger minnet';
sv.onboarding.beatLoopBody =
	'Bocka av rader när ni handlar — listan håller sig uppdaterad för hela hushållet.';
sv.onboarding.beatHowBody =
	'Kvitton och avbockade rader bygger hushållets minne — bättre förslag nästa vecka.';
sv.onboarding.welcomeBodyShoppingList =
	'Det här är er gemensamma inköpslista. Lägg till det ni brukar handla — bjud in partner när du vill.';

en.onboarding.beatWhatTitle = 'This is your shared shopping list';
en.onboarding.beatLoopTitle = 'Check off as you shop';
en.onboarding.beatHowTitle = 'Receipts build memory';
en.onboarding.beatLoopBody =
	'Check off rows as you shop — the list stays updated for the whole household.';
en.onboarding.beatHowBody =
	'Receipts and checkoffs build household memory — better suggestions next week.';
en.onboarding.welcomeBodyShoppingList =
	'This is your shared shopping list. Add what you usually buy — invite your partner when ready.';

fs.writeFileSync(svPath, JSON.stringify(sv, null, '\t') + '\n');
fs.writeFileSync(enPath, JSON.stringify(en, null, '\t') + '\n');
console.log('R58 i18n patched');
