// Professional category images from Unsplash (free to use)
// Multiple images per category for variety

export const categoryImagePool: Record<string, string[]> = {
  stadning: [
    'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&q=75',
    'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=400&q=75',
    'https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?w=400&q=75',
    'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=400&q=75',
  ],
  flytt: [
    'https://images.unsplash.com/photo-1523413651479-597eb2da0ad6?w=400&q=75',
    'https://images.unsplash.com/photo-1600518464441-9154a4dea21b?w=400&q=75',
    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&q=75',
    'https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=400&q=75',
  ],
  hantverk: [
    'https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=400&q=75',
    'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400&q=75',
    'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=400&q=75',
    'https://images.unsplash.com/photo-1590479773265-7464e5d48118?w=400&q=75',
  ],
  'hem-fastighet': [
    'https://images.unsplash.com/photo-1558904541-efa843a96f01?w=400&q=75',
    'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&q=75',
    'https://images.unsplash.com/photo-1592417817098-8fd3d9eb14a5?w=400&q=75',
    'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=400&q=75',
  ],
  annat: [
    'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=75',
    'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=400&q=75',
    'https://images.unsplash.com/photo-1556761175-4b46a572b786?w=400&q=75',
  ],
}

export const defaultImage = 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=75'

// Get consistent image based on company ID (hash)
function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

export function getCategoryImage(categoryId?: string, companyId?: string): string {
  if (!categoryId) return defaultImage
  const images = categoryImagePool[categoryId]
  if (!images || images.length === 0) return defaultImage
  
  // Use company ID to pick consistent image
  const index = companyId ? hashCode(companyId) % images.length : 0
  return images[index]
}

export const categoryNames: Record<string, string> = {
  frisor: 'Frisör & Skönhet',
  massage: 'Massage & Spa',
  stadning: 'Städning',
  flytt: 'Flytt & Transport',
  hantverk: 'Hantverk & Småjobb',
  'hem-fastighet': 'Hem & Fastighet',
  bil: 'Bil & Motor',
  halsa: 'Hälsa & Sjukvård',
  restaurang: 'Restaurang & Café',
  fitness: 'Träning & Fitness',
  utbildning: 'Utbildning & Kurser',
  djur: 'Djur & Husdjur',
  it: 'IT & Teknik',
  annat: 'Övrigt',
}
