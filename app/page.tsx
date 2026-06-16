'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { ProductSlideshow } from '@/components/ProductSlideshow'
import { ShoppingCart, Shield, Zap, Award } from 'lucide-react'
import { PRODUCTS } from '@/lib/mockData'
import { formatPrice } from '@/lib/formatPrice'
import styles from './page.module.css'

const FEATURED_PRODUCTS = PRODUCTS.slice(0, 3)

const FEATURES = [
  {
    icon: Shield,
    title: 'Military Grade',
    description: 'Advanced security and reliability standards trusted by defense professionals.',
  },
  {
    icon: Zap,
    title: 'Cutting Edge',
    description: 'Latest technology and innovations for superior mission performance.',
  },
  {
    icon: Award,
    title: 'Industry Leading',
    description: 'Trusted by professionals worldwide for critical operations.',
  },
  {
    icon: ShoppingCart,
    title: 'Easy Ordering',
    description: 'Seamless purchase experience with dedicated customer support.',
  },
]

export default function Home() {
  return (
    <div className={`${styles.page} flex flex-col min-h-screen`}>
      <Header />

      <ProductSlideshow products={PRODUCTS} />

      <section className={styles.hero}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className={styles.heroContent}>
              <h1 className={styles.heroTitle}>
                NEW ARRIVALS: Advanced Defense & Surveillance Drones
              </h1>
              <p className={styles.heroSubtitle}>
                Professional-grade unmanned systems for military, defense, and
                industrial applications. Precision engineering meets cutting-edge
                technology.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/shop" className={styles.ctaPrimary}>
                  <ShoppingCart className="w-5 h-5" />
                  Shop Now
                </Link>
                <Link href="/about" className={styles.ctaSecondary}>
                  Learn More
                </Link>
              </div>
            </div>
            <div className={styles.heroImage}>
              <div className={styles.heroImageOverlay} />
              <Image
                src={PRODUCTS[0].image}
                alt="Sentinel Pro Drone"
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      <section className={styles.features}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className={styles.sectionTitle}>Why Choose Hawking Defence</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((feature, index) => (
              <div key={index} className={styles.featureCard}>
                <feature.icon className={styles.featureIcon} />
                <h3 className={styles.featureTitle}>{feature.title}</h3>
                <p className={styles.featureDesc}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.products}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className={styles.productsHeader}>
            <h2 className={styles.sectionTitle} style={{ marginBottom: 0, textAlign: 'left' }}>
              Featured Products
            </h2>
            <Link href="/shop" className={styles.viewAll}>
              View All →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {FEATURED_PRODUCTS.map((product) => (
              <Link
                key={product.id}
                href={`/product/${product.id}`}
                className={styles.productCard}
              >
                <div className={styles.productImageWrap}>
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className={styles.productImage}
                  />
                  {product.originalPrice && (
                    <div className={styles.saleBadge}>Sale</div>
                  )}
                </div>
                <div className={styles.productBody}>
                  <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">
                    {product.category}
                  </p>
                  <h3 className={styles.productName}>{product.name}</h3>
                  <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
                    <span>★ {product.rating}</span>
                    <span>({product.reviews} reviews)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-baseline gap-2">
                      <span className={styles.productPrice}>
                        {formatPrice(product.price)}
                      </span>
                      {product.originalPrice && (
                        <span className="text-sm text-muted-foreground line-through">
                          {formatPrice(product.originalPrice)}
                        </span>
                      )}
                    </div>
                    <ShoppingCart className="w-5 h-5 text-primary opacity-60" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.ctaSection}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className={styles.ctaTitle}>Ready to Upgrade Your Operations?</h2>
          <p className={styles.ctaText}>
            Explore our complete catalog of professional drones and take your
            mission capabilities to the next level.
          </p>
          <Link href="/shop" className={styles.ctaButton}>
            <ShoppingCart className="w-5 h-5" />
            Explore All Products
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
