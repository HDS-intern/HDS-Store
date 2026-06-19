'use client'

import { useState } from 'react'
import { Download, FileText } from 'lucide-react'
import { getStoredToken } from '@/lib/api'

type TermsAgreementDownloadProps = {
  className?: string
  label?: string
  variant?: 'button' | 'link'
  onError?: (message: string) => void
}

export function TermsAgreementDownload({
  className = '',
  label = 'Download Terms & Agreement',
  variant = 'button',
  onError,
}: TermsAgreementDownloadProps) {
  const [downloading, setDownloading] = useState(false)

  const download = async () => {
    setDownloading(true)
    try {
      const token = getStoredToken()
      const res = await fetch('/api/terms-agreement', {
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

  if (variant === 'link') {
    return (
      <button
        type="button"
        className={className}
        onClick={download}
        disabled={downloading}
      >
        <FileText className="w-4 h-4" />
        {downloading ? 'Downloading...' : label}
      </button>
    )
  }

  return (
    <button type="button" className={className} onClick={download} disabled={downloading}>
      <Download className="w-4 h-4" />
      {downloading ? 'Downloading...' : label}
    </button>
  )
}
