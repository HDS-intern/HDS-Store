'use client'

import styles from './UserAccessToggle.module.css'

type UserAccessToggleProps = {
  locked: boolean
  disabled?: boolean
  onChange: (locked: boolean) => void
}

export function UserAccessToggle({ locked, disabled = false, onChange }: UserAccessToggleProps) {
  const granted = !locked

  return (
    <button
      type="button"
      role="switch"
      aria-checked={granted}
      aria-label={granted ? 'Access granted' : 'Access locked'}
      disabled={disabled}
      className={`${styles.wrap} ${granted ? styles.wrapGranted : styles.wrapLocked} ${
        disabled ? styles.wrapDisabled : ''
      }`}
      onClick={() => onChange(!locked)}
    >
      <span className={`${styles.track} ${granted ? styles.trackGranted : styles.trackLocked}`}>
        <span className={`${styles.thumb} ${granted ? styles.thumbGranted : ''}`} />
      </span>
      <span className={styles.label}>{granted ? 'Access Granted' : 'Access Locked'}</span>
    </button>
  )
}
