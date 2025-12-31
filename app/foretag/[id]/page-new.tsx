import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { db } from '@/lib/firebase'
import { doc, getDoc, collection, getDocs, query, where, orderBy } from 'firebase/firestore'
import { generateCompanyMetadata } from './metadata'
import { generateLocalBusinessSchema } from '@/lib/seo/json-ld'
import CompanyClient from './CompanyClient'

type CompanyDoc = {
  status?: string
  name?: string
  description?: string
  address?: string
  city?: string
  phone?: string
  email?: string
  website?: string
  rating?: number
  reviewCount?: number
  images?: string[]
  image?: string
  openingHours?: Record<string, { open: string; close: string; closed: boolean }>
  [key: string]: unknown
}

// Enable ISR - revalidate every 60 seconds
export const revalidate = 60

// Generate static params for most visited companies
export async function generateStaticParams() {
  if (!db) return []

  try {
    const companiesQuery = query(
      collection(db, 'companies'),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc')
    )
    
    const snapshot = await getDocs(companiesQuery)
    
    return snapshot.docs.slice(0, 50).map((doc) => ({
      id: doc.id,
    }))
  } catch (error) {
    console.error('Error generating static params:', error)
    return []
  }
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  return generateCompanyMetadata(params.id)
}

async function getCompanyData(id: string): Promise<(CompanyDoc & { id: string }) | null> {
  if (!db) return null

  try {
    const companyDoc = await getDoc(doc(db, 'companies', id))
    
    if (!companyDoc.exists()) return null
    
    const data = companyDoc.data() as CompanyDoc
    return { id: companyDoc.id, ...data }
  } catch (error) {
    console.error('Error fetching company:', error)
    return null
  }
}

async function getCompanyReviews(companyId: string) {
  if (!db) return []

  try {
    const reviewsQuery = query(
      collection(db, 'reviews'),
      where('companyId', '==', companyId),
      orderBy('createdAt', 'desc')
    )
    
    const snapshot = await getDocs(reviewsQuery)
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return []
  }
}

export default async function CompanyPage({ params }: { params: { id: string } }) {
  const company = await getCompanyData(params.id)
  
  if (!company) {
    notFound()
  }

  const companyData = company as CompanyDoc & { id: string }

  // Check if company is draft and not published
  // Client component will handle showing draft only to owner
  if (companyData.status === 'draft') {
    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebPage',
              name: companyData.name ?? '',
            }),
          }}
        />
        <CompanyClient company={companyData} reviews={[]} />
      </>
    )
  }

  const reviews = await getCompanyReviews(params.id)

  // Generate JSON-LD structured data
  const jsonLd = generateLocalBusinessSchema({
    name: companyData.name ?? '',
    description: companyData.description,
    address: companyData.address,
    city: companyData.city,
    phone: companyData.phone,
    email: companyData.email,
    website: companyData.website,
    rating: companyData.rating,
    reviewCount: companyData.reviewCount,
    image: Array.isArray(companyData.images) && companyData.images.length > 0
      ? companyData.images[0]
      : companyData.image,
    openingHours: companyData.openingHours,
  })

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CompanyClient company={companyData} reviews={reviews} />
    </>
  )
}
