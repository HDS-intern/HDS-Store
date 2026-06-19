'use client'

import { useRef, useState } from 'react'
import { Download, FileSpreadsheet, Upload, ExternalLink } from 'lucide-react'
import { getStoredToken } from '@/lib/api'
import styles from './AdminDashboard.module.css'

type InvoiceTemplatePanelProps = {
  isAdmin: boolean
  onMessage?: (msg: string) => void
  onError?: (msg: string) => void
  onOpenInvoices?: () => void
}

export function InvoiceTemplatePanel({
  isAdmin,
  onMessage,
  onError,
  onOpenInvoices,
}: InvoiceTemplatePanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [downloading, setDownloading] = useState<'xlsx' | 'csv' | null>(null)

  const downloadTemplate = async (format: 'xlsx' | 'csv') => {
    setDownloading(format)
    try {
      const token = getStoredToken()
      const res = await fetch(`/api/admin/invoice-template?format=${format}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Download failed')
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `hds-invoice-template.${format}`
      anchor.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Download failed')
    } finally {
      setDownloading(null)
    }
  }

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
      const res = await fetch('/api/admin/invoice-template', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      onMessage?.(`Invoice template updated: ${data.filename}`)
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
      <p className={styles.panelTitle}>Invoice Template</p>
      <p className={styles.bulkHint}>
        Upload the master invoice layout (.xlsx recommended). Downloaded invoices from the
        Invoices tab use this uploaded file and are filled with order details automatically.
        For custom layouts, use placeholders such as{' '}
        <strong>{'{{invoice_id}}'}</strong>, <strong>{'{{customer_name}}'}</strong>,{' '}
        <strong>{'{{amount}}'}</strong>, and <strong>{'{{shipping_address}}'}</strong>.
        The bundled HDS tax invoice layout is used until you upload your own file.
      </p>
      <div className={styles.bulkActions}>
        <button
          type="button"
          className={styles.bulkBtnOutline}
          disabled={downloading !== null}
          onClick={() => downloadTemplate('xlsx')}
        >
          <FileSpreadsheet className="w-4 h-4" />
          {downloading === 'xlsx' ? 'Downloading...' : 'Download .xlsx'}
        </button>
        <button
          type="button"
          className={styles.bulkBtnOutline}
          disabled={downloading !== null}
          onClick={() => downloadTemplate('csv')}
        >
          <Download className="w-4 h-4" />
          {downloading === 'csv' ? 'Downloading...' : 'Download .csv'}
        </button>
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
        {onOpenInvoices && (
          <button type="button" className={styles.bulkBtnOutline} onClick={onOpenInvoices}>
            <ExternalLink className="w-4 h-4" />
            Open Invoices
          </button>
        )}
      </div>
    </div>
  )
}
