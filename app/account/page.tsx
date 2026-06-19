'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { OrderItemReview } from '@/components/OrderItemReview'
import { OrderTrackingModal } from '@/components/OrderTrackingModal'
import { OrderWarrantyReturnActions } from '@/components/OrderWarrantyReturnModal'
import { useApp } from '@/lib/context'
import { apiFetch } from '@/lib/api'
import { formatPrice } from '@/lib/formatPrice'
import type { Order, SavedAddress, User } from '@/lib/types'
import {
  User,
  Package,
  Heart,
  Settings,
  LogOut,
  ChevronRight,
  Calendar,
  MapPin,
  Truck,
  Download,
  ChevronDown,
  X,
  Plus,
  Trash2,
  FileText,
} from 'lucide-react'
import { TermsAgreementDownload } from '@/components/TermsAgreementDownload'
import styles from './page.module.css'

type DashboardTab = 'overview' | 'orders' | 'wishlist' | 'settings'

function profileDisplayName(name: string) {
  return name.replace(/\s+customer$/i, '').trim() || name
}

export default function AccountPage() {
  const router = useRouter()
  const { user, logout, orders, wishlist, products, setUser } = useApp()
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview')
  const [expandedReviews, setExpandedReviews] = useState<Set<string>>(new Set())
  const [invoiceNotFoundOpen, setInvoiceNotFoundOpen] = useState(false)
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null)
  const [profileName, setProfileName] = useState('')
  const [profileEmail, setProfileEmail] = useState('')
  const [profilePhone, setProfilePhone] = useState('')
  const [profileAddresses, setProfileAddresses] = useState<SavedAddress[]>([])
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMessage, setProfileMessage] = useState('')
  const [profileError, setProfileError] = useState('')
  const [mounted, setMounted] = useState(false)

  const isCustomer = user?.role === 'customer'

  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleReview = (key: string) => {
    setExpandedReviews((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const wishlistProducts = products.filter((p) => wishlist.includes(p.id))

  useEffect(() => {
    if (!user) return
    setProfileName(profileDisplayName(user.name))
    setProfileEmail(user.email)
    setProfilePhone(user.phone || '')
    if (user.addresses?.length) {
      setProfileAddresses(user.addresses)
    } else {
      setProfileAddresses([
        {
          id: `addr-${Date.now()}`,
          label: profileDisplayName(user.name),
          street: user.address || '',
          city: user.city || '',
          state: user.state || '',
          zipCode: user.zipCode || '',
        },
      ])
    }
  }, [user])

  const updateAddress = (id: string, field: keyof SavedAddress, value: string) => {
    setProfileAddresses((prev) =>
      prev.map((addr) => (addr.id === id ? { ...addr, [field]: value } : addr))
    )
  }

  const addAddress = () => {
    setProfileAddresses((prev) => [
      ...prev,
      {
        id: `addr-${Date.now()}-${prev.length}`,
        label: user?.name || 'New Address',
        street: '',
        city: '',
        state: '',
        zipCode: '',
      },
    ])
  }

  const removeAddress = (id: string) => {
    setProfileAddresses((prev) => (prev.length <= 1 ? prev : prev.filter((a) => a.id !== id)))
  }

  const handleSaveProfile = async () => {
    setProfileError('')
    setProfileMessage('')
    setProfileSaving(true)
    try {
      const data = await apiFetch<{ user: User }>('/api/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          name: profileName,
          email: profileEmail,
          phone: profilePhone,
          addresses: profileAddresses,
        }),
      })
      if (data.user) setUser(data.user)
      setProfileMessage('Profile saved successfully.')
    } catch (e) {
      setProfileError(e instanceof Error ? e.message : 'Failed to save profile')
    } finally {
      setProfileSaving(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  const demoUser = user || {
    id: '123',
    username: 'guest',
    name: 'Guest',
    email: '',
    role: 'customer' as const,
  }

  return (
    <div className={`${styles.page} flex flex-col min-h-screen bg-background`}>
      <Header />

      <div className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <div className="bg-card rounded-lg border border-border p-6 sticky top-20">
              {/* Profile Info */}
              <div className="mb-6 pb-6 border-b border-border">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-4">
                  <User className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="font-bold text-lg text-foreground">
                  {profileDisplayName(demoUser.name)}
                </h3>
                <p className="text-sm text-muted-foreground">{demoUser.email}</p>
              </div>

              {/* Navigation */}
              <nav className="space-y-2">
                {[
                  { id: 'overview', label: 'Overview', icon: Package },
                  { id: 'orders', label: 'Orders', icon: Truck },
                  { id: 'wishlist', label: 'Wishlist', icon: Heart },
                  { id: 'settings', label: 'Settings', icon: Settings },
                ].map((item) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id as DashboardTab)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        activeTab === item.id
                          ? 'bg-accent text-accent-foreground font-semibold'
                          : 'text-foreground hover:bg-muted'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {item.label}
                    </button>
                  )
                })}
              </nav>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="w-full mt-6 py-3 border-2 border-border text-foreground rounded-lg font-semibold hover:bg-muted transition-colors flex items-center justify-center gap-2"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="md:col-span-3">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                <div>
                  <h1 className="text-3xl font-bold text-foreground mb-2">
                    Welcome back, {profileDisplayName(demoUser.name).split(' ')[0]}!
                  </h1>
                  <p className="text-muted-foreground">
                    Manage your account and view your orders
                  </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {[
                    {
                      label: 'Total Orders',
                      value: orders.length,
                      color: 'from-primary to-secondary',
                    },
                    {
                      label: 'Wishlist Items',
                      value: wishlist.length,
                      color: 'from-primary to-secondary',
                    },
                    {
                      label: 'Total Spent',
                      value: formatPrice(orders.reduce((sum, o) => sum + o.total, 0)),
                      color: 'from-secondary to-primary',
                    },
                  ].map((stat, idx) => (
                    <div
                      key={idx}
                      className={`bg-gradient-to-br ${stat.color} rounded-lg p-6 text-primary-foreground`}
                    >
                      <p className="text-sm opacity-90 mb-2">{stat.label}</p>
                      <p className="text-3xl font-bold">{stat.value}</p>
                    </div>
                  ))}
                </div>

                {/* Recent Orders */}
                {orders.length > 0 && (
                  <div className="bg-card rounded-lg border border-border p-6">
                    <h2 className="text-xl font-bold text-foreground mb-6">
                      Recent Orders
                    </h2>
                    <div className="space-y-4">
                      {orders.slice(0, 3).map((order) => (
                        <div key={order.id} className="flex items-center justify-between p-4 rounded-lg bg-background border border-border hover:border-accent transition-colors">
                          <div>
                            <p className="font-semibold text-foreground">{order.id}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-primary">{formatPrice(order.total)}</p>
                            <p
                              className={`text-xs font-semibold ${
                                order.status === 'delivered'
                                  ? 'text-green-600'
                                  : 'text-blue-600'
                              }`}
                            >
                              {order.status.toUpperCase()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">Your Orders</h1>
                  <p className="text-sm text-muted-foreground mt-2">
                    Review products you have purchased from this page after placing an order.
                  </p>
                </div>

                {orders.length === 0 ? (
                  <div className="bg-card rounded-lg border border-border p-12 text-center">
                    <Package className="w-16 h-16 text-muted-foreground opacity-50 mx-auto mb-4" />
                    <p className="text-lg text-muted-foreground mb-6">
                      You haven&apos;t placed any orders yet.
                    </p>
                    <Link
                      href="/shop"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-secondary text-primary-foreground rounded-lg font-bold hover:shadow-lg transition-all"
                    >
                      Start Shopping
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div
                        key={order.id}
                        className="bg-card rounded-lg border border-border p-6 hover:shadow-lg transition-shadow"
                      >
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 pb-4 border-b border-border">
                          <div>
                            <div className={styles.orderIdRow}>
                              <h3 className="font-bold text-lg text-foreground">{order.id}</h3>
                              <button
                                type="button"
                                className={styles.trackBtn}
                                onClick={() => setTrackingOrder(order)}
                              >
                                <Truck className="w-4 h-4" />
                                Track
                              </button>
                            </div>
                            <div className="flex flex-col gap-2 text-sm text-muted-foreground mt-2">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                {new Date(order.createdAt).toLocaleDateString()}
                              </div>
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                {order.shippingAddress}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-primary">
                              {formatPrice(order.total)}
                            </p>
                            <p
                              className={`text-sm font-bold mt-2 ${
                                order.status === 'delivered'
                                  ? 'text-green-600'
                                  : order.status === 'shipped'
                                    ? 'text-blue-600'
                                    : 'text-yellow-600'
                              }`}
                            >
                              {order.status.toUpperCase()}
                            </p>
                          </div>
                        </div>

                        {/* Order Items */}
                        <div className="space-y-4 mb-4">
                          {order.items.map((item) => {
                            const product = products.find(
                              (p) => p.id === item.productId
                            )
                            const reviewKey = `${order.id}-${item.productId}`
                            const reviewExpanded = expandedReviews.has(reviewKey)
                            return (
                              <div key={item.productId}>
                                <div className="flex justify-between text-sm text-muted-foreground">
                                  <span>
                                    {product?.name} x{item.quantity}
                                  </span>
                                  <span>{formatPrice((product?.price || 0) * item.quantity)}</span>
                                </div>
                                {isCustomer && product && (
                                  <div className={styles.reviewBlock}>
                                    <button
                                      type="button"
                                      className={styles.reviewToggle}
                                      onClick={() => toggleReview(reviewKey)}
                                      aria-expanded={reviewExpanded}
                                      aria-label={
                                        reviewExpanded
                                          ? 'Hide review and rating'
                                          : 'Show review and rating'
                                      }
                                    >
                                      <ChevronDown
                                        className={`w-4 h-4 transition-transform ${
                                          reviewExpanded ? 'rotate-180' : ''
                                        }`}
                                      />
                                      <span>
                                        {reviewExpanded
                                          ? 'Hide review & rating'
                                          : 'Show review & rating'}
                                      </span>
                                    </button>
                                    {reviewExpanded && (
                                      <OrderItemReview
                                        productId={product.id}
                                        orderId={order.id}
                                        productName={product.name}
                                      />
                                    )}
                                    {order.paymentStatus === 'paid' && order.status !== 'cancelled' && (
                                      <OrderWarrantyReturnActions
                                        orderId={order.id}
                                        productId={product.id}
                                        product={product}
                                      />
                                    )}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>

                        {isCustomer && (
                          <button
                            type="button"
                            className={styles.downloadInvoiceBtn}
                            onClick={() => setInvoiceNotFoundOpen(true)}
                          >
                            <Download className="w-4 h-4" />
                            Download Invoice
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Wishlist Tab */}
            {activeTab === 'wishlist' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">My Wishlist</h1>
                </div>

                {wishlistProducts.length === 0 ? (
                  <div className="bg-card rounded-lg border border-border p-12 text-center">
                    <Heart className="w-16 h-16 text-muted-foreground opacity-50 mx-auto mb-4" />
                    <p className="text-lg text-muted-foreground mb-6">
                      Your wishlist is empty.
                    </p>
                    <Link
                      href="/shop"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-secondary text-primary-foreground rounded-lg font-bold hover:shadow-lg transition-all"
                    >
                      Continue Shopping
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {wishlistProducts.map((product) => (
                      <Link
                        key={product.id}
                        href={`/product/${product.id}`}
                        className="bg-card rounded-lg border border-border overflow-hidden hover:shadow-lg transition-shadow"
                      >
                        <div className="aspect-video bg-muted relative overflow-hidden">
                          {/* Placeholder for product image */}
                          <div className="w-full h-full bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                            <span className="text-muted-foreground">
                              {product.name}
                            </span>
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="font-bold text-foreground mb-2">
                            {product.name}
                          </h3>
                          <div className="flex justify-between items-center">
                            <span className="text-lg font-bold text-primary">
                              {formatPrice(product.price)}
                            </span>
                            <span className="text-xs font-semibold text-muted-foreground">
                              {product.reviews} reviews
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">Account Settings</h1>
                </div>

                <div className={styles.settingsCard}>
                  <div>
                    <h2 className={styles.settingsSectionTitle}>Personal Information</h2>
                    <div className="space-y-4">
                      <div>
                        <label className={styles.fieldLabel}>Full Name</label>
                        <input
                          type="text"
                          value={profileName}
                          onChange={(e) => setProfileName(e.target.value)}
                          className={styles.fieldInput}
                        />
                      </div>
                      <div>
                        <label className={styles.fieldLabel}>Email</label>
                        <input
                          type="email"
                          value={profileEmail}
                          onChange={(e) => setProfileEmail(e.target.value)}
                          className={styles.fieldInput}
                        />
                      </div>
                      <div>
                        <label className={styles.fieldLabel}>Phone</label>
                        <input
                          type="text"
                          value={profilePhone}
                          onChange={(e) => setProfilePhone(e.target.value)}
                          className={styles.fieldInput}
                        />
                      </div>
                    </div>
                  </div>

                  <div className={styles.settingsDivider}>
                    <div className="flex items-center justify-between gap-4 mb-4">
                      <h2 className={styles.settingsSectionTitle}>Saved Addresses</h2>
                      <button type="button" className={styles.addAddressBtn} onClick={addAddress}>
                        <Plus className="w-4 h-4" />
                        Add Address
                      </button>
                    </div>

                    <div className="space-y-4">
                      {profileAddresses.map((addr, index) => (
                        <div key={addr.id} className={styles.addressCard}>
                          <div className="flex items-center justify-between gap-3 mb-3">
                            <span className={styles.addressCardTitle}>Address {index + 1}</span>
                            {profileAddresses.length > 1 && (
                              <button
                                type="button"
                                className={styles.removeAddressBtn}
                                onClick={() => removeAddress(addr.id)}
                                aria-label="Remove address"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          <div className="space-y-3">
                            <div>
                              <label className={styles.fieldLabel}>Address Name</label>
                              <input
                                type="text"
                                value={addr.label}
                                onChange={(e) => updateAddress(addr.id, 'label', e.target.value)}
                                placeholder="e.g. Home, Office, or your name"
                                className={styles.fieldInput}
                              />
                            </div>
                            <div>
                              <label className={styles.fieldLabel}>Street Address</label>
                              <input
                                type="text"
                                value={addr.street}
                                onChange={(e) => updateAddress(addr.id, 'street', e.target.value)}
                                className={styles.fieldInput}
                              />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div>
                                <label className={styles.fieldLabel}>City</label>
                                <input
                                  type="text"
                                  value={addr.city}
                                  onChange={(e) => updateAddress(addr.id, 'city', e.target.value)}
                                  className={styles.fieldInput}
                                />
                              </div>
                              <div>
                                <label className={styles.fieldLabel}>State</label>
                                <input
                                  type="text"
                                  value={addr.state}
                                  onChange={(e) => updateAddress(addr.id, 'state', e.target.value)}
                                  className={styles.fieldInput}
                                />
                              </div>
                              <div>
                                <label className={styles.fieldLabel}>ZIP Code</label>
                                <input
                                  type="text"
                                  value={addr.zipCode}
                                  onChange={(e) => updateAddress(addr.id, 'zipCode', e.target.value)}
                                  className={styles.fieldInput}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className={styles.settingsDivider}>
                    <h2 className={styles.settingsSectionTitle}>Terms and Agreement</h2>
                    <p className={styles.settingsHint}>
                      Download the latest HDS terms and agreement document for your records.
                    </p>
                    <TermsAgreementDownload
                      className={styles.termsDownloadBtn}
                      onError={setProfileError}
                    />
                  </div>

                  {profileError && <p className={styles.settingsError}>{profileError}</p>}
                  {profileMessage && <p className={styles.settingsSuccess}>{profileMessage}</p>}

                  <button
                    type="button"
                    className={styles.saveProfileBtn}
                    onClick={handleSaveProfile}
                    disabled={profileSaving}
                  >
                    {profileSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />

      {trackingOrder && (
        <OrderTrackingModal order={trackingOrder} onClose={() => setTrackingOrder(null)} />
      )}

      {invoiceNotFoundOpen && mounted
        ? createPortal(
            <div
              className={styles.modalBackdrop}
              role="dialog"
              aria-modal="true"
              aria-labelledby="invoice-not-found-title"
              onClick={() => setInvoiceNotFoundOpen(false)}
            >
              <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  className={styles.modalClose}
                  onClick={() => setInvoiceNotFoundOpen(false)}
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
                <h2 id="invoice-not-found-title" className={styles.modalTitle}>
                  Invoice not found
                </h2>
                <p className={styles.modalText}>
                  We could not find an invoice for this order. Please contact support if you need
                  assistance.
                </p>
                <button
                  type="button"
                  className={styles.modalOkBtn}
                  onClick={() => setInvoiceNotFoundOpen(false)}
                >
                  OK
                </button>
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  )
}
