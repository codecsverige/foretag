'use client'

import { useState } from 'react'
import { HiStar, HiChevronLeft, HiChevronRight } from 'react-icons/hi'

interface Review {
  id: string
  author: string
  rating: number
  comment: string
  date: string
}

interface ReviewSectionProps {
  rating: number
  reviewCount: number
  reviews?: Review[]
}

export default function ReviewSection({ rating, reviewCount, reviews = [] }: ReviewSectionProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const reviewsPerPage = 5
  const totalPages = Math.ceil(reviews.length / reviewsPerPage)
  
  const ratingDistribution = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => Math.round(r.rating) === star).length,
    percent: reviews.length > 0 
      ? (reviews.filter(r => Math.round(r.rating) === star).length / reviews.length) * 100 
      : 0
  }))

  const currentReviews = reviews.slice(
    (currentPage - 1) * reviewsPerPage,
    currentPage * reviewsPerPage
  )

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <div className="space-y-6">
      {/* Rating Overview */}
      <div className="flex flex-col sm:flex-row gap-6 items-start">
        <div className="text-center">
          <div className="text-5xl font-bold text-gray-900">{rating.toFixed(1)}</div>
          <div className="flex items-center justify-center gap-0.5 mt-2">
            {[1, 2, 3, 4, 5].map(star => (
              <HiStar 
                key={star} 
                className={`w-5 h-5 ${star <= Math.round(rating) ? 'text-amber-400' : 'text-gray-200'}`} 
              />
            ))}
          </div>
          <div className="text-sm text-gray-500 mt-1">{reviewCount} omdömen</div>
        </div>

        <div className="flex-1 space-y-2">
          {ratingDistribution.map(({ star, count, percent }) => (
            <div key={star} className="flex items-center gap-3">
              <span className="text-sm text-gray-600 w-3">{star}</span>
              <HiStar className="w-4 h-4 text-amber-400" />
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-400 rounded-full transition-all"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <span className="text-sm text-gray-500 w-8">({count})</span>
            </div>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      {currentReviews.length > 0 ? (
        <div className="space-y-4">
          {currentReviews.map((review) => (
            <div key={review.id} className="border-b border-gray-100 pb-4 last:border-0">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                  {getInitials(review.author)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">{review.author}</span>
                    <span className="text-sm text-gray-400">{review.date}</span>
                  </div>
                  <div className="flex items-center gap-0.5 mt-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <HiStar 
                        key={star} 
                        className={`w-4 h-4 ${star <= review.rating ? 'text-amber-400' : 'text-gray-200'}`} 
                      />
                    ))}
                  </div>
                  {review.comment && (
                    <p className="text-gray-600 mt-2 text-sm">{review.comment}</p>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <HiChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm text-gray-600">
                Sida {currentPage} av {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <HiChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <p>Inga omdömen ännu.</p>
          <p className="text-sm mt-1">Bli den första att lämna ett omdöme!</p>
        </div>
      )}
    </div>
  )
}
