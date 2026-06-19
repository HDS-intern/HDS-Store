'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { X } from 'lucide-react'
import type { HomePopup } from '@/lib/mainTemplateTypes'
import styles from './HomeOfferPopup.module.css'

const DISMISS_KEY = 'hds-home-popup-dismissed'

type HomeOfferPopupProps = {
  popup: HomePopup
}

export function HomeOfferPopup({ popup }: HomeOfferPopupProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!popup.enabled) return
    const dismissed = sessionStorage.getItem(DISMISS_KEY)
    if (!dismissed) setVisible(true)
  }, [popup.enabled])

  if (!popup.enabled || !visible) return null

  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, '1')
    setVisible(false)
  }

  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true" aria-labelledby="home-popup-title">
      <div className={styles.popup}>
        <button type="button" className={styles.closeBtn} onClick={dismiss} aria-label="Close popup">
          <X className="w-5 h-5" />
        </button>

        <div className={styles.imageWrap}>
          <Image src={popup.image} alt={popup.title} fill className="object-cover" />
          <span className={styles.badge}>
            {popup.type === 'offers' ? 'Special Offers' : 'New Arrivals'}
          </span>
        </div>

        <div className={styles.body}>
          <h2 id="home-popup-title" className={styles.title}>
            {popup.title}
          </h2>
          <p className={styles.subtitle}>{popup.subtitle}</p>
          <Link href={popup.linkUrl} className={styles.ctaBtn} onClick={dismiss}>
            {popup.buttonText}
          </Link>
        </div>
      </div>
    </div>
  )
}
