export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 animate-pulse">
      <div className="h-44 sm:h-52 md:h-60 lg:h-64 bg-gray-200" />
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-6 lg:py-8">
        <div className="grid lg:grid-cols-12 gap-4 sm:gap-6">
          <div className="lg:col-span-8 space-y-4 sm:space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5">
              <div className="h-6 bg-gray-100 rounded w-2/3 mb-2" />
              <div className="h-4 bg-gray-100 rounded w-1/2" />
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5">
              <div className="h-4 bg-gray-100 rounded w-1/3 mb-3" />
              <div className="space-y-2">
                <div className="h-3 bg-gray-100 rounded" />
                <div className="h-3 bg-gray-100 rounded" />
                <div className="h-3 bg-gray-100 rounded w-4/5" />
              </div>
            </div>
          </div>
          <div className="lg:col-span-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5">
              <div className="h-5 bg-gray-100 rounded w-1/2 mb-4" />
              <div className="space-y-3">
                <div className="h-10 bg-gray-100 rounded-xl" />
                <div className="grid grid-cols-2 gap-3">
                  <div className="h-10 bg-gray-100 rounded-xl" />
                  <div className="h-10 bg-gray-100 rounded-xl" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="h-10 bg-gray-100 rounded-xl" />
                  <div className="h-10 bg-gray-100 rounded-xl" />
                </div>
                <div className="h-11 bg-gray-200 rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
