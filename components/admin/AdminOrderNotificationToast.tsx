'use client'

import { useEffect } from 'react'
import { ShoppingBag, XCircle, BadgeCheck, FileSpreadsheet, X } from 'lucide-react'
import { formatPrice } from '@/lib/formatPrice'
import type { AdminOrderNotification } from '@/lib/adminNotifications'
import styles from './AdminOrderNotificationToast.module.css'

type AdminOrderNotificationToastProps = {
  notification: AdminOrderNotification
  queueCount: number
  onDismiss: () => void
  onViewOrder: () => void
}

export function AdminOrderNotificationToast({
  notification,
  queueCount,
  onDismiss,
  onViewOrder,
}: AdminOrderNotificationToastProps) {
  useEffect(() => {
    const timer = window.setTimeout(onDismiss, 8000)
    return () => window.clearTimeout(timer)
  }, [onDismiss, notification.id])

  const Icon =
    notification.type === 'new_order'
      ? ShoppingBag
      : notification.type === 'order_cancelled'
        ? XCircle
        : notification.type === 'bulk_order_confirmed'
          ? FileSpreadsheet
          : BadgeCheck

  const iconClass =
    notification.type === 'new_order' || notification.type === 'bulk_order_confirmed'
      ? styles.iconNew
      : notification.type === 'order_cancelled'
        ? styles.iconCancelled
        : styles.iconPaid

  return (
    <div
      className={styles.toast}
      role="button"
      tabIndex={0}
      aria-label={`${notification.title}. Open orders page.`}
      onClick={onViewOrder}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onViewOrder()
        }
      }}
    >
      <div className={`${styles.iconWrap} ${iconClass}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className={styles.content}>
        <p className={styles.title}>{notification.title}</p>
        <p className={styles.message}>{notification.message}</p>
        <div className={styles.meta}>
          <span>
            {notification.type === 'bulk_order_confirmed' ? 'Order' : 'Order ID'}:{' '}
            <strong>{notification.orderId}</strong>
          </span>
          <span>{formatPrice(notification.total)}</span>
        </div>
        {queueCount > 0 && (
          <p className={styles.queueHint}>
            +{queueCount} more notification{queueCount > 1 ? 's' : ''}
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
