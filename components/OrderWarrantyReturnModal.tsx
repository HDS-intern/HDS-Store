'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AlertCircle, RotateCcw, Shield, Upload, X } from 'lucide-react'
import { getStoredToken } from '@/lib/api'
import type { Product } from '@/lib/types'
import styles from './OrderWarrantyReturnModal.module.css'

type ModalKind = 'warranty' | 'return' | null

type OrderWarrantyReturnActionsProps = {
  orderId: string
  productId: string
  product: Product
}

export function OrderWarrantyReturnActions({
  orderId,
  productId,
  product,
}: OrderWarrantyReturnActionsProps) {
  const [modal, setModal] = useState<ModalKind>(null)
  const [notes, setNotes] = useState('')
  const [reason, setReason] = useState('')
  const [fileName, setFileName] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState('')
  const [alertMessage, setAlertMessage] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const showAlert = (message: string) => {
    setAlertMessage(message)
  }

  const closeAlert = () => {
    setAlertMessage(null)
  }

  const resetForm = () => {
    setNotes('')
    setReason('')
    setFileName('')
    setAgreed(false)
    setSuccess('')
    setAlertMessage(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const closeModal = () => {
    setModal(null)
    resetForm()
  }

  useEffect(() => {
    if (!modal) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal()
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [modal])

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault()
    const file = fileInputRef.current?.files?.[0]

    if (!agreed) {
      showAlert(
        modal === 'warranty'
          ? 'Please agree to the warranty terms to continue.'
          : 'Please agree to the return policy to continue.'
      )
      return
    }

    if (!file) {
      showAlert('Supporting document is not available. Please attach a file before submitting.')
      return
    }

    setSubmitting(true)
    setSuccess('')

    try {
      const formData = new FormData()
      formData.append('orderId', orderId)
      formData.append('productId', productId)
      formData.append('agreed', 'true')
      formData.append('file', file)

      if (modal === 'warranty') {
        formData.append('notes', notes)
      } else {
        formData.append('reason', reason)
      }

      const token = getStoredToken()
      const endpoint = modal === 'warranty' ? '/api/warranty-claims' : '/api/return-requests'
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Submission failed')

      setSuccess(
        modal === 'warranty'
          ? 'Warranty claim submitted successfully. Our team will review it shortly.'
          : 'Return request submitted successfully. Our team will contact you shortly.'
      )
      window.setTimeout(() => closeModal(), 1800)
    } catch (err) {
      showAlert(err instanceof Error ? err.message : 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  const modalContent =
    modal && mounted ? (
      <div
        className={styles.backdrop}
        role="dialog"
        aria-modal="true"
        aria-labelledby="warranty-return-title"
        onClick={closeModal}
      >
        <div className={styles.popup} onClick={(e) => e.stopPropagation()}>
          <button type="button" className={styles.closeBtn} onClick={closeModal} aria-label="Close">
            <X className="w-5 h-5" />
          </button>

          <div className={styles.header}>
            <h2 id="warranty-return-title" className={styles.title}>
              {modal === 'warranty' ? 'Warranty Claim' : 'Return Request'}
            </h2>
            <p className={styles.subtitle}>{product.name}</p>
          </div>

          <form className={styles.form} onSubmit={submitForm}>
            {modal === 'warranty' && (
              <div className={styles.warrantyDetails}>
                <p className={styles.sectionLabel}>Warranty details</p>
                <div className={styles.warrantyCard}>
                  <p className={styles.warrantyDuration}>{product.warranty.duration}</p>
                  <p className={styles.warrantyType}>{product.warranty.type}</p>
                  {product.warranty.extendedAvailable && product.warranty.extendedPrice && (
                    <p className={styles.warrantyExtra}>
                      Extended warranty: {product.warranty.extendedPrice}
                    </p>
                  )}
                  <ul className={styles.warrantyList}>
                    {product.warranty.coverage.slice(0, 4).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>

                <label className={styles.label} htmlFor={`issue-${orderId}-${productId}`}>
                  Issue note
                </label>
                <textarea
                  id={`issue-${orderId}-${productId}`}
                  className={styles.textarea}
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Describe the defect or issue in detail..."
                  required
                  minLength={10}
                />
              </div>
            )}

            {modal === 'return' && (
              <>
                <label className={styles.label} htmlFor={`reason-${orderId}-${productId}`}>
                  Reason for return
                </label>
                <textarea
                  id={`reason-${orderId}-${productId}`}
                  className={styles.textarea}
                  rows={4}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain why you are returning this product..."
                  required
                  minLength={10}
                />
              </>
            )}

            <label className={styles.label}>Supporting document</label>
            <div className={styles.fileRow}>
              <input
                ref={fileInputRef}
                type="file"
                className={styles.hiddenInput}
                accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.txt"
                onChange={(e) => setFileName(e.target.files?.[0]?.name ?? '')}
              />
              <button
                type="button"
                className={styles.fileBtn}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4" />
                Choose file
              </button>
              <span className={styles.fileName}>
                {fileName || 'PDF, image, or document up to 8 MB'}
              </span>
            </div>

            <label className={styles.agreementRow}>
              <input
                type="checkbox"
                className={styles.agreementCheck}
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
              />
              <span>
                {modal === 'warranty'
                  ? 'I confirm the information provided is accurate and agree to the HDS warranty terms and claim process.'
                  : 'I agree to the HDS return policy and confirm the product details and reason provided are accurate.'}
              </span>
            </label>

            {success && <p className={styles.success}>{success}</p>}

            <div className={styles.formActions}>
              <button type="button" className={styles.cancelBtn} onClick={closeModal}>
                Cancel
              </button>
              <button type="submit" className={styles.submitBtn} disabled={submitting || !!success}>
                {submitting
                  ? 'Submitting...'
                  : modal === 'warranty'
                    ? 'Submit warranty claim'
                    : 'Submit return request'}
              </button>
            </div>
          </form>
        </div>

        {alertMessage && (
          <div className={styles.alertBackdrop} onClick={closeAlert}>
            <div
              className={styles.alertPopup}
              role="alertdialog"
              aria-labelledby="warranty-alert-title"
              onClick={(e) => e.stopPropagation()}
            >
              <AlertCircle className={styles.alertIcon} />
              <h3 id="warranty-alert-title" className={styles.alertTitle}>
                {alertMessage.includes('document') ? 'Document required' : 'Action required'}
              </h3>
              <p className={styles.alertText}>{alertMessage}</p>
              <button type="button" className={styles.alertOkBtn} onClick={closeAlert}>
                OK
              </button>
            </div>
          </div>
        )}
      </div>
    ) : null

  return (
    <>
      <div className={styles.actionRow}>
        <button
          type="button"
          className={styles.actionBtn}
          onClick={() => {
            resetForm()
            setModal('warranty')
          }}
        >
          <Shield className="w-4 h-4" />
          Warranty
        </button>
        <button
          type="button"
          className={`${styles.actionBtn} ${styles.returnBtn}`}
          onClick={() => {
            resetForm()
            setModal('return')
          }}
        >
          <RotateCcw className="w-4 h-4" />
          Return
        </button>
      </div>

      {mounted && modalContent ? createPortal(modalContent, document.body) : null}
    </>
  )
}
