import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { ChevronRight, Truck, Globe, Package, MapPin, Mail } from 'lucide-react'
import styles from '../support.module.css'

const SHIPPING_METHODS = [
  {
    name: 'Standard Delivery',
    time: '5–7 business days',
    cost: 'Calculated at checkout (free on orders over eligible thresholds)',
    description:
      'Reliable ground and air freight delivery across India. Ideal for most domestic orders.',
  },
  {
    name: 'Express Delivery',
    time: '2–3 business days',
    cost: 'Flat ₹500 surcharge (select metros and tier-1 cities)',
    description:
      'Priority handling and expedited courier service for urgent deployments and time-sensitive orders.',
  },
  {
    name: 'Bulk / Enterprise',
    time: '7–14 business days',
    cost: 'Quoted per order',
    description:
      'Palletized shipping for bulk and government orders. Custom logistics arranged through our enterprise team.',
  },
  {
    name: 'International',
    time: '10–21 business days',
    cost: 'Varies by destination and customs',
    description:
      'We ship to 60+ countries. Import duties, taxes, and customs clearance are the responsibility of the recipient unless otherwise agreed.',
  },
]

const REGIONS = [
  { region: 'India – Metro Cities', delivery: '3–5 business days (standard)' },
  { region: 'India – Tier 2 & 3', delivery: '5–7 business days (standard)' },
  { region: 'South Asia', delivery: '7–12 business days' },
  { region: 'Middle East & Africa', delivery: '10–18 business days' },
  { region: 'Europe & North America', delivery: '12–21 business days' },
  { region: 'Asia-Pacific', delivery: '8–15 business days' },
]

const SHIPPING_NOTES = [
  'Orders are processed within 1–2 business days after payment confirmation.',
  'You will receive a tracking number by email once your order ships.',
  'Signature may be required for high-value military and professional equipment.',
  'Some restricted items cannot be shipped to certain countries due to export regulations.',
  'Damaged packages must be reported within 48 hours of delivery with photos of the packaging.',
]

export default function ShippingPage() {
  return (
    <div className={`${styles.page} flex flex-col min-h-screen bg-background`}>
      <Header />

      <div className={styles.breadcrumb}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className={styles.breadcrumbInner}>
            <Link href="/" className={styles.breadcrumbLink}>
              Home
            </Link>
            <ChevronRight className={`w-4 h-4 ${styles.breadcrumbSep}`} />
            <span className={styles.breadcrumbCurrent}>Shipping Info</span>
          </div>
        </div>
      </div>

      <section className={styles.hero}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className={styles.heroTitle}>Shipping Information</h1>
          <p className={styles.heroSubtitle}>
            Delivery options, estimated transit times, and shipping policies for HDS drone orders
            in India and worldwide.
          </p>
        </div>
      </section>

      <section className={styles.content}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className={`${styles.cardGrid} mb-10`}>
            <div className={styles.card}>
              <Truck className={styles.cardIcon} />
              <h2 className={styles.cardTitle}>Fast Domestic Delivery</h2>
              <p className={styles.cardText}>
                Standard and express options available across India with real-time tracking from
                dispatch to delivery.
              </p>
            </div>
            <div className={styles.card}>
              <Globe className={styles.cardIcon} />
              <h2 className={styles.cardTitle}>Global Shipping</h2>
              <p className={styles.cardText}>
                We deliver to 60+ countries. International orders include export documentation
                and compliance support.
              </p>
            </div>
            <div className={styles.card}>
              <Package className={styles.cardIcon} />
              <h2 className={styles.cardTitle}>Secure Packaging</h2>
              <p className={styles.cardText}>
                All drones are shipped in reinforced, shock-resistant packaging designed for
                sensitive electronic equipment.
              </p>
            </div>
          </div>

          <h2 className={styles.sectionTitle}>Delivery Methods</h2>
          <div className={styles.infoTable}>
            {SHIPPING_METHODS.map((method) => (
              <div key={method.name} className={styles.tableRow}>
                <span className={styles.tableKey}>{method.name}</span>
                <span className={styles.tableValue}>
                  <strong>Delivery:</strong> {method.time}
                  <br />
                  <strong>Cost:</strong> {method.cost}
                  <br />
                  {method.description}
                </span>
              </div>
            ))}
          </div>

          <h2 className={styles.sectionTitle}>Delivery Times by Region</h2>
          <p className={styles.sectionDesc}>
            Estimated transit times after order processing. Actual delivery may vary due to customs,
            weather, or carrier delays.
          </p>
          <div className={styles.infoTable}>
            {REGIONS.map((row) => (
              <div key={row.region} className={styles.tableRow}>
                <span className={styles.tableKey}>{row.region}</span>
                <span className={styles.tableValue}>{row.delivery}</span>
              </div>
            ))}
          </div>

          <h2 className={styles.sectionTitle}>Order Tracking</h2>
          <p className={styles.sectionDesc}>
            Once your order ships, you will receive an email with a tracking number and carrier
            link. Logged-in customers can also view order status and tracking details in their{' '}
            <Link href="/account" className={styles.infoLink}>
              account dashboard
            </Link>
            . For bulk orders, your account manager will provide dedicated shipment updates.
          </p>

          <h2 className={styles.sectionTitle}>Important Notes</h2>
          <div className={styles.card}>
            {SHIPPING_NOTES.map((note) => (
              <div key={note} className={styles.listItem}>
                <MapPin className={styles.listBullet} />
                {note}
              </div>
            ))}
          </div>

          <div className={styles.ctaBox}>
            <p className={styles.ctaText}>
              Need a custom shipping quote for bulk or international orders?
            </p>
            <Link href="/contact" className={styles.ctaLink}>
              <Mail className="w-4 h-4" />
              Contact Shipping Team
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
