export default function HowItWorks() {
  const steps = [
    {
      number: 1,
      title: 'Sök tjänst',
      description: 'Hitta företag som erbjuder städning eller flyttstäd i ditt område.'
    },
    {
      number: 2,
      title: 'Jämför & välj',
      description: 'Läs omdömen, jämför priser och välj det företag som passar dig.'
    },
    {
      number: 3,
      title: 'Boka enkelt',
      description: 'Boka direkt online eller ring företaget. Bekräftelse via e-post.'
    }
  ]

  return (
    <section className="py-12 bg-white border-t border-gray-200">
      <div className="max-w-5xl mx-auto px-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-8 text-center">Så fungerar det</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step) => (
            <div key={step.number} className="bg-gray-50 border border-gray-200 rounded-2xl p-6 text-center shadow-sm">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                {step.number}
              </div>
              <h3 className="font-medium text-gray-900 mb-2">{step.title}</h3>
              <p className="text-sm text-gray-500">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
