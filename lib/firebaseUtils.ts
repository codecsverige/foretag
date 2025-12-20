/* ────────────────────────────────────────────────
   lib/firebaseUtils.ts
   Utility functions for Firebase operations
──────────────────────────────────────────────── */

/**
 * Validate Firebase configuration and log warnings
 */
export function validateFirebaseConfig(): boolean {
  const requiredEnvVars = {
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  }

  const missingVars: string[] = []
  
  for (const [key, value] of Object.entries(requiredEnvVars)) {
    if (!value) {
      missingVars.push(key)
    }
  }

  if (missingVars.length > 0) {
    console.warn('⚠️ Missing Firebase environment variables:', missingVars.join(', '))
    return false
  }

  // Validate project ID
  const projectId = requiredEnvVars.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  if (projectId && projectId !== 'bokanara-4797d') {
    console.warn(`⚠️ WARNING: Project ID is "${projectId}", expected "bokanara-4797d"`)
    console.warn('⚠️ Make sure you are connected to the correct Firebase project!')
  } else if (projectId === 'bokanara-4797d') {
    console.log('✅ Firebase configured for BokaNära project')
  }

  return true
}

/**
 * Retry a Firestore operation with exponential backoff
 */
export async function retryFirestoreOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error: unknown) {
      const err = error as Error & { code?: string }
      lastError = err
      console.warn(`Firestore operation failed (attempt ${attempt + 1}/${maxRetries}):`, err.message)
      
      // Don't retry on certain errors
      if (
        err.code === 'permission-denied' ||
        err.code === 'invalid-argument' ||
        err.code === 'unauthenticated'
      ) {
        throw err
      }
      
      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }
  
  throw lastError || new Error('Firestore operation failed after retries')
}

/**
 * Company/Ad data structure for validation
 */
export interface CompanyData {
  name: string
  category: string
  city: string
  description: string
  phone: string
  status: string
  services: Array<{
    name: string
    price: number
    duration?: number
    description?: string
  }>
  [key: string]: any // Allow additional fields
}

/**
 * Validate required fields for a company/ad document
 */
export function validateCompanyData(data: CompanyData): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // Required fields
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    errors.push('Name is required')
  }
  
  if (!data.category || typeof data.category !== 'string') {
    errors.push('Category is required')
  }
  
  if (!data.city || typeof data.city !== 'string') {
    errors.push('City is required')
  }
  
  if (!data.description || typeof data.description !== 'string' || data.description.trim().length === 0) {
    errors.push('Description is required')
  }
  
  if (!data.phone || typeof data.phone !== 'string' || data.phone.trim().length === 0) {
    errors.push('Phone is required')
  }
  
  if (!data.status || typeof data.status !== 'string') {
    errors.push('Status is required')
  }
  
  // Validate services array
  if (!data.services || !Array.isArray(data.services) || data.services.length === 0) {
    errors.push('At least one service is required')
  } else {
    data.services.forEach((service: any, index: number) => {
      if (!service.name || typeof service.name !== 'string') {
        errors.push(`Service ${index + 1}: name is required`)
      }
      if (typeof service.price !== 'number' || service.price < 0) {
        errors.push(`Service ${index + 1}: valid price is required`)
      }
    })
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}
