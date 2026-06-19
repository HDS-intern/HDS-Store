'use client'

import Image from 'next/image'
import styles from './SiteLoadingOverlay.module.css'

type SiteLoadingOverlayProps = {
  label?: string
}

export function SiteLoadingOverlay({ label = 'Loading HDS...' }: SiteLoadingOverlayProps) {
  return (
    <div className={styles.overlay} role="status" aria-live="polite" aria-label={label}>
      <div className={styles.loader}>
        <div className={styles.orbit} aria-hidden="true">
          <span className={`${styles.ring} ${styles.ringOuter}`} />
          <span className={`${styles.ring} ${styles.ringMid}`} />
          <span className={`${styles.ring} ${styles.ringInner}`} />
        </div>

        <div className={styles.logoWrap}>
          <Image
            src="/logo.png"
            alt="HDS"
            width={88}
            height={88}
            priority
            className={styles.logo}
          />
        </div>
      </div>

      <p className={styles.label}>{label}</p>
      <div className={styles.progressTrack} aria-hidden="true">
        <span className={styles.progressBar} />
      </div>
    </div>
  )
}
