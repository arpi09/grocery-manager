# Skaffu — guide för familjetest (beta)

Kort guide för att testa **https://skaffu.com** tillsammans. Appen är under utveckling; rapportera gärna konstiga texter, krascher eller saker som känns otydliga.

## Kom igång

1. Öppna **https://skaffu.com** och läs landningssidan.
2. Välj **Skapa konto** (eller **Logga in** om du redan har konto).
3. Vid registrering: fyll i e-post och lösenord och slutför **säkerhetskontrollen** (Cloudflare Turnstile).
4. Efter inloggning landar du på **Hem**. En kort **introduktion** kan visas — du kan hoppa över eller följa den; den pekar mot skanning.
5. Välj **Streckkod** eller **Kvitto** i introduktionen, eller gå till **Skanna** i menyn längst ned.

**Tips:** På mobil fungerar skanning bäst. Tillåt kameratillgång när webbläsaren frågar. I skanningsflödet finns knapp för att **vända kamera** (fram/bak).

## Det viktigaste att testa

| Område | Vad du gör |
|--------|------------|
| **Streckkod** | Meny → **Skanna** → **Streckkod** → skanna en vara eller skriv streckkod manuellt → spara till kyl/skafferi/frys. |
| **Kvitto** | **Skanna** → **Kvitto** → ladda upp PDF eller foto → granska rader → lägg till i lagret. |
| **Foto-runda** | **Skanna** → **Foto-runda** → välj zon → ta 1–3 foton → analysera och godkänn förslag. |
| **Hushåll** | **Mer** → **Hushåll** → byt namn, bjud in via **delningslänk** (skicka länken till en familjemedlem). Den andra öppnar länken, loggar in/registrerar sig och går med. |
| **Inköpslista** | **Inköp** — lägg till, bocka av, dela samma lista inom hushållet. |
| **Utgång** | På **Hem** / inventering: kolla **Går ut snart** och att datum känns rimliga. |

## Kända begränsningar (just nu)

- **Google-inloggning** visas bara om ägaren har konfigurerat OAuth i produktion (hemligheter + `grantaccess` mot App Hosting-backend). Annars: e-post + lösenord.
- **Betalning / Pro (Stripe)** är främst för utveckling/test — familjetestare behöver normalt inte uppgradera.
- **Push-notiser** kräver att du tillåter notiser i webbläsaren under **Inställningar**; de är valfria.
- **AI-funktioner** (kvitto, foto-runda, recept) kan vara långsamma eller misslyckas vid dålig bild/PDF — försök igen med tydligare foto.
- Appen är en **webbapp (PWA)**; “lägg till på hemskärmen” fungerar på mobil men är inte obligatoriskt.

## Om något strular

- **Kan inte registrera dig:** kontrollera att Turnstile laddas (ingen aggressiv adblocker).
- **Inbjudan funkar inte:** länken kan ha gått ut eller återkallats — be hushållsägaren skapa en ny länk under **Hushåll**.
- **Skanning:** prova manuell streckkod eller bättre belysning; på dator är streckkodsläsare begränsad.

Kontakta **Arvid** med skärmdump och ungefär vilken sida du var på.

---

*Senast uppdaterad för deploy på skaffu.com — familjebeta.*
