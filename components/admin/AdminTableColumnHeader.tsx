'use client'

import styles from './AdminTableColumnHeader.module.css'

type AdminTableColumnHeaderProps = {
  label: string
  highlighted?: boolean
  className?: string
}

export function AdminTableColumnHeader({
  label,
  highlighted = false,
  className,
}: AdminTableColumnHeaderProps) {
  return (
    <th className={[styles.cell, className].filter(Boolean).join(' ')}>
      <span className={`${styles.label} ${highlighted ? styles.labelHighlighted : ''}`}>
        {label}
      </span>
    </th>
  )
}
