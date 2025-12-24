// Professional category images from Unsplash (free to use)
// These are small, optimized images that load quickly

export const categoryImages: Record<string, string> = {
  frisor: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&q=80',
  massage: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&q=80',
  stadning: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&q=80',
  bil: 'https://images.unsplash.com/photo-1625047509248-ec889cbff17f?w=600&q=80',
  halsa: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&q=80',
  restaurang: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80',
  fitness: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&q=80',
  utbildning: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&q=80',
  djur: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&q=80',
  it: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=600&q=80',
  annat: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80',
}

export const defaultImage = 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80'

export function getCategoryImage(categoryId?: string): string {
  if (!categoryId) return defaultImage
  return categoryImages[categoryId] || defaultImage
}

export const categoryNames: Record<string, string> = {
  frisor: 'Frisör & Skönhet',
  massage: 'Massage & Spa',
  stadning: 'Städ & Hemservice',
  bil: 'Bil & Motor',
  halsa: 'Hälsa & Sjukvård',
  restaurang: 'Restaurang & Café',
  fitness: 'Träning & Fitness',
  utbildning: 'Utbildning & Kurser',
  djur: 'Djur & Husdjur',
  it: 'IT & Teknik',
  annat: 'Övrigt',
}
