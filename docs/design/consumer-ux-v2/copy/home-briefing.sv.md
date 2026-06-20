# Home Household Briefing — Swedish copy

For `/hem` Household Briefing (phase 3). Keys: `home.v6.*`  
Tone: time-neutral greeting, status + För dig + CTA + chips. Not a "morning briefing".

---

## Page meta

| Key | String |
|-----|--------|
| `home.v6.pageTitle` | Hem · Skaffu |
| `home.v6.metaDescription` | Översikt för hushållet — vad att använda snart, inköp och skafferi. |

---

## Header chrome

| Key | String |
|-----|--------|
| `home.v6.brandAria` | Skaffu – Hem |
| `home.v6.accountAria` | Konto |
| `home.v6.householdSwitcher` | {name} · {count, plural, one {# medlem} other {# medlemmar}} |
| `home.v6.householdSwitcherAria` | Byt hushåll, nuvarande: {name} |

---

## Hero illustration

| Key | String |
|-----|--------|
| `home.v6.hero.illustrationAria` | Hem — översikt av skafferi och inköp |

---

## Greeting (time-neutral)

| Key | String |
|-----|--------|
| `home.v6.greeting` | Hej {name} |
| `home.v6.greetingFallback` | Hej |

---

## Status line (single calm sentence)

| Key | String | When |
|-----|--------|------|
| `home.v6.status.useSoonAndList` | {useSoonCount, plural, one {# sak att använda snart} other {# saker att använda snart}} · listan är klar till {weekday} | Both signals |
| `home.v6.status.useSoonOnly` | {count, plural, one {# sak att använda snart} other {# saker att använda snart}} | Eat-first only |
| `home.v6.status.listReady` | Listan är klar till {weekday} | Shopping ready |
| `home.v6.status.listItems` | {count, plural, one {# vara på inköpslistan} other {# varor på inköpslistan}} | List has items, no ritual day |
| `home.v6.status.allGood` | Skafferiet ser bra. Inget bråttom. | Quiet week |
| `home.v6.status.emptyPantry` | Låt oss börja bygga ert skafferi. | New household |

---

## För dig section

| Key | String |
|-----|--------|
| `home.v6.forYou.sectionLabel` | För dig |
| `home.v6.forYou.illustrationAria` | För dig — nästa naturliga steg |

### Card variants (one primary card shown)

| Key | String |
|-----|--------|
| `home.v6.forYou.recipe.title` | {mealName} med det du har hemma |
| `home.v6.forYou.recipe.body` | Du har {items} som går ut {when}. Ett snabbt mål för {servings}. |
| `home.v6.forYou.recipe.ctaAddAndShop` | Lägg till {missingCount} saknade · Handla {weekday} |
| `home.v6.forYou.recipe.ctaAdd` | Lägg till {missingCount} på listan |
| `home.v6.forYou.recipe.ctaShop` | Öppna inköpslistan |
| `home.v6.forYou.replenishment.title` | Dags för {name}? |
| `home.v6.forYou.replenishment.body` | Du brukar köpa det ungefär var {interval} dagar. |
| `home.v6.forYou.replenishment.cta` | Lägg på inköpslistan |
| `home.v6.forYou.expiring.title` | Använd {name} snart |
| `home.v6.forYou.expiring.body` | {days, plural, one {Går ut om # dag} other {Går ut om # dagar}} — bra till {suggestion}. |
| `home.v6.forYou.expiring.cta` | Visa i skafferiet |
| `home.v6.forYou.shopReady.title` | Redo att handla |
| `home.v6.forYou.shopReady.body` | {count, plural, one {# vara} other {# varor}} väntar. Perfekt till {weekday}. |
| `home.v6.forYou.shopReady.cta` | Börja handla |

---

## Moment card (calm fallback when För dig is empty)

Shown when nothing urgent is surfaced. Same section label as För dig (`home.v6.forYou.sectionLabel`).

| Key | String |
|-----|--------|
| `home.v6.moment.emptyPantry.title` | Bygg ert skafferi |
| `home.v6.moment.emptyPantry.body` | Skanna ett kvitto eller lägg till varor manuellt — så håller ni koll tillsammans. |
| `home.v6.moment.emptyPantry.cta` | Skanna kvitto |
| `home.v6.moment.scanReceipt.title` | Håll skafferiet uppdaterat |
| `home.v6.moment.scanReceipt.body` | En kvittoskanning håller skafferiet uppdaterat. |
| `home.v6.moment.scanReceipt.cta` | Skanna kvitto |
| `home.v6.moment.photoRound.title` | Snabb koll på kylen |
| `home.v6.moment.photoRound.body` | Ta en snabb bild av kylen. |
| `home.v6.moment.photoRound.cta` | Foto-runda |
| `home.v6.moment.planMeal.title` | Vad blir det till middag? |
| `home.v6.moment.planMeal.body` | Bläddra bland recept med det ni har hemma. |
| `home.v6.moment.planMeal.cta` | Bläddra recept |
| `home.v6.moment.openShopping.title` | Inköpslistan väntar |
| `home.v6.moment.openShopping.body` | Ni har varor på listan — perfekt till en snabb tur. |
| `home.v6.moment.openShopping.cta` | Öppna inköpslistan |
| `home.v6.moment.seeStats.title` | Se hur det går i köket |
| `home.v6.moment.seeStats.body` | Kolla statistik och roliga siffror från ert hushåll. |
| `home.v6.moment.seeStats.cta` | Öppna statistik |

---

## Quick glance chips

| Key | String |
|-----|--------|
| `home.v6.chips.sectionLabel` | Snabbkoll |
| `home.v6.chips.useSoon` | {count} att använda snart |
| `home.v6.chips.useSoonAria` | Visa varor att använda snart |
| `home.v6.chips.shopping` | {tripName} |
| `home.v6.chips.shoppingDefault` | Inköpslistan |
| `home.v6.chips.shoppingAria` | Öppna inköpslistan |
| `home.v6.chips.householdSynced` | Hushållet synkat |
| `home.v6.chips.householdAria` | Hushållsinställningar |
| `home.v6.chips.pantry` | Skafferi |
| `home.v6.chips.pantryAria` | Öppna skafferiet |

---

## Empty / error

| Key | String |
|-----|--------|
| `home.v6.error.loadFailed` | Hem kunde inte laddas. Försök igen. |
