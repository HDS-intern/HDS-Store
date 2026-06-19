'use client'

import { useRef, useState } from 'react'
import { Download, Eye, FileText, Upload } from 'lucide-react'
import { getStoredToken } from '@/lib/api'
import { TermsAgreementViewModal } from './TermsAgreementViewModal'
import styles from './AdminDashboard.module.css'

type TermsAgreementTemplatePanelProps = {
  isAdmin: boolean
  onMessage?: (msg: string) => void
  onError?: (msg: string) => void
}

export function TermsAgreementTemplatePanel({
  isAdmin,
  onMessage,
  onError,
}: TermsAgreementTemplatePanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)

  const downloadTemplate = async () => {
    setDownloading(true)
    try {
      const token = getStoredToken()
      const res = await fetch('/api/admin/terms-agreement', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Download failed')
      }

      const disposition = res.headers.get('Content-Disposition') || ''
      const match = disposition.match(/filename="([^"]+)"/)
      const filename = match?.[1] || 'hds-terms-and-agreement.pdf'

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = filename
      anchor.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Download failed')
    } finally {
      setDownloading(false)
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const name = file.name.toLowerCase()
    if (!name.endsWith('.pdf') && !name.endsWith('.xlsx') && !name.endsWith('.csv')) {
      onError?.('Only .pdf, .xlsx, and .csv files are allowed.')
      e.target.value = ''
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const token = getStoredToken()
      const res = await fetch('/api/admin/terms-agreement', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      onMessage?.(`Terms and agreement updated: ${data.filename}`)
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Template upload failed')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  if (!isAdmin) return null

  return (
    <>
      <div className={styles.bulkPanel}>
        <p className={styles.panelTitle}>Terms and Agreement</p>
        <p className={styles.bulkHint}>
          Upload the official terms and agreement document for HDS customers and staff. Only{' '}
          <strong>administrators</strong> can upload or replace this file. Accepted formats are{' '}
          <strong>.pdf</strong>, <strong>.xlsx</strong>, and <strong>.csv</strong>. Staff and
          customer accounts can download the published agreement from their account area or the
          admin sidebar.
        </p>
        <div className={styles.bulkActions}>
          <button
            type="button"
            className={styles.bulkBtnOutline}
            onClick={() => setViewOpen(true)}
          >
            <Eye className="w-4 h-4" />
            View Document
          </button>
          <button
            type="button"
            className={styles.bulkBtnOutline}
            disabled={downloading}
            onClick={downloadTemplate}
          >
            <Download className="w-4 h-4" />
            {downloading ? 'Downloading...' : 'Download'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.xlsx,.csv"
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
          <span className={styles.bulkHintInline}>
            <FileText className="w-4 h-4 inline" /> Admin upload only
          </span>
        </div>
      </div>

      {viewOpen && (
        <TermsAgreementViewModal onClose={() => setViewOpen(false)} onError={onError} />
      )}
    </>
  )
}
