import Link from 'next/link'

interface Category {
  id: string
  name: string
  emoji: string
  count: number
}

export default function CategoryGrid({ categories }: { categories: Category[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
      {categories.map((category) => (
        <Link
          key={category.id}
          href={`/sok?kategori=${category.id}`}
          className="bg-white rounded-xl p-4 text-center hover:shadow-lg transition-all duration-300 border border-gray-100 group"
        >
          <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">
            {category.emoji}
          </div>
          <div className="font-semibold text-gray-900 text-sm">
            {category.name}
          </div>
          <div className="text-gray-400 text-xs mt-1">
            {category.count} företag
          </div>
        </Link>
      ))}
    </div>
  )
}
