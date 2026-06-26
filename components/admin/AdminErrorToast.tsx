'use client'

import { useEffect } from 'react'
import { AlertCircle, X } from 'lucide-react'
import styles from './AdminErrorToast.module.css'

type AdminErrorToastProps = {
  message: string
  onDismiss: () => void
}

export function AdminErrorToast({ message, onDismiss }: AdminErrorToastProps) {
  useEffect(() => {
    const timer = window.setTimeout(onDismiss, 4000)
    return () => window.clearTimeout(timer)
  }, [message, onDismiss])

  return (
    <div className={styles.toast} role="alert" aria-live="assertive">
      <div className={styles.iconWrap}>
        <AlertCircle className="w-5 h-5" />
      </div>
      <div className={styles.content}>
        <p className={styles.title}>Error</p>
        <p className={styles.message}>{message}</p>
      </div>
      <button type="button" className={styles.closeBtn} onClick={onDismiss} aria-label="Dismiss">
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
