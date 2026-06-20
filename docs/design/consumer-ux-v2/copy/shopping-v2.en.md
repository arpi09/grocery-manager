# Shopping V2 — English copy (Plan + Trip)

Final strings for `/inkop` when `SHOPPING_UX_V2_ENABLED`. Keys: `shopping.v2.*`

---

## Page meta

| Key | String |
|-----|--------|
| `shopping.v2.pageTitle` | Shopping · Skaffu |
| `shopping.v2.metaDescription` | Plan the week's shop and pick items one at a time. Shared list for your household. |

---

## Plan mode — header

| Key | String | Notes |
|-----|--------|-------|
| `shopping.v2.plan.titleDefault` | Shopping list |
| `shopping.v2.plan.titleTrip` | {name} | e.g. "Friday shop" |
| `shopping.v2.plan.subtitle` | {count, plural, one {# item} other {# items}} · {store} |
| `shopping.v2.plan.subtitleMemory` | remembers your usual picks |
| `shopping.v2.plan.subtitleEmpty` | Empty list — add what's missing |

---

## Mode toggle (Plan ↔ Shop)

| Key | String |
|-----|--------|
| `shopping.v2.mode.plan` | Plan |
| `shopping.v2.mode.shop` | Shop |
| `shopping.v2.mode.aria` | Shopping mode |
| `shopping.v2.mode.planAria` | Plan shopping |
| `shopping.v2.mode.shopAria` | Shop in store |

---

## Plan mode — illustration

| Key | String |
|-----|--------|
| `shopping.v2.plan.illustrationAria` | Shopping plan overview |

---

## Plan mode — memory suggestions

| Key | String |
|-----|--------|
| `shopping.v2.memory.sectionLabel` | Skaffu remembers |
| `shopping.v2.memory.empty` | No suggestions yet. As you shop and scan receipts, Skaffu learns your habits. |
| `shopping.v2.memory.add` | Add |
| `shopping.v2.memory.addAria` | Add {name} to the list |
| `shopping.v2.memory.onList` | On list |
| `shopping.v2.memory.onListAria` | {name} is already on the list |
| `shopping.v2.memory.cadenceEvery` | Every {days} days |
| `shopping.v2.memory.cadenceEveryDays` | Every {interval} days |
| `shopping.v2.memory.lastPurchase` | last {weekday} |
| `shopping.v2.memory.lastPurchaseDate` | last {date} |
| `shopping.v2.memory.fromRecipe` | Already on list from For you |
| `shopping.v2.memory.fromMeal` | From {mealName} |
| `shopping.v2.memory.usualAmount` | {amount} usually lasts |
| `shopping.v2.memory.acceptSuccess` | {name} added |
| `shopping.v2.memory.acceptFailed` | Couldn't add — try again |

---

## Plan mode — list summary

| Key | String |
|-----|--------|
| `shopping.v2.summary.title` | Your list right now |
| `shopping.v2.summary.countPill` | {count, plural, one {# item} other {# items}} |
| `shopping.v2.summary.morePill` | +{count} more |
| `shopping.v2.summary.empty` | No items yet |
| `shopping.v2.summary.startShopCta` | Start shopping |
| `shopping.v2.summary.startShopCtaAria` | Start shopping {count, plural, one {# item} other {# items}} |
| `shopping.v2.summary.addItemCta` | Add item |
| `shopping.v2.summary.viewAllAria` | View full list |

---

## Plan mode — quick add

| Key | String |
|-----|--------|
| `shopping.v2.add.toggle` | Add item |
| `shopping.v2.add.placeholder` | Item name |
| `shopping.v2.add.quantityPlaceholder` | Qty |
| `shopping.v2.add.unitPlaceholder` | Unit |
| `shopping.v2.add.submit` | Add |
| `shopping.v2.add.scanLink` | Scan instead |

---

## Plan mode — overflow

| Key | String |
|-----|--------|
| `shopping.v2.overflow.export` | Copy list |
| `shopping.v2.overflow.smartFill` | Fill from pantry |
| `shopping.v2.overflow.share` | Share list |
| `shopping.v2.overflow.legacyList` | Show as checklist |
| `shopping.v2.overflow.title` | More for shopping |

---

## Shop mode — chrome

| Key | String |
|-----|--------|
| `shopping.v2.shop.backToPlan` | Plan |
| `shopping.v2.shop.backToPlanAria` | Back to planning |

---

## Shop mode — progress

| Key | String |
|-----|--------|
| `shopping.v2.shop.progress` | {picked} of {total} picked |
| `shopping.v2.shop.progressAria` | {picked} of {total} items picked |
| `shopping.v2.shop.progressComplete` | All picked |
| `shopping.v2.shop.progressEmpty` | Nothing to shop — add items in Plan |

---

## Shop mode — focus item

| Key | String |
|-----|--------|
| `shopping.v2.shop.illustrationAria` | Shopping — one item in focus |
| `shopping.v2.shop.focusQuantity` | {quantity} {unit} |
| `shopping.v2.shop.focusLocation` | {location} |
| `shopping.v2.shop.focusDetail` | {quantity} · {location} |
| `shopping.v2.shop.pickCta` | I've picked this |
| `shopping.v2.shop.pickCtaAria` | Mark {name} as picked |
| `shopping.v2.shop.skipCta` | Skip |
| `shopping.v2.shop.skipAria` | Skip {name} without picking |
| `shopping.v2.shop.undoCta` | Undo |
| `shopping.v2.shop.undoAria` | Undo last pick |

---

## Shop mode — peek queue

| Key | String |
|-----|--------|
| `shopping.v2.shop.peekLabel` | Up next |
| `shopping.v2.shop.peekMore` | +{count} more |
| `shopping.v2.shop.peekAria` | Upcoming items on the list |

---

## Shop mode — completion

| Key | String |
|-----|--------|
| `shopping.v2.shop.completeTitle` | Done for this trip |
| `shopping.v2.shop.completeBody` | {count, plural, one {# item} other {# items}} picked. Update the pantry when you're home. |
| `shopping.v2.shop.completePantryCta` | Update pantry |
| `shopping.v2.shop.completePlanCta` | Back to planning |
| `shopping.v2.shop.completeHomeCta` | Go to home |

---

## Pantry bridge

| Key | String |
|-----|--------|
| `shopping.v2.pantryBridge.title` | Add to pantry? |
| `shopping.v2.pantryBridge.lead` | {name} — add to {location} as {amount}? |
| `shopping.v2.pantryBridge.yes` | Yes, add |
| `shopping.v2.pantryBridge.no` | No, list only |
| `shopping.v2.pantryBridge.addedToast` | {name} added to pantry |

---

## Household invite

| Key | String |
|-----|--------|
| `shopping.v2.invite.title` | Shop together |
| `shopping.v2.invite.body` | Invite your partner to see the same list in the store. |
| `shopping.v2.invite.cta` | Invite |

---

## Errors & readonly

| Key | String |
|-----|--------|
| `shopping.v2.error.loadFailed` | Couldn't load the shopping list. Try again. |
| `shopping.v2.error.toggleFailed` | Couldn't update the item. Try again. |
| `shopping.v2.readonly` | You have read-only access in this household. |

---

## Receipt import lead

| Key | String |
|-----|--------|
| `shopping.v2.receiptLead` | Receipt imported. Check if anything's missing from the list. |
