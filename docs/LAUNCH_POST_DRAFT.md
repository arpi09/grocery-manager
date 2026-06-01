# Skaffu — launch-inlägg (utkast)

*Utkast 2026-06-01. Publicera manuellt när du är redo. Byt `[DITT_NAMN]` / lokala grupper efter behov.*

## UTM-mall

| Kanal | `utm_source` | `utm_medium` | `utm_campaign` | Länk |
|--------|--------------|--------------|----------------|------|
| LinkedIn | `linkedin` | `social` | `launch_2026_06` | https://skaffu.com/?utm_source=linkedin&utm_medium=social&utm_campaign=launch_2026_06 |
| Vänner & familj | `friends` | `referral` | `launch_2026_06` | https://skaffu.com/?utm_source=friends&utm_medium=referral&utm_campaign=launch_2026_06 |
| Lokal grupp (FB/Slack) | `local` | `community` | `launch_2026_06` | https://skaffu.com/?utm_source=local&utm_medium=community&utm_campaign=launch_2026_06 |
| Registrering direkt | `linkedin` | `social` | `launch_2026_06` | https://skaffu.com/register?utm_source=linkedin&utm_medium=social&utm_campaign=launch_2026_06 |

---

## Kort variant (LinkedIn / gruppchatt)

Vi har släppt **Skaffu** — ett enkelt sätt att hålla koll på kyl, frys och skafferi tillsammans i hushållet. Scanna varor, få påminnelser innan det går ut, och dela inköpslistan.

Prova gratis: https://skaffu.com/?utm_source=linkedin&utm_medium=social&utm_campaign=launch_2026_06

Feedback välkomnas — särskilt om ni testar med partner eller barn i samma hushåll.

---

## Lång variant (LinkedIn-artikel / lokalt forum)

**Rubrik:** Slipp mat som går ut — hushållets skafferi på ett ställe

Hej! Jag har byggt **Skaffu** för oss som vill slippa gissa vad som finns hemma och vad som snart går ut.

**Vad du kan göra:**
- Lägga in varor med streckkod eller kvitto
- Se vad som finns i kyl, frys och skafferi
- Få påminnelser innan bäst-före
- Dela inköpslistan med resten av hushållet

Det är gratis att komma igång. Jag söker några hushåll som vill testa i en vecka och säga vad som känns krångligt — särskilt första gången ni scannar eller bjuder in någon.

**Länk:** https://skaffu.com/?utm_source=linkedin&utm_medium=social&utm_campaign=launch_2026_06  
**Skapa konto:** https://skaffu.com/register?utm_source=linkedin&utm_medium=social&utm_campaign=launch_2026_06

Tack på förhand — / [DITT_NAMN]

---

## Vänner & familj (DM / WhatsApp)

Hej! Jag har lagt upp Skaffu — app för att hålla koll på mat hemma (kyl/frys/skafferi) och dela inköpslista. Kan du testa en vecka och säga vad som känns konstigt?

https://skaffu.com/?utm_source=friends&utm_medium=referral&utm_campaign=launch_2026_06

---

## Lokal community (Facebook-grupp / föräldragrupp)

Hej alla! Jag delar ett projekt jag använder hemma: **Skaffu** — håller koll på vad som finns i kyl/frys/skafferi och vad som snart går ut. Bra om flera i familjen handlar.

Gratis att testa: https://skaffu.com/?utm_source=local&utm_medium=community&utm_campaign=launch_2026_06

Ingen reklam i tråden om reglerna förbjuder det — ta bort inlägget om det inte passar gruppen.

---

## Före publicering

- [ ] Turnstile OK på https://skaffu.com/register (hostname `skaffu.com` i Cloudflare Turnstile)
- [ ] `www.skaffu.com` redirectar till apex (verifierat 2026-06-01: 302 → skaffu.com)
- [ ] UTM-kampanj namngiven i admin/analytics om ni följer `signup_utm_*`
- [ ] Mejl avstängt tills Resend Verified ([EMAIL.md](./EMAIL.md))
