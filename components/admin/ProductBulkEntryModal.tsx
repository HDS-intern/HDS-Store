'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { X, Plus, Trash2, ImageIcon } from 'lucide-react'
import { AnimatedFormSelect, type AnimatedFormSelectOption } from '@/components/admin/AnimatedFormSelect'
import { apiFetch, getStoredToken } from '@/lib/api'
import type { CertificationTypeRecord } from '@/lib/certificationTypes'
import { syncPricingFields, type PricingField } from '@/lib/productPricing'
import { applySequentialAutoIds } from '@/lib/productIdGenerator'
import styles from './ProductBulkEntryModal.module.css'

export type ProductDraftRow = {
  id: string
  modelId: string
  manufacturingId: string
  stock: string
  minStockQty: string
  basePrice: string
  mrp: string
  discount: string
  finalPrice: string
  name: string
  specification: string
  certificationType: string
  certificationLogo: string
  certificationDocument: string
}

const CREATE_CERT_VALUE = '__create_cert_type__'

export function createEmptyProductDraftRow(): ProductDraftRow {
  return {
    id: `row-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    modelId: '',
    manufacturingId: '',
    stock: '0',
    minStockQty: '0',
    basePrice: '0',
    mrp: '0',
    discount: '0',
    finalPrice: '0',
    name: '',
    specification: '',
    certificationType: '',
    certificationLogo: '',
    certificationDocument: '',
  }
}

type ProductBulkEntryModalProps = {
  rows: ProductDraftRow[]
  saving: boolean
  certDocumentUploading: boolean
  onRowsChange: (rows: ProductDraftRow[]) => void
  onCertDocumentUpload: (rowId: string, file: File) => Promise<void>
  onSave: () => void
  onClose: () => void
}

function buildCertOptions(types: CertificationTypeRecord[]): AnimatedFormSelectOption[] {
  const unique = types.filter(Boolean)
  return [
    { value: '', label: 'Select type', tone: 'default' },
    ...unique.map((item) => ({
      value: item.type,
      label: item.type,
      tone: 'default' as const,
    })),
    { value: CREATE_CERT_VALUE, label: 'Create certification type', tone: 'default' },
  ]
}

async function uploadCertificationLogo(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('kind', 'logo')
  const token = getStoredToken()
  const res = await fetch('/api/admin/certifications/upload', {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  })
  const data = (await res.json()) as { url?: string; error?: string }
  if (!res.ok) throw new Error(data.error || 'Upload failed')
  if (!data.url) throw new Error('Upload failed')
  return data.url
}

export function ProductBulkEntryModal({
  rows,
  saving,
  certDocumentUploading,
  onRowsChange,
  onCertDocumentUpload,
  onSave,
  onClose,
}: ProductBulkEntryModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const certTypeLogoInputRef = useRef<HTMLInputElement>(null)
  const uploadRowIdRef = useRef<string | null>(null)
  const [autoIdEnabled, setAutoIdEnabled] = useState(false)
  const [noteRowId, setNoteRowId] = useState<string | null>(null)
  const [createCertRowId, setCreateCertRowId] = useState<string | null>(null)
  const [certTypes, setCertTypes] = useState<CertificationTypeRecord[]>([])
  const [certTypesLoading, setCertTypesLoading] = useState(false)
  const [editingCertTypeId, setEditingCertTypeId] = useState<string | null>(null)
  const [newCertTypeName, setNewCertTypeName] = useState('')
  const [newCertLogoUrl, setNewCertLogoUrl] = useState('')
  const [certTypeUploading, setCertTypeUploading] = useState(false)
  const [certTypeSaving, setCertTypeSaving] = useState(false)
  const [certTypeError, setCertTypeError] = useState('')
  const [certOptions, setCertOptions] = useState<AnimatedFormSelectOption[]>(() =>
    buildCertOptions([])
  )

  const noteRow = noteRowId ? rows.find((row) => row.id === noteRowId) : null
  const createCertRow = createCertRowId ? rows.find((row) => row.id === createCertRowId) : null

  const syncCertOptions = (types: CertificationTypeRecord[]) => {
    setCertTypes(types)
    setCertOptions(buildCertOptions(types))
  }

  const loadCertificationTypes = async () => {
    setCertTypesLoading(true)
    setCertTypeError('')
    try {
      const data = await apiFetch<{ certificationTypes: CertificationTypeRecord[] }>(
        '/api/admin/certification-types'
      )
      syncCertOptions(Array.isArray(data.certificationTypes) ? data.certificationTypes : [])
    } catch (e) {
      setCertTypeError(e instanceof Error ? e.message : 'Failed to load certification types')
      syncCertOptions([])
    } finally {
      setCertTypesLoading(false)
    }
  }

  useEffect(() => {
    void loadCertificationTypes()
  }, [])

  const updateRow = (id: string, patch: Partial<ProductDraftRow>) => {
    onRowsChange(rows.map((row) => (row.id === id ? { ...row, ...patch } : row)))
  }

  const updatePricing = (id: string, source: PricingField, field: PricingField, raw: string) => {
    if (raw !== '' && !/^\d+$/.test(raw)) return
    const row = rows.find((r) => r.id === id)
    if (!row) return
    const next = syncPricingFields(
      source,
      field === 'max' ? raw : row.mrp,
      field === 'discount' ? raw : row.discount,
      field === 'sale' ? raw : row.finalPrice
    )
    updateRow(id, {
      mrp: next.max,
      discount: next.discount,
      finalPrice: next.sale,
    })
  }

  const updateNumericField = (id: string, key: keyof ProductDraftRow, raw: string) => {
    if (raw === '' || /^\d+$/.test(raw)) updateRow(id, { [key]: raw })
  }

  const handleAutoToggle = (checked: boolean) => {
    setAutoIdEnabled(checked)
    if (checked) {
      onRowsChange(applySequentialAutoIds(rows))
    }
  }

  const resetCertTypeForm = () => {
    setEditingCertTypeId(null)
    setNewCertTypeName('')
    setNewCertLogoUrl('')
    setCertTypeError('')
  }

  const openCertTypeManager = (rowId: string) => {
    setCreateCertRowId(rowId)
    resetCertTypeForm()
    void loadCertificationTypes()
  }

  const closeCertTypeManager = () => {
    setCreateCertRowId(null)
    resetCertTypeForm()
  }

  const handleCertTypeChange = (rowId: string, value: string) => {
    if (value === CREATE_CERT_VALUE) {
      openCertTypeManager(rowId)
      return
    }
    const match = certTypes.find((item) => item.type === value)
    updateRow(rowId, {
      certificationType: value,
      certificationLogo: match?.logoUrl ?? '',
    })
  }

  const applyCertTypeToRow = (type: string, logoUrl: string) => {
    if (!createCertRowId) return
    updateRow(createCertRowId, { certificationType: type, certificationLogo: logoUrl })
  }

  const handleCertTypeLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCertTypeUploading(true)
    setCertTypeError('')
    try {
      const url = await uploadCertificationLogo(file)
      setNewCertLogoUrl(url)
    } catch (err) {
      setCertTypeError(err instanceof Error ? err.message : 'Logo upload failed')
    } finally {
      e.target.value = ''
      setCertTypeUploading(false)
    }
  }

  const saveCertType = async () => {
    const name = newCertTypeName.trim()
    if (!name) {
      setCertTypeError('Certification type name is required')
      return
    }
    if (!newCertLogoUrl) {
      setCertTypeError('Certification logo is required')
      return
    }

    setCertTypeSaving(true)
    setCertTypeError('')
    try {
      if (editingCertTypeId) {
        await apiFetch('/api/admin/certification-types', {
          method: 'PUT',
          body: JSON.stringify({ id: editingCertTypeId, type: name, logoUrl: newCertLogoUrl }),
        })
      } else {
        await apiFetch('/api/admin/certification-types', {
          method: 'POST',
          body: JSON.stringify({ type: name, logoUrl: newCertLogoUrl }),
        })
      }
      await loadCertificationTypes()
      applyCertTypeToRow(name, newCertLogoUrl)
      resetCertTypeForm()
    } catch (err) {
      setCertTypeError(err instanceof Error ? err.message : 'Failed to save certification type')
    } finally {
      setCertTypeSaving(false)
    }
  }

  const startEditCertType = (item: CertificationTypeRecord) => {
    setEditingCertTypeId(item.id)
    setNewCertTypeName(item.type)
    setNewCertLogoUrl(item.logoUrl)
    setCertTypeError('')
  }

  const deleteCertType = async (item: CertificationTypeRecord) => {
    if (!window.confirm(`Delete certification type "${item.type}"?`)) return
    setCertTypeError('')
    try {
      await apiFetch(`/api/admin/certification-types?id=${encodeURIComponent(item.id)}`, {
        method: 'DELETE',
      })
      if (editingCertTypeId === item.id) resetCertTypeForm()
      await loadCertificationTypes()
      onRowsChange(
        rows.map((row) =>
          row.certificationType === item.type
            ? { ...row, certificationType: '', certificationLogo: '' }
            : row
        )
      )
    } catch (err) {
      setCertTypeError(err instanceof Error ? err.message : 'Failed to delete certification type')
    }
  }

  const useCertTypeForRow = (item: CertificationTypeRecord) => {
    applyCertTypeToRow(item.type, item.logoUrl)
    closeCertTypeManager()
  }

  const addRow = () => {
    const next = [...rows, createEmptyProductDraftRow()]
    onRowsChange(autoIdEnabled ? applySequentialAutoIds(next) : next)
  }

  const removeRow = (id: string) => {
    if (rows.length <= 1) return
    const next = rows.filter((row) => row.id !== id)
    onRowsChange(autoIdEnabled ? applySequentialAutoIds(next) : next)
  }

  const triggerCertDocumentUpload = (rowId: string) => {
    uploadRowIdRef.current = rowId
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    const rowId = uploadRowIdRef.current
    if (!file || !rowId) return
    await onCertDocumentUpload(rowId, file)
    e.target.value = ''
    uploadRowIdRef.current = null
  }

  return (
    <>
      <div
        className={styles.backdrop}
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-bulk-title"
        onClick={onClose}
      >
        <div className={styles.popup} onClick={(e) => e.stopPropagation()}>
          <div className={styles.header}>
            <div>
              <h2 id="product-bulk-title" className={styles.title}>
                New Products
              </h2>
              <p className={styles.subtitle}>
                Add one product per row. Fill in the grouped sheet columns, then save all rows.
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
                  <th rowSpan={2} className={styles.rowNumHead}>
                    #
                  </th>
                  <th colSpan={2} className={styles.groupHead}>
                    <span>Product ID</span>
                    <label className={styles.autoCheckLabel}>
                      <input
                        type="checkbox"
                        className={styles.autoCheck}
                        checked={autoIdEnabled}
                        onChange={(e) => handleAutoToggle(e.target.checked)}
                      />
                      Auto
                    </label>
                  </th>
                  <th colSpan={2} className={styles.groupHead}>
                    QTY in stock
                  </th>
                  <th colSpan={4} className={styles.groupHead}>
                    Pricing information
                  </th>
                  <th colSpan={2} className={styles.groupHead}>
                    Technical Specifications
                  </th>
                  <th colSpan={2} className={styles.groupHead}>
                    Certification
                  </th>
                  <th rowSpan={2} className={styles.actionsHead} />
                </tr>
                <tr>
                  <th className={styles.subHead}>1. SKU ID *</th>
                  <th className={styles.subHead}>2. MFG ID *</th>
                  <th className={styles.subHead}>1. Total qty *</th>
                  <th className={styles.subHead}>2. Min stock qty *</th>
                  <th className={styles.subHead}>1. Base price (₹) *</th>
                  <th className={styles.subHead}>2. MRP (₹) *</th>
                  <th className={styles.subHead}>3. Discount value in %</th>
                  <th className={styles.subHead}>4. Final price (₹)</th>
                  <th className={styles.subHead}>1. Product name *</th>
                  <th className={styles.subHead}>2. Note *</th>
                  <th className={styles.subHead}>1. Certification type</th>
                  <th className={styles.subHead}>2. Certification logo</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={row.id}>
                    <td className={styles.rowNum}>{index + 1}</td>
                    <td>
                      <input
                        className={styles.cellInput}
                        value={row.modelId}
                        onChange={(e) => updateRow(row.id, { modelId: e.target.value })}
                        placeholder="HDS-SKU-001"
                        readOnly={autoIdEnabled}
                      />
                    </td>
                    <td>
                      <input
                        className={styles.cellInput}
                        value={row.manufacturingId}
                        onChange={(e) => updateRow(row.id, { manufacturingId: e.target.value })}
                        placeholder="MFG-001"
                        readOnly={autoIdEnabled}
                      />
                    </td>
                    <td>
                      <input
                        className={styles.cellInput}
                        inputMode="numeric"
                        value={row.stock}
                        onChange={(e) => updateNumericField(row.id, 'stock', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        className={styles.cellInput}
                        inputMode="numeric"
                        value={row.minStockQty}
                        onChange={(e) => updateNumericField(row.id, 'minStockQty', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        className={styles.cellInput}
                        inputMode="numeric"
                        value={row.basePrice}
                        onChange={(e) => updateNumericField(row.id, 'basePrice', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        className={styles.cellInput}
                        inputMode="numeric"
                        value={row.mrp}
                        onChange={(e) => updatePricing(row.id, 'max', 'max', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        className={styles.cellInput}
                        inputMode="numeric"
                        value={row.discount}
                        onChange={(e) =>
                          updatePricing(row.id, 'discount', 'discount', e.target.value)
                        }
                      />
                    </td>
                    <td>
                      <input
                        className={styles.cellInput}
                        inputMode="numeric"
                        value={row.finalPrice}
                        onChange={(e) => updatePricing(row.id, 'sale', 'sale', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        className={styles.cellInput}
                        value={row.name}
                        onChange={(e) => updateRow(row.id, { name: e.target.value })}
                        placeholder="Product name"
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        className={`${styles.noteBtn} ${row.specification.trim() ? styles.noteBtnFilled : ''}`}
                        onClick={() => setNoteRowId(row.id)}
                      >
                        Note
                      </button>
                    </td>
                    <td>
                      <AnimatedFormSelect
                        className={styles.certSelectWrap}
                        variant="cell"
                        value={
                          row.certificationType === CREATE_CERT_VALUE ? '' : row.certificationType
                        }
                        options={certOptions}
                        onChange={(value) => handleCertTypeChange(row.id, value)}
                      />
                    </td>
                    <td className={styles.logoCellTd}>
                      <button
                        type="button"
                        className={`${styles.logoBtn} ${row.certificationLogo ? styles.logoBtnFilled : ''}`}
                        onClick={() => triggerCertDocumentUpload(row.id)}
                        disabled={certDocumentUploading}
                        aria-label={
                          row.certificationDocument
                            ? 'Certificate uploaded — click to replace'
                            : 'Upload certificate document'
                        }
                        title={
                          row.certificationDocument
                            ? 'Certificate uploaded — click to replace'
                            : 'Upload certificate document'
                        }
                      >
                        <span
                          className={`${styles.certUploadStatus} ${
                            row.certificationDocument
                              ? styles.certUploadStatusDone
                              : styles.certUploadStatusPending
                          }`}
                          aria-hidden="true"
                        />
                        {row.certificationLogo ? (
                          <Image
                            src={row.certificationLogo}
                            alt=""
                            width={48}
                            height={48}
                            className={styles.logoBtnPreview}
                            unoptimized
                          />
                        ) : (
                          <ImageIcon className="w-5 h-5" />
                        )}
                      </button>
                    </td>
                    <td>
                      <button
                        type="button"
                        className={styles.removeRowBtn}
                        onClick={() => removeRow(row.id)}
                        disabled={rows.length <= 1}
                        aria-label="Remove row"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
            className={styles.hiddenInput}
            onChange={handleFileChange}
          />
          <input
            ref={certTypeLogoInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,image/jpeg,image/png"
            className={styles.hiddenInput}
            onChange={handleCertTypeLogoUpload}
          />

          <div className={styles.footer}>
            <button type="button" className={styles.addRowBtn} onClick={addRow}>
              <Plus className="w-4 h-4" />
              Add Row
            </button>
            <div className={styles.footerActions}>
              <button type="button" className={styles.saveBtn} onClick={onSave} disabled={saving}>
                {saving ? 'Saving...' : `Save ${rows.length} Product${rows.length === 1 ? '' : 's'}`}
              </button>
              <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={saving}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>

      {createCertRow && (
        <div
          className={styles.noteBackdrop}
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-cert-type-title"
          onClick={closeCertTypeManager}
        >
          <div className={styles.createCertModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.noteHeader}>
              <div>
                <h3 id="create-cert-type-title" className={styles.noteTitle}>
                  Manage certification types
                </h3>
                <p className={styles.noteMeta}>
                  Row {rows.findIndex((row) => row.id === createCertRow.id) + 1}
                  {createCertRow.name.trim() ? ` · ${createCertRow.name}` : ''}
                </p>
              </div>
              <button
                type="button"
                className={styles.noteCloseBtn}
                onClick={closeCertTypeManager}
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className={styles.createCertBody}>
              {certTypeError && <p className={styles.certTypeError}>{certTypeError}</p>}

              <div className={styles.createCertFormTableWrap}>
                <table className={styles.createCertFormTable}>
                  <thead>
                    <tr>
                      <th>Certification type</th>
                      <th>Logo upload</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <input
                          className={styles.createCertInputInline}
                          value={newCertTypeName}
                          onChange={(e) => setNewCertTypeName(e.target.value)}
                          placeholder="Enter certification type name"
                          autoFocus
                        />
                      </td>
                      <td>
                        <button
                          type="button"
                          className={`${styles.createCertLogoBtn} ${newCertLogoUrl ? styles.createCertLogoBtnFilled : ''}`}
                          onClick={() => certTypeLogoInputRef.current?.click()}
                          disabled={certTypeUploading}
                        >
                          {newCertLogoUrl ? (
                            <>
                              <Image
                                src={newCertLogoUrl}
                                alt=""
                                width={36}
                                height={36}
                                className={styles.createCertLogoPreview}
                                unoptimized
                              />
                              <span>{certTypeUploading ? 'Uploading...' : 'Change logo'}</span>
                            </>
                          ) : (
                            <>
                              <ImageIcon className="w-5 h-5" />
                              <span>{certTypeUploading ? 'Uploading...' : 'Upload logo'}</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className={styles.createCertFormActions}>
                {editingCertTypeId && (
                  <button type="button" className={styles.certTypeCancelEditBtn} onClick={resetCertTypeForm}>
                    Cancel edit
                  </button>
                )}
                <button
                  type="button"
                  className={styles.noteDoneBtn}
                  onClick={() => void saveCertType()}
                  disabled={certTypeSaving || certTypeUploading || !newCertTypeName.trim() || !newCertLogoUrl}
                >
                  {certTypeSaving
                    ? 'Saving...'
                    : editingCertTypeId
                      ? 'Update type'
                      : 'Add type'}
                </button>
              </div>

              <h4 className={styles.createCertListTitle}>Existing certification types</h4>
              <div className={styles.createCertListWrap}>
                {certTypesLoading ? (
                  <p className={styles.createCertEmpty}>Loading certification types...</p>
                ) : (
                  <table className={styles.createCertListTable}>
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Logo</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {certTypes.map((item) => (
                        <tr key={item.id}>
                          <td>{item.type}</td>
                          <td>
                            <Image
                              src={item.logoUrl}
                              alt={`${item.type} logo`}
                              width={40}
                              height={40}
                              className={styles.createCertListLogo}
                              unoptimized
                            />
                          </td>
                          <td>
                            <div className={styles.createCertActions}>
                              <button
                                type="button"
                                className={styles.certTypeUseBtn}
                                onClick={() => useCertTypeForRow(item)}
                              >
                                Use
                              </button>
                              <button
                                type="button"
                                className={styles.certTypeEditBtn}
                                onClick={() => startEditCertType(item)}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className={styles.certTypeDeleteBtn}
                                onClick={() => void deleteCertType(item)}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {certTypes.length === 0 && (
                        <tr>
                          <td colSpan={3} className={styles.createCertEmpty}>
                            No certification types yet. Add one above.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <div className={styles.noteActions}>
              <button type="button" className={styles.noteDoneBtn} onClick={closeCertTypeManager}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {noteRow && (
        <div
          className={styles.noteBackdrop}
          role="dialog"
          aria-modal="true"
          aria-labelledby="spec-note-title"
          onClick={() => setNoteRowId(null)}
        >
          <div className={styles.noteModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.noteHeader}>
              <div>
                <h3 id="spec-note-title" className={styles.noteTitle}>
                  Specification Note
                </h3>
                <p className={styles.noteMeta}>
                  Row {rows.findIndex((row) => row.id === noteRow.id) + 1}
                  {noteRow.name.trim() ? ` · ${noteRow.name}` : ''}
                </p>
              </div>
              <button
                type="button"
                className={styles.noteCloseBtn}
                onClick={() => setNoteRowId(null)}
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <textarea
              className={styles.noteTextarea}
              value={noteRow.specification}
              onChange={(e) => updateRow(noteRow.id, { specification: e.target.value })}
              placeholder="Enter product specification details..."
              autoFocus
            />
            <div className={styles.noteActions}>
              <button type="button" className={styles.noteDoneBtn} onClick={() => setNoteRowId(null)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
