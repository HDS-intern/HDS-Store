'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { X, Star } from 'lucide-react'
import { useApp } from '@/lib/context'
import { apiFetch } from '@/lib/api'
import type { ProductReview } from '@/lib/types'
import styles from './PostPurchaseReviewPrompt.module.css'

const STORAGE_KEY = 'hds-pending-reviews'

type PendingReviews = {
  orderId: string
  productIds: string[]
}

type PromptItem = {
  productId: string
  orderId: string
}

export function PostPurchaseReviewPrompt() {
  const pathname = usePathname()
  const { user, products, refreshProducts } = useApp()
  const [current, setCurrent] = useState<PromptItem | null>(null)
  const [rating, setRating] = useState(5)
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const isCustomerSession = Boolean(user && user.role === 'customer' && !pathname.startsWith('/admin'))

  const readQueue = useCallback((): PendingReviews | null => {
    if (typeof window === 'undefined') return null
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw) as PendingReviews
    } catch {
      return null
    }
  }, [])

  const writeQueue = useCallback((queue: PendingReviews | null) => {
    if (typeof window === 'undefined') return
    if (!queue || queue.productIds.length === 0) {
      sessionStorage.removeItem(STORAGE_KEY)
      setCurrent(null)
      return
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(queue))
    setCurrent({ productId: queue.productIds[0], orderId: queue.orderId })
    setRating(5)
    setTitle('')
    setComment('')
    setError('')
  }, [])

  useEffect(() => {
    if (!isCustomerSession) {
      setCurrent(null)
      return
    }
    const queue = readQueue()
    if (queue?.productIds.length) {
      setCurrent({ productId: queue.productIds[0], orderId: queue.orderId })
    }
  }, [isCustomerSession, readQueue, pathname])

  const skipCurrent = () => {
    const queue = readQueue()
    if (!queue) {
      setCurrent(null)
      return
    }
    writeQueue({ ...queue, productIds: queue.productIds.slice(1) })
  }

  const dismissAll = () => {
    sessionStorage.removeItem(STORAGE_KEY)
    setCurrent(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!current) return
    if (!title.trim() || !comment.trim()) {
      setError('Please add a title and comment')
      return
    }

    setSubmitting(true)
    setError('')
    try {
      await apiFetch<{ reviews: ProductReview[] }>(
        `/api/products/${current.productId}/reviews`,
        {
          method: 'POST',
          body: JSON.stringify({
            rating,
            title,
            comment,
            orderId: current.orderId,
          }),
        }
      )
      await refreshProducts()
      const queue = readQueue()
      if (queue) {
        writeQueue({ ...queue, productIds: queue.productIds.slice(1) })
      } else {
        setCurrent(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit review')
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    if (!current || !isCustomerSession) return
    const product = products.find((p) => p.id === current.productId)
    if (!product) {
      const queue = readQueue()
      if (queue) {
        writeQueue({ ...queue, productIds: queue.productIds.slice(1) })
      } else {
        setCurrent(null)
      }
    }
  }, [current, isCustomerSession, products, readQueue, writeQueue])

  if (!current || !isCustomerSession) return null

  const product = products.find((p) => p.id === current.productId)
  if (!product) return null

  const queue = readQueue()
  const remaining = queue?.productIds.length ?? 1

  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true" aria-labelledby="review-prompt-title">
      <div className={styles.popup}>
        <div className={styles.header}>
          <div>
            <h2 id="review-prompt-title" className={styles.title}>
              Rate Your Purchase
            </h2>
            <p className={styles.subtitle}>
              Thank you for your order! Share your experience with this product.
              {remaining > 1 && ` (${remaining} items to review)`}
            </p>
          </div>
          <button type="button" className={styles.closeBtn} onClick={dismissAll} aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className={styles.productRow}>
          <div className={styles.productImage}>
            <Image src={product.image} alt={product.name} fill className="object-cover" />
          </div>
          <div>
            <p className={styles.productName}>{product.name}</p>
            <p className={styles.productMeta}>{product.category}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.stars}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className={styles.starBtn}
                aria-label={`Rate ${star} stars`}
              >
                <Star
                  className={`w-8 h-8 ${
                    star <= rating ? 'fill-accent text-accent' : 'text-muted-foreground'
                  }`}
                />
              </button>
            ))}
          </div>

          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Review title"
            className={styles.input}
            maxLength={120}
          />
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tell us about your experience..."
            className={styles.textarea}
            rows={3}
            maxLength={1000}
          />

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.actions}>
            <button type="button" onClick={skipCurrent} className={styles.skipBtn}>
              Skip
            </button>
            <button type="submit" disabled={submitting} className={styles.submitBtn}>
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
