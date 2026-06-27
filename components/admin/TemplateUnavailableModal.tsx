'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'
import styles from './TermsAgreementViewModal.module.css'

type TemplateUnavailableModalProps = {
  title: string
  onClose: () => void
}

export function TemplateUnavailableModal({ title, onClose }: TemplateUnavailableModalProps) {
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
      aria-labelledby="template-unavailable-title"
      onClick={onClose}
    >
      <div className={styles.popup} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div>
            <h2 id="template-unavailable-title" className={styles.title}>
              {title}
            </h2>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className={styles.body}>
          <p className={styles.loading}>Template is not available.</p>
        </div>
      </div>
    </div>
  )
}
