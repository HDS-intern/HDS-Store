import Link from 'next/link'
import Image from 'next/image'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { PRODUCTS } from '@/lib/mockData'
import {
  ChevronRight,
  Shield,
  Target,
  Users,
  Globe,
  ShoppingCart,
} from 'lucide-react'
import styles from './page.module.css'

const COMPANY_STATS = [
  { value: '15+', label: 'Years of Innovation' },
  { value: '60+', label: 'Countries Served' },
  { value: '12K+', label: 'Drones Deployed' },
  { value: '98%', label: 'Client Satisfaction' },
]

const COMPANY_VALUES = [
  {
    icon: Shield,
    title: 'Security First',
    description:
      'Every system is engineered with military-grade encryption and fail-safe protocols for mission-critical operations.',
  },
  {
    icon: Target,
    title: 'Precision Engineering',
    description:
      'From ISR platforms to heavy-lift cargo drones, we deliver accuracy and reliability at every altitude.',
  },
  {
    icon: Users,
    title: 'Expert Support',
    description:
      'Our dedicated team provides training, maintenance, and 24/7 technical assistance worldwide.',
  },
  {
    icon: Globe,
    title: 'Global Reach',
    description:
      'Headquartered in Tech City with distribution centers across North America, Europe, and Asia-Pacific.',
  },
]

const FEATURED_DRONES = PRODUCTS.slice(0, 6)

const MILESTONES = [
  { year: '2011', event: 'HDS founded as an aerospace research lab in Tech City.' },
  { year: '2014', event: 'Launched our first professional surveillance drone, the Sentinel series.' },
  { year: '2018', event: 'Expanded to 30+ countries with military-grade ISR platforms.' },
  { year: '2022', event: 'Opened Asia-Pacific distribution center and heavy-lift cargo division.' },
  { year: '2026', event: '12,000+ drones deployed worldwide across defense and industrial sectors.' },
]

const LEADERSHIP = [
  { name: 'Dr. Sarah Mitchell', role: 'CEO & Founder', initials: 'SM', bio: 'Former aerospace engineer with 20+ years in unmanned systems.' },
  { name: 'James Chen', role: 'CTO', initials: 'JC', bio: 'Leads R&D for next-gen flight control and AI navigation.' },
  { name: 'Maria Rodriguez', role: 'Head of Operations', initials: 'MR', bio: 'Oversees global manufacturing and supply chain logistics.' },
  { name: 'David Okonkwo', role: 'Director of Sales', initials: 'DO', bio: 'Manages enterprise and government client partnerships.' },
]

const CERTIFICATIONS = [
  'ISO 9001 Certified',
  'FAA Part 107 Compliant',
  'NATO Approved Supplier',
  'CE Marked Products',
  'NDAA Compliant',
]

export const metadata = {
  title: 'About Us | HDS',
  description:
    'Learn about HDS — a leading provider of advanced defense and surveillance drones for professional operations worldwide.',
}

export default function AboutPage() {
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
            <span className="text-foreground font-semibold">About</span>
          </div>
        </div>
      </div>

      <section className={styles.hero}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className={styles.heroInner}>
            <h1 className={styles.heroTitle}>About HDS</h1>
            <p className={styles.heroSubtitle}>
              Pioneering the future of unmanned aerial systems for defense,
              surveillance, and industrial operations. We combine cutting-edge
              technology with decades of aerospace expertise.
            </p>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className={styles.storyGrid}>
            <div className={styles.storyImage}>
              <Image
                src={PRODUCTS[3].image}
                alt="Aurora Reconnaissance drone"
                fill
                className="object-cover"
                priority
              />
            </div>
            <div className={styles.storyText}>
              <h2 className={styles.sectionTitle}>Our Story</h2>
              <p>
                Founded in 2011, HDS began as a small aerospace
                research lab with a bold vision: to make professional-grade
                unmanned systems accessible to defense agencies, law enforcement,
                and industrial operators worldwide.
              </p>
              <p>
                Today, we design and manufacture a full spectrum of drones — from
                compact consumer scouts to military-grade ISR platforms and
                heavy-lift cargo systems. Our products power border surveillance,
                disaster response, precision mapping, and tactical operations
                across six continents.
              </p>
              <p>
                Headquartered in Thiruvallur, Tamil Nadu, our 200+ engineers
                and field specialists work alongside clients to deliver solutions
                that meet the highest standards of performance and reliability.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.sectionAlt}`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className={styles.sectionTitle}>Mission & Vision</h2>
          <div className={styles.missionGrid}>
            <div className={styles.missionCard}>
              <p className={styles.missionLabel}>Our Mission</p>
              <p className={styles.missionText}>
                To deliver reliable, mission-ready unmanned aerial systems that
                empower defense agencies, law enforcement, and industrial
                operators to perform safer, smarter, and more effective
                operations worldwide.
              </p>
            </div>
            <div className={styles.missionCard}>
              <p className={styles.missionLabel}>Our Vision</p>
              <p className={styles.missionText}>
                To be the global leader in professional drone technology —
                setting the standard for precision, security, and innovation in
                every aerial platform we design and deploy.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.sectionAlt}`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className={styles.sectionTitle} style={{ textAlign: 'center' }}>
            HDS by the Numbers
          </h2>
          <div className={styles.statsGrid}>
            {COMPANY_STATS.map((stat) => (
              <div key={stat.label} className={styles.statCard}>
                <p className={styles.statValue}>{stat.value}</p>
                <p className={styles.statLabel}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className={styles.sectionTitle}>Our Mission & Values</h2>
          <p className={styles.sectionDesc}>
            We exist to advance aerial intelligence and operational capability
            while maintaining the highest ethical and safety standards in every
            product we build.
          </p>
          <div className={styles.valuesGrid}>
            {COMPANY_VALUES.map((value) => (
              <div key={value.title} className={styles.valueCard}>
                <value.icon className={styles.valueIcon} />
                <h3 className={styles.valueTitle}>{value.title}</h3>
                <p className={styles.valueDesc}>{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.sectionAlt}`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className={styles.sectionTitle} style={{ textAlign: 'center' }}>
            Our Journey
          </h2>
          <p className={styles.sectionDesc} style={{ textAlign: 'center', margin: '0 auto 2.5rem' }}>
            Key milestones that shaped HDS into the industry leader we are today.
          </p>
          <div className={styles.timeline}>
            {MILESTONES.map((item) => (
              <div key={item.year} className={styles.timelineItem}>
                <div className={styles.timelineDot} />
                <div>
                  <p className={styles.timelineYear}>{item.year}</p>
                  <p className={styles.timelineEvent}>{item.event}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className={styles.sectionTitle}>Leadership Team</h2>
          <p className={styles.sectionDesc}>
            Experienced professionals driving innovation in unmanned aerial systems.
          </p>
          <div className={styles.teamGrid}>
            {LEADERSHIP.map((member) => (
              <div key={member.name} className={styles.teamCard}>
                <div className={styles.teamAvatar}>{member.initials}</div>
                <h3 className={styles.teamName}>{member.name}</h3>
                <p className={styles.teamRole}>{member.role}</p>
                <p className={styles.teamBio}>{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.sectionAlt}`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className={styles.sectionTitle} style={{ textAlign: 'center' }}>
            Certifications & Compliance
          </h2>
          <p className={styles.sectionDesc} style={{ textAlign: 'center', margin: '0 auto 2rem' }}>
            Our products and processes meet the highest international standards.
          </p>
          <div className={styles.certGrid}>
            {CERTIFICATIONS.map((cert) => (
              <span key={cert} className={styles.certBadge}>
                {cert}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.sectionAlt}`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className={styles.sectionTitle}>Our Drone Lineup</h2>
          <p className={styles.sectionDesc}>
            Explore the platforms that define HDS — engineered for
            professionals who demand precision, endurance, and mission-ready
            performance.
          </p>
          <div className={styles.droneGrid}>
            {FEATURED_DRONES.map((drone) => (
              <Link
                key={drone.id}
                href={`/product/${drone.id}`}
                className={styles.droneCard}
              >
                <div className={styles.droneImageWrap}>
                  <Image
                    src={drone.image}
                    alt={drone.name}
                    fill
                    className={styles.droneImage}
                  />
                </div>
                <div className={styles.droneBody}>
                  <p className={styles.droneCategory}>{drone.category}</p>
                  <h3 className={styles.droneName}>{drone.name}</h3>
                  <p className={styles.droneDesc}>{drone.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.ctaSection}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className={styles.ctaTitle}>Ready to Partner With Us?</h2>
          <p className={styles.ctaText}>
            Browse our full catalog or reach out to our team for custom solutions
            tailored to your mission requirements.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/shop" className={styles.ctaButton}>
              <ShoppingCart className="w-5 h-5" />
              Shop Drones
            </Link>
            <Link
              href="/contact"
              className={`${styles.ctaButton} ${styles.ctaButtonOutline}`}
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
