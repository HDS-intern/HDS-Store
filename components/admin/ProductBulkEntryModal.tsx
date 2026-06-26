'use client'

import { useRef } from 'react'
import Image from 'next/image'
import { X, Plus, Trash2, ImageIcon } from 'lucide-react'
import { syncPricingFields, type PricingField } from '@/lib/productPricing'
import styles from './ProductBulkEntryModal.module.css'

export const WARRANTY_DURATION_OPTIONS = ['1 Year', '2 Years', '3 Years'] as const

export type ProductDraftRow = {
  id: string
  name: string
  modelId: string
  manufacturingId: string
  maxPrice: string
  discount: string
  discountedPrice: string
  stock: string
  category: string
  image: string
  description: string
  warrantyDuration: (typeof WARRANTY_DURATION_OPTIONS)[number]
  certified: boolean
}

export function createEmptyProductDraftRow(): ProductDraftRow {
  return {
    id: `row-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: '',
    modelId: '',
    manufacturingId: '',
    maxPrice: '0',
    discount: '0',
    discountedPrice: '0',
    stock: '0',
    category: 'Professional Drones',
    image: '/images/drone-sentinel-pro.png',
    description: '',
    warrantyDuration: '2 Years',
    certified: false,
  }
}

type ProductBulkEntryModalProps = {
  rows: ProductDraftRow[]
  saving: boolean
  imageUploading: boolean
  onRowsChange: (rows: ProductDraftRow[]) => void
  onImageUpload: (rowId: string, file: File) => Promise<void>
  onSave: () => void
  onClose: () => void
}

export function ProductBulkEntryModal({
  rows,
  saving,
  imageUploading,
  onRowsChange,
  onImageUpload,
  onSave,
  onClose,
}: ProductBulkEntryModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadRowIdRef = useRef<string | null>(null)

  const updateRow = (id: string, patch: Partial<ProductDraftRow>) => {
    onRowsChange(rows.map((row) => (row.id === id ? { ...row, ...patch } : row)))
  }

  const updatePricing = (id: string, source: PricingField, field: PricingField, raw: string) => {
    if (raw !== '' && !/^\d+$/.test(raw)) return
    const row = rows.find((r) => r.id === id)
    if (!row) return
    const next = syncPricingFields(
      source,
      field === 'max' ? raw : row.maxPrice,
      field === 'discount' ? raw : row.discount,
      field === 'sale' ? raw : row.discountedPrice
    )
    updateRow(id, {
      maxPrice: next.max,
      discount: next.discount,
      discountedPrice: next.sale,
    })
  }

  const addRow = () => {
    onRowsChange([...rows, createEmptyProductDraftRow()])
  }

  const removeRow = (id: string) => {
    if (rows.length <= 1) return
    onRowsChange(rows.filter((row) => row.id !== id))
  }

  const triggerImageUpload = (rowId: string) => {
    uploadRowIdRef.current = rowId
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    const rowId = uploadRowIdRef.current
    if (!file || !rowId) return
    await onImageUpload(rowId, file)
    e.target.value = ''
    uploadRowIdRef.current = null
  }

  return (
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
              Add one product per row. Fill in the sheet columns, then save all rows.
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
                <th>#</th>
                <th>Name</th>
                <th>SKU ID *</th>
                <th>MFG ID *</th>
                <th>Max Price (₹)</th>
                <th>Discount %</th>
                <th>Discounted (₹)</th>
                <th>Stock</th>
                <th>Category</th>
                <th>Image</th>
                <th>Description</th>
                <th>Warranty</th>
                <th>Cert</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row.id}>
                  <td className={styles.rowNum}>{index + 1}</td>
                  <td>
                    <input
                      className={styles.cellInput}
                      value={row.name}
                      onChange={(e) => updateRow(row.id, { name: e.target.value })}
                      placeholder="Product name"
                    />
                  </td>
                  <td>
                    <input
                      className={styles.cellInput}
                      value={row.modelId}
                      onChange={(e) => updateRow(row.id, { modelId: e.target.value })}
                      placeholder="HDS-SKU-001"
                    />
                  </td>
                  <td>
                    <input
                      className={styles.cellInput}
                      value={row.manufacturingId}
                      onChange={(e) => updateRow(row.id, { manufacturingId: e.target.value })}
                      placeholder="MFG-001"
                    />
                  </td>
                  <td>
                    <input
                      className={styles.cellInput}
                      inputMode="numeric"
                      value={row.maxPrice}
                      onChange={(e) => updatePricing(row.id, 'max', 'max', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      className={styles.cellInput}
                      inputMode="numeric"
                      value={row.discount}
                      onChange={(e) => updatePricing(row.id, 'discount', 'discount', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      className={styles.cellInput}
                      inputMode="numeric"
                      value={row.discountedPrice}
                      onChange={(e) => updatePricing(row.id, 'sale', 'sale', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      className={styles.cellInput}
                      inputMode="numeric"
                      value={row.stock}
                      onChange={(e) => {
                        const raw = e.target.value
                        if (raw === '' || /^\d+$/.test(raw)) updateRow(row.id, { stock: raw })
                      }}
                    />
                  </td>
                  <td>
                    <input
                      className={styles.cellInput}
                      value={row.category}
                      onChange={(e) => updateRow(row.id, { category: e.target.value })}
                    />
                  </td>
                  <td>
                    <div className={styles.imageCell}>
                      {row.image && (
                        <Image
                          src={row.image}
                          alt=""
                          width={28}
                          height={28}
                          className={styles.imageThumb}
                          unoptimized
                        />
                      )}
                      <button
                        type="button"
                        className={styles.imageBtn}
                        onClick={() => triggerImageUpload(row.id)}
                        disabled={imageUploading}
                        aria-label="Upload image"
                      >
                        <ImageIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                  <td>
                    <input
                      className={styles.cellInput}
                      value={row.description}
                      onChange={(e) => updateRow(row.id, { description: e.target.value })}
                      placeholder="Description"
                    />
                  </td>
                  <td>
                    <select
                      className={styles.cellSelect}
                      value={row.warrantyDuration}
                      onChange={(e) =>
                        updateRow(row.id, {
                          warrantyDuration: e.target.value as ProductDraftRow['warrantyDuration'],
                        })
                      }
                    >
                      {WARRANTY_DURATION_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className={styles.certCell}>
                    <input
                      type="checkbox"
                      checked={row.certified}
                      onChange={(e) => updateRow(row.id, { certified: e.target.checked })}
                      aria-label="Certification"
                    />
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
          accept="image/jpeg,image/png,image/webp"
          className={styles.hiddenInput}
          onChange={handleFileChange}
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
  )
}
