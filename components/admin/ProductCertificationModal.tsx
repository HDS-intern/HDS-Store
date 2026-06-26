'use client'

import Image from 'next/image'
import { Plus } from 'lucide-react'
import styles from './ProductCertificationModal.module.css'

type ProductCertificationModalProps = {
  draftImage: string | null
  uploading: boolean
  onUploadClick: () => void
  onSave: () => void
  onClose: () => void
}

export function ProductCertificationModal({
  draftImage,
  uploading,
  onUploadClick,
  onSave,
  onClose,
}: ProductCertificationModalProps) {
  const canSave = Boolean(draftImage)

  return (
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="certification-modal-title"
      onClick={onClose}
    >
      <div className={styles.popup} onClick={(e) => e.stopPropagation()}>
        <h2 id="certification-modal-title" className={styles.title}>
          Certification
        </h2>
        <p className={styles.subtitle}>Upload the product certification image</p>

        <div className={styles.uploadArea}>
          {draftImage ? (
            <div className={styles.previewWrap}>
              <Image
                src={draftImage}
                alt="Certification preview"
                width={320}
                height={240}
                className={styles.preview}
                unoptimized
              />
              <button
                type="button"
                className={styles.replaceBtn}
                onClick={onUploadClick}
                disabled={uploading}
              >
                <Plus className="w-5 h-5" />
                <span>{uploading ? 'Uploading...' : 'Replace'}</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              className={styles.uploadBtn}
              onClick={onUploadClick}
              disabled={uploading}
              aria-label="Upload certification image"
            >
              <Plus className="w-10 h-10" />
              <span>{uploading ? 'Uploading...' : 'Upload'}</span>
            </button>
          )}
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={`${styles.saveBtn} ${canSave ? styles.saveBtnActive : styles.saveBtnInactive}`}
            onClick={onSave}
            disabled={!canSave}
          >
            Save
          </button>
          <button type="button" className={styles.closeBtn} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
