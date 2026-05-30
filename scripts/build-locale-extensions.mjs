/**
 * One-off helper: merge extension keys into sv.json / en.json.
 * Run: node scripts/build-locale-extensions.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const svPath = join(root, 'src/lib/i18n/locales/sv.json');
const enPath = join(root, 'src/lib/i18n/locales/en.json');

const extensions = {
	sv: {
		common: {
			delete: 'Ta bort',
			confirm: 'Bekräfta',
			undo: 'Ångra',
			copy: 'Kopiera',
			copied: 'Kopierad!',
			send: 'Skicka',
			next: 'Nästa',
			previous: 'Tillbaka',
			skip: 'Hoppa över',
			getStarted: 'Kom igång',
			loading: 'Laddar…',
			thinking: 'Tänker…',
			lookup: 'Slår upp…',
			searching: 'Söker…',
			optional: 'valfritt',
			name: 'Namn',
			quantity: 'Mängd',
			unit: 'Enhet',
			notes: 'Anteckningar',
			place: 'Plats',
			email: 'E-post',
			role: 'Roll',
			species: 'Art',
			confirmation: 'Bekräftelse',
			confirmDelete: 'Bekräfta borttagning',
			typeDeleteConfirm: 'TA BORT',
			unknownItem: 'den här posten',
			unknownProduct: 'vara'
		},
		inventory: {
			title: 'Ditt skafferi',
			emptyTitle: 'Tomt i {location}',
			noResults: 'Inga träffar',
			tryOtherSearch: 'Prova ett annat sökord.',
			emptyCanWrite: 'Skanna en vara eller lägg till manuellt i {location}.',
			emptyReadonly: 'Det finns inga varor i {location} ännu.',
			scan: 'Skanna',
			addManual: 'Lägg till manuellt',
			backHome: 'Tillbaka till hem',
			readonly: 'Du har endast läsbehörighet i detta hushåll.',
			rowSingular: 'rad i skafferiet',
			rowPlural: 'rader i skafferiet'
		},
		item: {
			addTitle: 'Lägg till vara',
			editTitle: 'Redigera vara',
			addSubmit: 'Lägg till vara',
			saveChanges: 'Spara ändringar',
			deleteItem: 'Ta bort vara',
			deleteItemNamed: 'Ta bort {name}',
			howToFill: 'Hur vill du fylla i varan?',
			scanModeAria: 'Skanningsläge',
			barcodeTab: 'Streckkod',
			photoTab: 'Foto',
			bestBefore: 'Bäst före (valfritt)',
			notesOptional: 'Anteckningar (valfritt)',
			unitPlaceholder: 'st, g, L…',
			invalidBarcode: 'Ogiltig streckkod. Ange minst 8 siffror.',
			lookupFailed: 'Kunde inte slå upp streckkoden. Försök igen eller fyll i manuellt.',
			lookupNetwork: 'Nätverksfel vid uppslagning av produkten.',
			foundProduct: 'Hittade {name} ({barcode}).',
			unknownBarcodeFilled: 'Okänd streckkod – fyllde i "{name}". Justera vid behov.',
			unknownProductName: 'Okänd vara ({barcode})'
		},
		shopping: {
			title: 'Inköp',
			subtitle: 'Gemensam inköpslista och AI-hjälp',
			listTab: 'Inköpslista',
			assistantTab: 'Assistent',
			listAria: 'Inköpslista',
			quantityPlaceholder: 'Antal',
			unitPlaceholder: 'Enhet',
			clearChecked: 'Rensa alla avbockade rader',
			removeLine: 'Ta bort {line}',
			assistantIntro:
				'AI analyserar ditt skafferi, utgångsdatum och måltidsplan — och föreslår en inköpslista anpassad för ICA.',
			assistantAria: 'Inköpsassistent',
			insightsTab: 'Inventarietips',
			icaTab: 'ICA inköpslista',
			focusOptional: 'Fokus (valfritt)',
			focusPlaceholder: 'T.ex. vad ska jag laga i helgen? Vad bör jag använda först?',
			preferences: 'Preferenser (valfritt)',
			householdSize: 'Hushållsstorlek',
			generateInsights: 'Generera tips',
			generateIca: 'Skapa ICA-lista',
			copyList: 'Kopiera lista',
			openIca: 'Öppna på ICA',
			insightsError: 'Kunde inte hämta inventarietips.',
			insightsNetwork: 'Nätverksfel vid hämtning av tips.',
			icaError: 'Kunde inte skapa ICA-lista.',
			icaNetwork: 'Nätverksfel vid skapande av inköpslista.',
			insightExpiring: 'Utgår snart',
			insightRunningLow: 'Håller på att ta slut',
			insightUseSoon: 'Använd snart',
			insightRestock: 'Fyll på',
			insightMealPlan: 'Måltidsplan',
			insightTip: 'Tips'
		},
		planer: {
			title: 'Planer',
			subtitle: 'Planera måltider i kalendern och lägg in ChatGPT-idéer',
			ideasAria: 'Receptidéer',
			ideasIntro: 'Genererade idéer från ditt lager. Välj datum och lägg till i kalendern.',
			ideasEmpty: 'Inga genererade idéer ännu. Använd knappen Receptidéer först.',
			usesLabel: 'Använd:',
			addToCalendar: 'Lägg till i kalender',
			calendarAria: 'Månadskalender',
			prevMonth: 'Föregående månad',
			nextMonth: 'Nästa månad',
			gridAria: 'Kalendergrid, svep vänster eller höger för att byta månad',
			otherMonth: '(annan månad)',
			mealsCount: '{count} måltider',
			openDay: 'Öppna {date}',
			addMeal: 'Lägg till måltid',
			mealsTitle: 'Måltider',
			mealsTitleDate: 'Måltider {date}',
			plannedCount: '{count} planerade måltider',
			mealTitle: 'Måltidstitel',
			removeMeal: 'Ta bort måltid {title}',
			recipeIdeasAria: 'Öppna receptidéer – generera måltidsförslag från ditt lager'
		},
		stats: {
			title: 'Så här ser skafferiet ut',
			subtitle: 'Snabb överblick — typ haha, men faktiskt användbart'
		},
		profile: {
			title: 'Profil',
			subtitle: 'Redigera ditt konto',
			updated: 'Snyggt — profilen är uppdaterad!',
			themeSaved: 'Tema sparat — ser bra ut!',
			saveProfile: 'Spara profil',
			avatarInvalid: 'Välj en bildfil (PNG, JPEG, GIF eller WebP).',
			avatarTooLarge: 'Bilden får vara högst 100 KB.',
			themeTitle: 'Tema',
			themeLight: 'Ljust',
			themeDark: 'Mörkt',
			themeSystem: 'System'
		},
		settings: {
			account: {
				title: 'Konto',
				description: 'Ditt inloggade konto och profil',
				loggedInEmail: 'Inloggad e-post',
				editProfile: 'Redigera profil',
				editProfileNote: 'Namn, bild och tema'
			},
			household: {
				title: 'Hushåll',
				description: 'Delat hushåll, medlemmar och inbjudningar'
			},
			app: {
				title: 'App',
				description: 'Funktioner och preferenser'
			},
			pets: {
				title: 'Husdjur',
				note: 'Aktivera för att visa Husdjur i menyn och hantera dina husdjur.',
				enable: 'Slå på',
				disable: 'Stäng av',
				add: '+ Lägg till husdjur',
				heading: 'Dina husdjur',
				empty: 'Inga husdjur tillagda ännu.',
				remove: 'Ta bort',
				removeNamed: 'Ta bort husdjur {name}',
				modalTitle: 'Lägg till husdjur',
				speciesOptional: 'Art (valfritt)',
				speciesPlaceholder: 't.ex. Hund, Katt',
				namePlaceholder: 't.ex. Luna'
			},
			onboarding: {
				title: 'Visa introduktion igen',
				note: 'Gå igenom välkomstguiden för appen.',
				start: 'Starta guide'
			}
		},
		household: {
			members: 'Medlemmar',
			invite: 'Bjud in',
			inviteNote: 'Skicka en inbjudan via e-post. Du kan också kopiera länken manuellt nedan.',
			inviteSent: 'Inbjudan skickad — kolla inkorgen!',
			sendInvite: 'Skicka inbjudan',
			sendingInvite: 'Skickar inbjudan…',
			inviteLink: 'Inbjudningslänk',
			pendingInvites: 'Väntande inbjudningar',
			revoke: 'Återkalla',
			revokeNamed: 'Återkalla inbjudan till {email}',
			roleFor: 'Roll för {email}',
			roleOwner: 'Ägare',
			roleEditor: 'Redigera',
			roleViewer: 'Visa',
			yourRole: 'Din roll: {role}.',
			ownerOnly: 'Endast ägare kan bjuda in och hantera medlemmar.',
			dangerZone: 'Farozon',
			deleteWarning:
				'Ta bort hushållet permanent. All inventering, inköpslista och förbrukningshistorik för detta hushåll raderas. Väntande inbjudningar tas bort.',
			otherMembersLoseAccess: '{count} {count, plural, one {annan medlem} other {andra medlemmar}} förlorar åtkomst omedelbart.',
			deleteHousehold: 'Ta bort hushåll',
			deletingHousehold: 'Tar bort hushållet…',
			removeMember: 'Ta bort medlem {email}',
			defaultName: 'Mitt hushåll',
			roleOwnerLabel: 'Ägare'
		},
		pets: {
			title: 'Husdjur',
			subtitle: 'Dina husdjur hemma',
			addFood: 'Add pet food',
			lookupFailed: 'Kunde inte slå upp streckkoden just nu.',
			lookupNetwork: 'Nätverksfel vid uppslagning av streckkod.',
			unknownBarcode: 'Okänd streckkod – fyllde i "{name}".'
		},
		admin: {
			title: 'Admin',
			subtitle: 'Hantera användare och översikt',
			users: 'Användare',
			enablePets: 'Aktivera husdjur',
			disablePets: 'Stäng av husdjur',
			on: 'På',
			dbEngine: 'Aktiv databasmotor',
			logoutConfirmRequired: 'Skriv bekräftelse för att logga ut alla.',
			invalidUser: 'Ogiltig användare.',
			loggedOut: 'Du har loggats ut.',
			loggedOutAll: 'Alla användare har loggats ut ({count} sessioner).'
		},
		invite: {
			title: 'Hushållsinbjudan'
		},
		starter: {
			title: 'Snabbstart',
			subtitle: 'Markera det du har hemma'
		},
		photoScan: {
			title: 'Fota produkt',
			subtitle: 'AI läser etiketten och fyller i uppgifter',
			pickFile: '📁 Välj bild från filer',
			reading: 'Läser produkten…',
			readFailed: 'Kunde inte läsa produkten från bilden. Försök med en tydligare bild.',
			networkError: 'Nätverksfel vid analys av bilden.',
			confidenceHigh: 'hög',
			confidenceLow: 'låg',
			filledFromPhoto:
				'Fyllde i uppgifter från fotot (säkerhet: {confidence}). Kontrollera innan du sparar.'
		},
		receipt: {
			pickFile: '📁 Välj från filer',
			pickSourceAria: 'Välj kvitto eller bildkälla',
			reading: 'Läser kvitto…',
			readingStatus: 'Läser kvittot… det tar oftast några sekunder.',
			parseFailed: 'Hoppsan — kunde inte läsa kvittot. Prova en tydligare bild.',
			networkError: 'Hoppsan — nätverksfel. Kontrollera anslutningen och försök igen.',
			needImage: 'Just nu behövs en bildfil — spara kvittot som bild eller ta en skärmdump om du har PDF.',
			saving: 'Sparar till skafferiet…'
		},
		scanFlow: {
			lookupProduct: 'Slår upp produkt',
			saving: 'Sparar till skafferiet…',
			hideDetails: 'Dölj detaljer',
			lookupFailed: 'Hoppsan — kunde inte slå upp streckkoden. Försök igen eller ange manuellt.',
			networkError: 'Hoppsan — nätverksfel. Kontrollera anslutningen och försök igen.',
			barcodeFab: 'Skanna streckkod',
			barcodeCamera: 'Skanna streckkod med kameran',
			barcodeModal: 'Skanna streckkod',
			noCamera: 'Ingen kamera hittades på enheten.',
			cameraDenied: 'Kunde inte öppna kameran. Tillåt kameraåtkomst i webbläsarens inställningar.',
			addModalTitle: 'Lägg till vara',
			toastAdded: 'Klart! "{label}" ligger nu i skafferiet.',
			toastAddedUnknown: 'Bra jobbat — "{label}" finns nu i skafferiet (okänd streckkod).'
		},
		recipe: {
			title: 'Receptförslag',
			notLoggedIn: 'Du måste vara inloggad för att generera recept.',
			serviceUnavailable: 'AI-tjänsten är tillfälligt otillgänglig. Försök igen om en stund.',
			generateFailed: 'Hoppsan — kunde inte generera recept just nu. Försök igen.',
			noneGenerated: 'Inga recept genererades. Lägg till fler varor och försök igen.',
			reachFailed: 'Kunde inte nå AI-tjänsten just nu. Försök igen om en stund.',
			parseFailed: 'Kunde inte tolka receptförslagen. Försök igen om en stund.',
			networkError: 'Nätverksfel vid generering av recept. Kontrollera anslutningen och försök igen.'
		},
		onboarding: {
			welcome: 'Välkommen till Home Pantry',
			stepOf: 'Steg {current} av {total}',
			welcomeBody:
				'Håll koll på vad du har hemma — i kyl, frys och skafferi. Se vad som snart går ut och slipp dubbelköp.',
			scanTitle: 'Skanna varor',
			scanBody:
				'Skanna streckkoder med kameran för att lägga till varor på några sekunder. Du hittar skanna-knappen längst ner på mobilen.',
			locationsTitle: 'Tre platser',
			locationsBody:
				'Dela upp lagret efter var varorna står. Tryck på en plats på startsidan för att se och redigera innehållet.',
			shareTitle: 'Dela hushåll',
			shareBody:
				'Bjud in familj eller sambo under Inställningar. Byt mellan hushåll via menyn högst upp om du har flera skafferier.',
			readyTitle: 'Du är redo!',
			readyBody:
				'Börja med att skanna några varor eller lägg till manuellt. Guiden visas bara en gång — du kan alltid öppna den igen under Inställningar.',
			locationsAria: 'Lagringsplatser',
			fridgeShort: 'Kyl',
			freezerShort: 'Frys',
			cupboardShort: 'Skafferi',
			tryScan: 'Prova skanna',
			stepsAria: 'Introduktionssteg',
			landingHousehold: 'Hushåll',
			landingShopping: 'Inköpslista',
			landingExpiring: 'Utgår snart'
		},
		pantry: {
			switchAria: 'Byt pantry, nuvarande: {name}',
			closeMenu: 'Stäng pantry-meny',
			listAria: 'Dina pantries',
			switchTitle: 'Byt pantry',
			newName: 'Namn på ny pantry',
			create: 'Skapa pantry',
			leave: 'Lämna pantry',
			join: 'Gå med'
		},
		expiry: {
			today: 'Går ut idag'
		},
		calendar: {
			mon: 'Mån',
			tue: 'Tis',
			wed: 'Ons',
			thu: 'Tor',
			fri: 'Fre',
			sat: 'Lör',
			sun: 'Sön'
		},
		captcha: {
			failed: 'Captcha verifierades inte. Försök igen.',
			notConfigured: 'Captcha är inte konfigurerad. Kontakta administratören.'
		},
		delete: {
			shoppingItem: {
				title: 'Ta bort rad?',
				description: 'Raden {name} tas bort från inköpslistan.',
				undoNamed: '{name} borttagen från listan',
				undo: 'Rad borttagen från listan'
			},
			clearChecked: {
				title: 'Rensa avbockade?',
				description: '{count} avbockade {count, plural, one {rad tas} other {rader tas}} bort permanent.',
				descriptionAll: 'Alla avbockade rader tas bort permanent.',
				consequence: 'Detta går inte att ångra.',
				confirm: 'Rensa avbockade'
			},
			inventoryItem: {
				title: 'Ta bort vara?',
				titleNamed: 'Ta bort {name}?',
				description: 'Varan {name} tas bort från skafferiet.'
			},
			householdMember: {
				title: 'Ta bort medlem?',
				titleNamed: 'Ta bort {name}?',
				description: 'Medlemmen {name} förlorar åtkomst till hushållet.',
				consequence: 'Personen måste bjudas in igen för att komma tillbaka.',
				confirm: 'Ta bort medlem'
			},
			household: {
				title: 'Ta bort hushåll',
				description:
					'Detta går inte att ångra. All inventering, inköpslista och förbrukningshistorik för hushållet raderas.',
				otherMembers: '{count} {count, plural, one {annan medlem} other {andra medlemmar}} förlorar åtkomst omedelbart.',
				confirm: 'Ta bort permanent',
				typedHint: 'Skriv {name} eller TA BORT för att bekräfta.',
				typedHintGeneric: 'Skriv hushållets namn eller TA BORT för att bekräfta.'
			},
			invite: {
				title: 'Återkalla inbjudan?',
				description: 'Inbjudan till {name} tas bort. Länken slutar fungera.',
				descriptionGeneric: 'Inbjudan tas bort och länken slutar fungera.',
				confirm: 'Återkalla'
			},
			pet: {
				title: 'Ta bort husdjur?',
				titleNamed: 'Ta bort {name}?',
				description: 'Husdjuret {name} och tillhörande matloggar tas bort.',
				consequence: 'Detta går inte att ångra.',
				confirm: 'Ta bort husdjur'
			},
			petFood: {
				title: 'Ta bort mat?',
				titleNamed: 'Ta bort {name}?',
				description: 'Matposten {name} tas bort från husdjursförrådet.'
			},
			plannedMeal: {
				title: 'Ta bort måltid?',
				titleNamed: 'Ta bort {name}?',
				description: 'Måltiden {name} tas bort från veckoplanen.'
			},
			receiptReview: {
				title: 'Kasta granskning?',
				description: '{count} identifierade {count, plural, one {vara försvinner} other {varor försvinner}} om du väljer ny bild.',
				descriptionEmpty: 'Den parsade kvittolistan försvinner om du väljer ny bild.',
				consequence: 'Du måste fotografera eller välja kvittot igen.',
				confirm: 'Kasta och välj ny bild'
			},
			generic: {
				title: 'Ta bort?',
				descriptionSimple: 'Är du säker på att du vill ta bort detta?',
				descriptionPermanent: 'Den valda posten tas bort permanent.',
				consequence: 'Detta går inte att ångra.'
			}
		},
		errors: {
			household: {
				forbidden: 'Endast ägare kan utföra denna åtgärd.',
				inviteNotFound: 'Inbjudan hittades inte.',
				memberNotFound: 'Medlemmen hittades inte.',
				householdNotFound: 'Pantryn hittades inte.',
				deleteConfirm: 'Bekräftelsen matchar inte. Skriv hushållets namn eller TA BORT.',
				alreadyMember: 'Användaren är redan medlem i hushållet.',
				pendingInvite: 'Det finns redan en väntande inbjudan till denna e-postadress.',
				lastOwner: 'Det måste finnas minst en ägare i hushållet.',
				inviteNotPending: 'Inbjudan är inte längre giltig.',
				inviteExpired: 'Inbjudan har gått ut.',
				inviteEmailMismatch: 'Logga in med samma e-postadress som inbjudan skickades till.',
				notMember: 'Du är inte medlem i denna pantry.',
				invalidInvite: 'Ogiltig inbjudan.',
				invalidRole: 'Ogiltig roll.',
				invalidMember: 'Ogiltig medlem.',
				invalidConfirm: 'Ogiltig bekräftelse.',
				nameRequired: 'Pantryn måste ha ett namn.',
				noHousehold: 'Inget hushåll valt'
			},
			validation: {
				nameRequired: 'Ange ett namn',
				nameTooLong: 'Namnet är för långt',
				deleteConfirm: 'Skriv hushållets namn eller TA BORT för att bekräfta'
			},
			api: {
				icaFailed: 'Kunde inte skapa inköpslista från AI-svaret. Försök igen.',
				insightsEmpty: 'Du har inga varor registrerade ännu.',
				insightsSummary: 'Här är dina senaste inventarietips.',
				insightsParse: 'Kunde inte tolka AI-svaret. Försök igen om en stund.',
				insightsAddItems: 'Lägg till varor i kyl, frys eller skafferi för att få smarta tips.',
				productImageParse: 'Kunde inte tolka produktuppgifter från bilden. Prova en tydligare etikett.',
				receiptTooLarge: 'Bilden är för stor (max 8 MB).',
				receiptNotImage: 'Filen måste vara en bild.',
				receiptNoImage: 'Ingen bild uppladdad.'
			}
		}
	},
	en: {
		common: {
			delete: 'Delete',
			confirm: 'Confirm',
			undo: 'Undo',
			copy: 'Copy',
			copied: 'Copied!',
			send: 'Send',
			next: 'Next',
			previous: 'Back',
			skip: 'Skip',
			getStarted: 'Get started',
			loading: 'Loading…',
			thinking: 'Thinking…',
			lookup: 'Looking up…',
			searching: 'Searching…',
			optional: 'optional',
			name: 'Name',
			quantity: 'Quantity',
			unit: 'Unit',
			notes: 'Notes',
			place: 'Location',
			email: 'Email',
			role: 'Role',
			species: 'Species',
			confirmation: 'Confirmation',
			confirmDelete: 'Confirm deletion',
			typeDeleteConfirm: 'DELETE',
			unknownItem: 'this entry',
			unknownProduct: 'item'
		},
		inventory: {
			title: 'Your pantry',
			emptyTitle: 'Empty in {location}',
			noResults: 'No matches',
			tryOtherSearch: 'Try a different search term.',
			emptyCanWrite: 'Scan an item or add manually in {location}.',
			emptyReadonly: 'There are no items in {location} yet.',
			scan: 'Scan',
			addManual: 'Add manually',
			backHome: 'Back to home',
			readonly: 'You have read-only access in this household.',
			rowSingular: 'row in the pantry',
			rowPlural: 'rows in the pantry'
		},
		item: {
			addTitle: 'Add item',
			editTitle: 'Edit item',
			addSubmit: 'Add item',
			saveChanges: 'Save changes',
			deleteItem: 'Delete item',
			deleteItemNamed: 'Delete {name}',
			howToFill: 'How do you want to fill in the item?',
			scanModeAria: 'Scan mode',
			barcodeTab: 'Barcode',
			photoTab: 'Photo',
			bestBefore: 'Best before (optional)',
			notesOptional: 'Notes (optional)',
			unitPlaceholder: 'pcs, g, L…',
			invalidBarcode: 'Invalid barcode. Enter at least 8 digits.',
			lookupFailed: 'Could not look up the barcode. Try again or enter manually.',
			lookupNetwork: 'Network error while looking up the product.',
			foundProduct: 'Found {name} ({barcode}).',
			unknownBarcodeFilled: 'Unknown barcode — filled in "{name}". Adjust if needed.',
			unknownProductName: 'Unknown item ({barcode})'
		},
		shopping: {
			title: 'Shopping',
			subtitle: 'Shared shopping list and AI assistant',
			listTab: 'Shopping list',
			assistantTab: 'Assistant',
			listAria: 'Shopping list',
			quantityPlaceholder: 'Qty',
			unitPlaceholder: 'Unit',
			clearChecked: 'Clear all checked rows',
			removeLine: 'Remove {line}',
			assistantIntro:
				'AI analyses your pantry, expiry dates and meal plan — and suggests a shopping list tailored for ICA.',
			assistantAria: 'Shopping assistant',
			insightsTab: 'Inventory tips',
			icaTab: 'ICA shopping list',
			focusOptional: 'Focus (optional)',
			focusPlaceholder: 'E.g. what should I cook this weekend? What should I use first?',
			preferences: 'Preferences (optional)',
			householdSize: 'Household size',
			generateInsights: 'Generate tips',
			generateIca: 'Create ICA list',
			copyList: 'Copy list',
			openIca: 'Open on ICA',
			insightsError: 'Could not fetch inventory tips.',
			insightsNetwork: 'Network error while fetching tips.',
			icaError: 'Could not create ICA list.',
			icaNetwork: 'Network error while creating shopping list.',
			insightExpiring: 'Expiring soon',
			insightRunningLow: 'Running low',
			insightUseSoon: 'Use soon',
			insightRestock: 'Restock',
			insightMealPlan: 'Meal plan',
			insightTip: 'Tip'
		},
		planer: {
			title: 'Plans',
			subtitle: 'Plan meals in the calendar and add ChatGPT ideas',
			ideasAria: 'Recipe ideas',
			ideasIntro: 'Generated ideas from your stock. Pick a date and add to the calendar.',
			ideasEmpty: 'No generated ideas yet. Use the Recipe ideas button first.',
			usesLabel: 'Use:',
			addToCalendar: 'Add to calendar',
			calendarAria: 'Month calendar',
			prevMonth: 'Previous month',
			nextMonth: 'Next month',
			gridAria: 'Calendar grid, swipe left or right to change month',
			otherMonth: '(other month)',
			mealsCount: '{count} meals',
			openDay: 'Open {date}',
			addMeal: 'Add meal',
			mealsTitle: 'Meals',
			mealsTitleDate: 'Meals {date}',
			plannedCount: '{count} planned meals',
			mealTitle: 'Meal title',
			removeMeal: 'Remove meal {title}',
			recipeIdeasAria: 'Open recipe ideas — generate meal suggestions from your stock'
		},
		stats: {
			title: 'How your pantry looks',
			subtitle: 'Quick overview — kind of fun, but actually useful'
		},
		profile: {
			title: 'Profile',
			subtitle: 'Edit your account',
			updated: 'Nice — your profile is updated!',
			themeSaved: 'Theme saved — looks good!',
			saveProfile: 'Save profile',
			avatarInvalid: 'Choose an image file (PNG, JPEG, GIF or WebP).',
			avatarTooLarge: 'Image must be at most 100 KB.',
			themeTitle: 'Theme',
			themeLight: 'Light',
			themeDark: 'Dark',
			themeSystem: 'System'
		},
		settings: {
			account: {
				title: 'Account',
				description: 'Your logged-in account and profile',
				loggedInEmail: 'Logged-in email',
				editProfile: 'Edit profile',
				editProfileNote: 'Name, photo and theme'
			},
			household: {
				title: 'Household',
				description: 'Shared household, members and invitations'
			},
			app: {
				title: 'App',
				description: 'Features and preferences'
			},
			pets: {
				title: 'Pets',
				note: 'Enable to show Pets in the menu and manage your pets.',
				enable: 'Turn on',
				disable: 'Turn off',
				add: '+ Add pet',
				heading: 'Your pets',
				empty: 'No pets added yet.',
				remove: 'Remove',
				removeNamed: 'Remove pet {name}',
				modalTitle: 'Add pet',
				speciesOptional: 'Species (optional)',
				speciesPlaceholder: 'e.g. Dog, Cat',
				namePlaceholder: 'e.g. Luna'
			},
			onboarding: {
				title: 'Show introduction again',
				note: 'Walk through the welcome guide for the app.',
				start: 'Start guide'
			}
		},
		household: {
			members: 'Members',
			invite: 'Invite',
			inviteNote: 'Send an invitation by email. You can also copy the link manually below.',
			inviteSent: 'Invitation sent — check your inbox!',
			sendInvite: 'Send invitation',
			sendingInvite: 'Sending invitation…',
			inviteLink: 'Invitation link',
			pendingInvites: 'Pending invitations',
			revoke: 'Revoke',
			revokeNamed: 'Revoke invitation to {email}',
			roleFor: 'Role for {email}',
			roleOwner: 'Owner',
			roleEditor: 'Edit',
			roleViewer: 'View',
			yourRole: 'Your role: {role}.',
			ownerOnly: 'Only owners can invite and manage members.',
			dangerZone: 'Danger zone',
			deleteWarning:
				'Permanently delete the household. All inventory, shopping list and consumption history for this household will be deleted. Pending invitations are removed.',
			otherMembersLoseAccess:
				'{count} {count, plural, one {other member} other {other members}} will lose access immediately.',
			deleteHousehold: 'Delete household',
			deletingHousehold: 'Deleting household…',
			removeMember: 'Remove member {email}',
			defaultName: 'My household',
			roleOwnerLabel: 'Owner'
		},
		pets: {
			title: 'Pets',
			subtitle: 'Your pets at home',
			addFood: 'Add pet food',
			lookupFailed: 'Could not look up the barcode right now.',
			lookupNetwork: 'Network error while looking up barcode.',
			unknownBarcode: 'Unknown barcode — filled in "{name}".'
		},
		admin: {
			title: 'Admin',
			subtitle: 'Manage users and overview',
			users: 'Users',
			enablePets: 'Enable pets',
			disablePets: 'Disable pets',
			on: 'On',
			dbEngine: 'Active database engine',
			logoutConfirmRequired: 'Type confirmation to log out everyone.',
			invalidUser: 'Invalid user.',
			loggedOut: 'You have been logged out.',
			loggedOutAll: 'All users have been logged out ({count} sessions).'
		},
		invite: {
			title: 'Household invitation'
		},
		starter: {
			title: 'Quick start',
			subtitle: 'Mark what you have at home'
		},
		photoScan: {
			title: 'Photograph product',
			subtitle: 'AI reads the label and fills in details',
			pickFile: '📁 Choose image from files',
			reading: 'Reading product…',
			readFailed: 'Could not read the product from the image. Try a clearer photo.',
			networkError: 'Network error while analysing the image.',
			confidenceHigh: 'high',
			confidenceLow: 'low',
			filledFromPhoto:
				'Filled in details from the photo (confidence: {confidence}). Check before saving.'
		},
		receipt: {
			pickFile: '📁 Choose from files',
			pickSourceAria: 'Choose receipt or image source',
			reading: 'Reading receipt…',
			readingStatus: 'Reading receipt… this usually takes a few seconds.',
			parseFailed: 'Oops — could not read the receipt. Try a clearer image.',
			networkError: 'Oops — network error. Check your connection and try again.',
			needImage:
				'An image file is required for now — save the receipt as an image or take a screenshot if you have a PDF.',
			saving: 'Saving to pantry…'
		},
		scanFlow: {
			lookupProduct: 'Looking up product',
			saving: 'Saving to pantry…',
			hideDetails: 'Hide details',
			lookupFailed: 'Oops — could not look up the barcode. Try again or enter manually.',
			networkError: 'Oops — network error. Check your connection and try again.',
			barcodeFab: 'Scan barcode',
			barcodeCamera: 'Scan barcode with camera',
			barcodeModal: 'Scan barcode',
			noCamera: 'No camera found on this device.',
			cameraDenied: 'Could not open the camera. Allow camera access in your browser settings.',
			addModalTitle: 'Add item',
			toastAdded: 'Done! "{label}" is now in your pantry.',
			toastAddedUnknown: 'Nice — "{label}" is in your pantry (unknown barcode).'
		},
		recipe: {
			title: 'Recipe suggestions',
			notLoggedIn: 'You must be logged in to generate recipes.',
			serviceUnavailable: 'AI service is temporarily unavailable. Try again in a moment.',
			generateFailed: 'Oops — could not generate recipes right now. Try again.',
			noneGenerated: 'No recipes were generated. Add more items and try again.',
			reachFailed: 'Could not reach the AI service right now. Try again in a moment.',
			parseFailed: 'Could not parse recipe suggestions. Try again in a moment.',
			networkError: 'Network error while generating recipes. Check your connection and try again.'
		},
		onboarding: {
			welcome: 'Welcome to Home Pantry',
			stepOf: 'Step {current} of {total}',
			welcomeBody:
				'Keep track of what you have at home — fridge, freezer and cupboard. See what is expiring soon and avoid duplicate purchases.',
			scanTitle: 'Scan items',
			scanBody:
				'Scan barcodes with the camera to add items in seconds. Find the scan button at the bottom on mobile.',
			locationsTitle: 'Three locations',
			locationsBody:
				'Split your stock by where items are stored. Tap a location on the home screen to view and edit contents.',
			shareTitle: 'Share household',
			shareBody:
				'Invite family or housemates under Settings. Switch between households via the menu at the top if you have several pantries.',
			readyTitle: 'You are ready!',
			readyBody:
				'Start by scanning a few items or adding manually. The guide is shown once — you can always open it again under Settings.',
			locationsAria: 'Storage locations',
			fridgeShort: 'Fridge',
			freezerShort: 'Freezer',
			cupboardShort: 'Cupboard',
			tryScan: 'Try scanning',
			stepsAria: 'Introduction steps',
			landingHousehold: 'Household',
			landingShopping: 'Shopping list',
			landingExpiring: 'Expiring soon'
		},
		pantry: {
			switchAria: 'Switch pantry, current: {name}',
			closeMenu: 'Close pantry menu',
			listAria: 'Your pantries',
			switchTitle: 'Switch pantry',
			newName: 'Name for new pantry',
			create: 'Create pantry',
			leave: 'Leave pantry',
			join: 'Join'
		},
		expiry: {
			today: 'Expires today'
		},
		calendar: {
			mon: 'Mon',
			tue: 'Tue',
			wed: 'Wed',
			thu: 'Thu',
			fri: 'Fri',
			sat: 'Sat',
			sun: 'Sun'
		},
		captcha: {
			failed: 'Captcha was not verified. Try again.',
			notConfigured: 'Captcha is not configured. Contact the administrator.'
		},
		delete: {
			shoppingItem: {
				title: 'Remove row?',
				description: 'Row {name} will be removed from the shopping list.',
				undoNamed: '{name} removed from list',
				undo: 'Row removed from list'
			},
			clearChecked: {
				title: 'Clear checked?',
				description: '{count} checked {count, plural, one {row will} other {rows will}} be permanently removed.',
				descriptionAll: 'All checked rows will be permanently removed.',
				consequence: 'This cannot be undone.',
				confirm: 'Clear checked'
			},
			inventoryItem: {
				title: 'Delete item?',
				titleNamed: 'Delete {name}?',
				description: 'Item {name} will be removed from the pantry.'
			},
			householdMember: {
				title: 'Remove member?',
				titleNamed: 'Remove {name}?',
				description: 'Member {name} will lose access to the household.',
				consequence: 'They must be invited again to return.',
				confirm: 'Remove member'
			},
			household: {
				title: 'Delete household',
				description:
					'This cannot be undone. All inventory, shopping list and consumption history for the household will be deleted.',
				otherMembers:
					'{count} {count, plural, one {other member} other {other members}} will lose access immediately.',
				confirm: 'Delete permanently',
				typedHint: 'Type {name} or DELETE to confirm.',
				typedHintGeneric: 'Type the household name or DELETE to confirm.'
			},
			invite: {
				title: 'Revoke invitation?',
				description: 'Invitation to {name} will be removed. The link will stop working.',
				descriptionGeneric: 'The invitation will be removed and the link will stop working.',
				confirm: 'Revoke'
			},
			pet: {
				title: 'Delete pet?',
				titleNamed: 'Delete {name}?',
				description: 'Pet {name} and related food logs will be deleted.',
				consequence: 'This cannot be undone.',
				confirm: 'Delete pet'
			},
			petFood: {
				title: 'Delete food?',
				titleNamed: 'Delete {name}?',
				description: 'Food entry {name} will be removed from pet supplies.'
			},
			plannedMeal: {
				title: 'Delete meal?',
				titleNamed: 'Delete {name}?',
				description: 'Meal {name} will be removed from the weekly plan.'
			},
			receiptReview: {
				title: 'Discard review?',
				description:
					'{count} identified {count, plural, one {item will disappear} other {items will disappear}} if you choose a new image.',
				descriptionEmpty: 'The parsed receipt list will be lost if you choose a new image.',
				consequence: 'You will need to photograph or select the receipt again.',
				confirm: 'Discard and choose new image'
			},
			generic: {
				title: 'Delete?',
				descriptionSimple: 'Are you sure you want to delete this?',
				descriptionPermanent: 'The selected entry will be permanently deleted.',
				consequence: 'This cannot be undone.'
			}
		},
		errors: {
			household: {
				forbidden: 'Only owners can perform this action.',
				inviteNotFound: 'Invitation not found.',
				memberNotFound: 'Member not found.',
				householdNotFound: 'Pantry not found.',
				deleteConfirm: 'Confirmation does not match. Type the household name or DELETE.',
				alreadyMember: 'User is already a member of the household.',
				pendingInvite: 'There is already a pending invitation to this email address.',
				lastOwner: 'There must be at least one owner in the household.',
				inviteNotPending: 'Invitation is no longer valid.',
				inviteExpired: 'Invitation has expired.',
				inviteEmailMismatch: 'Log in with the same email address the invitation was sent to.',
				notMember: 'You are not a member of this pantry.',
				invalidInvite: 'Invalid invitation.',
				invalidRole: 'Invalid role.',
				invalidMember: 'Invalid member.',
				invalidConfirm: 'Invalid confirmation.',
				nameRequired: 'Pantry must have a name.',
				noHousehold: 'No household selected'
			},
			validation: {
				nameRequired: 'Enter a name',
				nameTooLong: 'Name is too long',
				deleteConfirm: 'Type the household name or DELETE to confirm'
			},
			api: {
				icaFailed: 'Could not create shopping list from AI response. Try again.',
				insightsEmpty: 'You have no items registered yet.',
				insightsSummary: 'Here are your latest inventory tips.',
				insightsParse: 'Could not parse AI response. Try again in a moment.',
				insightsAddItems: 'Add items in fridge, freezer or cupboard to get smart tips.',
				productImageParse: 'Could not parse product details from the image. Try a clearer label.',
				receiptTooLarge: 'Image is too large (max 8 MB).',
				receiptNotImage: 'File must be an image.',
				receiptNoImage: 'No image uploaded.'
			}
		}
	}
};

function deepMerge(target, source) {
	for (const [key, value] of Object.entries(source)) {
		if (value && typeof value === 'object' && !Array.isArray(value)) {
			target[key] = target[key] && typeof target[key] === 'object' ? target[key] : {};
			deepMerge(target[key], value);
		} else {
			target[key] = value;
		}
	}
	return target;
}

for (const [locale, ext] of Object.entries(extensions)) {
	const path = locale === 'sv' ? svPath : enPath;
	const current = JSON.parse(readFileSync(path, 'utf8'));
	deepMerge(current, ext);
	writeFileSync(path, JSON.stringify(current, null, '\t') + '\n', 'utf8');
	console.log(`Updated ${path}`);
}

const sv = JSON.parse(readFileSync(svPath, 'utf8'));
function countKeys(o, p = '') {
	let n = 0;
	for (const [k, v] of Object.entries(o)) {
		const path = p ? `${p}.${k}` : k;
		if (v && typeof v === 'object') n += countKeys(v, path);
		else n++;
	}
	return n;
}
console.log('Total sv keys:', countKeys(sv));
