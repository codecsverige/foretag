interface LocalBusinessProps {
  name: string
  description?: string
  address?: string
  city?: string
  phone?: string
  email?: string
  website?: string
  rating?: number
  reviewCount?: number
  priceRange?: string
  image?: string
  openingHours?: Record<string, { open: string; close: string; closed: boolean }>
}

export function generateLocalBusinessSchema(props: LocalBusinessProps) {
  const {
    name,
    description,
    address,
    city,
    phone,
    email,
    website,
    rating,
    reviewCount,
    priceRange,
    image,
    openingHours,
  } = props

  const openingHoursSpecification = openingHours
    ? Object.entries(openingHours)
        .filter(([_, hours]) => !hours.closed)
        .map(([day, hours]) => ({
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: capitalize(day),
          opens: hours.open,
          closes: hours.close,
        }))
    : undefined

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name,
    description: description || `${name} - Professionella tjänster i ${city || 'Sverige'}`,
    ...(address && city && {
      address: {
        '@type': 'PostalAddress',
        streetAddress: address,
        addressLocality: city,
        addressCountry: 'SE',
      },
    }),
    ...(phone && { telephone: phone }),
    ...(email && { email }),
    ...(website && { url: website }),
    ...(image && { image }),
    ...(rating && reviewCount && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: rating,
        reviewCount: reviewCount,
        bestRating: 5,
        worstRating: 1,
      },
    }),
    ...(priceRange && { priceRange }),
    ...(openingHoursSpecification && { openingHoursSpecification }),
  }

  return schema
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function JSONLDScript({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
