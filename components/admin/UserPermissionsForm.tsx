'use client'

import type { UserPermissions } from '@/lib/permissions'
import { PERMISSION_META } from '@/lib/permissions'
import styles from './UserPermissionsForm.module.css'

type UserPermissionsFormProps = {
  value: UserPermissions
  onChange: (perms: UserPermissions) => void
  disabled?: boolean
}

export function UserPermissionsForm({ value, onChange, disabled }: UserPermissionsFormProps) {
  const toggle = (key: keyof UserPermissions) => {
    if (disabled) return
    onChange({ ...value, [key]: !value[key] })
  }

  return (
    <div className={styles.grid}>
      {PERMISSION_META.map(({ key, label, description }) => (
        <label
          key={key}
          className={`${styles.item} ${value[key] ? styles.itemActive : ''} ${disabled ? styles.itemDisabled : ''}`}
        >
          <input
            type="checkbox"
            className={styles.checkbox}
            checked={value[key]}
            disabled={disabled}
            onChange={() => toggle(key)}
          />
          <span className={styles.text}>
            <span className={styles.label}>{label}</span>
            <span className={styles.hint}>{description}</span>
          </span>
        </label>
      ))}
    </div>
  )
}
