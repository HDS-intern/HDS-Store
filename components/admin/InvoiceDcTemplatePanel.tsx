'use client'

import { useState } from 'react'
import { Eye, FileText } from 'lucide-react'
import { TemplateUnavailableModal } from './TemplateUnavailableModal'
import styles from './AdminDashboard.module.css'

type InvoiceDcTemplatePanelProps = {
  isAdmin: boolean
}

export function InvoiceDcTemplatePanel({ isAdmin }: InvoiceDcTemplatePanelProps) {
  const [viewMode, setViewMode] = useState<'invoice' | 'dc' | null>(null)

  if (!isAdmin) return null

  return (
    <>
      <div className={styles.bulkPanel}>
        <p className={styles.panelTitle}>Invoice / DC</p>
        <p className={styles.bulkHint}>
          Preview the published invoice template and delivery challan (DC) layout used for order
          documentation. Use the buttons below to open each template in a centered viewer.
        </p>
        <div className={styles.bulkActions}>
          <button
            type="button"
            className={styles.bulkBtnOutline}
            onClick={() => setViewMode('invoice')}
          >
            <Eye className="w-4 h-4" />
            View Invoice
          </button>
          <button type="button" className={styles.bulkBtnOutline} onClick={() => setViewMode('dc')}>
            <Eye className="w-4 h-4" />
            View DC
          </button>
          <span className={styles.bulkHintInline}>
            <FileText className="w-4 h-4 inline" /> Template preview
          </span>
        </div>
      </div>

      {viewMode === 'invoice' && (
        <TemplateUnavailableModal
          title="Invoice Template"
          onClose={() => setViewMode(null)}
        />
      )}

      {viewMode === 'dc' && (
        <TemplateUnavailableModal
          title="Delivery Challan (DC)"
          onClose={() => setViewMode(null)}
        />
      )}
    </>
  )
}
