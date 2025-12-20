/**
 * Loading and skeleton components for better UX
 */

export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-4',
  }

  return (
    <div className={`animate-spin rounded-full ${sizeClasses[size]} border-brand border-t-transparent`} />
  )
}

export function LoadingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600">Laddar...</p>
      </div>
    </div>
  )
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
      <div className="h-48 bg-gray-200" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-1/3" />
        <div className="h-6 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        <div className="flex justify-between pt-3 border-t border-gray-100">
          <div className="h-4 bg-gray-200 rounded w-1/4" />
          <div className="h-4 bg-gray-200 rounded w-1/4" />
        </div>
      </div>
    </div>
  )
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2 animate-pulse">
      {Array.from({ length: lines }).map((_, i) => (
        <div 
          key={i} 
          className={`h-4 bg-gray-200 rounded ${i === lines - 1 ? 'w-2/3' : 'w-full'}`} 
        />
      ))}
    </div>
  )
}

export function SkeletonCompanyHeader() {
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden animate-pulse">
      <div className="h-64 bg-gray-200" />
      <div className="p-6 space-y-4">
        <div className="flex gap-2">
          <div className="h-6 bg-gray-200 rounded w-20" />
          <div className="h-6 bg-gray-200 rounded w-24" />
        </div>
        <div className="h-8 bg-gray-200 rounded w-2/3" />
        <div className="flex gap-3">
          <div className="h-12 bg-gray-200 rounded w-32" />
          <div className="h-12 bg-gray-200 rounded w-32" />
        </div>
      </div>
    </div>
  )
}

export function ButtonLoading({ children, isLoading, ...props }: any) {
  return (
    <button {...props} disabled={isLoading || props.disabled}>
      {isLoading ? (
        <span className="flex items-center justify-center gap-2">
          <LoadingSpinner size="sm" />
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  )
}

export default {
  LoadingSpinner,
  LoadingPage,
  SkeletonCard,
  SkeletonText,
  SkeletonCompanyHeader,
  ButtonLoading,
}
