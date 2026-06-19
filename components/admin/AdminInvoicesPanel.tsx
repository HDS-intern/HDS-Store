'use client'

import { useCallback, useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { formatPrice } from '@/lib/formatPrice'
import type { InvoiceRecord } from '@/lib/invoices'
import { InvoiceViewModal } from './InvoiceViewModal'
import styles from './AdminInvoicesPanel.module.css'

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

function paymentBadgeClass(status: string) {
  if (status === 'paid') return styles.badgePaid
  if (status === 'refunded') return styles.badgeRefunded
  if (status === 'failed') return styles.badgeFailed
  return styles.badgePending
}

export function AdminInvoicesPanel() {
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [viewInvoiceId, setViewInvoiceId] = useState<string | null>(null)

  const loadInvoices = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true)
    try {
      const data = await apiFetch<{ invoices: InvoiceRecord[] }>('/api/admin/invoices')
      setInvoices(Array.isArray(data.invoices) ? data.invoices : [])
      setLastUpdated(new Date())
    } catch {
      setInvoices([])
    } finally {
      if (showLoader) setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadInvoices(true)
  }, [loadInvoices])

  useEffect(() => {
    const interval = window.setInterval(() => {
      void loadInvoices(false)
    }, 10000)

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        void loadInvoices(false)
      }
    }

    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onVisible)

    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onVisible)
    }
  }, [loadInvoices])

  return (
    <div>
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.pageTitle}>Invoices</h1>
          <p className={styles.pageDesc}>
            All generated invoices, newest first. The list refreshes automatically every 10 seconds.
          </p>
        </div>
        <div className={styles.headerActions}>
          {lastUpdated && (
            <span className={styles.updatedAt}>
              Updated {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button
            type="button"
            className={styles.refreshBtn}
            onClick={() => loadInvoices(true)}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? styles.spinning : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Invoice ID</th>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Amount</th>
              <th>Payment</th>
              <th>Method</th>
              <th>Generated</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice.id}>
                <td>
                  <button
                    type="button"
                    className={styles.invoiceIdBtn}
                    onClick={() => setViewInvoiceId(invoice.id)}
                    title="View invoice"
                  >
                    {invoice.id}
                  </button>
                </td>
                <td className={styles.mono}>{invoice.orderId}</td>
                <td>{invoice.customerName || invoice.userId}</td>
                <td>{formatPrice(invoice.total)}</td>
                <td>
                  <span className={`${styles.badge} ${paymentBadgeClass(invoice.paymentStatus)}`}>
                    {invoice.paymentStatus}
                  </span>
                </td>
                <td className={styles.methodCell}>{invoice.paymentMethod || '—'}</td>
                <td>{formatInvoiceDate(invoice.createdAt)}</td>
              </tr>
            ))}
            {!loading && invoices.length === 0 && (
              <tr>
                <td colSpan={7} className={styles.empty}>
                  No invoices yet. Invoices are created automatically when customers place orders.
                </td>
              </tr>
            )}
            {loading && invoices.length === 0 && (
              <tr>
                <td colSpan={7} className={styles.empty}>
                  Loading invoices...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {viewInvoiceId && (
        <InvoiceViewModal invoiceId={viewInvoiceId} onClose={() => setViewInvoiceId(null)} />
      )}
    </div>
  )
}
