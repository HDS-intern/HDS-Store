'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { useApp } from '@/lib/context'
import { apiFetch } from '@/lib/api'
import { formatPrice } from '@/lib/formatPrice'
import {
  ShoppingCart,
  CreditCard,
  Truck,
  Check,
  User,
  Smartphone,
  Banknote,
  Building2,
  Copy,
  QrCode,
} from 'lucide-react'
import {
  UPI_ID,
  BANK_DETAILS,
  NET_BANKING_BANKS,
  COMPANY_NAME,
} from '@/lib/paymentConfig'
import { OrderSuccessToast } from '@/components/OrderSuccessToast'
import styles from './page.module.css'

type CheckoutStep = 'customer' | 'shipping' | 'payment' | 'confirmation'
type PaymentMethod = 'upi' | 'cod' | 'netbanking' | 'card_transfer'
type UpiMode = 'qr' | 'upi_id'

const PAYMENT_OPTIONS: {
  id: PaymentMethod
  label: string
  description: string
  icon: typeof CreditCard
}[] = [
  { id: 'upi', label: 'UPI Payment', description: 'Scan QR or pay via UPI ID', icon: Smartphone },
  { id: 'cod', label: 'Cash on Delivery', description: 'Pay when your order arrives', icon: Banknote },
  { id: 'netbanking', label: 'Net Banking', description: 'Pay through your bank portal', icon: Building2 },
  { id: 'card_transfer', label: 'Card Transfer', description: 'NEFT / IMPS / card to account', icon: CreditCard },
]

type BulkPendingItem = {
  modelNumber: string
  qty: number
  productId: string
  productName: string
  price: number
}

export default function CheckoutPage() {
  const router = useRouter()
  const { cart, getCartTotal, addOrder, user, clearCart, products } = useApp()
  const [step, setStep] = useState<CheckoutStep>('customer')
  const [bulkPendingItems] = useState<BulkPendingItem[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      const raw = sessionStorage.getItem('hds-bulk-order-pending')
      if (!raw) return []
      return JSON.parse(raw) as BulkPendingItem[]
    } catch {
      return []
    }
  })
  const bulkOrder = bulkPendingItems.length > 0

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

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi')
  const [upiMode, setUpiMode] = useState<UpiMode>('qr')
  const [netBankingBank, setNetBankingBank] = useState('')
  const [transferConfirmed, setTransferConfirmed] = useState(false)
  const [paymentReference, setPaymentReference] = useState('')
  const [copiedUpi, setCopiedUpi] = useState(false)

  const [orderId, setOrderId] = useState('')
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const cartItems = cart.map((item) => ({
    ...item,
    product: products.find((p) => p.id === item.productId),
  }))

  const subtotal = getCartTotal()
  const shipping = subtotal > 0 ? 50 : 0
  const tax = Math.round(subtotal * 0.08 * 100) / 100
  const total = subtotal + shipping + tax

  useEffect(() => {
    if (step !== 'confirmation') return

    const timer = window.setTimeout(() => {
      router.push('/shop')
    }, 5000)

    return () => window.clearTimeout(timer)
  }, [step, router])

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

  const isPaymentValid = () => {
    switch (paymentMethod) {
      case 'upi':
      case 'cod':
        return true
      case 'netbanking':
        return netBankingBank !== ''
      case 'card_transfer':
        return transferConfirmed
      default:
        return false
    }
  }

  const copyUpiId = async () => {
    try {
      await navigator.clipboard.writeText(UPI_ID)
      setCopiedUpi(true)
      setTimeout(() => setCopiedUpi(false), 2000)
    } catch {
      setCopiedUpi(false)
    }
  }

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isPaymentValid() || submitting) return

    const methodLabel =
      paymentMethod === 'upi'
        ? `upi-${upiMode}`
        : paymentMethod === 'netbanking'
          ? `netbanking-${netBankingBank}`
          : paymentMethod

    const newOrderId = `ORD-${Date.now()}`
    const newOrder = {
      id: newOrderId,
      userId: user?.id || 'guest',
      items: cart,
      total: total,
      status: 'pending' as const,
      paymentStatus: paymentMethod === 'cod' ? ('pending' as const) : ('pending' as const),
      authorized: false,
      createdAt: new Date(),
      deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      trackingNumber: `TRACK${Math.random().toString(36).substring(2, 11).toUpperCase()}`,
      shippingAddress: `${shippingData.address}, ${shippingData.city}, ${shippingData.state} ${shippingData.zipCode}`,
      deliveryMethod: paymentMethod === 'cod' ? 'cod' : 'express',
      paymentMethod: bulkOrder
        ? `bulk_sheet|${paymentReference ? `${methodLabel}|ref:${paymentReference}` : methodLabel}`
        : paymentReference
          ? `${methodLabel}|ref:${paymentReference}`
          : methodLabel,
    }

    setSubmitting(true)
    setSubmitError('')

    try {
      await addOrder(newOrder)

      if (bulkOrder) {
        await apiFetch('/api/bulk-order/confirm', {
          method: 'POST',
          body: JSON.stringify({ items: bulkPendingItems, orderId: newOrderId }),
        })
        sessionStorage.removeItem('hds-bulk-order-pending')
      }

      setOrderId(newOrderId)
      setStep('confirmation')
      setShowSuccessToast(true)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to place order')
    } finally {
      setSubmitting(false)
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

      {showSuccessToast && orderId && (
        <OrderSuccessToast
          orderId={orderId}
          bulkOrder={bulkOrder}
          onDismiss={() => setShowSuccessToast(false)}
        />
      )}

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
                <h2 className="text-2xl font-bold text-foreground mb-2">Payment Information</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Choose how you would like to pay for your order.
                </p>

                <form onSubmit={handlePaymentSubmit} className="space-y-6">
                  <div className={styles.paymentMethods}>
                    {PAYMENT_OPTIONS.map((option) => {
                      const Icon = option.icon
                      const active = paymentMethod === option.id
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => {
                            setPaymentMethod(option.id)
                            setTransferConfirmed(false)
                            setNetBankingBank('')
                          }}
                          className={`${styles.paymentMethodCard} ${active ? styles.paymentMethodActive : ''}`}
                        >
                          <Icon className="w-5 h-5 shrink-0" />
                          <span>
                            <span className={styles.paymentMethodLabel}>{option.label}</span>
                            <span className={styles.paymentMethodHint}>{option.description}</span>
                          </span>
                        </button>
                      )
                    })}
                  </div>

                  {paymentMethod === 'upi' && (
                    <div className={styles.paymentPanel}>
                      <p className={styles.panelTitle}>UPI Payment</p>
                      <p className={styles.panelHint}>
                        Use either option below — scan the QR code or send payment to our UPI ID.
                      </p>

                      <div className={styles.upiToggle}>
                        <button
                          type="button"
                          className={`${styles.upiToggleBtn} ${upiMode === 'qr' ? styles.upiToggleActive : ''}`}
                          onClick={() => setUpiMode('qr')}
                        >
                          <QrCode className="w-4 h-4" />
                          Scan QR Code
                        </button>
                        <button
                          type="button"
                          className={`${styles.upiToggleBtn} ${upiMode === 'upi_id' ? styles.upiToggleActive : ''}`}
                          onClick={() => setUpiMode('upi_id')}
                        >
                          <Smartphone className="w-4 h-4" />
                          Pay via UPI ID
                        </button>
                      </div>

                      {upiMode === 'qr' ? (
                        <div className={styles.qrBlock}>
                          <Image
                            src="/images/hds-upi-qr.svg"
                            alt="HDS UPI QR code"
                            width={200}
                            height={200}
                            className={styles.qrImage}
                          />
                          <p className={styles.qrAmount}>Amount: {formatPrice(total)}</p>
                          <p className={styles.qrHint}>
                            Open any UPI app (GPay, PhonePe, Paytm) and scan to pay {COMPANY_NAME}.
                          </p>
                        </div>
                      ) : (
                        <div className={styles.upiIdBlock}>
                          <p className={styles.upiIdLabel}>UPI ID</p>
                          <div className={styles.upiIdRow}>
                            <code className={styles.upiIdValue}>{UPI_ID}</code>
                            <button type="button" onClick={copyUpiId} className={styles.copyBtn}>
                              <Copy className="w-4 h-4" />
                              {copiedUpi ? 'Copied' : 'Copy'}
                            </button>
                          </div>
                          <p className={styles.qrHint}>
                            Send {formatPrice(total)} to the UPI ID above, then place your order.
                          </p>
                        </div>
                      )}

                      <div className="mt-4">
                        <label className="block text-sm font-semibold text-foreground mb-2">
                          UPI Transaction Reference (optional)
                        </label>
                        <input
                          type="text"
                          value={paymentReference}
                          onChange={(e) => setPaymentReference(e.target.value)}
                          className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                          placeholder="e.g. 123456789012"
                        />
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'cod' && (
                    <div className={styles.paymentPanel}>
                      <p className={styles.panelTitle}>Cash on Delivery</p>
                      <p className={styles.panelHint}>
                        Pay {formatPrice(total)} in cash when your drone order is delivered. No online
                        payment is required now.
                      </p>
                      <ul className={styles.infoList}>
                        <li>Please keep exact change ready if possible.</li>
                        <li>Our delivery partner will provide a receipt on payment.</li>
                        <li>COD is available for eligible pin codes only.</li>
                      </ul>
                    </div>
                  )}

                  {paymentMethod === 'netbanking' && (
                    <div className={styles.paymentPanel}>
                      <p className={styles.panelTitle}>Net Banking</p>
                      <p className={styles.panelHint}>
                        Select your bank and transfer {formatPrice(total)} using net banking.
                      </p>

                      <div className="mb-4">
                        <label className="block text-sm font-semibold text-foreground mb-2">
                          Select Your Bank *
                        </label>
                        <select
                          required
                          value={netBankingBank}
                          onChange={(e) => setNetBankingBank(e.target.value)}
                          className="hds-select"
                        >
                          <option value="">Choose a bank</option>
                          {NET_BANKING_BANKS.map((bank) => (
                            <option key={bank} value={bank}>
                              {bank}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className={styles.bankDetails}>
                        <p className={styles.bankDetailsTitle}>Transfer to {COMPANY_NAME}</p>
                        <p><span>Bank:</span> {BANK_DETAILS.bankName}</p>
                        <p><span>Account Name:</span> {BANK_DETAILS.accountName}</p>
                        <p><span>Account No:</span> {BANK_DETAILS.accountNumber}</p>
                        <p><span>IFSC:</span> {BANK_DETAILS.ifsc}</p>
                        <p><span>Branch:</span> {BANK_DETAILS.branch}</p>
                      </div>

                      <div className="mt-4">
                        <label className="block text-sm font-semibold text-foreground mb-2">
                          Transaction Reference (optional)
                        </label>
                        <input
                          type="text"
                          value={paymentReference}
                          onChange={(e) => setPaymentReference(e.target.value)}
                          className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                          placeholder="UTR / reference number"
                        />
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'card_transfer' && (
                    <div className={styles.paymentPanel}>
                      <p className={styles.panelTitle}>Card Transfer</p>
                      <p className={styles.panelHint}>
                        Transfer {formatPrice(total)} via NEFT, IMPS, or card-to-account payment using
                        the details below.
                      </p>

                      <div className={styles.bankDetails}>
                        <p className={styles.bankDetailsTitle}>Beneficiary Details</p>
                        <p><span>Bank:</span> {BANK_DETAILS.bankName}</p>
                        <p><span>Account Name:</span> {BANK_DETAILS.accountName}</p>
                        <p><span>Account No:</span> {BANK_DETAILS.accountNumber}</p>
                        <p><span>IFSC:</span> {BANK_DETAILS.ifsc}</p>
                        <p><span>Branch:</span> {BANK_DETAILS.branch}</p>
                      </div>

                      <div className="mt-4">
                        <label className="block text-sm font-semibold text-foreground mb-2">
                          Transaction Reference (optional)
                        </label>
                        <input
                          type="text"
                          value={paymentReference}
                          onChange={(e) => setPaymentReference(e.target.value)}
                          className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                          placeholder="UTR / reference number"
                        />
                      </div>

                      <label className={styles.confirmRow}>
                        <input
                          type="checkbox"
                          checked={transferConfirmed}
                          onChange={(e) => setTransferConfirmed(e.target.checked)}
                          className={styles.confirmCheckbox}
                        />
                        <span>I have initiated the transfer for {formatPrice(total)}</span>
                      </label>
                    </div>
                  )}

                  {submitError && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {submitError}
                    </div>
                  )}

                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setStep('shipping')}
                      className="flex-1 py-3 border-2 border-border text-foreground rounded-lg font-bold hover:bg-muted transition-colors"
                      disabled={submitting}
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={!isPaymentValid() || submitting}
                      className="flex-1 py-3 bg-gradient-to-r from-primary to-secondary text-primary-foreground rounded-lg font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? 'Placing Order...' : 'Place Order'}
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
                <p className="text-muted-foreground mb-2">
                  Thank you for your purchase. Your order has been confirmed and will be
                  shipped soon. You can review your purchased products from the Orders tab in
                  your account.
                </p>
                <p className="text-sm text-muted-foreground mb-6">
                  Redirecting to the shop in a few seconds...
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
