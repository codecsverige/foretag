'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { db } from '@/lib/firebase'
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs,
  serverTimestamp,
  doc,
  updateDoc,
  increment
} from 'firebase/firestore'
import { HiStar, HiUser } from 'react-icons/hi'

interface Review {
  id: string
  userId: string
  userName: string
  rating: number
  text: string
  createdAt: any
}

interface ReviewSectionProps {
  companyId: string
  companyName: string
}

export default function ReviewSection({ companyId, companyName }: ReviewSectionProps) {
  let user: any = null
  try {
    const auth = useAuth()
    user = auth.user
  } catch (error) {
    // Auth not available
  }

  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    loadReviews()
  }, [companyId])

  const loadReviews = async () => {
    if (!db) {
      setLoading(false)
      return
    }

    try {
      const q = query(
        collection(db, 'reviews'),
        where('companyId', '==', companyId),
        orderBy('createdAt', 'desc')
      )
      
      const snapshot = await getDocs(q)
      const reviewsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Review[]
      
      setReviews(reviewsData)
    } catch (error) {
      console.error('Error loading reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      alert('Du måste vara inloggad för att lämna ett omdöme')
      return
    }

    if (!db || rating === 0) {
      return
    }

    setIsSubmitting(true)
    try {
      // Add review
      const reviewData = {
        companyId,
        userId: user.uid,
        userName: user.displayName || user.email?.split('@')[0] || 'Anonym',
        rating,
        text: reviewText,
        createdAt: serverTimestamp()
      }
      
      await addDoc(collection(db, 'reviews'), reviewData)

      // Update company rating
      const companyRef = doc(db, 'companies', companyId)
      
      // Calculate new average rating
      const allReviews = [...reviews, { ...reviewData, id: 'temp' } as Review]
      const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0)
      const avgRating = totalRating / allReviews.length
      
      await updateDoc(companyRef, {
        rating: Math.round(avgRating * 10) / 10,
        reviewCount: increment(1)
      })

      // Reset form
      setRating(0)
      setReviewText('')
      setShowForm(false)
      
      // Reload reviews
      loadReviews()
      
      alert('Tack för ditt omdöme!')
    } catch (error) {
      console.error('Error submitting review:', error)
      alert('Kunde inte skicka omdömet. Försök igen.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStars = (count: number, interactive: boolean = false) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type={interactive ? 'button' : undefined}
            disabled={!interactive}
            onClick={() => interactive && setRating(star)}
            onMouseEnter={() => interactive && setHoveredRating(star)}
            onMouseLeave={() => interactive && setHoveredRating(0)}
            className={`${interactive ? 'cursor-pointer hover:scale-110' : ''} transition-transform`}
          >
            <HiStar
              className={`w-6 h-6 ${
                star <= (interactive ? (hoveredRating || rating) : count)
                  ? 'text-yellow-400 fill-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    )
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return ''
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString('sv-SE', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0

  return (
    <section className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">⭐ Omdömen</h2>
          {reviews.length > 0 && (
            <div className="flex items-center gap-2 mt-2">
              {renderStars(Math.round(averageRating))}
              <span className="text-gray-600">
                {averageRating.toFixed(1)} ({reviews.length} omdömen)
              </span>
            </div>
          )}
        </div>
        {user && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-brand hover:bg-brand-dark text-white px-4 py-2 rounded-lg font-medium transition"
          >
            {showForm ? 'Avbryt' : 'Lämna omdöme'}
          </button>
        )}
      </div>

      {/* Review Form */}
      {showForm && (
        <form onSubmit={handleSubmitReview} className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-3">Betygsätt {companyName}</h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ditt betyg *
            </label>
            {renderStars(rating, true)}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Din upplevelse (valfritt)
            </label>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              rows={4}
              placeholder="Berätta om din upplevelse..."
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-brand focus:ring-1 focus:ring-brand outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || rating === 0}
            className="w-full bg-brand hover:bg-brand-dark text-white py-3 rounded-lg font-semibold transition disabled:opacity-50"
          >
            {isSubmitting ? 'Skickar...' : 'Skicka omdöme'}
          </button>
        </form>
      )}

      {/* Reviews List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand mx-auto"></div>
        </div>
      ) : reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="border-b border-gray-100 pb-4 last:border-0">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                  <HiUser className="w-5 h-5 text-gray-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-900">{review.userName}</span>
                    <span className="text-sm text-gray-500">{formatDate(review.createdAt)}</span>
                  </div>
                  {renderStars(review.rating)}
                  {review.text && (
                    <p className="text-gray-600 mt-2">{review.text}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-4xl mb-3">💬</div>
          <p className="text-gray-600">
            Inga omdömen ännu. Bli den första att lämna ett omdöme!
          </p>
        </div>
      )}
    </section>
  )
}
