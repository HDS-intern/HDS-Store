'use client'

import { useEffect, useState } from 'react'
import { Check, Package, Truck, MapPin, XCircle, X } from 'lucide-react'
import type { Order } from '@/lib/types'
import styles from './OrderTrackingModal.module.css'

type OrderTrackingModalProps = {
  order: Order
  onClose: () => void
}

const TRACKING_STEPS = [
  {
    status: 'pending' as const,
    label: 'Order Placed',
    description: 'Your order has been received',
    icon: Package,
  },
  {
    status: 'confirmed' as const,
    label: 'Confirmed',
    description: 'Order verified and being prepared',
    icon: Check,
  },
  {
    status: 'shipped' as const,
    label: 'Shipped',
    description: 'Package is on the way',
    icon: Truck,
  },
  {
    status: 'delivered' as const,
    label: 'Delivered',
    description: 'Successfully delivered',
    icon: MapPin,
  },
]

const STATUS_ORDER = ['pending', 'confirmed', 'shipped', 'delivered'] as const

function statusIndex(status: Order['status']) {
  if (status === 'cancelled') return -1
  return STATUS_ORDER.indexOf(status as (typeof STATUS_ORDER)[number])
}

function formatStatusLabel(status: Order['status']) {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

export function OrderTrackingModal({ order, onClose }: OrderTrackingModalProps) {
  const [animateProgress, setAnimateProgress] = useState(false)
  const currentIndex = statusIndex(order.status)
  const isCancelled = order.status === 'cancelled'

  const progressPercent =
    currentIndex <= 0 ? 0 : Math.min(100, (currentIndex / (TRACKING_STEPS.length - 1)) * 100)

  useEffect(() => {
    const frame = requestAnimationFrame(() => setAnimateProgress(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-tracking-title"
      onClick={onClose}
    >
      <div className={styles.popup} onClick={(e) => e.stopPropagation()}>
        <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
          <X className="w-5 h-5" />
        </button>

        <div className={styles.header}>
          <h2 id="order-tracking-title" className={styles.title}>
            Track Order
          </h2>
          <p className={styles.subtitle}>{order.id}</p>
        </div>

        <div className={styles.trackingBox}>
          <span className={styles.trackingLabel}>Tracking ID</span>
          <p className={styles.trackingId}>{order.trackingNumber || 'Not assigned yet'}</p>
          <p className={styles.trackingHint}>
            Use this ID to follow your shipment with our delivery partner.
          </p>
        </div>

        {isCancelled ? (
          <div className={styles.cancelledBanner}>
            <XCircle className="w-5 h-5 text-red-600 shrink-0" />
            <div>
              <strong>Order Cancelled</strong>
              <span>This order is no longer active.</span>
            </div>
          </div>
        ) : (
          <div className={styles.statusSection}>
            <p className={styles.statusHeading}>Delivery Status</p>
            <div className={styles.timeline}>
              <div className={styles.progressTrack}>
                <div
                  className={styles.progressFill}
                  style={{
                    transform: `scaleY(${animateProgress ? progressPercent / 100 : 0})`,
                  }}
                />
              </div>

              {TRACKING_STEPS.map((step, index) => {
                const Icon = step.icon
                const isComplete = currentIndex > index
                const isActive = currentIndex === index
                const stepClass = [
                  styles.step,
                  isComplete ? styles.stepComplete : '',
                  isActive ? styles.stepActive : '',
                ]
                  .filter(Boolean)
                  .join(' ')

                return (
                  <div
                    key={step.status}
                    className={stepClass}
                    style={{ animationDelay: `${0.15 + index * 0.12}s` }}
                  >
                    <div className={styles.stepDotWrap}>
                      <div className={styles.stepDot}>
                        <Icon className="w-4 h-4" />
                      </div>
                    </div>
                    <div className={styles.stepBody}>
                      <p className={styles.stepLabel}>{step.label}</p>
                      <p className={styles.stepDesc}>{step.description}</p>
                      {isActive && (
                        <span className={styles.stepTime}>Current · {formatStatusLabel(order.status)}</span>
                      )}
                      {isComplete && index === TRACKING_STEPS.length - 1 && order.status === 'delivered' && (
                        <span className={styles.stepTime}>Completed</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
