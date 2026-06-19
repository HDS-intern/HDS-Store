'use client'

import { useCallback, useEffect, useState } from 'react'
import { Calendar, CreditCard, Mail, Phone, ShoppingBag, User, X } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { formatPrice } from '@/lib/formatPrice'
import styles from './CustomerDetailsModal.module.css'

type CustomerOrder = {
  id: string
  total: number
  status: string
  paymentStatus: string
  paymentMethod?: string
  createdAt: string
}

type CustomerProfile = {
  id: string
  username: string
  email: string
  name: string
  phone?: string
  role: string
  accountCreatedAt: string | null
}

type CustomerDetails = {
  profile: CustomerProfile
  orders: CustomerOrder[]
  paymentMethods: string[]
  preferredPaymentMethod: string | null
  orderCount: number
  totalSpent: number
}

const PAYMENT_LABELS: Record<string, string> = {
  upi: 'UPI Payment',
  cod: 'Cash on Delivery',
  netbanking: 'Net Banking',
  card_transfer: 'Card / Bank Transfer',
}

function formatPayment(method: string | null | undefined) {
  if (!method) return '—'
  return PAYMENT_LABELS[method] ?? method.replace(/_/g, ' ')
}

function formatDate(value: string | null | undefined) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

type CustomerDetailsModalProps = {
  userId: string
  displayName?: string
  onClose: () => void
}

export function CustomerDetailsModal({ userId, displayName, onClose }: CustomerDetailsModalProps) {
  const [details, setDetails] = useState<CustomerDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await apiFetch<CustomerDetails>(
        `/api/admin/customers/${encodeURIComponent(userId)}`
      )
      setDetails(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load customer details')
      setDetails(null)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    load()
  }, [load])

  const profile = details?.profile
  const title = displayName || profile?.name || userId

  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true" onClick={onClose}>
      <div className={styles.popup} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>Customer Details</h2>
            <p className={styles.subtitle}>{title}</p>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <p className={styles.loading}>Loading customer details...</p>
        ) : error ? (
          <p className={styles.error}>{error}</p>
        ) : details ? (
          <div className={styles.body}>
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Profile</h3>
              <div className={styles.profileGrid}>
                <div className={styles.profileItem}>
                  <User className="w-4 h-4" />
                  <div>
                    <span className={styles.label}>Full Name</span>
                    <span className={styles.value}>{profile?.name}</span>
                  </div>
                </div>
                <div className={styles.profileItem}>
                  <Mail className="w-4 h-4" />
                  <div>
                    <span className={styles.label}>Email</span>
                    <span className={styles.value}>{profile?.email}</span>
                  </div>
                </div>
                <div className={styles.profileItem}>
                  <Phone className="w-4 h-4" />
                  <div>
                    <span className={styles.label}>Phone</span>
                    <span className={styles.value}>{profile?.phone || '—'}</span>
                  </div>
                </div>
                <div className={styles.profileItem}>
                  <User className="w-4 h-4" />
                  <div>
                    <span className={styles.label}>Username</span>
                    <span className={styles.value}>{profile?.username}</span>
                  </div>
                </div>
                <div className={styles.profileItem}>
                  <Calendar className="w-4 h-4" />
                  <div>
                    <span className={styles.label}>Account Created</span>
                    <span className={styles.value}>{formatDate(profile?.accountCreatedAt)}</span>
                  </div>
                </div>
              </div>
            </section>

            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Payment</h3>
              <div className={styles.paymentRow}>
                <CreditCard className="w-4 h-4" />
                <div>
                  <span className={styles.label}>Preferred / Latest Method</span>
                  <span className={styles.value}>
                    {formatPayment(details.preferredPaymentMethod)}
                  </span>
                </div>
              </div>
              {details.paymentMethods.length > 0 && (
                <div className={styles.paymentTags}>
                  {details.paymentMethods.map((method) => (
                    <span key={method} className={styles.paymentTag}>
                      {formatPayment(method)}
                    </span>
                  ))}
                </div>
              )}
              <div className={styles.statsRow}>
                <span>{details.orderCount} orders</span>
                <span>Total spent: {formatPrice(details.totalSpent)}</span>
              </div>
            </section>

            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>
                <ShoppingBag className="w-4 h-4 inline mr-1" />
                Order History
              </h3>
              {details.orders.length === 0 ? (
                <p className={styles.empty}>No orders found for this customer.</p>
              ) : (
                <div className={styles.orderList}>
                  {details.orders.map((order) => (
                    <div key={order.id} className={styles.orderRow}>
                      <div>
                        <p className={styles.orderId}>{order.id}</p>
                        <p className={styles.orderMeta}>
                          {formatDate(order.createdAt)} · {formatPayment(order.paymentMethod)}
                        </p>
                      </div>
                      <div className={styles.orderRight}>
                        <span className={styles.orderTotal}>{formatPrice(order.total)}</span>
                        <span className={styles.orderStatus}>{order.status}</span>
                        <span className={styles.orderPayment}>{order.paymentStatus}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        ) : null}
      </div>
    </div>
  )
}
