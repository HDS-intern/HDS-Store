'use client'

import Link from 'next/link'
import { Mail, Phone, MapPin } from 'lucide-react'
import styles from './Footer.module.css'

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
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
            <h3 className={styles.heading}>About Hawking Defence</h3>
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
                <a href="tel:+1234567890" className="hover:underline">
                  +1 (234) 567-890
                </a>
              </li>
              <li className={styles.contactItem}>
                <Mail className="w-4 h-4 flex-shrink-0" />
                <a href="mailto:info@hawking.com" className="hover:underline">
                  info@hawking.com
                </a>
              </li>
              <li className={`${styles.contactItem} items-start`}>
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>123 Defence Blvd, Tech City</span>
              </li>
            </ul>
          </div>
        </div>

        <div className={`${styles.divider} pt-8 flex flex-col md:flex-row justify-between items-center gap-4`}>
          <div className={styles.socialLinks}>
            <a href="#" className={styles.socialLink} aria-label="Facebook">
              <FacebookIcon />
            </a>
            <a href="#" className={styles.socialLink} aria-label="Twitter">
              <TwitterIcon />
            </a>
            <a href="#" className={styles.socialLink} aria-label="LinkedIn">
              <LinkedInIcon />
            </a>
          </div>
          <p className="text-sm opacity-75">
            &copy; 2026 Hawking Defence. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
