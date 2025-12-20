# Advertising System Documentation

## Overview
The advertising system allows users to create and publish advertisements for their businesses, separate from the main company profiles system.

## Components

### 1. CreateAd Page (`/app/skapa-annons/page.tsx`)
A 3-step form for creating advertisements:
- **Step 1**: Basic information (company name, category, city, address, description, contact details)
- **Step 2**: Services and images (add multiple services with pricing, upload up to 5 images)
- **Step 3**: Review and publish

### 2. Ad Detail Page (`/app/ad/[id]/page.tsx`)
Displays full details of an advertisement including:
- Company information
- Services and pricing
- Image gallery
- Contact information
- Location details
- Call-to-action sidebar

### 3. AdCard Component (`/components/ad/AdCard.tsx`)
A card component for displaying ads in listings:
- Shows company name, category, and location
- Displays preview image or emoji
- Shows service count and starting price
- "View Details" button

### 4. Home Page Integration
The home page now fetches and displays:
- Premium companies
- Latest companies
- Latest ads (from the `ads` collection)

## Firestore Schema

### Collection: `ads`
```typescript
{
  id: string
  companyName: string
  category: string
  categoryName: string
  emoji: string
  city: string
  address?: string
  description: string
  phone: string
  email?: string
  website?: string
  services: Array<{
    name: string
    price: number
    duration: number
    description: string
  }>
  images?: string[] // URLs from Firebase Storage
  status: 'published' | 'under_review' | 'archived'
  ownerId?: string
  ownerName?: string
  ownerEmail?: string
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

## Firebase Storage

Images are stored in Firebase Storage under the path:
```
ads/{timestamp}_{filename}
```

## Routes

- `/skapa-annons` - Create a new advertisement
- `/ad/[id]` - View an advertisement
- `/` - Home page (displays ads alongside companies)

## Features

1. **Multi-step form** for easy ad creation
2. **Image upload** support (up to 5 images)
3. **Multiple services** can be added with individual pricing
4. **Automatic status** set to "published" on creation
5. **Anonymous creation** (temporarily, until auth is fully configured)
6. **LocalStorage fallback** if Firestore is unavailable

## Differences from Companies System

| Feature | Companies | Ads |
|---------|-----------|-----|
| Collection | `companies` | `ads` |
| Route | `/foretag/[id]` | `/ad/[id]` |
| Create page | `/skapa` | `/skapa-annons` |
| Opening hours | Yes | No |
| Premium status | Yes | No |
| Reviews/Ratings | Yes | No |
| Booking form | Yes | No |

## Usage

### Creating an Ad
1. Navigate to `/skapa-annons`
2. Fill in basic information
3. Add services and optionally upload images
4. Review and publish

### Viewing Ads
- Ads are displayed on the home page in the "📢 Senaste annonserna" section
- Click on any ad card to view full details
- From the detail page, users can contact the business via phone or email

## Future Enhancements

- [ ] Add authentication requirement
- [ ] Implement ad moderation workflow
- [ ] Add ad status management (under_review, archived)
- [ ] Add ad editing functionality
- [ ] Add ad deletion
- [ ] Add search and filtering for ads
- [ ] Add analytics for ad views and interactions
