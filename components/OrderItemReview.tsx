'use client'

import { useCallback, useEffect, useState } from 'react'
import { WriteReviewForm } from '@/components/WriteReviewForm'
import { apiFetch } from '@/lib/api'
import type { ProductReview } from '@/lib/types'
import styles from './OrderItemReview.module.css'

type OrderItemReviewProps = {
  productId: string
  orderId: string
  productName: string
}

export function OrderItemReview({ productId, orderId, productName }: OrderItemReviewProps) {
  const [canReview, setCanReview] = useState(false)
  const [userReview, setUserReview] = useState<ProductReview | null>(null)
  const [loaded, setLoaded] = useState(false)

  const loadStatus = useCallback(async () => {
    try {
      const data = await apiFetch<{
        canReview: boolean
        userReview: ProductReview | null
      }>(`/api/products/${productId}/reviews`)
      setCanReview(data.canReview)
      setUserReview(data.userReview)
    } catch {
      setCanReview(false)
      setUserReview(null)
    } finally {
      setLoaded(true)
    }
  }, [productId])

  useEffect(() => {
    loadStatus()
  }, [loadStatus])

  if (!loaded || (!canReview && !userReview)) return null

  return (
    <div className={styles.wrap}>
      <p className={styles.label}>Review: {productName}</p>
      <WriteReviewForm
        productId={productId}
        orderId={orderId}
        canReview={canReview}
        purchased
        userReview={userReview}
        isLoggedIn
        compact
        onSubmitted={() => {
          loadStatus()
        }}
      />
    </div>
  )
}
