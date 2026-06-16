'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { useApp } from '@/lib/context'
import { PRODUCTS } from '@/lib/mockData'
import { formatPrice } from '@/lib/formatPrice'
import {
  ShoppingCart,
  ChevronRight,
  CreditCard,
  Truck,
  Check,
  User,
  MapPin,
  Phone,
  Mail,
} from 'lucide-react'
import { Order } from '@/lib/types'
import styles from './page.module.css'

type CheckoutStep = 'customer' | 'shipping' | 'payment' | 'confirmation'

export default function CheckoutPage() {
  const router = useRouter()
  const { cart, getCartTotal, addOrder, user, clearCart } = useApp()
  const [step, setStep] = useState<CheckoutStep>('customer')

  // Form Data
  const [customerData, setCustomerData] = useState({
    email: user?.email || '',
    name: user?.name || '',
    phone: user?.phone || '',
  })

  const [shippingData, setShippingData] = useState({
    address: user?.address || '',
    city: user?.city || '',
    state: user?.state || '',
    zipCode: user?.zipCode || '',
    country: 'United States',
  })

  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    cardName: '',
    expiry: '',
    cvv: '',
  })

  const [orderId, setOrderId] = useState('')

  const cartItems = cart.map((item) => ({
    ...item,
    product: PRODUCTS.find((p) => p.id === item.productId),
  }))

  const subtotal = getCartTotal()
  const shipping = subtotal > 0 ? 50 : 0
  const tax = Math.round(subtotal * 0.08 * 100) / 100
  const total = subtotal + shipping + tax

  const handleCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (customerData.email && customerData.name && customerData.phone) {
      setStep('shipping')
    }
  }

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (
      shippingData.address &&
      shippingData.city &&
      shippingData.state &&
      shippingData.zipCode
    ) {
      setStep('payment')
    }
  }

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (
      paymentData.cardNumber &&
      paymentData.cardName &&
      paymentData.expiry &&
      paymentData.cvv
    ) {
      // Create order
      const newOrder: Order = {
        id: `ORD-${Date.now()}`,
        userId: user?.id || 'guest',
        items: cart,
        total: total,
        status: 'confirmed',
        createdAt: new Date(),
        deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        trackingNumber: `TRACK${Math.random().toString(36).substring(2, 11).toUpperCase()}`,
        shippingAddress: `${shippingData.address}, ${shippingData.city}, ${shippingData.state} ${shippingData.zipCode}`,
        deliveryMethod: 'express',
      }

      setOrderId(newOrder.id)
      addOrder(newOrder)
      setStep('confirmation')
    }
  }

  if (cart.length === 0 && step !== 'confirmation') {
    return (
      <div className={`${styles.page} flex flex-col min-h-screen bg-background`}>
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-20">
          <ShoppingCart className="w-24 h-24 text-muted-foreground mb-4 opacity-50" />
          <h1 className="text-3xl font-bold text-foreground mb-2">Your cart is empty</h1>
          <p className="text-muted-foreground mb-8 text-center max-w-md">
            Add items to your cart before proceeding to checkout.
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

      {/* Content */}
      <div className="flex-1 mx-auto max-w-6xl w-full px-4 sm:px-6 lg:px-8 py-12">
        {/* Progress Indicator */}
        {step !== 'confirmation' && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-8">
              {[
                { id: 'customer', label: 'Customer Info', icon: User },
                { id: 'shipping', label: 'Shipping', icon: Truck },
                { id: 'payment', label: 'Payment', icon: CreditCard },
              ].map((s, idx) => {
                const Icon = s.icon
                const isActive = step === s.id
                const isComplete =
                  ['customer', 'shipping', 'payment'].indexOf(step) >
                  ['customer', 'shipping', 'payment'].indexOf(s.id as any)

                return (
                  <div key={s.id} className="flex items-center flex-1">
                    <div
                      className={`flex items-center justify-center w-12 h-12 rounded-full font-bold transition-all ${
                        isActive
                          ? 'bg-accent text-accent-foreground'
                          : isComplete
                            ? 'bg-green-600 text-white'
                            : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {isComplete ? (
                        <Check className="w-6 h-6" />
                      ) : (
                        <Icon className="w-6 h-6" />
                      )}
                    </div>
                    <p
                      className={`ml-4 font-semibold text-sm ${
                        isActive
                          ? 'text-foreground'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {s.label}
                    </p>
                    {idx < 2 && (
                      <div
                        className={`flex-1 h-1 mx-4 rounded-full ${
                          isComplete ? 'bg-green-600' : 'bg-border'
                        }`}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Forms */}
          <div className="lg:col-span-2">
            {/* Customer Information */}
            {step === 'customer' && (
              <div className="bg-card rounded-lg border border-border p-8">
                <h2 className="text-2xl font-bold text-foreground mb-6">
                  Customer Information
                </h2>
                <form onSubmit={handleCustomerSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={customerData.email}
                      onChange={(e) =>
                        setCustomerData({ ...customerData, email: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                      placeholder="email@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={customerData.name}
                      onChange={(e) =>
                        setCustomerData({ ...customerData, name: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={customerData.phone}
                      onChange={(e) =>
                        setCustomerData({ ...customerData, phone: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-primary to-secondary text-primary-foreground rounded-lg font-bold hover:shadow-lg transition-all"
                  >
                    Continue to Shipping
                  </button>
                </form>
              </div>
            )}

            {/* Shipping Information */}
            {step === 'shipping' && (
              <div className="bg-card rounded-lg border border-border p-8">
                <h2 className="text-2xl font-bold text-foreground mb-6">
                  Shipping Address
                </h2>
                <form onSubmit={handleShippingSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Street Address *
                    </label>
                    <input
                      type="text"
                      required
                      value={shippingData.address}
                      onChange={(e) =>
                        setShippingData({ ...shippingData, address: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                      placeholder="123 Main Street"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        City *
                      </label>
                      <input
                        type="text"
                        required
                        value={shippingData.city}
                        onChange={(e) =>
                          setShippingData({ ...shippingData, city: e.target.value })
                        }
                        className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                        placeholder="New York"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        State *
                      </label>
                      <input
                        type="text"
                        required
                        value={shippingData.state}
                        onChange={(e) =>
                          setShippingData({ ...shippingData, state: e.target.value })
                        }
                        className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                        placeholder="NY"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        ZIP Code *
                      </label>
                      <input
                        type="text"
                        required
                        value={shippingData.zipCode}
                        onChange={(e) =>
                          setShippingData({ ...shippingData, zipCode: e.target.value })
                        }
                        className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                        placeholder="10001"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        Country
                      </label>
                      <input
                        type="text"
                        disabled
                        value={shippingData.country}
                        className="w-full px-4 py-3 rounded-lg border border-border bg-muted text-foreground opacity-50"
                      />
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setStep('customer')}
                      className="flex-1 py-3 border-2 border-border text-foreground rounded-lg font-bold hover:bg-muted transition-colors"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3 bg-gradient-to-r from-primary to-secondary text-primary-foreground rounded-lg font-bold hover:shadow-lg transition-all"
                    >
                      Continue to Payment
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Payment Information */}
            {step === 'payment' && (
              <div className="bg-card rounded-lg border border-border p-8">
                <h2 className="text-2xl font-bold text-foreground mb-6">
                  Payment Information
                </h2>
                <form onSubmit={handlePaymentSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Cardholder Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={paymentData.cardName}
                      onChange={(e) =>
                        setPaymentData({ ...paymentData, cardName: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Card Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={paymentData.cardNumber}
                      onChange={(e) =>
                        setPaymentData({
                          ...paymentData,
                          cardNumber: e.target.value.replace(/\s/g, ''),
                        })
                      }
                      placeholder="1234 5678 9012 3456"
                      maxLength="19"
                      className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        Expiry Date *
                      </label>
                      <input
                        type="text"
                        required
                        value={paymentData.expiry}
                        onChange={(e) =>
                          setPaymentData({ ...paymentData, expiry: e.target.value })
                        }
                        placeholder="MM/YY"
                        maxLength="5"
                        className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        CVV *
                      </label>
                      <input
                        type="text"
                        required
                        value={paymentData.cvv}
                        onChange={(e) =>
                          setPaymentData({ ...paymentData, cvv: e.target.value })
                        }
                        placeholder="123"
                        maxLength="4"
                        className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                      />
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setStep('shipping')}
                      className="flex-1 py-3 border-2 border-border text-foreground rounded-lg font-bold hover:bg-muted transition-colors"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3 bg-gradient-to-r from-primary to-secondary text-primary-foreground rounded-lg font-bold hover:shadow-lg transition-all"
                    >
                      Place Order
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Order Confirmation */}
            {step === 'confirmation' && (
              <div className="bg-card rounded-lg border border-border p-8 text-center">
                <div className="mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-600 mb-4">
                    <Check className="w-8 h-8 text-white" />
                  </div>
                </div>
                <h2 className="text-3xl font-bold text-foreground mb-2">
                  Order Confirmed!
                </h2>
                <p className="text-muted-foreground mb-6">
                  Thank you for your purchase. Your order has been confirmed and will be
                  shipped soon.
                </p>
                <div className="bg-background rounded-lg p-6 mb-6">
                  <p className="text-sm text-muted-foreground mb-2">Order ID</p>
                  <p className="text-2xl font-bold text-primary">{orderId}</p>
                </div>
                <div className="space-y-3">
                  <Link
                    href="/account"
                    className="w-full py-3 bg-gradient-to-r from-primary to-secondary text-primary-foreground rounded-lg font-bold hover:shadow-lg transition-all block"
                  >
                    View Order Details
                  </Link>
                  <Link
                    href="/shop"
                    className="w-full py-3 border-2 border-border text-foreground rounded-lg font-bold hover:bg-muted transition-colors block"
                  >
                    Continue Shopping
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="bg-card rounded-lg border border-border p-6 h-fit sticky top-20">
            <h3 className="text-lg font-bold text-foreground mb-6">Order Summary</h3>

            <div className="space-y-4 pb-6 border-b border-border mb-6">
              {cartItems.map((item) => (
                <div key={item.productId} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {item.product?.name} x{item.quantity}
                  </span>
                  <span className="font-semibold text-foreground">
                    {formatPrice((item.product?.price || 0) * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-3 pb-6 border-b border-border">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
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

            <div className="flex justify-between items-center">
              <span className="font-bold text-foreground">Total</span>
              <span className="text-2xl font-bold text-primary">{formatPrice(total)}</span>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
