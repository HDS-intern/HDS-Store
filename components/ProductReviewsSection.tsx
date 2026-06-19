'use client'

import { useCallback, useEffect, useState } from 'react'
import { BadgeCheck } from 'lucide-react'
import { StarRating } from '@/components/StarRating'
import { apiFetch } from '@/lib/api'
import type { ProductReview } from '@/lib/types'
import styles from '@/app/product/[id]/page.module.css'

type ProductReviewsSectionProps = {
  productId: string
  initialReviews: ProductReview[]
  initialRating: number
}

export function ProductReviewsSection({
  productId,
  initialReviews,
  initialRating,
}: ProductReviewsSectionProps) {
  const [reviews, setReviews] = useState<ProductReview[]>(initialReviews)
  const [avgRating, setAvgRating] = useState(initialRating)

  const loadReviews = useCallback(async () => {
    try {
      const data = await apiFetch<{ reviews: ProductReview[] }>(
        `/api/products/${productId}/reviews`
      )
      setReviews(data.reviews)
      if (data.reviews.length > 0) {
        const avg =
          Math.round(
            (data.reviews.reduce((sum, r) => sum + r.rating, 0) / data.reviews.length) * 10
          ) / 10
        setAvgRating(avg)
      }
    } catch {
      // keep initial data
    }
  }, [productId])

  useEffect(() => {
    loadReviews()
  }, [loadReviews])

  const ratingBreakdown = [5, 4, 3, 2, 1].map((stars) => {
    const count = reviews.filter((r) => r.rating === stars).length
    const total = reviews.length || 1
    return { stars, count, percent: Math.round((count / total) * 100) }
  })

  return (
    <div id="reviews">
      <h2 className={styles.sectionTitle}>Customer Reviews</h2>

      <div className={styles.ratingSummary}>
        <div className="text-center sm:text-left">
          <p className={styles.ratingBig}>{avgRating}</p>
          <StarRating rating={avgRating} />
          <p className="text-sm text-muted-foreground mt-1">
            Based on {reviews.length} review{reviews.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex-1">
          {ratingBreakdown.map(({ stars, percent }) => (
            <div key={stars} className={styles.ratingBar}>
              <span className="w-12">{stars} ★</span>
              <div className={styles.ratingBarTrack}>
                <div className={styles.ratingBarFill} style={{ width: `${percent}%` }} />
              </div>
              <span className="w-8 text-right">{percent}%</span>
            </div>
          ))}
        </div>
      </div>

      {reviews.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">No customer reviews yet.</p>
      ) : (
        reviews.map((review) => (
          <div key={review.id} className={styles.reviewCard}>
            <div className={styles.reviewHeader}>
              <div>
                <span className={styles.reviewAuthor}>{review.author}</span>
                {review.verified && (
                  <span className={styles.verifiedBadge}>
                    <BadgeCheck className="w-3 h-3" />
                    Verified Purchase
                  </span>
                )}
              </div>
              <span className={styles.reviewDate}>
                {new Date(review.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
            <StarRating rating={review.rating} size="sm" />
            <p className={styles.reviewTitle}>{review.title}</p>
            <p className={styles.reviewComment}>{review.comment}</p>
          </div>
        ))
      )}
    </div>
  )
}
