'use client'

import Link from 'next/link'
import { Mail, Phone, MapPin } from 'lucide-react'
import styles from './Footer.module.css'

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 11-2.881.001 1.44 1.44 0 012.881-.001z" />
    </svg>
  )
}

function YouTubeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  )
}

function TwitterIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
}

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className={styles.heading}>About HDS</h3>
            <p className="text-sm opacity-90 leading-relaxed">
              Leading provider of advanced defense and surveillance drones for
              professional operations worldwide.
            </p>
          </div>

          <div>
            <h3 className={styles.heading}>Products</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/shop?category=professional" className={styles.link}>
                  Professional Drones
                </Link>
              </li>
              <li>
                <Link href="/shop?category=military" className={styles.link}>
                  Military Grade
                </Link>
              </li>
              <li>
                <Link href="/shop?category=consumer" className={styles.link}>
                  Consumer Drones
                </Link>
              </li>
              <li>
                <Link href="/shop?category=industrial" className={styles.link}>
                  Industrial
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className={styles.heading}>Support</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/faq" className={styles.link}>
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/warranty" className={styles.link}>
                  Warranty
                </Link>
              </li>
              <li>
                <Link href="/contact" className={styles.link}>
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/shipping" className={styles.link}>
                  Shipping Info
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className={styles.heading}>Contact</h3>
            <ul className="space-y-3">
              <li className={styles.contactItem}>
                <Phone className="w-4 h-4 flex-shrink-0" />
                <a href="tel:+919940199407" className="hover:underline">
                  +91-99401-99407
                </a>
              </li>
              <li className={styles.contactItem}>
                <Mail className="w-4 h-4 flex-shrink-0" />
                <a href="mailto:info@hds-india.com" className="hover:underline">
                  info@hds-india.com
                </a>
              </li>
              <li className={`${styles.contactItem} items-start`}>
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  HDS Private Limited, No.45 JN Road, Kamarajapuram, Thiruvallur, TN - 602001
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className={`${styles.divider} pt-8 flex flex-col md:flex-row justify-between items-center gap-4`}>
          <div className={styles.socialLinks}>
            <a
              href="https://www.instagram.com/hawking_hds/"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialLink}
              aria-label="Instagram"
            >
              <InstagramIcon />
            </a>
            <a
              href="https://www.youtube.com/@HawkingDefenceServices"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialLink}
              aria-label="YouTube"
            >
              <YouTubeIcon />
            </a>
            <a
              href="https://x.com/HawkingDefense"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialLink}
              aria-label="X (Twitter)"
            >
              <TwitterIcon />
            </a>
            <a
              href="https://linkedin.com/company/hawking-defence-services-private-limited"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialLink}
              aria-label="LinkedIn"
            >
              <LinkedInIcon />
            </a>
          </div>
          <p className="text-sm opacity-75">
            &copy; 2026 HDS. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
