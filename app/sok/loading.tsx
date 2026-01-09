export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-16 z-30">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="h-11 bg-gray-100 rounded-2xl animate-pulse" />
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex flex-col gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 overflow-hidden animate-pulse flex flex-row">
              <div className="w-48 sm:w-60 md:w-80 aspect-[4/3] bg-gray-100 flex-shrink-0" />
              <div className="px-4 py-3 flex-1">
                <div className="h-4 bg-gray-100 rounded w-1/3 mb-3" />
                <div className="h-3 bg-gray-100 rounded w-1/2 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
