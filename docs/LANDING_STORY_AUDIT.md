# Landing Story Audit

> **Implemented:** Branch `feat/landing-memory-story` (2026-05-28) — status sync only.

**Date:** 2026-06-13  
**Anchor:** [SKAFFU_2026_VISION.md](./SKAFFU_2026_VISION.md) — *Gemensam veckohandel med matkoll; hushållets minne, inte skanner först.*  
**Sources:** `content.ts`, `landing-variants.ts`, `(marketing)/+page.svelte`, `LandingHeroVisual.svelte`, `sv.json` (auth/onboarding), `README.md`, [HIGHEST_LEVERAGE.md](./HIGHEST_LEVERAGE.md) §8.

**5-second pass criteria (vision):** Visitor answers *"App for households shopping together with smart food memory"* — not *"pantry scanner"* or *"Bring with expiry dates"*.

---

# Current Story

## What a visitor thinks in ~5 seconds (default variant A)

| Signal | Copy / visual | Implied category |
|--------|---------------|------------------|
| **Eyebrow** | `Skaffu · skaffu.com` | Brand only — no wedge |
| **H1** | *Handla ihop — med en lista som håller.* | Shared shopping list (Bring competitor) |
| **Lead** | Gemensam inköpslista, bjud in partner, checka av, se vad som går ut hemma, släng mindre | Lista + duo + waste reduction |
| **Secondary** | *Kvitto och skanning fyller skafferiet i bakgrunden* | **Pantry inventory tool** (scanner/autofill) |
| **Hero visual** | Phone mock: inköpslista, "Anna checkade mjölk", float cards "Dela länk" / "Handla tillsammans", Ät det först badge | Lista-first visual — **no memory/suggestions** |
| **Highlights** | Delad lista · Bjud in partner · Ät det först | Feature chips, not a single Brain sentence |
| **Primary CTA** | *Kom igång gratis* → `/register` | Account, not "skapa veckans lista" |

**One-line visitor mental model:** *"Bring-liknande delad inköpslista för par/hushåll, med skafferi och matsvinn som bonus — kvitto/skanning fyller lagret."*

## Variant B (`?hero=b` or cookie)

H1 flips to **"Butiksneutralt skafferi för hela hushållet"** — immediately pantry/ inventory app. Worse for 2026 wedge; better for SEO long-tail only.

## Receipt hero experiment (`?receipt_hero=`)

Overrides hero to receipt-autopilot (*"Ladda upp ett digitalt kvitto — Skaffu fyller skafferiet"*). **Actively trains scanner-first story** — conflicts with vision and post-register `/inkop` path.

## Below-fold reinforcement (seconds 6–30)

Even scrollers who only skim hero secondary get re-anchored:

| Section | Dominant frame |
|---------|----------------|
| Differentiators | "Lager som stämmer", "Kvitto-autopilot", "AI hjälper till att fylla skafferiet" |
| Features preview (first 4) | Hushåll → Smart lista → Ät det först → **Streckkodsskanning** |
| Waste block | "Skafferi-app som hjälper dig minska matsvinn" |
| Comparison disclaimer | "butiksneutralt skafferi med lager som sanningskälla" |
| Comparison CTA lead | "kom igång med ett kvitto eller några streckkoder" |
| Guides teaser | "skafferi, matsvinn och kvitto-PDF" |
| Pro banner | "obegränsade kvitto-PDF och smartare listfyllning" |
| Footer tagline | "Skafferi, kyl och inköp på ett ställe" |

## Register → inkop continuity (post-click)

| Step | Story | Alignment |
|------|-------|-----------|
| Register subtitle | *Gemensam inköpslista — bjud in partner och handla ihop* | ✅ Lista wedge |
| Register meta | *Skafferi-app med skanning och kvitto-PDF* | ❌ Pantry-first SEO |
| Post-register redirect | `/inkop` (`APP_HOME_PATH`) | ✅ Matches hero lista promise |
| Onboarding beat 1 | *Handlar du tillsammans?* / veckolista | ✅ Vision-aligned (code shipped) |
| Onboarding legacy keys | `landingHeadline`: *Ditt skafferi, samlat*; scan CTAs still present | ⚠️ Mixed |
| verifyEmail welcome | *…igång med skafferiet* | ❌ Pantry framing |

## README / product tagline

`Handla ihop — med en lista som håller. Minska matsvinn.` — lista OK; **no household memory**; matsvinn as co-hero dilutes Brain story.

## HIGHEST_LEVERAGE.md assessment

Item **#8** marks landing → register → inkop as *"Largely done; incremental lift is monitoring 5-second test"*. This audit disagrees on **message depth**: path continuity is good; **category positioning** still reads pantry/scanner below the hero fold.

---

# Desired Story

## 2026 one-liner (vision)

*Gemensam veckohandel med matkoll — hushållets minne gör listan, skafferiet och matsvinn rätt utan att du tänker på det.*

## What they should think in ~5 seconds

| Layer | Intended takeaway |
|-------|-------------------|
| **Category** | Weekly shopping rhythm for households — not a pantry database |
| **Job** | Plan and shop together on one lista that stays true |
| **Differentiator** | Skaffu **learns the household** (kvitton, checkoffs, corrections) and suggests what to buy, eat first, and skip — **without "AI" in the UI** |
| **Duo** | Built for two people in the store and at home — partner presence is the proof |
| **Input** | Kvitto/skanning = *uppdatera hushållets minne*, not "fyll skafferiet" |
| **Outcome** | Right buys, less waste — **because the list knows you**, not because you tracked every jar |

## Register → inkop continuity (desired)

1. **Landing CTA** promises *veckans lista* / *handla ihop* — not scan.
2. **Register** repeats lista + optional partner — meta matches.
3. **First screen** `/inkop` with onboarding *Tillsammans* → add 3 staples → cold-start copy *"Vi föreslår när vi sett dina mönster"*.
4. **Optional** receipt path framed as *"Hjälp Skaffu förstå ditt hushåll"* — never default hero.

## Success test (from vision)

> Week 4 retention: users cite *"den vet vad vi brukar köpa"* not *"bra skanner"*.

Landing must prime that quote, not the scanner quote.

---

# Top 20 Improvements (ranked by leverage for 5-second test + register→inkop continuity)

Ranked for **message leverage** on cold visitors and **story continuity** through register — not implementation effort.

| Rank | Improvement | Why (5s + continuity) |
|------|-------------|------------------------|
| **1** | Replace hero **secondary** — drop *"fyller skafferiet"*; use memory/veckorytm frame | Secondary is read in 5s; currently undoes H1 lista story |
| **2** | Add **eyebrow wedge** (*Gemensam veckohandel* / *För hushåll som handlar ihop*) | Instant category before H1 parses |
| **3** | Rewrite **hero highlights** — lista + partner + *"lär sig vad ni brukar köpa"* (not Ät det först alone) | Chips are scanned in 5s; eat-first alone = pantry tracker |
| **4** | **Hero visual**: add *"Skaffu föreslår"* row or suggestion chip (*Från dina kvitton*) | Visual proof of household memory, not static list mock |
| **5** | **Kill or gate receipt_hero experiment** on main `/` — receipt story belongs on `/kvitto-pdf-kivra` only | Experiment overrides lista hero for attributed traffic |
| **6** | **Retire variant B** as default env — pantry H1 trains wrong category for wedge | `PUBLIC_LANDING_VARIANT=b` fights 2026 positioning |
| **7** | Align **register metaDescription** + **verifyEmail welcomeBody** with lista (not skafferi-app) | First click after hero must not contradict |
| **8** | Change **final CTA** + hero CTA label to *"Skapa veckans lista"* (test vs *Kom igång gratis*) | Outcome-named CTA → `/inkop` mental model at register |
| **9** | Reorder **differentiators**: (1) Veckans lista tillsammans (2) Hushållets minne (3) Ät det först (4) Butiksneutral — demote Kvitto-autopilot tag | First scroll block after stats; currently pantry/AI |
| **10** | **Features preview**: show Hushåll, Smart lista, **Skaffu föreslår**, Ät det först — **drop barcode from hero fold preview** | Barcode in first 4 = scanner category |
| **11** | **Steps section** step 3: *"Nästa vecka — Skaffu föreslår"* instead of *"Kvitto och skanning fyller lagret"* | How-it-works is second-most-read; must close the loop |
| **12** | **Comparison CTA lead**: *"Skapa lista och bjud in partner"* not *"kvitto eller streckkoder"* | Last conversion block before guides |
| **13** | **Meta title/description** lead with *gemensam veckohandel* + *hushållets minne*; demote *skafferi-app* | SERP/snippet is pre-5s story for many users |
| **14** | **Footer tagline**: *"Veckans lista och matkoll för hela hushållet"* | Persistent re-anchor on every page |
| **15** | **README** one-liner: add memory clause; match vision one-liner | Repo is agent/human source of truth |
| **16** | **Pro banner** on landing: hide or rewrite — *"fler hushållsmedlemmar"* only; drop kvitto-PDF hero bullets (Tier C checkout off) | Pro block screams scanner/power-user |
| **17** | **Waste section** H2: *"Mindre svinn när listan vet vad som finns"* — not *"Skafferi-app"* | Matsvinn as outcome of memory, not category |
| **18** | **onboarding.landingHeadline** (*Ditt skafferi, samlat*) → align with lista/memory or remove from register funnel | Legacy key leaks pantry story inside app |
| **19** | **Logged-out demo link** secondary CTA: *"Se veckans lista"* → public lista preview or 30s Loom — reduces register anxiety for duo | Secondary CTA currently only login |
| **20** | **Analytics**: track 5s proxy — `register_click` variant + post-register `shared_list_action` within 24h; A/B only on H1/eyebrow, not receipt hero | [HIGHEST_LEVERAGE.md](./HIGHEST_LEVERAGE.md) #8 measurement |

---

# New Hero Copy (sv primary + en mirror)

Proposed **variant C** (replace A as default; keep A as Bring-comparison SEO test only).

## Swedish (primary)

| Field | Copy |
|-------|------|
| **Eyebrow** | `Gemensam veckohandel · skaffu.com` |
| **H1** | `Handla ihop — Skaffu lär sig ert hushåll.` |
| **Lead** | `En delad veckolista för hela hushållet. Bjud in partner, checka av i butiken och få förslag på vad ni brukar behöva — så ni köper rätt och slänger mindre.` |
| **Secondary** | `Kvitton och checkoffs bygger hushållets minne i bakgrunden. Butiksneutralt — ICA, Willys eller Coop.` |
| **Highlight 1** | `Delad lista i realtid` |
| **Highlight 2** | `Bjud in partner` |
| **Highlight 3** | `Lär sig vad ni brukar köpa` |

## English (mirror)

| Field | Copy |
|-------|------|
| **Eyebrow** | `Shared weekly shopping · skaffu.com` |
| **H1** | `Shop together — Skaffu learns your household.` |
| **Lead** | `One shared weekly list for the whole household. Invite your partner, check off in the store and get suggestions for what you usually need — so you buy right and waste less.` |
| **Secondary** | `Receipts and checkoffs build household memory in the background. Store-neutral — ICA, Willys or Coop.` |
| **Highlight 1** | `Shared list in real time` |
| **Highlight 2** | `Invite your partner` |
| **Highlight 3** | `Learns what you usually buy` |

### Hero visual copy tweaks (sv / en)

| Key | SV | EN |
|-----|----|----|
| listTitle | `Veckans lista` | `This week's list` |
| listItemChecked | `Anna checkade mjölk` | `Anna checked off milk` |
| eatFirstCaption | `3 varor går ut — ät först` | `3 items expiring — eat first` |
| **New suggestion row** | `Skaffu föreslår: Yoghurt` + badge `Från dina kvitton` | `Skaffu suggests: Yogurt` + badge `From your receipts` |

---

# New CTA Strategy (primary/secondary per section, register vs inkop, A/B notes)

## Principles

1. **Primary conversion = register** with lista-outcome labels (logged out).
2. **Logged in** → `Öppna appen` → `/inkop` (unchanged).
3. **Never** primary CTA to `/scan` on landing.
4. **Inköp** as CTA only for logged-in users or future public lista demo — not for cold register (no accountless write path today).

## Per section

| Section | Primary CTA | Secondary CTA | Destination | Notes |
|---------|-------------|---------------|-------------|-------|
| **Hero** | *Skapa veckans lista* | *Logga in* | `/register` · `/login` | Replace *Kom igång gratis* — outcome language; keep `register_click` analytics |
| **Hero** (logged in) | *Öppna veckans lista* | — | `/inkop` | Match `APP_HOME_PATH` |
| **Stats strip** | — | — | — | No CTA; optional link row to `/sa-fungerar-det` |
| **Differentiators** | — | *Så fungerar det* | `/sa-fungerar-det` | Education, not conversion |
| **How it works (3 steps)** | *Skapa veckans lista* | *Läs mer* | `/register` · `/sa-fungerar-det` | Add CTA row (currently link only) |
| **Features preview** | *Se alla funktioner* | — | `/funktioner` | Discovery |
| **Waste section** | *Skapa veckans lista* | *Läs om matsvinn* | `/register` · `/minska-matsvinn` | Outcome section → lista CTA |
| **Comparison** | *Skapa veckans lista* | *Logga in* | `/register` · `/login` | Replace kvitto/streckkod lead copy |
| **Guides teaser** | — | *Alla guider* | `/guider` | SEO nurture |
| **Pro banner** | *Se priser* (if shown) | *Skapa veckans lista* | `/priser` · `/register` | Demote Pro on landing until checkout live |
| **Final CTA** | *Skapa veckans lista* | *Logga in* | `/register` · `/login` | Title already lista-aligned |

## Register page (copy only — no route change)

| Field | Current | Proposed |
|-------|---------|----------|
| subtitle | Gemensam inköpslista — bjud in partner… | *Skapa veckans lista — bjud in partner när du vill* |
| metaDescription | Skafferi-app med skanning… | *Gratis gemensam veckolista för hushållet. Skaffu lär sig vad ni brukar köpa — butiksneutralt.* |

Post-register: keep **`/inkop?freshAccount=1`** + onboarding *Tillsammans* (no change).

## A/B test matrix (recommended)

| Test ID | What varies | Control | Challenger | Metric | Guardrail |
|---------|-------------|---------|------------|--------|-----------|
| **L-H1** | H1 only | *…lista som håller* | *…lär sig ert hushåll* | `register_click` → `freshAccount` → first list item ≤10 min | Bounce rate |
| **L-CTA** | Hero CTA label | *Kom igång gratis* | *Skapa veckans lista* | Same + `shared_list_action` D1 | Register completion |
| **L-EYEBROW** | Eyebrow | `Skaffu · skaffu.com` | *Gemensam veckohandel · skaffu.com* | 5s scroll depth to differentiators | — |
| **L-SEC** | Hero secondary | skafferiet i bakgrunden | minne i bakgrunden | D7 retention; qual *"what is Skaffu?"* | — |

**Do not A/B on landing:** `receipt_hero` variants (move to `/kvitto-pdf-kivra`), variant B pantry H1 (SEO page only).

## Instrumentation

- Keep `landing_variant` cookie for L-H1 / L-CTA / L-EYEBROW / L-SEC.
- Add optional qual snippet post-register: *"Vad tror du Skaffu hjälper er med?"* (single select: lista / skafferi / skanna / minska svinn / vet inte) — feeds 5-second test without user interviews.

---

**Key gap (one sentence):** Hero promises shared lista, but the secondary line and everything below the fold still train *pantry scanner / skafferi-app* — so the 5-second story is Bring-plus-inventory, not *gemensam veckohandel med hushållets minne*.

**Related:** [SKAFFU_2026_VISION.md](./SKAFFU_2026_VISION.md) · [HIGHEST_LEVERAGE.md](./HIGHEST_LEVERAGE.md) · [DUO_WEDGE_SHIPPED.md](./DUO_WEDGE_SHIPPED.md)
