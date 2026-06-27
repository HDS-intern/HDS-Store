'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown } from 'lucide-react'
import styles from './AnimatedFormSelect.module.css'

export type AnimatedFormSelectOption = {
  value: string
  label: string
  hint?: string
  tone?: 'live' | 'resigned' | 'default'
}

type AnimatedFormSelectProps = {
  value: string
  options: readonly AnimatedFormSelectOption[]
  onChange: (value: string) => void
  disabled?: boolean
  id?: string
  className?: string
  /** Full-width table cell style without inner pill badge */
  variant?: 'default' | 'cell'
}

function toneClass(tone: AnimatedFormSelectOption['tone']) {
  if (tone === 'live') return styles.badgeLive
  if (tone === 'resigned') return styles.badgeResigned
  return styles.badgeDefault
}

export function AnimatedFormSelect({
  value,
  options,
  onChange,
  disabled = false,
  id,
  className,
  variant = 'default',
}: AnimatedFormSelectProps) {
  const isCell = variant === 'cell'
  const [open, setOpen] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, width: 0 })
  const triggerRef = useRef<HTMLButtonElement>(null)
  const selected = options.find((option) => option.value === value) ?? options[0]

  const renderLabel = (option: AnimatedFormSelectOption, inMenu: boolean) => {
    if (isCell) {
      return (
        <span
          className={
            inMenu
              ? styles.optionLabel
              : `${styles.triggerLabel} ${!option.value ? styles.triggerPlaceholder : ''}`
          }
        >
          {option.label}
        </span>
      )
    }
    return (
      <span className={`${styles.badge} ${toneClass(option.tone)}`}>{option.label}</span>
    )
  }

  const updateMenuPosition = useCallback(() => {
    const trigger = triggerRef.current
    if (!trigger) return
    const rect = trigger.getBoundingClientRect()
    setMenuPosition({
      top: rect.bottom + 6,
      left: rect.left,
      width: rect.width,
    })
  }, [])

  useLayoutEffect(() => {
    if (!open) return
    updateMenuPosition()
  }, [open, updateMenuPosition])

  useEffect(() => {
    if (!open) return
    const handleReposition = () => updateMenuPosition()
    window.addEventListener('resize', handleReposition)
    window.addEventListener('scroll', handleReposition, true)
    return () => {
      window.removeEventListener('resize', handleReposition)
      window.removeEventListener('scroll', handleReposition, true)
    }
  }, [open, updateMenuPosition])

  useEffect(() => {
    if (!open) return
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [open])

  const menu =
    open && typeof document !== 'undefined'
      ? createPortal(
          <>
            <button
              type="button"
              className={styles.backdrop}
              onClick={() => setOpen(false)}
              aria-label="Close menu"
            />
            <ul
              className={styles.menu}
              role="listbox"
              aria-labelledby={id}
              style={{
                top: menuPosition.top,
                left: menuPosition.left,
                width: Math.max(menuPosition.width, 240),
              }}
            >
              {options.map((option, index) => {
                const isActive = value === option.value
                return (
                  <li
                    key={option.value}
                    role="option"
                    aria-selected={isActive}
                    className={styles.menuItem}
                    style={{ animationDelay: `${index * 45}ms` }}
                  >
                    <button
                      type="button"
                      className={`${styles.option} ${isActive ? styles.optionActive : ''}`}
                      onClick={() => {
                        onChange(option.value)
                        setOpen(false)
                      }}
                    >
                      <span className={styles.optionContent}>
                        {renderLabel(option, true)}
                        {!isCell && option.hint && (
                          <span className={styles.optionHint}>{option.hint}</span>
                        )}
                      </span>
                      {isActive && <Check className={styles.check} aria-hidden="true" />}
                    </button>
                  </li>
                )
              })}
            </ul>
          </>,
          document.body
        )
      : null

  return (
    <div className={[styles.wrap, className].filter(Boolean).join(' ') || undefined}>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        className={`${styles.trigger} ${isCell ? styles.triggerCell : ''} ${open ? styles.triggerOpen : ''}`}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
      >
        <span className={styles.triggerContent}>
          {renderLabel(selected, false)}
          {!isCell && selected.hint && <span className={styles.triggerHint}>{selected.hint}</span>}
        </span>
        <ChevronDown
          className={`${styles.chevron} ${isCell ? styles.chevronCell : ''} ${open ? styles.chevronOpen : ''}`}
        />
      </button>
      {menu}
    </div>
  )
}
