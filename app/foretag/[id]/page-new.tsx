import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { db } from '@/lib/firebase'
import { doc, getDoc, collection, getDocs, query, where, orderBy } from 'firebase/firestore'
import { generateCompanyMetadata } from './metadata'
import { generateLocalBusinessSchema, JSONLDScript } from '@/lib/seo/json-ld'
import CompanyClient from './CompanyClient'
import Link from 'next/link'
import { HiArrowLeft, HiLockClosed } from 'react-icons/hi'

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

async function getCompanyData(id: string) {
  if (!db) return null

  try {
    const companyDoc = await getDoc(doc(db, 'companies', id))
    
    if (!companyDoc.exists()) return null
    
    return { id: companyDoc.id, ...companyDoc.data() }
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

  // Check if company is draft and not published
  // Client component will handle showing draft only to owner
  if (company.status === 'draft') {
    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebPage',
              name: company.name,
            }),
          }}
        />
        <CompanyClient company={company} reviews={[]} />
      </>
    )
  }

  const reviews = await getCompanyReviews(params.id)

  // Generate JSON-LD structured data
  const jsonLd = generateLocalBusinessSchema({
    name: company.name,
    description: company.description,
    address: company.address,
    city: company.city,
    phone: company.phone,
    email: company.email,
    website: company.website,
    rating: company.rating,
    reviewCount: company.reviewCount,
    image: Array.isArray(company.images) && company.images.length > 0 
      ? company.images[0] 
      : company.image,
    openingHours: company.openingHours,
  })

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CompanyClient company={company} reviews={reviews} />
    </>
  )
}
