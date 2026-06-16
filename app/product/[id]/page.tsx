'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { ProductCard } from '@/components/ProductCard'
import { PRODUCTS } from '@/lib/mockData'
import { formatPrice } from '@/lib/formatPrice'
import { useApp } from '@/lib/context'
import {
  ShoppingCart,
  Heart,
  Share2,
  ChevronRight,
  Star,
  Truck,
  Shield,
  RotateCcw,
  Check,
} from 'lucide-react'
import styles from './page.module.css'

interface ProductDetailPageProps {
  params: {
    id: string
  }
}

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  const product = PRODUCTS.find((p) => p.id === params.id)
  const { addToCart, wishlist, addToWishlist, removeFromWishlist } = useApp()
  const [quantity, setQuantity] = useState(1)
  const [showAddedNotification, setShowAddedNotification] = useState(false)
  const [selectedImage, setSelectedImage] = useState(0)

  if (!product) {
    return (
      <div className={`${styles.page} flex flex-col min-h-screen bg-background`}>
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-2xl text-muted-foreground">Product not found</p>
        </div>
        <Footer />
      </div>
    )
  }

  const relatedProducts = PRODUCTS.filter(
    (p) => p.category === product.category && p.id !== product.id
  ).slice(0, 4)

  const isInWishlist = wishlist.includes(product.id)
  const discount = product.originalPrice
    ? Math.round(
        ((product.originalPrice - product.price) / product.originalPrice) * 100
      )
    : 0

  const handleAddToCart = () => {
    addToCart(product, quantity)
    setShowAddedNotification(true)
    setTimeout(() => setShowAddedNotification(false), 2000)
  }

  const handleToggleWishlist = () => {
    if (isInWishlist) {
      removeFromWishlist(product.id)
    } else {
      addToWishlist(product.id)
    }
  }

  return (
    <div className={`${styles.page} flex flex-col min-h-screen bg-background`}>
      <Header />

      {/* Breadcrumb */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-accent hover:text-secondary">
              Home
            </Link>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <Link href="/shop" className="text-accent hover:text-secondary">
              Shop
            </Link>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <span className="text-foreground font-semibold line-clamp-1">
              {product.name}
            </span>
          </div>
        </div>
      </div>

      {/* Product Detail */}
      <div className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Section */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative h-96 lg:h-[500px] rounded-xl overflow-hidden bg-gradient-to-br from-muted to-background border border-border">
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover"
              />
              {discount > 0 && (
                <div className="absolute top-4 right-4 bg-accent text-accent-foreground px-4 py-2 rounded-lg font-bold text-lg shadow-lg">
                  -{discount}%
                </div>
              )}
            </div>
            {/* Thumbnail Gallery */}
            <div className="grid grid-cols-4 gap-4">
              {[...product.images, product.image]
                .slice(0, 4)
                .map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`relative h-24 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === idx
                        ? 'border-accent'
                        : 'border-border hover:border-muted-foreground'
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`View ${idx + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
            </div>
          </div>

          {/* Details Section */}
          <div className="space-y-6">
            {/* Category & Title */}
            <div>
              <p className="text-sm font-bold text-primary uppercase tracking-wider mb-2">
                {product.category}
              </p>
              <h1 className="text-4xl font-bold text-foreground mb-4">
                {product.name}
              </h1>
              <p className="text-lg text-muted-foreground">
                {product.description}
              </p>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-4 pb-6 border-b border-border">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < Math.round(product.rating)
                        ? 'fill-accent text-accent'
                        : 'text-muted-foreground'
                    }`}
                  />
                ))}
              </div>
              <span className="font-bold text-foreground">{product.rating}</span>
              <a href="#reviews" className="text-accent hover:text-secondary">
                ({product.reviews} reviews)
              </a>
            </div>

            {/* Price */}
            <div className="space-y-2">
              <div className="flex items-baseline gap-4">
                <span className="text-4xl font-bold text-primary">
                  {formatPrice(product.price)}
                </span>
                {product.originalPrice && (
                  <span className="text-2xl text-muted-foreground line-through">
                    {formatPrice(product.originalPrice)}
                  </span>
                )}
              </div>
              {product.originalPrice && (
                <p className="text-green-600 font-semibold">
                  Save {formatPrice(product.originalPrice - product.price)}
                </p>
              )}
            </div>

            {/* Stock Status */}
            <div className={`flex items-center gap-2 font-semibold ${
              product.inStock ? 'text-green-600' : 'text-destructive'
            }`}>
              {product.inStock ? (
                <>
                  <Check className="w-5 h-5" />
                  In Stock
                </>
              ) : (
                'Out of Stock'
              )}
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center gap-4 pb-6 border-b border-border">
              <span className="font-semibold text-foreground">Quantity:</span>
              <div className="flex items-center border border-border rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-2 hover:bg-muted transition-colors"
                >
                  −
                </button>
                <span className="px-6 py-2 font-semibold">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-4 py-2 hover:bg-muted transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleAddToCart}
                className="relative w-full py-3 bg-gradient-to-r from-primary to-secondary text-primary-foreground rounded-lg font-bold text-lg hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-6 h-6" />
                Add to Cart
              </button>
              {showAddedNotification && (
                <div className="bg-green-600 text-white px-4 py-2 rounded-lg text-center font-semibold">
                  Added to cart!
                </div>
              )}
              <button
                onClick={handleToggleWishlist}
                className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
                  isInWishlist
                    ? 'bg-accent text-accent-foreground hover:opacity-90'
                    : 'border-2 border-border text-foreground hover:bg-muted'
                }`}
              >
                <Heart
                  className={`w-5 h-5 ${isInWishlist ? 'fill-current' : ''}`}
                />
                {isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
              </button>
              <button className="w-full py-3 border-2 border-border text-foreground rounded-lg font-bold hover:bg-muted transition-colors flex items-center justify-center gap-2">
                <Share2 className="w-5 h-5" />
                Share
              </button>
            </div>

            {/* Features */}
            <div className="space-y-3 pt-6 border-t border-border">
              {[
                { icon: Truck, text: 'Free worldwide shipping' },
                { icon: Shield, text: 'Military-grade warranty' },
                { icon: RotateCcw, text: '30-day money-back guarantee' },
              ].map((feature, idx) => (
                <div key={idx} className="flex items-center gap-3 text-muted-foreground">
                  <feature.icon className="w-5 h-5 text-accent" />
                  <span>{feature.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Specifications Section */}
        <div className="mt-16 pt-12 border-t border-border">
          <h2 className="text-2xl font-bold text-foreground mb-6">Specifications</h2>
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            {Object.entries(product.specs).map(([key, value], idx) => (
              <div
                key={key}
                className={`flex items-center px-6 py-4 ${
                  idx % 2 === 0 ? 'bg-background' : ''
                } ${idx < Object.keys(product.specs).length - 1 ? 'border-b border-border' : ''}`}
              >
                <span className="font-semibold text-foreground w-1/3">{key}</span>
                <span className="text-muted-foreground">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {product.features.map((feature, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <Check className="w-6 h-6 text-accent flex-shrink-0 mt-0.5" />
                <p className="text-muted-foreground">{feature}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16 pt-12 border-t border-border">
            <h2 className="text-2xl font-bold text-foreground mb-6">Related Products</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
