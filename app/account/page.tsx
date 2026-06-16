'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { useApp } from '@/lib/context'
import { PRODUCTS } from '@/lib/mockData'
import { formatPrice } from '@/lib/formatPrice'
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
} from 'lucide-react'
import styles from './page.module.css'

type DashboardTab = 'overview' | 'orders' | 'wishlist' | 'settings'

export default function AccountPage() {
  const { user, setUser, orders, wishlist } = useApp()
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview')

  const wishlistProducts = PRODUCTS.filter((p) => wishlist.includes(p.id))

  const handleLogout = () => {
    setUser(null)
  }

  // Demo user for preview
  const demoUser = user || {
    id: '123',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1 (555) 123-4567',
    address: '123 Main Street',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
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
                <h3 className="font-bold text-lg text-foreground">{demoUser.name}</h3>
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
                    Welcome back, {demoUser.name.split(' ')[0]}!
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
                      color: 'from-accent to-secondary',
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
                      {orders.slice(-3).reverse().map((order) => (
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
                            <h3 className="font-bold text-lg text-foreground">
                              {order.id}
                            </h3>
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
                        <div className="space-y-2 mb-4">
                          {order.items.map((item) => {
                            const product = PRODUCTS.find(
                              (p) => p.id === item.productId
                            )
                            return (
                              <div
                                key={item.productId}
                                className="flex justify-between text-sm text-muted-foreground"
                              >
                                <span>
                                  {product?.name} x{item.quantity}
                                </span>
                                <span>{formatPrice((product?.price || 0) * item.quantity)}</span>
                              </div>
                            )
                          })}
                        </div>

                        {/* Actions */}
                        {order.status === 'delivered' && (
                          <button className="flex items-center gap-2 text-accent hover:text-secondary font-semibold text-sm">
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

                <div className="bg-card rounded-lg border border-border p-6 space-y-6">
                  {/* Personal Information */}
                  <div>
                    <h2 className="text-lg font-bold text-foreground mb-4">
                      Personal Information
                    </h2>
                    <div className="space-y-4">
                      {[
                        { label: 'Full Name', value: demoUser.name },
                        { label: 'Email', value: demoUser.email },
                        { label: 'Phone', value: demoUser.phone },
                      ].map((field, idx) => (
                        <div key={idx}>
                          <label className="text-sm font-semibold text-muted-foreground">
                            {field.label}
                          </label>
                          <input
                            type="text"
                            defaultValue={field.value}
                            className="w-full px-4 py-2 mt-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Address */}
                  <div className="pt-6 border-t border-border">
                    <h2 className="text-lg font-bold text-foreground mb-4">
                      Shipping Address
                    </h2>
                    <div className="space-y-4">
                      {[
                        { label: 'Street Address', value: demoUser.address },
                        { label: 'City', value: demoUser.city },
                        { label: 'State', value: demoUser.state },
                        { label: 'ZIP Code', value: demoUser.zipCode },
                      ].map((field, idx) => (
                        <div key={idx}>
                          <label className="text-sm font-semibold text-muted-foreground">
                            {field.label}
                          </label>
                          <input
                            type="text"
                            defaultValue={field.value}
                            className="w-full px-4 py-2 mt-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <button className="w-full py-3 bg-gradient-to-r from-primary to-secondary text-primary-foreground rounded-lg font-bold hover:shadow-lg transition-all mt-6">
                    Save Changes
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
