'use client'

import { useEffect } from 'react'
import { CheckCircle } from 'lucide-react'
import styles from './OrderSuccessToast.module.css'

type OrderSuccessToastProps = {
  orderId: string
  bulkOrder?: boolean
  onDismiss: () => void
}

export function OrderSuccessToast({ orderId, bulkOrder, onDismiss }: OrderSuccessToastProps) {
  useEffect(() => {
    const timer = window.setTimeout(onDismiss, 6000)
    return () => window.clearTimeout(timer)
  }, [onDismiss])

  return (
    <div className={styles.toast} role="status" aria-live="polite">
      <CheckCircle className={styles.icon} />
      <div className={styles.content}>
        <p className={styles.title}>Order Placed Successfully</p>
        <p className={styles.message}>
          {bulkOrder
            ? 'Your bulk order has been submitted. Order '
            : 'Thank you! Your order '}
          <span className={styles.orderId}>{orderId}</span> is confirmed. Our team will process it
          shortly.
        </p>
      </div>
      <button type="button" className={styles.dismissBtn} onClick={onDismiss} aria-label="Dismiss">
        ×
      </button>
    </div>
  )
}
