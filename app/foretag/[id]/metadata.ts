import { Metadata } from 'next'
import { db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'

export async function generateCompanyMetadata(id: string): Promise<Metadata> {
  if (!db) {
    return {
      title: 'Företag | BokaNära',
      description: 'Hitta och boka tjänster nära dig',
    }
  }

  try {
    const companyDoc = await getDoc(doc(db, 'companies', id))
    
    if (!companyDoc.exists()) {
      return {
        title: 'Företag hittades inte | BokaNära',
      }
    }

    const company = companyDoc.data()
    const title = `${company.name} - ${company.categoryName || company.category || 'Tjänster'} i ${company.city || 'Sverige'}`
    const description = company.description
      ? company.description.slice(0, 160)
      : `Boka ${company.categoryName || company.category} med ${company.name} i ${company.city}. ${
          company.rating ? `Betyg: ${company.rating}/5` : ''
        }`

    const images = Array.isArray(company.images) && company.images.length > 0
      ? company.images.map((img: string) => ({ url: img }))
      : company.image
      ? [{ url: company.image }]
      : []

    return {
      title,
      description,
      keywords: [
        company.name,
        company.category,
        company.categoryName,
        company.city,
        'boka',
        'tjänster',
      ].filter(Boolean).join(', '),
      openGraph: {
        title,
        description,
        type: 'website',
        locale: 'sv_SE',
        images,
        siteName: 'BokaNära',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images,
      },
      alternates: {
        canonical: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://bokanara.se'}/foretag/${id}`,
      },
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    return {
      title: 'Företag | BokaNära',
      description: 'Hitta och boka tjänster nära dig',
    }
  }
}
