'use client'

import { useEffect } from 'react'
import { MessageSquare, X } from 'lucide-react'
import styles from './AdminContactMessageToast.module.css'

export type ContactMessageNotification = {
  id: string
  messageId: string
  name: string
  subject: string
}

type AdminContactMessageToastProps = {
  notification: ContactMessageNotification
  queueCount: number
  onDismiss: () => void
  onViewMessages: () => void
}

export function AdminContactMessageToast({
  notification,
  queueCount,
  onDismiss,
  onViewMessages,
}: AdminContactMessageToastProps) {
  useEffect(() => {
    const timer = window.setTimeout(onDismiss, 6000)
    return () => window.clearTimeout(timer)
  }, [onDismiss, notification.id])

  return (
    <div
      className={styles.toast}
      role="button"
      tabIndex={0}
      aria-label={`New support ticket from ${notification.name}. Open tickets.`}
      onClick={onViewMessages}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onViewMessages()
        }
      }}
    >
      <div className={styles.iconWrap}>
        <MessageSquare className="w-5 h-5" />
      </div>
      <div className={styles.content}>
        <p className={styles.title}>New Support Ticket</p>
        <p className={styles.message}>
          <strong>{notification.name}</strong> generated a ticket for{' '}
          <strong>{notification.subject}</strong>.
        </p>
        <p className={styles.meta}>Ticket ID: {notification.messageId}</p>
        {queueCount > 0 && (
          <p className={styles.queueHint}>
            +{queueCount} more ticket{queueCount > 1 ? 's' : ''}
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
