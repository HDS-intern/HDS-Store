'use client'

import { useEffect } from 'react'
import { CheckCircle2, X } from 'lucide-react'
import styles from './AdminUpdateToast.module.css'

export type AdminUpdateToastItem = {
  id: string
  message: string
}

type AdminUpdateToastProps = {
  toast: AdminUpdateToastItem
  queueCount?: number
  onDismiss: () => void
}

export function AdminUpdateToast({ toast, queueCount = 0, onDismiss }: AdminUpdateToastProps) {
  useEffect(() => {
    const timer = window.setTimeout(onDismiss, 3500)
    return () => window.clearTimeout(timer)
  }, [onDismiss, toast.id])

  return (
    <div className={styles.toast} role="status" aria-live="polite">
      <div className={styles.iconWrap}>
        <CheckCircle2 className="w-5 h-5" />
      </div>
      <div className={styles.content}>
        <p className={styles.title}>Updated successfully</p>
        <p className={styles.message}>{toast.message}</p>
        {queueCount > 0 && (
          <p className={styles.queueHint}>
            +{queueCount} more update{queueCount > 1 ? 's' : ''}
          </p>
        )}
      </div>
      <button type="button" className={styles.closeBtn} onClick={onDismiss} aria-label="Dismiss">
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
