'use client'

import { useState } from 'react'
import Link from 'next/link'
import { StarRating } from '@/components/StarRating'
import { apiFetch } from '@/lib/api'
import type { ProductReview } from '@/lib/types'
import styles from './WriteReviewForm.module.css'

type WriteReviewFormProps = {
  productId: string
  orderId?: string
  canReview: boolean
  purchased: boolean
  userReview: ProductReview | null
  isLoggedIn: boolean
  onSubmitted: (reviews: ProductReview[]) => void
  compact?: boolean
}

export function WriteReviewForm({
  productId,
  orderId,
  canReview,
  purchased,
  userReview,
  isLoggedIn,
  onSubmitted,
  compact = false,
}: WriteReviewFormProps) {
  const [rating, setRating] = useState(5)
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !comment.trim()) {
      setError('Please fill in both title and comment')
      return
    }

    setSubmitting(true)
    setError('')
    try {
      const data = await apiFetch<{ reviews: ProductReview[] }>(
        `/api/products/${productId}/reviews`,
        {
          method: 'POST',
          body: JSON.stringify({ rating, title, comment, orderId }),
        }
      )
      onSubmitted(data.reviews)
      setTitle('')
      setComment('')
      setRating(5)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit review')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isLoggedIn) {
    return (
      <div className={`${styles.panel} ${compact ? styles.panelCompact : ''}`}>
        <p className={styles.hint}>
          <Link href="/login" className={styles.link}>
            Log in
          </Link>{' '}
          to write a review after purchasing this product.
        </p>
      </div>
    )
  }

  if (userReview) {
    return (
      <div className={`${styles.panel} ${compact ? styles.panelCompact : ''}`}>
        <p className={styles.successTitle}>Your Review</p>
        <StarRating rating={userReview.rating} size="sm" />
        <p className={styles.reviewTitle}>{userReview.title}</p>
        <p className={styles.reviewComment}>{userReview.comment}</p>
      </div>
    )
  }

  if (!purchased) {
    return (
      <div className={`${styles.panel} ${compact ? styles.panelCompact : ''}`}>
        <p className={styles.hint}>
          Only verified buyers can review this product. Purchase it first to share your experience.
        </p>
      </div>
    )
  }

  if (!canReview) return null

  return (
    <form
      onSubmit={handleSubmit}
      className={`${styles.panel} ${compact ? styles.panelCompact : ''}`}
    >
      <h3 className={styles.formTitle}>Write a Review</h3>
      <div className={styles.field}>
        <label className={styles.label}>Your Rating</label>
        <StarRating rating={rating} size="lg" interactive onChange={setRating} />
      </div>
      <div className={styles.field}>
        <label htmlFor={`review-title-${productId}`} className={styles.label}>
          Review Title
        </label>
        <input
          id={`review-title-${productId}`}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Summarize your experience"
          className={styles.input}
          maxLength={120}
        />
      </div>
      <div className={styles.field}>
        <label htmlFor={`review-comment-${productId}`} className={styles.label}>
          Your Review
        </label>
        <textarea
          id={`review-comment-${productId}`}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Tell others what you liked or didn't like..."
          className={styles.textarea}
          rows={compact ? 3 : 4}
          maxLength={1000}
        />
      </div>
      {error && <p className={styles.error}>{error}</p>}
      <button type="submit" disabled={submitting} className={styles.submitBtn}>
        {submitting ? 'Submitting...' : 'Submit Review'}
      </button>
    </form>
  )
}
