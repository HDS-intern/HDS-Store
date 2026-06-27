'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { Upload, X } from 'lucide-react'
import { validateProductGalleryFiles } from '@/lib/productGalleryUpload'
import styles from './ProductBulkImagesModal.module.css'

export type BulkProductImageDraft = {
  rowId: string
  modelId: string
  manufacturingId: string
  name: string
  imageUrls: string[]
}

type ProductBulkImagesModalProps = {
  drafts: BulkProductImageDraft[]
  saving: boolean
  uploadingRowId: string | null
  onDraftsChange: (drafts: BulkProductImageDraft[]) => void
  onUploadFiles: (rowId: string, files: File[]) => Promise<void>
  onError: (message: string) => void
  onConfirm: () => void
  onBack: () => void
  onClose: () => void
}

function ImageDropZone({
  rowId,
  imageUrls,
  uploading,
  onUploadFiles,
  onRemove,
  onError,
}: {
  rowId: string
  imageUrls: string[]
  uploading: boolean
  onUploadFiles: (rowId: string, files: File[]) => Promise<void>
  onRemove: (rowId: string, url: string) => void
  onError: (message: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)

  const handleFiles = async (files: FileList | File[]) => {
    const list = Array.from(files)
    if (list.length === 0) return
    const validationError = validateProductGalleryFiles(list)
    if (validationError) {
      onError(validationError)
      return
    }
    await onUploadFiles(rowId, list)
  }

  return (
    <div
      className={`${styles.dropZone} ${dragActive ? styles.dropZoneActive : ''} ${uploading ? styles.dropZoneUploading : ''}`}
      onClick={() => inputRef.current?.click()}
      onDragEnter={(e) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(true)
      }}
      onDragOver={(e) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(true)
      }}
      onDragLeave={(e) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)
      }}
      onDrop={(e) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)
        void handleFiles(e.dataTransfer.files)
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          inputRef.current?.click()
        }
      }}
    >
      {imageUrls.length > 0 && (
        <div className={styles.previewGrid}>
          {imageUrls.map((url) => (
            <div key={url} className={styles.previewItem}>
              <Image src={url} alt="" width={72} height={72} className={styles.previewImg} unoptimized />
              <button
                type="button"
                className={styles.removeImgBtn}
                onClick={(e) => {
                  e.stopPropagation()
                  onRemove(rowId, url)
                }}
                aria-label="Remove image"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className={styles.dropHint}>
        {uploading ? (
          <span>Uploading...</span>
        ) : (
          <>
            <Upload className="w-5 h-5" />
            <span className={styles.dropHintTitle}>Drag & drop images here</span>
            <span>or click to browse · JPG, JPEG, PNG, WEBP · Max 2 MB each</span>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        multiple
        className={styles.hiddenInput}
        onChange={(e) => {
          if (e.target.files?.length) void handleFiles(e.target.files)
          e.target.value = ''
        }}
      />
    </div>
  )
}

export function ProductBulkImagesModal({
  drafts,
  saving,
  uploadingRowId,
  onDraftsChange,
  onUploadFiles,
  onError,
  onConfirm,
  onBack,
  onClose,
}: ProductBulkImagesModalProps) {
  const removeImage = (rowId: string, url: string) => {
    onDraftsChange(
      drafts.map((draft) =>
        draft.rowId === rowId
          ? { ...draft, imageUrls: draft.imageUrls.filter((item) => item !== url) }
          : draft
      )
    )
  }

  return (
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-bulk-images-title"
      onClick={onClose}
    >
      <div className={styles.popup} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div>
            <h2 id="product-bulk-images-title" className={styles.title}>
              Upload Product Images
            </h2>
            <p className={styles.subtitle}>
              Add one or more gallery images for each product. Drag and drop or browse from your
              folder.
            </p>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.rowNum}>#</th>
                <th>1. Product ID</th>
                <th>2. Product name</th>
                <th>3. Product images</th>
              </tr>
            </thead>
            <tbody className={drafts.length === 1 ? styles.tbodySingle : undefined}>
              {drafts.map((draft, index) => (
                <tr key={draft.rowId}>
                  <td className={styles.rowNum}>{index + 1}</td>
                  <td className={styles.productIdCell}>
                    <span className={styles.idLine}>
                      <span className={styles.idLabel}>SKU ID</span> {draft.modelId || '—'}
                    </span>
                    <span className={styles.idLine}>
                      <span className={styles.idLabel}>MFG ID</span> {draft.manufacturingId || '—'}
                    </span>
                  </td>
                  <td className={styles.productNameCell}>
                    {draft.name.trim() ? (
                      <span className={styles.productName}>{draft.name}</span>
                    ) : (
                      <span className={styles.productNameEmpty}>Untitled product</span>
                    )}
                  </td>
                  <td className={styles.imagesCell}>
                    <ImageDropZone
                      rowId={draft.rowId}
                      imageUrls={draft.imageUrls}
                      uploading={uploadingRowId === draft.rowId}
                      onUploadFiles={onUploadFiles}
                      onRemove={removeImage}
                      onError={onError}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={styles.footer}>
          <button type="button" className={styles.backBtn} onClick={onBack} disabled={saving}>
            Back
          </button>
          <button
            type="button"
            className={styles.saveBtn}
            onClick={onConfirm}
            disabled={saving || uploadingRowId !== null}
          >
            {saving ? (
              'Saving...'
            ) : (
              `Save ${drafts.length} Product${drafts.length === 1 ? '' : 's'}`
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
