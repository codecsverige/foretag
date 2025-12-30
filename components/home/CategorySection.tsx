import Link from 'next/link'

const categories = [
  { id: 'stadning', name: 'Städning', emoji: '🧼' },
  { id: 'flytt', name: 'Flytt & Transport', emoji: '🚚' },
  { id: 'hantverk', name: 'Hantverk & Småjobb', emoji: '🔧' },
  { id: 'hem-fastighet', name: 'Hem & Fastighet', emoji: '🏠' },
]

export default function CategorySection() {
  return (
    <section className="py-10 bg-white">
      <div className="max-w-5xl mx-auto px-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Populära kategorier</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/sok?kategori=${cat.id}`}
              className="group px-4 py-4 bg-gray-50 hover:bg-white border border-gray-200 hover:border-brand/30 rounded-2xl text-center shadow-sm hover:shadow-md transition-all"
            >
              <span className="text-2xl mb-2 block">{cat.emoji}</span>
              <span className="text-sm font-medium text-gray-700 group-hover:text-brand transition-colors">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
