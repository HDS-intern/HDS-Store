'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { useApp } from '@/lib/context'
import { formatPrice } from '@/lib/formatPrice'
import { Trash2, Plus, Minus, ChevronRight, ShoppingCart } from 'lucide-react'
import styles from './page.module.css'

export default function CartPage() {
  const { cart, removeFromCart, updateCartQuantity, getCartTotal, products } = useApp()

  const cartItems = cart.map((item) => ({
    ...item,
    product: products.find((p) => p.id === item.productId),
  }))

  const total = getCartTotal()
  const shipping = total > 0 ? 50 : 0
  const tax = Math.round(total * 0.08 * 100) / 100
  const grandTotal = total + shipping + tax

  if (cart.length === 0) {
    return (
      <div className={`${styles.page} flex flex-col min-h-screen bg-background`}>
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-20">
          <ShoppingCart className="w-24 h-24 text-muted-foreground mb-4 opacity-50" />
          <h1 className="text-3xl font-bold text-foreground mb-2">Your cart is empty</h1>
          <p className="text-muted-foreground mb-8 text-center max-w-md">
            Start shopping and add some products to your cart to see them here.
          </p>
          <Link
            href="/shop"
            className="px-6 py-3 bg-gradient-to-r from-primary to-secondary text-primary-foreground rounded-lg font-bold hover:shadow-lg transition-all"
          >
            Continue Shopping
          </Link>
        </div>
        <Footer />
      </div>
    )
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
            <span className="text-foreground font-semibold">Shopping Cart</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-foreground mb-8">Shopping Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <div
                key={item.productId}
                className="bg-card rounded-lg border border-border p-6 flex gap-6"
              >
                {/* Product Image */}
                <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  {item.product && (
                    <Image
                      src={item.product.image}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                    />
                  )}
                </div>

                {/* Product Details */}
                <div className="flex-1">
                  <Link
                    href={`/product/${item.productId}`}
                    className="font-bold text-lg text-foreground hover:text-accent transition-colors"
                  >
                    {item.product?.name}
                  </Link>
                  <p className="text-sm text-muted-foreground mb-4">
                    {item.product?.category}
                  </p>

                  <div className="flex items-center justify-between">
                    {/* Quantity Controls */}
                    {(() => {
                      const maxStock = item.product?.stock ?? 0
                      const atStockLimit = item.quantity >= maxStock

                      return (
                        <div className="flex items-center gap-3 flex-wrap">
                          <div className="flex items-center border border-border rounded-lg">
                            <button
                              onClick={() =>
                                updateCartQuantity(
                                  item.productId,
                                  Math.max(1, item.quantity - 1)
                                )
                              }
                              className="px-3 py-2 hover:bg-muted transition-colors"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="px-4 py-2 font-semibold">{item.quantity}</span>
                            <button
                              onClick={() =>
                                updateCartQuantity(item.productId, item.quantity + 1)
                              }
                              disabled={atStockLimit}
                              className={`px-3 py-2 transition-colors ${
                                atStockLimit
                                  ? styles.qtyBtnDisabled
                                  : 'hover:bg-muted'
                              }`}
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                          {atStockLimit && (
                            <span className={styles.stockLimitMsg}>Current stock is reached</span>
                          )}
                        </div>
                      )
                    })()}

                    {/* Price */}
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">
                        {formatPrice((item.product?.price || 0) * item.quantity)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatPrice(item.product?.price || 0)} each
                      </p>
                    </div>
                  </div>
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => removeFromCart(item.productId)}
                  className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="bg-card rounded-lg border border-border p-6 h-fit sticky top-20">
            <h2 className="text-xl font-bold text-foreground mb-6">Order Summary</h2>

            <div className="space-y-4 pb-6 border-b border-border">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatPrice(total)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping</span>
                <span>{formatPrice(shipping)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Tax</span>
                <span>{formatPrice(tax)}</span>
              </div>
            </div>

            <div className="flex justify-between items-center py-6 mb-6">
              <span className={styles.summaryTotalLabel}>Total</span>
              <span className={styles.summaryTotalAmount}>
                {formatPrice(grandTotal)}
              </span>
            </div>

            <Link
              href="/checkout"
              className="w-full py-3 bg-gradient-to-r from-primary to-secondary text-primary-foreground rounded-lg font-bold text-center hover:shadow-lg transition-all mb-3 block"
            >
              Proceed to Checkout
            </Link>

            <Link
              href="/shop"
              className="w-full py-3 px-6 border-2 border-border text-foreground rounded-lg font-bold text-center hover:bg-muted transition-colors block"
            >
              Continue Shopping
            </Link>

            {/* Promo Code */}
            <div className="mt-6 space-y-3 pt-6 border-t border-border">
              <p className="text-sm font-semibold text-foreground">Promo Code</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter code"
                  className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <button className="px-4 py-2 bg-muted hover:bg-border rounded-lg font-bold text-sm transition-colors">
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
