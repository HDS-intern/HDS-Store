'use client'

import { useEffect } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import type { AdminLowStockNotification } from '@/lib/lowStockAlerts'
import styles from './AdminLowStockToast.module.css'

type AdminLowStockToastProps = {
  notification: AdminLowStockNotification
  queueCount: number
  onDismiss: () => void
  onViewInventory: () => void
}

export function AdminLowStockToast({
  notification,
  queueCount,
  onDismiss,
  onViewInventory,
}: AdminLowStockToastProps) {
  useEffect(() => {
    const timer = window.setTimeout(onDismiss, 8000)
    return () => window.clearTimeout(timer)
  }, [onDismiss, notification.id])

  return (
    <div
      className={styles.toast}
      role="button"
      tabIndex={0}
      aria-label={`${notification.title}. Open inventory.`}
      onClick={onViewInventory}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onViewInventory()
        }
      }}
    >
      <div className={styles.iconWrap}>
        <AlertTriangle className="w-5 h-5" />
      </div>
      <div className={styles.content}>
        <p className={styles.title}>{notification.title}</p>
        <p className={styles.message}>{notification.message}</p>
        {notification.products.length === 1 && (
          <p className={styles.meta}>
            Stock: <strong>{notification.products[0].stock}</strong> · Alert at:{' '}
            <strong>{notification.products[0].minStockAlert}</strong>
          </p>
        )}
        {notification.products.length > 1 && (
          <ul className={styles.productList}>
            {notification.products.slice(0, 3).map((product) => (
              <li key={product.id}>
                {product.name} ({product.stock}/{product.minStockAlert})
              </li>
            ))}
            {notification.products.length > 3 && (
              <li>+{notification.products.length - 3} more</li>
            )}
          </ul>
        )}
        {queueCount > 0 && (
          <p className={styles.queueHint}>
            +{queueCount} more alert{queueCount > 1 ? 's' : ''}
          </p>
        )}
      </div>
      <button
        type="button"
        className={styles.closeBtn}
        onClick={(e) => {
          e.stopPropagation()
          onDismiss()
        }}
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
