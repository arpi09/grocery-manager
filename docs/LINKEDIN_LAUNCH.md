# LinkedIn — kom igång med Skaffu

Kopiera, anpassa i **du-form**, publicera när du är redo för besökare på [skaffu.com](https://skaffu.com).  
**Ärlig beta:** be om feedback, inte “tusentals användare” eller “folk betalar redan” om du inte har siffror från `/admin`.

**Företagssida + godkännande-kö:** För varumärkesinlägg som **Skaffu** (inte personlig profil), skapa Company Page och använd admin-kön — se [LINKEDIN_COMPANY_PAGE.md](./LINKEDIN_COMPANY_PAGE.md). Uppföljningscopy finns i [LINKEDIN_REPOST.md](./LINKEDIN_REPOST.md); agenter kan fylla drafts via `POST /api/admin/social-posts`.

---

## Profil (engångs)

### Rubrik (max ~220 tecken)

Välj en:

```
Bygger Skaffu — skafferi-app för hela hushållet | streckkod, kvitto, utgångsdatum | från idé till produktion på skaffu.com
```

```
Grundare @ Skaffu · SvelteKit · produkt från 0→1 · svenskt hushållsskafferi · öppen beta
```

### Om-sektion (kort)

```
Jag bygger Skaffu — en webbapp som hjälper familjer hålla koll på kyl, frys och skafferi.

• Skanna streckkod eller läs in kvitto (PDF/bild)
• Delat lager för hela hushållet
• Fokus på mindre matsvinn: utgångsdatum och “ät det först”

Produkten är live på skaffu.com. Jag söker hushåll som vill testa och ge ärlig feedback (särskilt med barn/inköp i vardagen).

Teknik: SvelteKit, PostgreSQL, egen auth, CI med e2e, deploy till Firebase App Hosting.

Intresserad av produkt, retention och PMF — inte bara fler features.
```

### Utvald länk

- **Titel:** Skaffu — skafferi för hela hushållet  
- **URL:** https://skaffu.com  

---

## Första inlägget (rekommenderat — “lansering / beta”)

```
Jag har byggt något jag själv saknade i vardagen: Skaffu.

Det är en skafferi-app för hela hushållet — kyl, frys och skafferi på ett ställe.

Så här kommer man igång på under en minut:
→ skanna en streckkod, eller
→ ladda upp ett kvitto (PDF eller bild)

Sedan ser ni utgångsdatum, förslag på vad som bör ätas först, och en gemensam inköpslista.

Jag har tagit det från idé till produktion (skaffu.com) — med fokus på att det ska fungera på mobilen, inte bara i en demo.

Nu vill jag beta-testare: familjer, sambos, studenter som handlar åt flera.

Vill du prova?
1. Gå till skaffu.com
2. Skapa konto (gratis i beta)
3. Skanna EN vara eller lägg in ETT kvitto
4. Skriv en kommentar eller DM med vad som kändes bra / jobbigt

Tack på förhand — ärlig feedback betyder mer än likes.

#skaffu #matsvinn #produktutveckling #startup #familj
```

---

## Kort variant (om du vill posta ofta)

```
Skaffu = delat skafferi för hushållet.

Streckkod eller kvitto → lager med utgångsdatum → mindre matsvinn.

Beta på skaffu.com — vem testar med mig denna vecka?
```

---

## “Byggare / CTO-vinkel” (för nätverk med tech-ledare)

```
De senaste månaderna har jag byggt Skaffu — inte som sidoprojekt-CRUD utan som komplett produkt:

• Auth, hushåll, roller
• Streckkod + kvitto-PDF + AI-tolkning
• PMF-events och admin-dashboard
• Marketing-site + app i samma deploy
• GitHub Actions: lint, integrationstester, Playwright, deploy till Firebase App Hosting

Det som medvetet väntar: hård monetarisering tills retention i en liten kohort känns riktig.

Om du leder team och bryr dig om 0→1-exekvering: jag delar gärna lärdomar (scope, e2e som gate, när man *inte* ska ship:a Stripe live).

Prova gärna skaffu.com och säg vad som brister för en vanlig familj på mobil.

#product #engineering #sveltekit #founder
```

---

## Måndagsritual — demo-inlägg (Veckan fixad)

```
Måndag = planering i vår familj.

I Skaffu har jag paketerat det som "Veckan fixad":
→ utgående varor visas direkt
→ AI föreslår upp till fem middagar
→ ett klick — matplan + saknade varor på inköpslistan

Inte ännu ett recept-flöde — samma lager som på hem, samma kvitto och scan.

Vill du se flödet?
1. skaffu.com → hem (mån–ons syns hero-kortet)
2. eller gå direkt till /planer/vecka
3. skriv vad som kändes smidigt / klumpigt

Screenshot: hero "Veckan fixad" på /hem eller förslagslistan på /planer/vecka.

#skaffu #matsvinn #matplanering #produktutveckling
```

---

## Uppföljningsinlägg (vecka 2–4)

### Efter första testare

```
Tack till er som testat Skaffu denna vecka.

Vanligaste insikten hittills: [FYLL I — t.ex. “första scan gick bra, men kvittot var otydligt”]

Jag har fixat / förbättrat: [FYLL I — t.ex. enklare scan, tydligare hemvy]

Fortfarande beta — skaffu.com. Vill du vara med i nästa våg? Kommentera “beta”.
```

### Matsvinn / hållbarhet (värdebaserat)

```
Vi kastar mat i Sverige i onödan — ofta för att “det där i kylen” glöms bort.

Skaffu är mitt försök att göra det synligt i hushållet:
utgångsdatum, “ät det först”, gemensamt lager.

Inte en livsstilsapp med perfekta recept — en praktisk skafferi-app.

Beta: skaffu.com
```

---

## Kommentar-svar (spara som mallar)

| De skriver | Du svarar |
|------------|-----------|
| “Är det gratis?” | “Ja i beta. Pro-plan kommer senare; just nu vill jag ha feedback på kärnflödet först.” |
| “Finns det i App Store?” | “Webb/PWA idag — funkar på mobil utan nedladdning. Native kan komma om retention motiverar det.” |
| “Hur skiljer det sig från X?” | “Fokus på svenskt hushåll: kvitto-PDF, delat lager, utgång + ät-först — inte recept-feed.” |
| “Kan jag få inbjudan?” | “Skapa konto direkt på skaffu.com — säg till om något strular så fixar jag snabbt.” |
| “Söker du folk?” | Anpassa: beta-testare nu; ev. samarbete senare. |

---

## Vad du **inte** ska skriva (än)

- “Tusentals användare” / “viral” utan data  
- “Folk betalar redan” (Stripe live / betalande kohort saknas i docs)  
- “AI-agenter i produkten” (det är ditt dev-verktyg, inte kundfeature)  
- “Perfekt för alla” — säg **familj / hushåll / inköp i vardagen**

---

## Publiceringsplan (enkel)

| Dag | Åtgärd |
|-----|--------|
| **0** | Uppdatera profil + utvald länk → skaffu.com |
| **1** | Första inlägget (beta) |
| **3–7** | Svara alla kommentarer/DM inom 24 h |
| **7** | Uppföljning med 1 konkret lärdom från test |
| **14** | Ev. tech-inlägg om du söker ledar-/produktroller |

Posta **morgon eller lunch** (SE-tid), **tis–tors** brukar fungera bättre än helg.

---

## Bild / media (valfritt)

- Skärmdump: `/hem` med “ät det först”  
- Kort video (15–30 s): scan → vara tillagd  
- Ingen screenshot med riktiga familjemedlemmars e-post utan samtycke  

---

## DM till vänner/familj (privat, innan publikt inlägg)

```
Hej! Jag har släppt en beta av Skaffu — appen vi pratat om för skafferiet.

skaffu.com — skapa konto och testa EN grej (scan eller kvitto).

Ärlig feedback på 2 min räcker. Kan jag citera dig anonymt om något var knas?
```

---

## Checklista innan du postar

- [ ] Release grön på `master` (senaste deploy live)  
- [ ] Du har själv klarat: registrering → scan **eller** kvitto → ser varan på `/hem`  
- [ ] `skaffu.com` öppnas på mobil  
- [ ] Du har tid att svara kommentarer samma dag  

---

## Förhandsbild (og:image) — projekt, inlägg och utvald länk

Sajten serverar **PNG** (`/og-skaffu.png`, 1200×630) som absolut HTTPS-URL i `og:image` via `MarketingSeoHead` på `/` och övriga marketing-sidor. LinkedIn läser **inte** SVG — tidigare pekade meta på `og-skaffu.svg`, vilket gav tom/miniatyr.

**Efter deploy:** LinkedIn cachar länkförhandsgranskning länge. Uppdatera inte bara projektet i UI — kör först:

1. Öppna [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/)
2. Klistra in `https://skaffu.com` och klicka **Inspect**
3. Bekräfta att förhandsbilden visas (grön Skaffu-banner)
4. Spara om LinkedIn-projektet / utvald länk om miniatyren fortfarande är gammal

Om miniatyren saknas trots Inspector: kontrollera att `og:image` i HTML är `https://skaffu.com/og-skaffu.png?v=…` och att bilden svarar `200` utan inloggning.

---

## Relaterat i repot

- [BETA_TESTER_GUIDE.md](./BETA_TESTER_GUIDE.md) — vad testare ska göra  
- [MARKETING_SITE.md](./MARKETING_SITE.md) — landningssida & SEO  
- [COMPETITIVE_ANALYSIS.md](./COMPETITIVE_ANALYSIS.md) — positionering (ärlig PMF-status)
