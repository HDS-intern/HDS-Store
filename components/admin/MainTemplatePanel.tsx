'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Plus, Trash2, Upload, Save, ImageIcon } from 'lucide-react'
import { apiFetch, getStoredToken } from '@/lib/api'
import {
  createSlideId,
  type HomeSlide,
  type MainTemplate,
  type PopupType,
} from '@/lib/mainTemplateTypes'
import styles from './MainTemplatePanel.module.css'

type MainTemplatePanelProps = {
  onMessage?: (msg: string) => void
  onError?: (msg: string) => void
}

export function MainTemplatePanel({ onMessage, onError }: MainTemplatePanelProps) {
  const [template, setTemplate] = useState<MainTemplate | null>(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const uploadTargetRef = useRef<{ type: 'slide' | 'hero' | 'popup'; slideId?: string } | null>(
    null
  )
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    apiFetch<{ template: MainTemplate }>('/api/admin/main-template')
      .then((data) => setTemplate(data.template))
      .catch((err) => onError?.(err instanceof Error ? err.message : 'Failed to load template'))
      .finally(() => setLoading(false))
  }, [onError])

  const updateSlide = (id: string, patch: Partial<HomeSlide>) => {
    setTemplate((prev) =>
      prev
        ? {
            ...prev,
            slides: prev.slides.map((slide) => (slide.id === id ? { ...slide, ...patch } : slide)),
          }
        : prev
    )
  }

  const addSlide = () => {
    setTemplate((prev) =>
      prev
        ? {
            ...prev,
            slides: [
              ...prev.slides,
              {
                id: createSlideId(),
                image: '/placeholder.svg',
                badge: 'Featured',
                title: 'New Slide',
                description: 'Add your slide description here.',
                linkUrl: '/shop',
                buttonText: 'Shop Now',
              },
            ],
          }
        : prev
    )
  }

  const removeSlide = (id: string) => {
    setTemplate((prev) =>
      prev && prev.slides.length > 1
        ? { ...prev, slides: prev.slides.filter((slide) => slide.id !== id) }
        : prev
    )
  }

  const triggerUpload = (target: { type: 'slide' | 'hero' | 'popup'; slideId?: string }) => {
    uploadTargetRef.current = target
    fileInputRef.current?.click()
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    const target = uploadTargetRef.current
    if (!file || !target) return

    try {
      const formData = new FormData()
      formData.append('file', file)
      const token = getStoredToken()
      const res = await fetch('/api/admin/main-template', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')

      setTemplate((prev) => {
        if (!prev) return prev
        if (target.type === 'hero') {
          return { ...prev, hero: { ...prev.hero, image: data.url } }
        }
        if (target.type === 'popup') {
          return { ...prev, popup: { ...prev.popup, image: data.url } }
        }
        if (target.type === 'slide' && target.slideId) {
          return {
            ...prev,
            slides: prev.slides.map((slide) =>
              slide.id === target.slideId ? { ...slide, image: data.url } : slide
            ),
          }
        }
        return prev
      })
      onMessage?.('Image uploaded successfully')
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Image upload failed')
    } finally {
      e.target.value = ''
      uploadTargetRef.current = null
    }
  }

  const handleSave = async () => {
    if (!template) return
    setSaving(true)
    try {
      const data = await apiFetch<{ template: MainTemplate }>('/api/admin/main-template', {
        method: 'PUT',
        body: JSON.stringify({ template }),
      })
      setTemplate(data.template)
      onMessage?.('Main template saved successfully')
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Failed to save template')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className={styles.loading}>Loading main template...</p>
  }

  if (!template) return null

  return (
    <div className={styles.panel}>
      <p className={styles.panelTitle}>Main Template</p>
      <p className={styles.hint}>
        Customize the homepage slideshow, hero section, and optional promotional popup for offers or
        new arrivals.
      </p>

      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp"
        className={styles.hiddenInput}
        onChange={handleImageUpload}
      />

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Homepage Slideshow</h3>
          <button type="button" className={styles.addBtn} onClick={addSlide}>
            <Plus className="w-4 h-4" />
            Add Slide
          </button>
        </div>

        <div className={styles.slideGrid}>
          {template.slides.map((slide, index) => (
            <div key={slide.id} className={styles.slideCard}>
              <div className={styles.slideCardHeader}>
                <span className={styles.slideLabel}>Slide {index + 1}</span>
                {template.slides.length > 1 && (
                  <button
                    type="button"
                    className={styles.removeBtn}
                    onClick={() => removeSlide(slide.id)}
                    aria-label={`Remove slide ${index + 1}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className={styles.imagePreview}>
                <Image src={slide.image} alt={slide.title} fill className="object-cover" />
              </div>

              <div className={styles.fieldRow}>
                <label className={styles.label}>Image URL</label>
                <div className={styles.imageField}>
                  <input
                    className={styles.input}
                    value={slide.image}
                    onChange={(e) => updateSlide(slide.id, { image: e.target.value })}
                  />
                  <button
                    type="button"
                    className={styles.uploadBtn}
                    onClick={() => triggerUpload({ type: 'slide', slideId: slide.id })}
                  >
                    <Upload className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className={styles.fieldRow}>
                <label className={styles.label}>Badge</label>
                <input
                  className={styles.input}
                  value={slide.badge}
                  onChange={(e) => updateSlide(slide.id, { badge: e.target.value })}
                />
              </div>
              <div className={styles.fieldRow}>
                <label className={styles.label}>Title</label>
                <input
                  className={styles.input}
                  value={slide.title}
                  onChange={(e) => updateSlide(slide.id, { title: e.target.value })}
                />
              </div>
              <div className={styles.fieldRow}>
                <label className={styles.label}>Content</label>
                <textarea
                  className={styles.textarea}
                  rows={3}
                  value={slide.description}
                  onChange={(e) => updateSlide(slide.id, { description: e.target.value })}
                />
              </div>
              <div className={styles.fieldRow}>
                <label className={styles.label}>Button Text</label>
                <input
                  className={styles.input}
                  value={slide.buttonText}
                  onChange={(e) => updateSlide(slide.id, { buttonText: e.target.value })}
                />
              </div>
              <div className={styles.fieldRow}>
                <label className={styles.label}>Link URL</label>
                <input
                  className={styles.input}
                  value={slide.linkUrl}
                  onChange={(e) => updateSlide(slide.id, { linkUrl: e.target.value })}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Hero Section</h3>
        <div className={styles.heroGrid}>
          <div className={styles.imagePreview}>
            <Image src={template.hero.image} alt="Hero" fill className="object-cover" />
          </div>
          <div className={styles.heroFields}>
            <div className={styles.fieldRow}>
              <label className={styles.label}>Hero Image URL</label>
              <div className={styles.imageField}>
                <input
                  className={styles.input}
                  value={template.hero.image}
                  onChange={(e) =>
                    setTemplate({ ...template, hero: { ...template.hero, image: e.target.value } })
                  }
                />
                <button
                  type="button"
                  className={styles.uploadBtn}
                  onClick={() => triggerUpload({ type: 'hero' })}
                >
                  <Upload className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className={styles.fieldRow}>
              <label className={styles.label}>Headline</label>
              <input
                className={styles.input}
                value={template.hero.title}
                onChange={(e) =>
                  setTemplate({ ...template, hero: { ...template.hero, title: e.target.value } })
                }
              />
            </div>
            <div className={styles.fieldRow}>
              <label className={styles.label}>Subtitle</label>
              <textarea
                className={styles.textarea}
                rows={3}
                value={template.hero.subtitle}
                onChange={(e) =>
                  setTemplate({ ...template, hero: { ...template.hero, subtitle: e.target.value } })
                }
              />
            </div>
            <div className={styles.twoCol}>
              <div className={styles.fieldRow}>
                <label className={styles.label}>Primary Button</label>
                <input
                  className={styles.input}
                  value={template.hero.primaryButtonText}
                  onChange={(e) =>
                    setTemplate({
                      ...template,
                      hero: { ...template.hero, primaryButtonText: e.target.value },
                    })
                  }
                />
              </div>
              <div className={styles.fieldRow}>
                <label className={styles.label}>Primary Link</label>
                <input
                  className={styles.input}
                  value={template.hero.primaryButtonUrl}
                  onChange={(e) =>
                    setTemplate({
                      ...template,
                      hero: { ...template.hero, primaryButtonUrl: e.target.value },
                    })
                  }
                />
              </div>
            </div>
            <div className={styles.twoCol}>
              <div className={styles.fieldRow}>
                <label className={styles.label}>Secondary Button</label>
                <input
                  className={styles.input}
                  value={template.hero.secondaryButtonText}
                  onChange={(e) =>
                    setTemplate({
                      ...template,
                      hero: { ...template.hero, secondaryButtonText: e.target.value },
                    })
                  }
                />
              </div>
              <div className={styles.fieldRow}>
                <label className={styles.label}>Secondary Link</label>
                <input
                  className={styles.input}
                  value={template.hero.secondaryButtonUrl}
                  onChange={(e) =>
                    setTemplate({
                      ...template,
                      hero: { ...template.hero, secondaryButtonUrl: e.target.value },
                    })
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.popupHeader}>
          <h3 className={styles.sectionTitle}>Promotional Popup</h3>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={template.popup.enabled}
              onChange={(e) =>
                setTemplate({
                  ...template,
                  popup: { ...template.popup, enabled: e.target.checked },
                })
              }
            />
            Enable popup on homepage
          </label>
        </div>

        {template.popup.enabled && (
          <div className={styles.popupGrid}>
            <div className={styles.imagePreview}>
              <Image src={template.popup.image} alt="Popup" fill className="object-cover" />
              <span className={styles.popupBadge}>
                <ImageIcon className="w-3 h-3" />
                {template.popup.type === 'offers' ? 'Offers' : 'New Arrivals'}
              </span>
            </div>
            <div className={styles.popupFields}>
              <div className={styles.fieldRow}>
                <label className={styles.label}>Popup Type</label>
                <select
                  className="hds-select-dark"
                  value={template.popup.type}
                  onChange={(e) =>
                    setTemplate({
                      ...template,
                      popup: { ...template.popup, type: e.target.value as PopupType },
                    })
                  }
                >
                  <option value="new_arrivals">New Arrivals</option>
                  <option value="offers">Offers</option>
                </select>
              </div>
              <div className={styles.fieldRow}>
                <label className={styles.label}>Popup Image URL</label>
                <div className={styles.imageField}>
                  <input
                    className={styles.input}
                    value={template.popup.image}
                    onChange={(e) =>
                      setTemplate({
                        ...template,
                        popup: { ...template.popup, image: e.target.value },
                      })
                    }
                  />
                  <button
                    type="button"
                    className={styles.uploadBtn}
                    onClick={() => triggerUpload({ type: 'popup' })}
                  >
                    <Upload className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className={styles.fieldRow}>
                <label className={styles.label}>Title</label>
                <input
                  className={styles.input}
                  value={template.popup.title}
                  onChange={(e) =>
                    setTemplate({
                      ...template,
                      popup: { ...template.popup, title: e.target.value },
                    })
                  }
                />
              </div>
              <div className={styles.fieldRow}>
                <label className={styles.label}>Message</label>
                <textarea
                  className={styles.textarea}
                  rows={3}
                  value={template.popup.subtitle}
                  onChange={(e) =>
                    setTemplate({
                      ...template,
                      popup: { ...template.popup, subtitle: e.target.value },
                    })
                  }
                />
              </div>
              <div className={styles.twoCol}>
                <div className={styles.fieldRow}>
                  <label className={styles.label}>Button Text</label>
                  <input
                    className={styles.input}
                    value={template.popup.buttonText}
                    onChange={(e) =>
                      setTemplate({
                        ...template,
                        popup: { ...template.popup, buttonText: e.target.value },
                      })
                    }
                  />
                </div>
                <div className={styles.fieldRow}>
                  <label className={styles.label}>Link URL</label>
                  <input
                    className={styles.input}
                    value={template.popup.linkUrl}
                    onChange={(e) =>
                      setTemplate({
                        ...template,
                        popup: { ...template.popup, linkUrl: e.target.value },
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      <button type="button" className={styles.saveBtn} onClick={handleSave} disabled={saving}>
        <Save className="w-4 h-4" />
        {saving ? 'Saving...' : 'Save Main Template'}
      </button>
    </div>
  )
}
