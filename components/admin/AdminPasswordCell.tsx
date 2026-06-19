'use client'

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import styles from './AdminPasswordCell.module.css'

type AdminPasswordCellProps = {
  password: string | null | undefined
}

export function AdminPasswordCell({ password }: AdminPasswordCellProps) {
  const [visible, setVisible] = useState(false)

  if (!password) {
    return <span className={styles.empty}>—</span>
  }

  return (
    <div className={styles.cell}>
      <code className={styles.value}>{visible ? password : '••••••••'}</code>
      <button
        type="button"
        className={styles.toggleBtn}
        onClick={() => setVisible((prev) => !prev)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        title={visible ? 'Hide password' : 'Show password'}
      >
        {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  )
}
