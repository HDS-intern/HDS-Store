'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { getStoredToken } from '@/lib/api'
import styles from './TermsAgreementViewModal.module.css'

type PreviewData =
  | { format: 'pdf'; filename: string }
  | { format: 'csv'; filename: string; content: string }
  | { format: 'html'; filename: string; content: string; sheetName?: string }

type TermsAgreementViewModalProps = {
  onClose: () => void
  onError?: (message: string) => void
  previewUrl?: string
}

export function TermsAgreementViewModal({
  onClose,
  onError,
  previewUrl = '/api/admin/terms-agreement/preview',
}: TermsAgreementViewModalProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<PreviewData | null>(null)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    let objectUrl: string | null = null

    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const token = getStoredToken()
        const headers = token ? { Authorization: `Bearer ${token}` } : {}

        const res = await fetch(previewUrl, { headers })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to load document')

        if (!active) return

        if (data.format === 'pdf') {
          const streamRes = await fetch(`${previewUrl}?stream=1`, { headers })
          if (!streamRes.ok) throw new Error('Failed to load PDF preview')
          const blob = await streamRes.blob()
          objectUrl = URL.createObjectURL(blob)
          if (!active) {
            URL.revokeObjectURL(objectUrl)
            return
          }
          setPdfUrl(objectUrl)
          setPreview({ format: 'pdf', filename: data.filename })
        } else {
          setPreview(data as PreviewData)
        }
      } catch (err) {
        if (!active) return
        const message = err instanceof Error ? err.message : 'Failed to load document'
        setError(message)
        onError?.(message)
      } finally {
        if (active) setLoading(false)
      }
    }

    void load()

    return () => {
      active = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [onError, previewUrl])

  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl)
    }
  }, [pdfUrl])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="terms-view-title"
      onClick={onClose}
    >
      <div className={styles.popup} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div>
            <h2 id="terms-view-title" className={styles.title}>
              Terms and Agreement
            </h2>
            {preview?.filename && <p className={styles.subtitle}>{preview.filename}</p>}
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className={styles.body}>
          {loading && <p className={styles.loading}>Loading document...</p>}
          {!loading && error && <p className={styles.error}>{error}</p>}
          {!loading && !error && preview?.format === 'pdf' && pdfUrl && (
            <iframe
              title="Terms and Agreement"
              src={pdfUrl}
              className={styles.pdfFrame}
            />
          )}
          {!loading && !error && preview?.format === 'csv' && (
            <pre className={styles.textContent}>{preview.content}</pre>
          )}
          {!loading && !error && preview?.format === 'html' && (
            <div
              className={styles.tableWrap}
              dangerouslySetInnerHTML={{ __html: preview.content }}
            />
          )}
        </div>
      </div>
    </div>
  )
}
