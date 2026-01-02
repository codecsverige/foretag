import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Användarvillkor | BokaNära',
  description: 'Läs våra användarvillkor och villkor för tjänsten BokaNära.',
}

export default function VillkorPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <Link href="/" className="text-blue-600 hover:underline mb-6 inline-block">
          ← Tillbaka till startsidan
        </Link>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Användarvillkor</h1>
        
        <div className="bg-white rounded-lg shadow-sm p-8 space-y-6">
          <p className="text-gray-600">
            Senast uppdaterad: {new Date().toLocaleDateString('sv-SE')}
          </p>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">1. Godkännande av villkor</h2>
            <p className="text-gray-700">
              Genom att använda BokaNära godkänner du dessa användarvillkor. Om du inte godkänner 
              villkoren ber vi dig att inte använda tjänsten. Dessa villkor gäller för alla användare 
              av plattformen, inklusive privatpersoner och företag.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">2. Beskrivning av tjänsten</h2>
            <p className="text-gray-700">
              BokaNära är en plattform som kopplar samman kunder med lokala tjänsteföretag. Vi 
              tillhandahåller verktyg för bokning, schemaläggning och kommunikation mellan parterna.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">3. Användarkonton</h2>
            <p className="text-gray-700">För att använda vissa funktioner behöver du skapa ett konto. Du ansvarar för att:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Ge korrekt och aktuell information vid registrering</li>
              <li>Hålla dina inloggningsuppgifter säkra</li>
              <li>Informera oss omedelbart vid obehörig åtkomst till ditt konto</li>
              <li>All aktivitet som sker via ditt konto</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">4. Användning av tjänsten</h2>
            <p className="text-gray-700">Du förbinder dig att:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Använda tjänsten i enlighet med gällande lagar och regler</li>
              <li>Inte missbruka eller störa tjänstens funktioner</li>
              <li>Inte ladda upp olagligt, stötande eller skadligt innehåll</li>
              <li>Respektera andra användares integritet</li>
              <li>Inte kopiera eller distribuera innehåll utan tillstånd</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">5. Företagsvillkor</h2>
            <p className="text-gray-700">
              Företag som registrerar sig på plattformen förbinder sig att:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Ha korrekta och uppdaterade företagsuppgifter</li>
              <li>Leverera tjänster enligt beskrivning och överenskommelse</li>
              <li>Följa alla tillämpliga lagar och branschregler</li>
              <li>Hantera bokningar och kundkommunikation professionellt</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">6. Bokningar och avbokningar</h2>
            <p className="text-gray-700">
              Bokningar som görs via BokaNära är bindande avtal mellan kunden och tjänsteleverantören. 
              Avbokningsregler varierar mellan olika företag och anges vid bokningstillfället. 
              BokaNära ansvarar inte för tvister som uppstår mellan kunder och företag.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">7. Betalning och priser</h2>
            <p className="text-gray-700">
              Priser för tjänster sätts av respektive företag. Betalning för tjänster sker direkt 
              till företaget om inget annat anges. För premiumtjänster på plattformen gäller 
              de priser som anges på vår prissida.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">8. Ansvarsbegränsning</h2>
            <p className="text-gray-700">
              BokaNära tillhandahåller plattformen i befintligt skick. Vi garanterar inte att 
              tjänsten alltid är tillgänglig eller felfri. Vi ansvarar inte för direkta eller 
              indirekta skador som uppstår genom användning av tjänsten, i den utsträckning 
              lagen tillåter.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">9. Ändringar av villkor</h2>
            <p className="text-gray-700">
              Vi förbehåller oss rätten att uppdatera dessa villkor. Vid väsentliga ändringar 
              kommer vi att meddela dig via e-post eller genom ett meddelande på plattformen. 
              Fortsatt användning efter ändringar innebär godkännande av de nya villkoren.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">10. Uppsägning</h2>
            <p className="text-gray-700">
              Du kan när som helst avsluta ditt konto. Vi förbehåller oss rätten att stänga 
              av eller avsluta konton som bryter mot dessa villkor utan förvarning.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">11. Tillämplig lag</h2>
            <p className="text-gray-700">
              Dessa villkor regleras av svensk lag. Eventuella tvister ska i första hand 
              lösas genom förhandling, och i andra hand avgöras av svensk domstol.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">12. Kontakt</h2>
            <p className="text-gray-700">
              Har du frågor om dessa villkor? Kontakta oss via vår{' '}
              <Link href="/kontakt" className="text-blue-600 hover:underline">kontaktsida</Link>.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
