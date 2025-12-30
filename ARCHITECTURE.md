# 🏗️ Architecture & Performance Guide

## 📋 Overview

This application is built with modern best practices for performance, SEO, and scalability.

### Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Database**: Firebase Firestore
- **Storage**: Firebase Storage
- **State Management**: React Query (TanStack Query)
- **Forms**: React Hook Form + Zod
- **Styling**: Tailwind CSS
- **Monitoring**: Sentry
- **Analytics**: Google Analytics 4

---

## 🚀 Performance Optimizations

### 1. ISR (Incremental Static Regeneration)

Company pages use ISR with 60-second revalidation:

```typescript
// app/foretag/[id]/page-new.tsx
export const revalidate = 60

export async function generateStaticParams() {
  // Pre-render top 50 companies at build time
  // Others are generated on-demand
}
```

**Benefits**:
- ⚡ Instant page loads for pre-built pages
- 🔄 Fresh data every 60 seconds
- 📈 Better SEO with static HTML

### 2. React Query Caching

All data fetching uses React Query for intelligent caching:

```typescript
// lib/hooks/useCompanies.ts
export function useCompanies() {
  return useQuery({
    queryKey: ['companies'],
    queryFn: fetchCompanies,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,   // 10 minutes
  })
}
```

**Benefits**:
- 💾 Automatic caching
- 🔄 Background refetching
- ⚡ Instant navigation
- 📊 DevTools for debugging

### 3. Image Optimization

Using next/image with AVIF/WebP:

```typescript
// next.config.js
images: {
  formats: ['image/avif', 'image/webp'],
  minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  deviceSizes: [640, 750, 828, 1080, 1200, 1920],
}
```

**Benefits**:
- 🖼️ 50-70% smaller images
- 📱 Responsive images
- ⚡ Lazy loading by default
- 🎯 Priority loading for LCP images

### 4. Server vs Client Components

**Server Components** (default):
- Data fetching
- Static content
- SEO metadata

**Client Components** ('use client'):
- Interactivity
- State management
- Event handlers

```typescript
// Server Component (app/foretag/[id]/page-new.tsx)
export default async function CompanyPage({ params }) {
  const company = await getCompanyData(params.id)
  return <CompanyClient company={company} />
}

// Client Component (CompanyClient.tsx)
'use client'
export default function CompanyClient({ company }) {
  const [state, setState] = useState()
  // Interactive UI
}
```

---

## 🔍 SEO Implementation

### 1. Dynamic Metadata

Each page has optimized metadata:

```typescript
// app/foretag/[id]/page-new.tsx
export async function generateMetadata({ params }): Promise<Metadata> {
  return {
    title: `${company.name} - ${company.category} i ${company.city}`,
    description: company.description,
    openGraph: { /* ... */ },
    twitter: { /* ... */ },
  }
}
```

### 2. JSON-LD Structured Data

LocalBusiness schema for rich snippets:

```typescript
// lib/seo/json-ld.ts
const schema = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: company.name,
  aggregateRating: { /* ... */ },
  openingHours: [ /* ... */ ],
}
```

**Benefits**:
- ⭐ Star ratings in search results
- 📍 Address & hours in Google
- 📞 Click-to-call buttons
- 🗺️ Google Maps integration

### 3. Dynamic Sitemap

Auto-generated sitemap with all pages:

```typescript
// app/sitemap.ts
export default async function sitemap() {
  // Static pages + all active companies + categories
  return [...staticPages, ...companies, ...categories]
}
```

**Accessible at**: `https://bokanara.se/sitemap.xml`

---

## 📝 Form Validation

### Zod Schemas

Type-safe validation:

```typescript
// lib/validations/company.ts
export const companySchema = z.object({
  name: z.string().min(2).max(100),
  category: z.string().min(1),
  services: z.array(serviceSchema).min(1),
  phone: z.string().regex(/^[\d\s\+\-\(\)]+$/),
  email: z.string().email(),
})
```

### React Hook Form Integration

```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

const form = useForm({
  resolver: zodResolver(companySchema),
  defaultValues: { /* ... */ }
})
```

**Benefits**:
- ✅ Client & server validation
- 🎯 Type safety
- 📝 Better UX with instant feedback

---

## 🐛 Error Monitoring

### Sentry Configuration

Automatic error tracking:

```typescript
// sentry.client.config.ts
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  replaysOnErrorSampleRate: 1.0,
})
```

**Dashboard**: sentry.io

**What's tracked**:
- ❌ Unhandled errors
- 🐛 API failures
- 📊 Performance metrics
- 🎥 Session replays on errors

---

## 📦 Bundle Optimization

### Code Splitting

```typescript
// Lazy load heavy components
const MapComponent = dynamic(() => import('./Map'), {
  loading: () => <Skeleton />,
  ssr: false
})
```

### Package Optimization

```typescript
// next.config.js
experimental: {
  optimizePackageImports: [
    'react-icons',
    '@tanstack/react-query',
    'firebase'
  ],
}
```

---

## 🔐 Security Headers

```typescript
// next.config.js
async headers() {
  return [{
    source: '/(.*)',
    headers: [
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
    ]
  }]
}
```

---

## 📊 Performance Metrics

### Target Metrics

- **LCP**: < 2.5s
- **FID**: < 100ms
- **CLS**: < 0.1
- **TTI**: < 3.5s

### Monitoring Tools

1. **Lighthouse**: `npm run lighthouse`
2. **React Query DevTools**: In development mode
3. **Sentry Performance**: Real user metrics
4. **Google Analytics**: User behavior

---

## 🚦 Deployment Checklist

### Environment Variables

```bash
# Required
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID

# Optional but recommended
NEXT_PUBLIC_SENTRY_DSN
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
NEXT_PUBLIC_BASE_URL
NEXT_PUBLIC_GA_MEASUREMENT_ID
```

### Build Commands

```bash
# Development
npm run dev

# Production build
npm run build

# Start production server
npm start

# Type check
npm run type-check
```

---

## 📚 File Structure

```
app/
├── foretag/[id]/
│   ├── page-new.tsx        # Server Component (ISR)
│   ├── CompanyClient.tsx   # Client Component
│   └── metadata.ts         # Dynamic metadata
├── sitemap.ts              # Dynamic sitemap
└── layout.tsx              # Root layout

lib/
├── hooks/
│   └── useCompanies.ts     # React Query hooks
├── validations/
│   └── company.ts          # Zod schemas
├── seo/
│   └── json-ld.ts          # Structured data
└── react-query-provider.tsx

components/
├── company/                # Company-related components
└── layout/                 # Layout components
```

---

## 🎯 Best Practices

### Data Fetching

✅ **DO**: Use React Query for client-side fetching
✅ **DO**: Use Server Components for initial data
✅ **DO**: Implement loading states
✅ **DO**: Handle errors gracefully

❌ **DON'T**: Fetch in useEffect without caching
❌ **DON'T**: Block rendering with suspense boundaries unnecessarily

### Performance

✅ **DO**: Use `next/image` for all images
✅ **DO**: Add `priority` to LCP images
✅ **DO**: Lazy load below-the-fold content
✅ **DO**: Monitor bundle size

❌ **DON'T**: Import entire icon libraries
❌ **DON'T**: Use inline styles (use Tailwind)
❌ **DON'T**: Fetch data on every render

### SEO

✅ **DO**: Add unique metadata to each page
✅ **DO**: Use semantic HTML
✅ **DO**: Implement structured data
✅ **DO**: Generate sitemap

❌ **DON'T**: Duplicate content
❌ **DON'T**: Block indexing unintentionally
❌ **DON'T**: Use images for text content

---

## 🆘 Troubleshooting

### Build Errors

**Issue**: TypeScript errors
```bash
npm run type-check
```

**Issue**: Module not found
```bash
rm -rf node_modules .next
npm install
```

### Performance Issues

**Issue**: Slow page loads
- Check React Query DevTools
- Verify ISR is working
- Check image optimization

**Issue**: Large bundle size
```bash
npm run build -- --analyze
```

---

## 📖 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Query Documentation](https://tanstack.com/query)
- [Zod Documentation](https://zod.dev)
- [Sentry Documentation](https://docs.sentry.io)
- [Firebase Documentation](https://firebase.google.com/docs)

---

**Last Updated**: December 2024
**Version**: 2.0.0
