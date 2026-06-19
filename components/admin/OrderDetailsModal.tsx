'use client'

import { Download, X } from 'lucide-react'
import { formatPrice } from '@/lib/formatPrice'
import { downloadOrderDetails, type OrderDetailExport } from '@/lib/orderDetailsExport'
import type { CartItem } from '@/lib/types'
import styles from './OrderDetailsModal.module.css'

type OrderDetailsModalProps = {
  order: OrderDetailExport
  onClose: () => void
}

function formatOrderDate(value: string | Date) {
  const parsed = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(parsed.getTime())) return String(value)
  return parsed.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatPaymentMethod(method?: string) {
  if (!method) return '—'
  const base = method.split('|')[0].split('-')[0]
  const labels: Record<string, string> = {
    upi: 'UPI Payment',
    cod: 'Cash on Delivery',
    netbanking: 'Net Banking',
    card_transfer: 'Card / Bank Transfer',
    bulk_sheet: 'Bulk Order Sheet',
  }
  return labels[base] ?? base.replace(/_/g, ' ')
}

function paymentBadgeClass(status: string) {
  if (status === 'paid') return styles.badgePaid
  if (status === 'refunded') return styles.badgeRefunded
  if (status === 'failed') return styles.badgeFailed
  return styles.badgePending
}

function lineItemLabel(item: CartItem) {
  return item.product?.name ?? item.productId
}

function lineUnitPrice(item: CartItem) {
  return item.product?.price ?? 0
}

function lineTotal(item: CartItem) {
  return lineUnitPrice(item) * item.quantity
}

export function OrderDetailsModal({ order, onClose }: OrderDetailsModalProps) {
  const customer = order.customerName || order.customerUsername || order.userId

  return (
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-details-title"
      onClick={onClose}
    >
      <div className={styles.popup} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div>
            <h2 id="order-details-title" className={styles.title}>
              Order Details
            </h2>
            <p className={styles.subtitle}>{order.id}</p>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.metaGrid}>
            <div>
              <span className={styles.label}>Placed</span>
              <span className={styles.value}>{formatOrderDate(order.createdAt)}</span>
            </div>
            <div>
              <span className={styles.label}>Customer</span>
              <span className={styles.value}>{customer}</span>
            </div>
            <div>
              <span className={styles.label}>Order Status</span>
              <span className={styles.value}>{order.status}</span>
            </div>
            <div>
              <span className={styles.label}>Payment</span>
              <span className={`${styles.badge} ${paymentBadgeClass(order.paymentStatus)}`}>
                {order.paymentStatus}
              </span>
            </div>
            <div>
              <span className={styles.label}>Method</span>
              <span className={styles.value}>{formatPaymentMethod(order.paymentMethod)}</span>
            </div>
          </div>

          <div className={styles.section}>
            <p className={styles.sectionTitle}>Fulfillment</p>
            <p className={styles.detailLine}>Delivery: {order.deliveryMethod || '—'}</p>
            <p className={styles.detailLine}>Address: {order.shippingAddress || '—'}</p>
            <p className={styles.detailLine}>Tracking: {order.trackingNumber || '—'}</p>
            {order.deliveryDate && (
              <p className={styles.detailLine}>
                Expected delivery: {formatOrderDate(order.deliveryDate)}
              </p>
            )}
          </div>

          <div className={styles.section}>
            <p className={styles.sectionTitle}>Line Items</p>
            <div className={styles.itemsTableWrap}>
              <table className={styles.itemsTable}>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Unit Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={`${item.productId}-${item.quantity}`}>
                      <td>{lineItemLabel(item)}</td>
                      <td>{item.quantity}</td>
                      <td>{formatPrice(lineUnitPrice(item))}</td>
                      <td>{formatPrice(lineTotal(item))}</td>
                    </tr>
                  ))}
                  {order.items.length === 0 && (
                    <tr>
                      <td colSpan={4}>No items recorded.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className={styles.totalRow}>
            <span>Order Total</span>
            <strong>{formatPrice(order.total)}</strong>
          </div>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={() => downloadOrderDetails(order)}
          >
            <Download className="w-4 h-4" />
            Download
          </button>
          <button type="button" className={styles.btnPrimary} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
