'use client'

import type { CSSProperties, ReactNode } from 'react'
import { shouldRunAdminEntrance } from '@/lib/adminEntrance'
import styles from './AdminSlideUp.module.css'

type AdminSlideUpProps = {
  children: ReactNode
  delayMs?: number
  className?: string
  style?: CSSProperties
  /** When set, animation runs only for this entrance session (once per page load). */
  entranceSession?: number
  /** Always animate on mount (for modals and popups). */
  forceAnimate?: boolean
}

export function AdminSlideUp({
  children,
  delayMs = 0,
  className,
  style,
  entranceSession = 0,
  forceAnimate = false,
}: AdminSlideUpProps) {
  const animate = forceAnimate || shouldRunAdminEntrance(entranceSession)

  return (
    <div
      className={[animate ? styles.slideUp : undefined, className].filter(Boolean).join(' ') || undefined}
      style={{
        animationDelay: animate ? `${delayMs}ms` : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  )
}
