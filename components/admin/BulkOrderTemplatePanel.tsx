'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { Download, FileSpreadsheet, Upload, ExternalLink } from 'lucide-react'
import { getStoredToken } from '@/lib/api'
import styles from './AdminDashboard.module.css'

type BulkOrderTemplatePanelProps = {
  isAdmin: boolean
  onMessage?: (msg: string) => void
  onError?: (msg: string) => void
}

export function BulkOrderTemplatePanel({
  isAdmin,
  onMessage,
  onError,
}: BulkOrderTemplatePanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const name = file.name.toLowerCase()
    if (!name.endsWith('.xlsx') && !name.endsWith('.csv')) {
      onError?.('Only .xlsx and .csv files are allowed.')
      e.target.value = ''
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const token = getStoredToken()
      const res = await fetch('/api/admin/bulk-template', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      onMessage?.(`Bulk order template updated: ${data.filename}`)
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Template upload failed')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  if (!isAdmin) return null

  return (
    <div className={styles.bulkPanel}>
      <p className={styles.panelTitle}>Bulk Order Sheet Template</p>
      <p className={styles.bulkHint}>
        Upload the master template used on the customer Bulk Order Sheet page. Only{' '}
        <strong>.xlsx</strong> and <strong>.csv</strong> files are accepted. Columns must
        include <strong>Model Number</strong> and <strong>Qty</strong>.
      </p>
      <div className={styles.bulkActions}>
        <a href="/api/bulk-order/template?format=xlsx" className={styles.bulkBtnOutline}>
          <FileSpreadsheet className="w-4 h-4" />
          Download .xlsx
        </a>
        <a href="/api/bulk-order/template?format=csv" className={styles.bulkBtnOutline}>
          <Download className="w-4 h-4" />
          Download .csv
        </a>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.csv"
          className={styles.hiddenInput}
          onChange={handleUpload}
        />
        <button
          type="button"
          className={styles.bulkBtnPrimary}
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-4 h-4" />
          {uploading ? 'Uploading...' : 'Upload Template'}
        </button>
        <Link href="/bulk-order" className={styles.bulkBtnOutline} target="_blank">
          <ExternalLink className="w-4 h-4" />
          Open Bulk Order Page
        </Link>
      </div>
    </div>
  )
}
