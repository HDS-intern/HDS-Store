'use client'

import { X, CheckCircle, AlertCircle } from 'lucide-react'
import { formatPrice } from '@/lib/formatPrice'
import type { ParsedBulkLine } from '@/lib/bulkOrder'
import styles from './BulkOrderPreviewModal.module.css'

type BulkOrderPreviewModalProps = {
  fileName: string
  lines: ParsedBulkLine[]
  confirming: boolean
  onConfirm: () => void
  onClose: () => void
}

export function BulkOrderPreviewModal({
  fileName,
  lines,
  confirming,
  onConfirm,
  onClose,
}: BulkOrderPreviewModalProps) {
  const validLines = lines.filter((line) => line.product && !line.error)
  const previewTotal = validLines.reduce(
    (sum, line) => sum + (line.product?.price || 0) * line.qty,
    0
  )
  const hasErrors = lines.some((line) => line.error)

  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true" aria-labelledby="bulk-preview-title">
      <div className={styles.popup}>
        <div className={styles.header}>
          <div>
            <h2 id="bulk-preview-title" className={styles.title}>
              Order Preview
            </h2>
            <p className={styles.subtitle}>Review your uploaded file before proceeding to checkout.</p>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close preview">
            <X className="w-5 h-5" />
          </button>
        </div>

        {fileName && <p className={styles.fileName}>File: {fileName}</p>}

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>SKU ID</th>
                <th>Product</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, idx) => (
                <tr key={`${line.modelNumber}-${idx}`}>
                  <td>{line.modelNumber}</td>
                  <td>{line.product?.name || '—'}</td>
                  <td>{line.qty}</td>
                  <td>{line.product ? formatPrice(line.product.price) : '—'}</td>
                  <td>
                    {line.error ? (
                      <span className={styles.rowError}>{line.error}</span>
                    ) : (
                      <span className={styles.rowOk}>Ready</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={styles.totalRow}>
          <span>Valid items: {validLines.length}</span>
          <span>Estimated total: {formatPrice(previewTotal)}</span>
        </div>

        {hasErrors && (
          <div className={styles.warning}>
            <AlertCircle className="w-4 h-4 shrink-0" />
            Rows with errors will be skipped. Fix your file or confirm with valid items only.
          </div>
        )}

        <div className={styles.actions}>
          <button type="button" className={styles.btnOutline} onClick={onClose} disabled={confirming}>
            Cancel
          </button>
          <button
            type="button"
            className={styles.btnPrimary}
            disabled={confirming || validLines.length === 0}
            onClick={onConfirm}
          >
            <CheckCircle className="w-4 h-4" />
            {confirming ? 'Confirming...' : 'Confirm & Proceed to Checkout'}
          </button>
        </div>
      </div>
    </div>
  )
}
