'use client'

import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'
import { apiFetch, getStoredToken } from '@/lib/api'
import { formatPrice } from '@/lib/formatPrice'
import type { InvoiceDetail } from '@/lib/invoices'
import styles from './InvoiceViewModal.module.css'

type InvoiceViewModalProps = {
  invoiceId: string
  onClose: () => void
}

function formatInvoiceDate(value: string) {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
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

export function InvoiceViewModal({ invoiceId, onClose }: InvoiceViewModalProps) {
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')

    apiFetch<{ invoice: InvoiceDetail }>(`/api/admin/invoices/${encodeURIComponent(invoiceId)}`)
      .then((data) => {
        if (active) setInvoice(data.invoice)
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load invoice')
          setInvoice(null)
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [invoiceId])

  const handleDownload = async () => {
    setDownloading(true)
    setError('')
    try {
      const token = getStoredToken()
      const res = await fetch(
        `/api/admin/invoices/${encodeURIComponent(invoiceId)}/download`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      )
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Download failed')
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `${invoiceId}.xlsx`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="invoice-view-title"
      onClick={onClose}
    >
      <div className={styles.popup} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div>
            <h2 id="invoice-view-title" className={styles.title}>
              Invoice
            </h2>
            <p className={styles.subtitle}>{invoiceId}</p>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading && <p className={styles.loading}>Loading invoice...</p>}
        {error && !loading && <p className={styles.error}>{error}</p>}

        {!loading && invoice && (
          <>
            <div className={styles.body}>
              <div className={styles.metaGrid}>
                <div>
                  <span className={styles.label}>Order ID</span>
                  <span className={styles.value}>{invoice.orderId}</span>
                </div>
                <div>
                  <span className={styles.label}>Generated</span>
                  <span className={styles.value}>{formatInvoiceDate(invoice.createdAt)}</span>
                </div>
                <div>
                  <span className={styles.label}>Customer</span>
                  <span className={styles.value}>{invoice.customerName || invoice.userId}</span>
                </div>
                <div>
                  <span className={styles.label}>Payment</span>
                  <span className={`${styles.badge} ${paymentBadgeClass(invoice.paymentStatus)}`}>
                    {invoice.paymentStatus}
                  </span>
                </div>
                <div>
                  <span className={styles.label}>Method</span>
                  <span className={styles.value}>{formatPaymentMethod(invoice.paymentMethod)}</span>
                </div>
                <div>
                  <span className={styles.label}>Order Status</span>
                  <span className={styles.value}>{invoice.orderStatus || '—'}</span>
                </div>
              </div>

              {(invoice.customerEmail || invoice.customerPhone || invoice.shippingAddress) && (
                <div className={styles.section}>
                  <p className={styles.sectionTitle}>Customer Details</p>
                  {invoice.customerEmail && (
                    <p className={styles.detailLine}>Email: {invoice.customerEmail}</p>
                  )}
                  {invoice.customerPhone && (
                    <p className={styles.detailLine}>Phone: {invoice.customerPhone}</p>
                  )}
                  {invoice.shippingAddress && (
                    <p className={styles.detailLine}>Address: {invoice.shippingAddress}</p>
                  )}
                </div>
              )}

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
                      {invoice.items.map((item) => (
                        <tr key={item.productId}>
                          <td>{item.productName}</td>
                          <td>{item.quantity}</td>
                          <td>{formatPrice(item.unitPrice)}</td>
                          <td>{formatPrice(item.lineTotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className={styles.totalRow}>
                <span>Invoice Total</span>
                <strong>{formatPrice(invoice.total)}</strong>
              </div>
            </div>

            <div className={styles.actions}>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={handleDownload}
                disabled={downloading}
              >
                <Download className="w-4 h-4" />
                {downloading ? 'Preparing...' : 'Download (.xlsx)'}
              </button>
              <button type="button" className={styles.btnPrimary} onClick={onClose}>
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
