import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Integritetspolicy | BokaNära',
  description: 'Läs om hur vi hanterar dina personuppgifter och skyddar din integritet.',
}

export default function IntegritetPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <Link href="/" className="text-blue-600 hover:underline mb-6 inline-block">
          ← Tillbaka till startsidan
        </Link>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Integritetspolicy</h1>
        
        <div className="bg-white rounded-lg shadow-sm p-8 space-y-6">
          <p className="text-gray-600">
            Senast uppdaterad: {new Date().toLocaleDateString('sv-SE')}
          </p>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">1. Inledning</h2>
            <p className="text-gray-700">
              BokaNära värnar om din personliga integritet. Denna integritetspolicy förklarar hur vi samlar in, 
              använder och skyddar dina personuppgifter när du använder vår tjänst.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">2. Vilka uppgifter vi samlar in</h2>
            <p className="text-gray-700">Vi kan samla in följande typer av personuppgifter:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Namn och kontaktuppgifter (e-post, telefonnummer)</li>
              <li>Företagsinformation för företagskonton</li>
              <li>Bokningshistorik och preferenser</li>
              <li>Teknisk information om din enhet och webbläsare</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">3. Hur vi använder dina uppgifter</h2>
            <p className="text-gray-700">Dina personuppgifter används för att:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Tillhandahålla och förbättra våra tjänster</li>
              <li>Hantera bokningar och kommunikation</li>
              <li>Skicka relevant information och uppdateringar</li>
              <li>Följa lagkrav och skydda våra rättigheter</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">4. Delning av uppgifter</h2>
            <p className="text-gray-700">
              Vi säljer aldrig dina personuppgifter till tredje part. Vi kan dela uppgifter med 
              tjänsteleverantörer som hjälper oss att driva vår verksamhet, under strikta sekretessavtal.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">5. Dina rättigheter</h2>
            <p className="text-gray-700">Enligt GDPR har du rätt att:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Begära tillgång till dina personuppgifter</li>
              <li>Begära rättelse av felaktiga uppgifter</li>
              <li>Begära radering av dina uppgifter</li>
              <li>Invända mot viss behandling av dina uppgifter</li>
              <li>Begära dataportabilitet</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">6. Kontakt</h2>
            <p className="text-gray-700">
              Om du har frågor om vår integritetspolicy eller vill utöva dina rättigheter, 
              kontakta oss via vår <Link href="/kontakt" className="text-blue-600 hover:underline">kontaktsida</Link>.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
