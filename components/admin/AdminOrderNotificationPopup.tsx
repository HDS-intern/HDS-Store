'use client'

import { ShoppingBag, XCircle, BadgeCheck, FileSpreadsheet } from 'lucide-react'
import { formatPrice } from '@/lib/formatPrice'
import type { AdminOrderNotification } from '@/lib/adminNotifications'
import styles from './AdminOrderNotificationPopup.module.css'

type AdminOrderNotificationPopupProps = {
  notification: AdminOrderNotification
  queueCount: number
  onDismiss: () => void
  onViewOrder: () => void
}

export function AdminOrderNotificationPopup({
  notification,
  queueCount,
  onDismiss,
  onViewOrder,
}: AdminOrderNotificationPopupProps) {
  const Icon =
    notification.type === 'new_order'
      ? ShoppingBag
      : notification.type === 'order_cancelled'
        ? XCircle
        : notification.type === 'bulk_order_confirmed'
          ? FileSpreadsheet
          : BadgeCheck

  const iconClass =
    notification.type === 'new_order'
      ? styles.iconNew
      : notification.type === 'order_cancelled'
        ? styles.iconCancelled
        : notification.type === 'bulk_order_confirmed'
          ? styles.iconNew
          : styles.iconPaid

  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true" aria-labelledby="admin-notif-title">
      <div className={styles.popup}>
        <div className={styles.header}>
          <div className={`${styles.iconWrap} ${iconClass}`}>
            <Icon className="w-5 h-5" />
          </div>
          <h2 id="admin-notif-title" className={styles.title}>
            {notification.title}
          </h2>
        </div>

        <div className={styles.body}>
          <p className={styles.message}>{notification.message}</p>
          <div className={styles.meta}>
            <div className={styles.metaRow}>
              <span className={styles.metaLabel}>
                {notification.type === 'bulk_order_confirmed' ? 'Reference' : 'Order ID'}
              </span>
              <span className={styles.metaValue}>{notification.orderId}</span>
            </div>
            <div className={styles.metaRow}>
              <span className={styles.metaLabel}>Amount</span>
              <span className={styles.metaValue}>{formatPrice(notification.total)}</span>
            </div>
          </div>
        </div>

        {queueCount > 0 && (
          <p className={styles.queueHint}>+{queueCount} more notification{queueCount > 1 ? 's' : ''}</p>
        )}

        <div className={styles.actions}>
          <button type="button" className={styles.btnSecondary} onClick={onDismiss}>
            Dismiss
          </button>
          <button type="button" className={styles.btnPrimary} onClick={onViewOrder}>
            View Orders
          </button>
        </div>
      </div>
    </div>
  )
}
