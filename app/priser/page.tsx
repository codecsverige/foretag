import { Metadata } from 'next'
import Link from 'next/link'
import { HiCheck, HiX, HiStar, HiSparkles, HiLockOpen } from 'react-icons/hi'

export const metadata: Metadata = {
  title: 'Priser | BokaNära',
  description: 'Se våra prisnivåer för företag. Kom igång gratis och betala bara när du får kunder.',
}

type PlanFeature = {
  text: string
  included: boolean
  note?: string
  highlight?: boolean
}

type Plan = {
  id: 'free' | 'pro' | 'premium'
  name: string
  price: number
  period: string
  description: string
  badge: string | null
  features: PlanFeature[]
  cta: string
  ctaLink: string
  popular: boolean
  color: string
}

const plans: Plan[] = [
  {
    id: 'free',
    name: 'Gratis',
    price: 0,
    period: '',
    description: 'Perfekt för att testa och komma igång',
    badge: null,
    features: [
      { text: 'Upp till 3 annonser', included: true },
      { text: 'Första 3 bokningar gratis', included: true },
      { text: 'Telefonnummer delvis dolt', included: true, note: '07X XXX XX XX' },
      { text: '1 gratis redigering', included: true },
      { text: 'Grundläggande statistik', included: true },
      { text: 'Obegränsade bokningar', included: false },
      { text: 'Kampanjer & rabatter', included: false },
      { text: 'Prioriterad i sökresultat', included: false },
    ],
    cta: 'Kom igång gratis',
    ctaLink: '/skapa',
    popular: false,
    color: 'gray'
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 199,
    period: '/mån',
    description: 'För aktiva företag med många kunder',
    badge: '⭐ Pro',
    features: [
      { text: 'Upp till 3 annonser', included: true },
      { text: 'Obegränsade bokningar', included: true, highlight: true },
      { text: 'Telefonnummer visas helt', included: true, highlight: true },
      { text: 'Obegränsade redigeringar', included: true },
      { text: 'Avancerad statistik', included: true },
      { text: 'Pro-märke på profilen', included: true },
      { text: 'Kampanjer & rabatter', included: false },
      { text: 'Prioriterad i sökresultat', included: false },
    ],
    cta: 'Uppgradera till Pro',
    ctaLink: '/konto?tab=subscription',
    popular: true,
    color: 'brand'
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 399,
    period: '/mån',
    description: 'För företag som vill dominera marknaden',
    badge: '💎 Premium',
    features: [
      { text: 'Upp till 3 annonser', included: true },
      { text: 'Obegränsade bokningar', included: true },
      { text: 'Telefonnummer visas helt', included: true },
      { text: 'Obegränsade redigeringar', included: true },
      { text: 'Full statistik & rapporter', included: true },
      { text: 'Premium-märke på profilen', included: true, highlight: true },
      { text: 'Kampanjer & rabatter', included: true, highlight: true },
      { text: 'Prioriterad i sökresultat', included: true, highlight: true },
    ],
    cta: 'Uppgradera till Premium',
    ctaLink: '/konto?tab=subscription',
    popular: false,
    color: 'purple'
  }
]

export default function PriserPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
      <div className="max-w-6xl mx-auto px-4">
        <Link href="/" className="text-brand hover:text-brand-dark mb-8 inline-flex items-center gap-2 font-medium">
          ← Tillbaka till startsidan
        </Link>
        
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Priser som passar alla företag</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Skapa din annons gratis. Betala bara när du börjar få kunder.
          </p>
        </div>

        {/* How it works */}
        <div className="bg-brand/5 rounded-2xl p-6 mb-12">
          <h2 className="text-lg font-bold text-center mb-6 flex items-center justify-center gap-2">
            <HiLockOpen className="w-5 h-5 text-brand" />
            Så fungerar det
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-brand text-white rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold">1</div>
              <h3 className="font-semibold mb-1">Skapa annons</h3>
              <p className="text-sm text-gray-600">Gratis & komplett</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-brand text-white rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold">2</div>
              <h3 className="font-semibold mb-1">Få bokningar</h3>
              <p className="text-sm text-gray-600">3 första gratis</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-brand text-white rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold">3</div>
              <h3 className="font-semibold mb-1">Se resultatet</h3>
              <p className="text-sm text-gray-600">Bekräfta att det fungerar</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-amber-500 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold">4</div>
              <h3 className="font-semibold mb-1">Uppgradera</h3>
              <p className="text-sm text-gray-600">För fler bokningar</p>
            </div>
          </div>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {plans.map((plan) => (
            <div 
              key={plan.id} 
              className={`bg-white rounded-2xl border-2 p-6 relative ${
                plan.popular ? 'border-brand shadow-xl shadow-brand/10 scale-105' : 'border-gray-200'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-brand text-white px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-1">
                    <HiStar className="w-4 h-4" />
                    Populärast
                  </span>
                </div>
              )}
              
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">{plan.name}</h2>
                {plan.badge && (
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    plan.id === 'pro' ? 'bg-brand/10 text-brand' : 'bg-purple-100 text-purple-700'
                  }`}>
                    {plan.badge}
                  </span>
                )}
                <p className="text-gray-500 text-sm mt-2">{plan.description}</p>
              </div>

              <div className="text-center mb-6">
                <span className="text-5xl font-bold text-gray-900">{plan.price}</span>
                {plan.price > 0 && <span className="text-gray-500 ml-1">kr{plan.period}</span>}
                {plan.price === 0 && <span className="text-gray-500 ml-1">kr</span>}
              </div>
              
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    {feature.included ? (
                      <HiCheck className={`w-5 h-5 flex-shrink-0 mt-0.5 ${feature.highlight ? 'text-brand' : 'text-green-500'}`} />
                    ) : (
                      <HiX className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
                    )}
                    <span className={`text-sm ${feature.included ? (feature.highlight ? 'text-gray-900 font-medium' : 'text-gray-700') : 'text-gray-400'}`}>
                      {feature.text}
                      {feature.note && <span className="text-gray-400 ml-1">({feature.note})</span>}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.ctaLink}
                className={`block w-full text-center py-3 rounded-xl font-semibold transition ${
                  plan.popular 
                    ? 'bg-brand text-white hover:bg-brand-dark' 
                    : plan.id === 'premium'
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : 'bg-gray-900 text-white hover:bg-gray-800'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Vanliga frågor</h2>
          
          <div className="space-y-4">
            <details className="bg-white rounded-xl border p-4 group">
              <summary className="font-semibold cursor-pointer list-none flex justify-between items-center">
                Vad händer efter 3 gratis bokningar?
                <span className="text-brand group-open:rotate-180 transition">▼</span>
              </summary>
              <p className="mt-3 text-gray-600 text-sm">
                Du kan fortfarande ta emot bokningar, men de blir låsta tills du uppgraderar. 
                Du ser att du har nya bokningar, men kan inte se kundernas information förrän du prenumererar.
              </p>
            </details>

            <details className="bg-white rounded-xl border p-4 group">
              <summary className="font-semibold cursor-pointer list-none flex justify-between items-center">
                Varför är telefonnumret delvis dolt?
                <span className="text-brand group-open:rotate-180 transition">▼</span>
              </summary>
              <p className="mt-3 text-gray-600 text-sm">
                För gratisanvändare visas telefonnumret som 07X XXX XX XX för att skydda din integritet. 
                Kunder kan fortfarande boka direkt via plattformen. Uppgradera till Pro för att visa hela numret.
              </p>
            </details>

            <details className="bg-white rounded-xl border p-4 group">
              <summary className="font-semibold cursor-pointer list-none flex justify-between items-center">
                Kan jag avbryta när som helst?
                <span className="text-brand group-open:rotate-180 transition">▼</span>
              </summary>
              <p className="mt-3 text-gray-600 text-sm">
                Ja! Du kan avbryta din prenumeration när som helst. Du behåller tillgång till alla funktioner 
                fram till slutet av din betalda period.
              </p>
            </details>

            <details className="bg-white rounded-xl border p-4 group">
              <summary className="font-semibold cursor-pointer list-none flex justify-between items-center">
                Vad är skillnaden mellan Pro och Premium?
                <span className="text-brand group-open:rotate-180 transition">▼</span>
              </summary>
              <p className="mt-3 text-gray-600 text-sm">
                Pro ger dig obegränsade bokningar och full telefonnummervisning. 
                Premium ger dig dessutom möjlighet att skapa kampanjer och rabatter, 
                samt prioriterad placering i sökresultaten så fler kunder hittar dig.
              </p>
            </details>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">Har du fler frågor?</p>
          <Link href="/kontakt" className="text-brand hover:text-brand-dark font-medium">
            Kontakta oss så hjälper vi dig →
          </Link>
        </div>
      </div>
    </div>
  )
}
