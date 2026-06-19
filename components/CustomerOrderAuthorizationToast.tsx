'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { BadgeCheck } from 'lucide-react'
import { useApp } from '@/lib/context'
import styles from './CustomerOrderAuthorizationToast.module.css'

type ToastState = {
  orderId: string
}

export function CustomerOrderAuthorizationToast() {
  const pathname = usePathname()
  const { user, orders } = useApp()
  const [toast, setToast] = useState<ToastState | null>(null)
  const authorizedSnapshotRef = useRef<Map<string, boolean>>(new Map())
  const snapshotReadyRef = useRef(false)

  const isCustomerSession = Boolean(user && user.role === 'customer' && !pathname.startsWith('/admin'))

  useEffect(() => {
    if (!isCustomerSession) {
      authorizedSnapshotRef.current = new Map()
      snapshotReadyRef.current = false
      setToast(null)
      return
    }

    for (const order of orders) {
      const wasAuthorized = authorizedSnapshotRef.current.get(order.id)
      if (snapshotReadyRef.current && wasAuthorized === false && order.authorized) {
        setToast({ orderId: order.id })
      }
    }

    const next = new Map<string, boolean>()
    for (const order of orders) {
      next.set(order.id, order.authorized)
    }
    authorizedSnapshotRef.current = next
    snapshotReadyRef.current = true
  }, [orders, isCustomerSession])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 5000)
    return () => window.clearTimeout(timer)
  }, [toast])

  if (!toast) return null

  return (
    <div className={styles.toast} role="status" aria-live="polite">
      <BadgeCheck className={styles.icon} />
      <div className={styles.content}>
        <p className={styles.title}>Order Authorized</p>
        <p className={styles.message}>
          Your order <span className={styles.orderId}>{toast.orderId}</span> has been authorized and
          is now being processed.
        </p>
      </div>
    </div>
  )
}
