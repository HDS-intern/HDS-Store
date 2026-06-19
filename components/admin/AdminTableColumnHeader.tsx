'use client'

import type { LucideIcon } from 'lucide-react'
import styles from './AdminTableColumnHeader.module.css'

type AdminTableColumnHeaderProps = {
  icon: LucideIcon
  label: string
  highlighted?: boolean
  className?: string
}

export function AdminTableColumnHeader({
  icon: Icon,
  label,
  highlighted = false,
  className,
}: AdminTableColumnHeaderProps) {
  return (
    <th className={[styles.cell, className].filter(Boolean).join(' ')}>
      <div className={`${styles.header} ${highlighted ? styles.headerHighlighted : ''}`}>
        <span className={styles.iconRing} aria-hidden="true">
          <Icon className={styles.icon} />
        </span>
        <span className={styles.label}>{label}</span>
      </div>
    </th>
  )
}
