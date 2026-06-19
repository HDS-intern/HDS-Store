'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, ShoppingCart } from 'lucide-react'
import { Product } from '@/lib/types'
import type { HomeSlide } from '@/lib/mainTemplateTypes'
import { formatPrice } from '@/lib/formatPrice'
import styles from './ProductSlideshow.module.css'

const SLIDE_DELAY = 3000

interface ProductSlideshowProps {
  products: Product[]
  slides?: HomeSlide[]
}

export function ProductSlideshow({ products, slides }: ProductSlideshowProps) {
  const useCustomSlides = Boolean(slides?.length)
  const slideCount = useCustomSlides ? slides!.length : products.length
  const [current, setCurrent] = useState(0)

  const goTo = useCallback(
    (index: number) => {
      setCurrent((index + slideCount) % slideCount)
    },
    [slideCount]
  )

  const next = useCallback(() => setCurrent((prev) => (prev + 1) % slideCount), [slideCount])
  const prev = useCallback(
    () => setCurrent((prev) => (prev - 1 + slideCount) % slideCount),
    [slideCount]
  )

  useEffect(() => {
    if (slideCount <= 1) return

    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slideCount)
    }, SLIDE_DELAY)

    return () => clearInterval(timer)
  }, [slideCount])

  if (slideCount === 0) return null

  const product = !useCustomSlides ? products[current] : null
  const slide = useCustomSlides ? slides![current] : null

  return (
    <section className={styles.slideshow} aria-label="Product showcase slideshow">
      <div className={styles.inner}>
        {useCustomSlides
          ? slides!.map((item, index) => (
              <div
                key={item.id}
                className={`${styles.slide} ${index === current ? styles.slideActive : ''}`}
                aria-hidden={index !== current}
              >
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className={styles.slideImage}
                  priority={index === 0}
                />
                <div className={styles.slideOverlay} />
              </div>
            ))
          : products.map((item, index) => (
              <div
                key={item.id}
                className={`${styles.slide} ${index === current ? styles.slideActive : ''}`}
                aria-hidden={index !== current}
              >
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className={styles.slideImage}
                  priority={index === 0}
                />
                <div className={styles.slideOverlay} />
              </div>
            ))}

        <div key={current} className={styles.content}>
          {useCustomSlides && slide ? (
            <>
              <span className={styles.badge}>{slide.badge}</span>
              <h2 className={styles.title}>{slide.title}</h2>
              <p className={styles.description}>{slide.description}</p>
              <div className={styles.actions}>
                <Link href={slide.linkUrl} className={styles.shopBtn}>
                  <ShoppingCart className="w-5 h-5" />
                  {slide.buttonText}
                </Link>
                <Link href="/shop" className={styles.exploreBtn}>
                  Explore All
                </Link>
              </div>
            </>
          ) : product ? (
            <>
              <span className={styles.badge}>Featured Collection</span>
              <p className={styles.category}>{product.category}</p>
              <h2 className={styles.title}>{product.name}</h2>
              <p className={styles.description}>{product.description}</p>
              <div className={styles.meta}>
                <span className={styles.price}>{formatPrice(product.price)}</span>
                {product.originalPrice && (
                  <span className={styles.originalPrice}>
                    {formatPrice(product.originalPrice)}
                  </span>
                )}
                <span className={styles.rating}>★ {product.rating}</span>
              </div>
              <div className={styles.actions}>
                <Link href={`/product/${product.id}`} className={styles.shopBtn}>
                  <ShoppingCart className="w-5 h-5" />
                  View Product
                </Link>
                <Link href="/shop" className={styles.exploreBtn}>
                  Explore All
                </Link>
              </div>
            </>
          ) : null}
        </div>

        <button
          type="button"
          className={`${styles.arrow} ${styles.arrowLeft}`}
          onClick={prev}
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          type="button"
          className={`${styles.arrow} ${styles.arrowRight}`}
          onClick={next}
          aria-label="Next slide"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        <div className={styles.dots}>
          {Array.from({ length: slideCount }).map((_, index) => (
            <button
              key={useCustomSlides ? slides![index].id : products[index].id}
              type="button"
              className={`${styles.dot} ${index === current ? styles.dotActive : ''}`}
              onClick={() => goTo(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
