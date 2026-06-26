'use client'

import { useState } from 'react'
import { SiteLoadingOverlay } from '@/components/SiteLoadingOverlay'
import styles from './HomeBufferButton.module.css'

export function HomeBufferButton() {
  const [active, setActive] = useState(false)

  return (
    <>
      <button
        type="button"
        className={`${styles.btn} ${active ? styles.btnActive : ''}`}
        onClick={() => setActive((open) => !open)}
        aria-pressed={active}
        aria-label={active ? 'Close buffer' : 'Open buffer'}
      >
        Buffer
      </button>

      {active && <SiteLoadingOverlay label="Buffering..." />}
    </>
  )
}
