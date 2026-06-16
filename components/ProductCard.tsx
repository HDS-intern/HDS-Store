'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Heart, ShoppingCart } from 'lucide-react'
import { Product } from '@/lib/types'
import { formatPrice } from '@/lib/formatPrice'
import { useApp } from '@/lib/context'
import { useState } from 'react'

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart, addToWishlist, removeFromWishlist, wishlist } = useApp()
  const [showAddedNotification, setShowAddedNotification] = useState(false)
  const isInWishlist = wishlist.includes(product.id)

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    addToCart(product, 1)
    setShowAddedNotification(true)
    setTimeout(() => setShowAddedNotification(false), 2000)
  }

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault()
    if (isInWishlist) {
      removeFromWishlist(product.id)
    } else {
      addToWishlist(product.id)
    }
  }

  return (
    <Link
      href={`/product/${product.id}`}
      className="group relative bg-card rounded-2xl overflow-hidden border border-border hover:shadow-2xl transition-all duration-400 hover:border-primary/40 hover:-translate-y-2"
      style={{ boxShadow: '0 4px 20px rgba(53, 106, 176, 0.06)' }}
    >
      {/* Image Container */}
      <div className="relative h-64 overflow-hidden bg-gradient-to-br from-muted to-background">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-500"
        />

        {/* Sale Badge */}
        {product.originalPrice && (
          <div
            className="absolute top-4 right-4 px-3 py-1.5 rounded-full text-sm font-bold shadow-lg text-white"
            style={{ background: 'rgba(53, 106, 176, 1)' }}
          >
            {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
          </div>
        )}

        {/* Wishlist Button */}
        <button
          onClick={handleToggleWishlist}
          className="absolute top-4 left-4 p-2 rounded-full bg-card/80 backdrop-blur-sm hover:bg-card transition-all shadow-md"
        >
          <Heart
            className={`w-5 h-5 transition-colors ${
              isInWishlist
                ? 'fill-accent text-accent'
                : 'text-muted-foreground hover:text-accent'
            }`}
          />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Category & Rating */}
        <div className="flex justify-between items-start">
          <p className="text-xs font-semibold text-primary uppercase tracking-wide">
            {product.category}
          </p>
          <div className="flex items-center gap-1">
            <span className="text-sm font-bold text-foreground">★ {product.rating}</span>
            <span className="text-xs text-muted-foreground">
              ({product.reviews})
            </span>
          </div>
        </div>

        {/* Product Name */}
        <h3 className="font-bold text-lg text-foreground line-clamp-2 group-hover:text-accent transition-colors">
          {product.name}
        </h3>

        {/* Stock Status */}
        <p
          className={`text-xs font-semibold ${
            product.inStock
              ? 'text-green-600'
              : 'text-destructive'
          }`}
        >
          {product.inStock ? '✓ In Stock' : 'Out of Stock'}
        </p>

        {/* Price */}
        <div className="flex items-baseline gap-2 pt-2">
          <span className="text-2xl font-bold text-primary">{formatPrice(product.price)}</span>
          {product.originalPrice && (
            <span className="text-sm text-muted-foreground line-through">
              {formatPrice(product.originalPrice)}
            </span>
          )}
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          className="relative w-full mt-4 py-2.5 rounded-xl font-semibold text-white hover:shadow-lg transition-all duration-300 active:scale-95 flex items-center justify-center gap-2"
          style={{
            background: 'linear-gradient(135deg, rgba(53, 106, 176, 1), rgba(74, 126, 196, 1))',
            boxShadow: '0 4px 14px rgba(53, 106, 176, 0.3)',
          }}
        >
          <ShoppingCart className="w-4 h-4" />
          Add to Cart
        </button>

        {/* Notification */}
        {showAddedNotification && (
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap shadow-lg">
            Added to cart!
          </div>
        )}
      </div>
    </Link>
  )
}
