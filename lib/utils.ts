/**
 * Utility functions for BokaNära
 */

/**
 * Compute the minimum price from an array of services
 * @param services Array of service objects with price property
 * @returns Minimum price, or 0 if no valid prices found
 */
export function computeMinServicePrice(services?: Array<{ price?: number }>): number {
  if (!services || services.length === 0) return 0
  
  const prices = services
    .map(s => s.price)
    .filter((price): price is number => typeof price === 'number' && price > 0)
  
  if (prices.length === 0) return 0
  
  return Math.min(...prices)
}

/**
 * Build a shareable URL for a company page
 * @param companyId The company ID
 * @returns Full URL to the company page
 */
export function buildShareUrl(companyId: string): string {
  // Use NEXT_PUBLIC_APP_URL if available, otherwise use window.location.origin
  const baseUrl = typeof window !== 'undefined' 
    ? (process.env.NEXT_PUBLIC_APP_URL || window.location.origin)
    : (process.env.NEXT_PUBLIC_APP_URL || 'https://bokanara.se')
  
  return `${baseUrl}/foretag/${companyId}`
}

/**
 * Copy text to clipboard
 * @param text Text to copy
 * @returns Promise that resolves when copy is successful
 */
export async function copyToClipboard(text: string): Promise<void> {
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    await navigator.clipboard.writeText(text)
  } else {
    // Fallback for older browsers
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.left = '-999999px'
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
  }
}
