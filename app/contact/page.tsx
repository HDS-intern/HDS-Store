'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import {
  ChevronRight,
  ChevronDown,
  Mail,
  Phone,
  MapPin,
  Clock,
  MessageSquare,
  Ticket,
} from 'lucide-react'
import styles from './page.module.css'

const BUSINESS_HOURS = [
  { day: 'Monday – Friday', hours: '8:00 AM – 6:00 PM' },
  { day: 'Saturday', hours: '9:00 AM – 2:00 PM' },
  { day: 'Sunday', hours: 'Closed' },
]

const FAQ_ITEMS = [
  {
    question: 'What is the typical response time for inquiries?',
    answer:
      'We respond to all support tickets within one business day. Urgent technical support requests are prioritized and typically answered within 4 hours during business hours.',
  },
  {
    question: 'Do you offer enterprise or bulk pricing?',
    answer:
      'Yes. For government contracts, bulk orders, or custom configurations, contact us at info@hds-india.com or select "Bulk / Enterprise Orders" when generating a ticket.',
  },
  {
    question: 'Where do you ship internationally?',
    answer:
      'We ship to 60+ countries worldwide. Shipping times and costs vary by destination. Contact us for specific delivery estimates to your region.',
  },
  {
    question: 'How can I get technical support for my drone?',
    answer:
      'Open the HDS Assistant chat on any store page, go to Ticket Generation, and submit your request with your order number and product model.',
  },
  {
    question: 'Can I schedule a product demo?',
    answer:
      'Absolutely. Generate a ticket with "Product Information" as the subject and mention that you would like a demo. Our sales team will arrange a virtual or in-person demonstration.',
  },
]

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

export default function ContactPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  return (
    <div className={`${styles.page} flex flex-col min-h-screen`}>
      <Header />

      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-accent hover:text-secondary">
              Home
            </Link>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <span className="text-foreground font-semibold">Contact Us</span>
          </div>
        </div>
      </div>

      <section className={styles.hero}>
        <Image
          src="/images/drone-aurora.png"
          alt=""
          fill
          className={styles.heroImage}
          priority
          sizes="100vw"
        />
        <div className={styles.heroOverlay} aria-hidden="true" />
        <div className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 ${styles.heroContent}`}>
          <h1 className={styles.heroTitle}>Get in Touch</h1>
          <p className={styles.heroSubtitle}>
            Have questions about our drones, need technical support, or want to
            discuss enterprise solutions? Use the HDS Assistant chat to generate a
            support ticket, or reach us directly below.
          </p>
        </div>
      </section>

      <section className={styles.content}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className={styles.ticketCallout}>
            <div className={styles.ticketCalloutIcon}>
              <Ticket className="w-6 h-6" />
            </div>
            <div>
              <h2 className={styles.ticketCalloutTitle}>Ticket Generation</h2>
              <p className={styles.ticketCalloutText}>
                Click the chat button at the bottom-right of any store page, open{' '}
                <strong>Ticket Generation</strong>, and submit your request. Our team
                will respond within one business day.
              </p>
            </div>
          </div>

          <div className={styles.infoOnlyGrid}>
            <div className={styles.infoCard}>
              <div className={styles.infoIcon}>
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <h3 className={styles.infoTitle}>Phone</h3>
                <p className={styles.infoText}>
                  <a href="tel:+919940199407" className={styles.infoLink}>
                    +91-99401-99407
                  </a>
                </p>
                <p className={styles.infoText} style={{ marginTop: '0.25rem' }}>
                  Mon–Fri, 8 AM – 6 PM IST
                </p>
              </div>
            </div>

            <div className={styles.infoCard}>
              <div className={styles.infoIcon}>
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 className={styles.infoTitle}>Email</h3>
                <p className={styles.infoText}>
                  <a href="mailto:info@hds-india.com" className={styles.infoLink}>
                    info@hds-india.com
                  </a>
                </p>
              </div>
            </div>

            <div className={styles.infoCard}>
              <div className={styles.infoIcon}>
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h3 className={styles.infoTitle}>Head Office</h3>
                <p className={styles.infoText}>
                  HDS Private Limited
                  <br />
                  No. 45 JN Road, Kamarajapuram
                  <br />
                  Thiruvallur
                  <br />
                  Tamil Nadu – 602001
                  <br />
                  India
                </p>
              </div>
            </div>

            <div className={styles.infoCard}>
              <div className={styles.infoIcon}>
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className={styles.infoTitle}>Sales & Enterprise</h3>
                <p className={styles.infoText}>
                  For bulk orders, government contracts, and custom drone
                  solutions, contact{' '}
                  <a href="mailto:info@hds-india.com" className={styles.infoLink}>
                    info@hds-india.com
                  </a>
                </p>
              </div>
            </div>

            <div className={styles.hoursCard}>
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-primary" />
                <h3 className={styles.hoursTitle}>Business Hours</h3>
              </div>
              {BUSINESS_HOURS.map((row) => (
                <div key={row.day} className={styles.hoursRow}>
                  <span>{row.day}</span>
                  <span>{row.hours}</span>
                </div>
              ))}
            </div>

            <div className={styles.socialCard}>
              <p className={styles.socialTitle}>Follow Us</p>
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
            </div>

            <div className={styles.mapPlaceholder}>
              <MapPin className="w-5 h-5 mr-2" />
              No. 45 JN Road, Kamarajapuram, Thiruvallur, TN 602001
            </div>
          </div>
        </div>
      </section>

      <section className={styles.faqSection}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className={styles.faqTitle}>Frequently Asked Questions</h2>
          <p className={styles.faqDesc}>
            Quick answers to common questions. Can&apos;t find what you need?{' '}
            <a href="mailto:info@hds-india.com" className={styles.infoLink}>
              Email us directly
            </a>
            .
          </p>
          <div className={styles.faqList}>
            {FAQ_ITEMS.map((item, index) => (
              <div key={item.question} className={styles.faqItem}>
                <button
                  type="button"
                  className={styles.faqQuestion}
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  aria-expanded={openFaq === index}
                >
                  {item.question}
                  <ChevronDown
                    className={`w-5 h-5 ${styles.faqIcon} ${openFaq === index ? styles.faqIconOpen : ''}`}
                  />
                </button>
                {openFaq === index && (
                  <p className={styles.faqAnswer}>{item.answer}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
