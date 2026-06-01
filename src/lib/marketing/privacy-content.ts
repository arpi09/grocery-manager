import type { MarketingLocale } from '$lib/marketing/content';

export interface PrivacySection {
	id: string;
	title: string;
	paragraphs: string[];
	bullets?: string[];
}

export interface PrivacyContent {
	title: string;
	lead: string;
	updatedLabel: string;
	updatedDate: string;
	faqLinkLabel: string;
	faqHref: string;
	sections: PrivacySection[];
}

const sv: PrivacyContent = {
	title: 'Integritet & AI',
	lead:
		'Här beskriver vi vilken data Skaffu samlar in, hur vi använder AI, och vilka rättigheter du har enligt GDPR. Vi skriver rakt på sak — inga onödiga juridiska omvägar.',
	updatedLabel: 'Senast uppdaterad',
	updatedDate: '30 maj 2026',
	faqLinkLabel: 'Vanliga frågor',
	faqHref: '/faq',
	sections: [
		{
			id: 'operator',
			title: 'Vem driver Skaffu?',
			paragraphs: [
				'Skaffu är en indie-produkt utvecklad och drivet av Arvid Pilhall (enskild utvecklare). Tjänsten riktar sig till hushåll som vill hålla koll på skafferiet.',
				'Frågor om integritet, AI eller dina uppgifter: hello@skaffu.com'
			]
		},
		{
			id: 'data',
			title: 'Vilken data samlar vi in?',
			paragraphs: ['Vi samlar bara det som behövs för att appen ska fungera:'],
			bullets: [
				'Konto: e-post, lösenord (hashat), visningsnamn, profilbild, tema och språkval.',
				'Hushåll: hushållsnamn, medlemskap, roller och inbjudningar.',
				'Lager: varor, platser (kyl/frys/skafferi), mängder, utgångsdatum och streckkoder.',
				'Skanning: streckkodsläsning, uppladdade kvitto (bild/PDF) och foton av hyllor eller varor.',
				'Inköp & planering: inköpslistor, måltidsplaner, recept och husdjursrelaterad data om du aktiverar det.',
				'Produktanvändning: anonymiserade händelser inom ditt hushåll (t.ex. genomförd scan eller kvittotolkning) för att förbättra tjänsten — ingen tredjeparts reklam-SDK.'
			]
		},
		{
			id: 'gdpr',
			title: 'Rättslig grund & dina rättigheter (GDPR)',
			paragraphs: [
				'Vi behandlar personuppgifter för att tillhandahålla tjänsten (avtal), för säker drift och felsökning (berättigat intresse), och i vissa fall utifrån ditt samtycke (t.ex. när du aktivt laddar upp kvitto eller foto för AI-tolkning).',
				'Du har rätt att få tillgång till, rätta och i vissa fall begränsa behandlingen av dina uppgifter. Kontakta oss på hello@skaffu.com om du vill utöva dina rättigheter.',
				'Hushållsägare kan ta bort hela hushållet och tillhörande data under Inställningar → Hushåll. Självbetjäning för att radera hela kontot kommer — tills dess, maila oss så hjälper vi dig radera kontot och kopplad data.',
				'Vi säljer inte dina personuppgifter och delar dem inte med annonsörer.'
			]
		},
		{
			id: 'ai',
			title: 'AI-policy',
			paragraphs: [
				'Vissa funktioner använder OpenAI:s API (modell gpt-4.1-mini) för att tolka kvitto, föreslå varor från foto, ge inköpsförslag, receptidéer och lagerinsikter.',
				'När du använder dessa funktioner skickas relevant innehåll till OpenAI — till exempel kvittotext, en sammanfattning av ditt lager eller en bild du laddat upp. Vi skickar inte ditt lösenord eller onödig kontodata.',
				'Enligt OpenAI:s villkor för API-kunder används inte API-data för att träna deras modeller som standard. OpenAI kan tillfälligt lagra data enligt sin egen policy; se openai.com/policies för detaljer.',
				'Vi sparar resultatet av AI-tolkning (t.ex. varor från kvitto) i din databas så att du kan granska och redigera. Råa AI-loggar sparas inte längre än nödvändigt för drift och felsökning.',
				'AI-förslag kan vara felaktiga — granska alltid innan du sparar varor eller handlar.'
			]
		},
		{
			id: 'cookies',
			title: 'Cookies & språk',
			paragraphs: [
				'Vi använder nödvändiga cookies för inloggning (session), valt språk och — när du är inloggad — tema. Inga cookies för reklamspårning.',
				'Vid första besök kan du välja i vår cookie-banner: godkänn alla (anonym besöksstatistik och A/B-test av landningssidan) eller endast nödvändiga.',
				'Språk på marknadsföringssidor följer ditt val eller webbläsarens språk där det stöds.'
			]
		},
		{
			id: 'third-parties',
			title: 'Tredjepartstjänster',
			paragraphs: ['Data kan behandlas av följande leverantörer när det behövs för tjänsten:'],
			bullets: [
				'Google Firebase / Google Cloud — hosting, databas (PostgreSQL) och drift.',
				'OpenAI — AI-tolkning och förslag (se AI-policy ovan).',
				'Resend — utskick av e-post (t.ex. hushållsinbjudan).',
				'Cloudflare Turnstile — bot-skydd vid registrering.',
				'Open Food Facts — valfri uppslagning av streckkodsprodukter (ingen konto-koppling hos dem).'
			]
		},
		{
			id: 'security',
			title: 'Säkerhet & lagring',
			paragraphs: [
				'Data lagras i molnet (EU-region där möjligt) kopplat till ditt konto och hushåll. Vi använder HTTPS, hashade lösenord och rollstyrning inom hushåll.',
				'Ingen metod är 100 % säker, men vi arbetar löpande med att minska risker i en liten kodbas.'
			]
		},
		{
			id: 'changes',
			title: 'Ändringar av policyn',
			paragraphs: [
				'Vi uppdaterar denna sida när funktioner eller leverantörer ändras. Vid väsentliga ändringar meddelar vi i appen eller via e-post där det är rimligt.',
				'Fortsatt användning efter uppdatering innebär att du accepterar den nya versionen.'
			]
		}
	]
};

const en: PrivacyContent = {
	title: 'Privacy & AI',
	lead:
		'How Skaffu collects and uses your data, how AI features work, and your rights under GDPR. Plain language — no unnecessary legalese.',
	updatedLabel: 'Last updated',
	updatedDate: '30 May 2026',
	faqLinkLabel: 'FAQ',
	faqHref: '/faq',
	sections: [
		{
			id: 'operator',
			title: 'Who operates Skaffu?',
			paragraphs: [
				'Skaffu is an indie product built and operated by Arvid Pilhall (solo developer). The service is for households managing pantry inventory.',
				'Privacy, AI or data questions: hello@skaffu.com'
			]
		},
		{
			id: 'data',
			title: 'What data do we collect?',
			paragraphs: ['We only collect what the app needs to work:'],
			bullets: [
				'Account: email, password (hashed), display name, avatar, theme and language.',
				'Household: name, membership, roles and invites.',
				'Inventory: items, locations (fridge/freezer/pantry), quantities, expiry dates and barcodes.',
				'Scanning: barcode reads, uploaded receipts (image/PDF) and shelf/product photos.',
				'Shopping & planning: lists, meal plans, recipes and optional pet data.',
				'Product usage: household-scoped events (e.g. scan or receipt parsed) to improve the product — no third-party ad SDKs.'
			]
		},
		{
			id: 'gdpr',
			title: 'Legal basis & your rights (GDPR)',
			paragraphs: [
				'We process personal data to provide the service (contract), for secure operation and debugging (legitimate interest), and sometimes with your consent (e.g. when you upload a receipt or photo for AI parsing).',
				'You may access, rectify or restrict processing where applicable. Contact hello@skaffu.com to exercise your rights.',
				'Household owners can delete the household and related data under Settings → Household. Self-service full account deletion is coming — until then, email us and we will help remove your account and data.',
				'We do not sell your personal data or share it with advertisers.'
			]
		},
		{
			id: 'ai',
			title: 'AI policy',
			paragraphs: [
				'Some features use the OpenAI API (gpt-4.1-mini) to parse receipts, suggest products from photos, shopping ideas, recipes and inventory insights.',
				'When you use these features, relevant content is sent to OpenAI — e.g. receipt text, a summary of your inventory, or an image you uploaded. We do not send your password or unnecessary account fields.',
				'Under OpenAI API terms, API data is not used to train their models by default. OpenAI may retain data temporarily per their policy; see openai.com/policies.',
				'We store AI results (e.g. parsed receipt lines) in your database so you can review and edit. Raw AI logs are not kept longer than needed for operations.',
				'AI suggestions can be wrong — always review before saving items or shopping.'
			]
		},
		{
			id: 'cookies',
			title: 'Cookies & locale',
			paragraphs: [
				'We use essential cookies for login (session), language and — when logged in — theme. No advertising tracking cookies.',
				'On your first visit you can choose in our cookie banner: accept all (anonymous visit analytics and landing-page A/B tests) or essential only.',
				'Marketing pages follow your language choice or browser locale where supported.'
			]
		},
		{
			id: 'third-parties',
			title: 'Third-party services',
			paragraphs: ['Data may be processed by these providers when needed:'],
			bullets: [
				'Google Firebase / Google Cloud — hosting, database (PostgreSQL) and operations.',
				'OpenAI — AI parsing and suggestions (see AI policy above).',
				'Resend — transactional email (e.g. household invites).',
				'Cloudflare Turnstile — bot protection on registration.',
				'Open Food Facts — optional barcode product lookup (no account link on their side).'
			]
		},
		{
			id: 'security',
			title: 'Security & storage',
			paragraphs: [
				'Data is stored in the cloud tied to your account and household. We use HTTPS, hashed passwords and household role controls.',
				'No method is 100% secure; we continuously reduce risk in a small codebase.'
			]
		},
		{
			id: 'changes',
			title: 'Policy updates',
			paragraphs: [
				'We update this page when features or providers change. For material changes we will notify in the app or by email where reasonable.',
				'Continued use after an update means you accept the new version.'
			]
		}
	]
};

const byLocale: Record<MarketingLocale, PrivacyContent> = { sv, en };

export function getPrivacyContent(locale: MarketingLocale = 'sv'): PrivacyContent {
	return byLocale[locale];
}
