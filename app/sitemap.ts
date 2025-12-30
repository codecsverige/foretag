import { MetadataRoute } from 'next'
import { db } from '@/lib/firebase'
import { collection, getDocs, query, where } from 'firebase/firestore'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bokanara.se'

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/sok`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/skapa`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]

  // Fetch active companies
  let companies: MetadataRoute.Sitemap = []
  if (db) {
    try {
      const companiesQuery = query(
        collection(db, 'companies'),
        where('status', '==', 'active')
      )
      const snapshot = await getDocs(companiesQuery)
      
      companies = snapshot.docs.map((doc) => ({
        url: `${baseUrl}/foretag/${doc.id}`,
        lastModified: doc.data().updatedAt?.toDate() || new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }))
    } catch (error) {
      console.error('Error fetching companies for sitemap:', error)
    }
  }

  // Categories
  const categories = [
    'stadning',
    'flyttstad',
    'fonsterputs',
    'hemstadning',
    'kontorsstadning',
  ]

  const categoryPages: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: `${baseUrl}/kategori/${cat}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  return [...staticPages, ...companies, ...categoryPages]
}
