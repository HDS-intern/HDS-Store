'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Check } from 'lucide-react'
import styles from './AdminBadgeDropdown.module.css'

export type BadgeOption = {
  value: string
  label: string
}

type AdminBadgeDropdownProps = {
  value: string
  options: readonly BadgeOption[]
  badgeClassMap: Record<string, string>
  disabled?: boolean
  onChange: (value: string) => void
  fallbackBadgeClass?: string
}

export function AdminBadgeDropdown({
  value,
  options,
  badgeClassMap,
  disabled = false,
  onChange,
  fallbackBadgeClass = 'badgePending',
}: AdminBadgeDropdownProps) {
  const [open, setOpen] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, minWidth: 0 })
  const triggerRef = useRef<HTMLButtonElement>(null)
  const selected = options.find((option) => option.value === value) ?? options[0]
  const badgeClass = styles[badgeClassMap[value] ?? fallbackBadgeClass] ?? styles[fallbackBadgeClass]

  const updateMenuPosition = useCallback(() => {
    const trigger = triggerRef.current
    if (!trigger) return
    const rect = trigger.getBoundingClientRect()
    setMenuPosition({
      top: rect.bottom + 8,
      left: rect.left,
      minWidth: Math.max(rect.width, 148),
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

  if (disabled) {
    return <span className={`${styles.badge} ${badgeClass}`}>{selected.label}</span>
  }

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
              style={{
                top: menuPosition.top,
                left: menuPosition.left,
                minWidth: menuPosition.minWidth,
              }}
            >
              {options.map((option, index) => {
                const optionBadge =
                  styles[badgeClassMap[option.value] ?? fallbackBadgeClass] ??
                  styles[fallbackBadgeClass]
                const isActive = value === option.value
                return (
                  <li
                    key={option.value}
                    role="option"
                    aria-selected={isActive}
                    className={styles.menuItem}
                    style={{ animationDelay: `${index * 35}ms` }}
                  >
                    <button
                      type="button"
                      className={`${styles.option} ${isActive ? styles.optionActive : ''}`}
                      onClick={() => {
                        onChange(option.value)
                        setOpen(false)
                      }}
                    >
                      <span className={`${styles.badge} ${optionBadge}`}>{option.label}</span>
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
    <div className={styles.wrap}>
      <button
        ref={triggerRef}
        type="button"
        className={`${styles.trigger} ${open ? styles.triggerOpen : ''}`}
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={`${styles.badge} ${badgeClass}`}>{selected.label}</span>
        <ChevronDown className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`} />
      </button>
      {menu}
    </div>
  )
}
