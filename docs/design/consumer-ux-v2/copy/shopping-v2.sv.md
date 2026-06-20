# Shopping V2 — Swedish copy (Plan + Trip)

Final strings for `/inkop` when `SHOPPING_UX_V2_ENABLED`. Keys: `shopping.v2.*`

---

## Page meta

| Key | String |
|-----|--------|
| `shopping.v2.pageTitle` | Inköp · Skaffu |
| `shopping.v2.metaDescription` | Planera veckans inköp och handla med fokus — en vara i taget. Delad lista för hushållet. |

---

## Plan mode — header

| Key | String | Notes |
|-----|--------|-------|
| `shopping.v2.plan.titleDefault` | Inköpslistan | When no trip label set |
| `shopping.v2.plan.titleTrip` | {name} | e.g. "Fredagshandling" — user or ritual label |
| `shopping.v2.plan.subtitle` | {count, plural, one {# vara} other {# varor}} · {store} | store optional; omit segment if unknown |
| `shopping.v2.plan.subtitleMemory` | minns vad ni brukar köpa | Appended when memory suggestions available |
| `shopping.v2.plan.subtitleEmpty` | Tom lista — lägg till det som saknas | Empty list, no store |

---

## Mode toggle (Plan ↔ Shop)

| Key | String |
|-----|--------|
| `shopping.v2.mode.plan` | Planera |
| `shopping.v2.mode.shop` | Handla |
| `shopping.v2.mode.aria` | Inköpsläge |
| `shopping.v2.mode.planAria` | Planera inköp |
| `shopping.v2.mode.shopAria` | Handla i butik |

---

## Plan mode — illustration

| Key | String |
|-----|--------|
| `shopping.v2.plan.illustrationAria` | Inköpsplan — översikt |

---

## Plan mode — memory suggestions

| Key | String |
|-----|--------|
| `shopping.v2.memory.sectionLabel` | Skaffu minns |
| `shopping.v2.memory.empty` | Inga förslag just nu. När ni handlar och skannar kvitton bygger Skaffu på vanorna. |
| `shopping.v2.memory.add` | Lägg till |
| `shopping.v2.memory.addAria` | Lägg {name} på listan |
| `shopping.v2.memory.onList` | På listan |
| `shopping.v2.memory.onListAria` | {name} finns redan på listan |
| `shopping.v2.memory.cadenceEvery` | Var {days} dagar |
| `shopping.v2.memory.cadenceEveryDays` | Var {interval} dagar |
| `shopping.v2.memory.lastPurchase` | senast {weekday} |
| `shopping.v2.memory.lastPurchaseDate` | senast {date} |
| `shopping.v2.memory.fromRecipe` | Redan på listan via För dig |
| `shopping.v2.memory.fromMeal` | Från {mealName} |
| `shopping.v2.memory.usualAmount` | {amount} brukar räcka |
| `shopping.v2.memory.acceptSuccess` | {name} lades till |
| `shopping.v2.memory.acceptFailed` | Kunde inte lägga till — försök igen |

---

## Plan mode — list summary (pills, not checkbox rows)

| Key | String |
|-----|--------|
| `shopping.v2.summary.title` | Din lista just nu |
| `shopping.v2.summary.countPill` | {count, plural, one {# vara} other {# varor}} |
| `shopping.v2.summary.morePill` | +{count} till |
| `shopping.v2.summary.empty` | Inga varor ännu |
| `shopping.v2.summary.startShopCta` | Börja handla |
| `shopping.v2.summary.startShopCtaAria` | Börja handla {count, plural, one {# vara} other {# varor}} |
| `shopping.v2.summary.addItemCta` | Lägg till vara |
| `shopping.v2.summary.viewAllAria` | Visa hela listan |

---

## Plan mode — quick add (collapsed by default in V2 primary surface)

| Key | String |
|-----|--------|
| `shopping.v2.add.toggle` | Lägg till vara |
| `shopping.v2.add.placeholder` | Varu namn |
| `shopping.v2.add.quantityPlaceholder` | Antal |
| `shopping.v2.add.unitPlaceholder` | Enhet |
| `shopping.v2.add.submit` | Lägg till |
| `shopping.v2.add.scanLink` | Skanna istället |

---

## Plan mode — secondary / overflow (legacy capabilities, not hero)

| Key | String |
|-----|--------|
| `shopping.v2.overflow.export` | Kopiera lista |
| `shopping.v2.overflow.smartFill` | Fyll på från skafferiet |
| `shopping.v2.overflow.share` | Dela lista |
| `shopping.v2.overflow.legacyList` | Visa som checklista |
| `shopping.v2.overflow.title` | Mer för inköp |

---

## Shop mode — chrome

| Key | String |
|-----|--------|
| `shopping.v2.shop.backToPlan` | Planera |
| `shopping.v2.shop.backToPlanAria` | Tillbaka till planering |

---

## Shop mode — progress

| Key | String |
|-----|--------|
| `shopping.v2.shop.progress` | {picked} av {total} plockade |
| `shopping.v2.shop.progressAria` | {picked} av {total} varor plockade |
| `shopping.v2.shop.progressComplete` | Allt plockat |
| `shopping.v2.shop.progressEmpty` | Inget att handla — lägg till varor i Planera |

---

## Shop mode — focus item

| Key | String |
|-----|--------|
| `shopping.v2.shop.illustrationAria` | Handla — en vara i fokus |
| `shopping.v2.shop.focusQuantity` | {quantity} {unit} |
| `shopping.v2.shop.focusLocation` | {location} |
| `shopping.v2.shop.focusDetail` | {quantity} · {location} |
| `shopping.v2.shop.pickCta` | Jag har plockat |
| `shopping.v2.shop.pickCtaAria` | Markera {name} som plockad |
| `shopping.v2.shop.skipCta` | Hoppa över |
| `shopping.v2.shop.skipAria` | Hoppa över {name} utan att plocka |
| `shopping.v2.shop.undoCta` | Ångra |
| `shopping.v2.shop.undoAria` | Ångra senaste plock |

---

## Shop mode — peek queue

| Key | String |
|-----|--------|
| `shopping.v2.shop.peekLabel` | Nästa |
| `shopping.v2.shop.peekMore` | +{count} till |
| `shopping.v2.shop.peekAria` | Kommande varor på listan |

---

## Shop mode — completion

| Key | String |
|-----|--------|
| `shopping.v2.shop.completeTitle` | Klart för den här turen |
| `shopping.v2.shop.completeBody` | {count, plural, one {# vara} other {# varor}} plockade. Uppdatera skafferiet när du packat hemma. |
| `shopping.v2.shop.completePantryCta` | Uppdatera skafferiet |
| `shopping.v2.shop.completePlanCta` | Tillbaka till planering |
| `shopping.v2.shop.completeHomeCta` | Till hem |

---

## Pantry bridge (checkoff → inventory — reuse domain, V2 presentation)

| Key | String |
|-----|--------|
| `shopping.v2.pantryBridge.title` | Lägg till i skafferiet? |
| `shopping.v2.pantryBridge.lead` | {name} — lägg till i {location} med {amount}? |
| `shopping.v2.pantryBridge.yes` | Ja, lägg till |
| `shopping.v2.pantryBridge.no` | Nej, bara lista |
| `shopping.v2.pantryBridge.addedToast` | {name} lades till i skafferiet |

---

## Household invite (existing InkopHouseholdInviteBanner — align tone)

| Key | String |
|-----|--------|
| `shopping.v2.invite.title` | Handla tillsammans |
| `shopping.v2.invite.body` | Bjud in partner så ni ser samma lista i butiken. |
| `shopping.v2.invite.cta` | Bjud in |

---

## Errors & readonly

| Key | String |
|-----|--------|
| `shopping.v2.error.loadFailed` | Inköpslistan kunde inte laddas. Försök igen. |
| `shopping.v2.error.toggleFailed` | Kunde inte uppdatera varan. Försök igen. |
| `shopping.v2.readonly` | Du har endast läsbehörighet i detta hushåll. |

---

## Receipt import lead (from `?from=receipt`)

| Key | String |
|-----|--------|
| `shopping.v2.receiptLead` | Kvitto importerat. Kolla om något saknas på listan. |
