# 💰 Hur betalningssystemet fungerar

## Översikt

VägVänner använder ett **Authorize → Capture** betalningsflöde via PayPal med ett 48-timmars säkerhetsfönster.

---

## Betalningsflöde

### Steg 1: Gratis bokning (Passagerare)
1. Passageraren söker efter en resa
2. Klickar "Boka resa" och fyller i namn, telefon och meddelande
3. Skickar bokning **utan betalning**
4. Bokningen sparas med status: `requested`

### Steg 2: Kontaktupplåsning (Förare)
1. Föraren ser bokningen i inbox
2. Klickar "Lås upp kontakt" för att få passagerarens telefonnummer
3. Omdirigeras till betalningssidan
4. Väljer vad hen vill dela (telefon/e-post/båda/inget)
5. Klickar på PayPal-knappen och betalar **10 SEK**

**Viktigt:** PayPal **reserverar** bara pengarna (AUTHORIZED), drar inte ännu!

### Steg 3: Omedelbar upplåsning
Efter godkänd PayPal-betalning:
- Kontaktuppgifterna visas **direkt** för föraren
- Status ändras till: `authorized`
- Ett 48-timmars fönster börjar: `reportWindowEndsAt = nu + 48h`
- Föraren kan ringa/maila passageraren omedelbart

### Steg 4: Vänteperiod (48 timmar)

Under dessa 48 timmar kan föraren:

**Alternativ A: Allt fungerar**
- Ringer passageraren
- Kontakten fungerar perfekt
- Gör **ingenting** (väntar bara)

**Alternativ B: Problem**
- Fel nummer / ingen svarar / tekniskt fel
- Klickar "Rapportera problem"
- Systemet markerar: `refundRequested: true`

### Steg 5: Automatisk avveckling (efter 48h)

En Cloud Function (`settleAuthorizedBookings`) körs **varje dag kl 11:00** och:

1. Söker efter bokningar med:
   - `status == "authorized"`
   - `reportWindowEndsAt <= nu`

2. För varje bokning:

**OM inget problem rapporterat:**
- Anropar PayPal API: `POST /v2/payments/authorizations/{authId}/capture`
- PayPal **drar pengarna** från förarens kort
- Uppdaterar status till: `captured`
- **10 SEK överförs till VägVänner-kontot** 💰

**OM problem rapporterat:**
- Anropar **INTE** PayPal
- Låter authorization löpa ut automatiskt
- Uppdaterar status till: `voided`
- **Pengarna frigörs tillbaka till föraren** ✅

---

## Penningflöde

### Vid upplåsning (Tidpunkt 0)
```
Förarens kort:        10 000 SEK
Reserverat:               10 SEK (AUTHORIZED)
VägVänner-konto:           0 SEK
```

### Efter 48h - Inget problem
```
Cloud Function kör → PayPal Capture → Pengar dras

Förarens kort:         9 990 SEK
VägVänner-konto:          10 SEK 💰
Status: CAPTURED
```

### Efter 48h - Problem rapporterat
```
Cloud Function kör → Hoppar över → Authorization löper ut

Förarens kort:        10 000 SEK (pengar tillbaka)
VägVänner-konto:           0 SEK
Status: VOIDED
```

---

## Teknisk implementation

### Frontend
- **Komponent:** `src/components/PayPalSimple.jsx`
- **Sida:** `src/pages/UnlockContactPage.jsx`
- **Konfiguration:** `src/config/paypal.js`
  - Production: `intent: 'authorize'`
  - Development: `intent: 'capture'`

### Backend
- **Cloud Function:** `functions/index.js → settleAuthorizedBookings`
- **Schema:** `"0 11 * * *"` (dagligen kl 11:00 Stockholm-tid)
- **Region:** `europe-west1`

### Databas (Firestore)
```javascript
// Vid bokning
{
  status: "requested",
  bookingType: "seat_booking"
}

// Efter PayPal-betalning
{
  status: "authorized",
  contactUnlockedAt: 1699086400000,
  reportWindowEndsAt: 1699259200000,  // +48h
  commission: 10,
  paypal: {
    status: "AUTHORIZED",
    authorizationId: "7GH53639GA123456E",
    amount: 10,
    currency: "SEK"
  }
}

// Efter 48h - Capture
{
  status: "captured",
  capturedAt: 1699259200000,
  paypal: {
    status: "CAPTURED",
    captureResult: { ... }
  }
}

// Efter 48h - Void
{
  status: "voided",
  voidedAt: 1699259200000,
  refundRequested: true
}
```

---

## Säkerhet

### Dubblettskydd
- Bokningslås (10 min TTL) förhindrar dubbel bearbetning
- Status-kontroll innan capture
- Transaktionsbaserade uppdateringar i Firestore

### Felhantering
- Om `authorizationId` saknas → automatisk void
- Om PayPal capture misslyckas → status: `error`
- Timeout-hantering för API-anrop

---

## Miljövariabler

### Frontend (.env)
```bash
REACT_APP_PAYPAL_CLIENT_ID=AYourPayPalClientId...
```

### Backend (Firebase Functions)
```bash
PAYPAL_CLIENT_ID=AYourPayPalClientId...
PAYPAL_CLIENT_SECRET=YourPayPalSecret...
```

---

## Sammanfattning

| Fas | Vad händer | Pengar | Status |
|-----|------------|--------|--------|
| 1. Bokning | Passagerare bokar | 0 SEK | `requested` |
| 2. Upplåsning | Förare betalar | Reserverat (10 SEK) | `authorized` |
| 3. Väntetid | 48h fönster | Fortfarande reserverat | `authorized` |
| 4a. Capture | Inget problem | Debiterat (10 SEK) | `captured` |
| 4b. Void | Problem rapporterat | Återbetalat (0 SEK) | `voided` |

**Systemet är komplett och fullt funktionellt.** ✅