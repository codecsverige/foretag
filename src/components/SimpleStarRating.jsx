import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';

/**
 * Simple Star Rating Component
 * Shows user rating with stars
 */
export function SimpleStarRating({ userId, compact = false }) {
  const [rating, setRating] = useState(4.5);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserRating = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        // Try to get user rating from userScores collection
        const userScoreDoc = await getDoc(doc(db, 'userScores', userId));
        if (userScoreDoc.exists()) {
          const data = userScoreDoc.data();
          if (data.stars) {
            setRating(data.stars);
          }
        } else {
          // Default rating for new users
          setRating(4.0);
        }
      } catch (error) {
        console.error('Error loading rating:', error);
        // Default rating on error
        setRating(4.0);
      } finally {
        setLoading(false);
      }
    };

    loadUserRating();
  }, [userId]);

  if (loading) {
    return <div className="w-16 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />;
  }

  // Generate stars display
  const renderStars = () => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    // Full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <span key={`full-${i}`} className="text-yellow-500">★</span>
      );
    }
    
    // Half star
    if (hasHalfStar && fullStars < 5) {
      stars.push(
        <span key="half" className="text-yellow-500">☆</span>
      );
    }
    
    // Empty stars
    const emptyStars = 5 - stars.length;
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <span key={`empty-${i}`} className="text-gray-300 dark:text-gray-600">☆</span>
      );
    }
    
    return stars;
  };

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        <div className="flex text-sm">
          {renderStars()}
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          ({rating.toFixed(1)})
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex text-lg">
        {renderStars()}
      </div>
      <span className="text-sm text-gray-600 dark:text-gray-400">
        {rating.toFixed(1)} / 5.0
      </span>
    </div>
  );
}

// Mini version for RideCard
export function MiniStarRating({ userId }) {
  return <SimpleStarRating userId={userId} compact={true} />;
}

export default SimpleStarRating;