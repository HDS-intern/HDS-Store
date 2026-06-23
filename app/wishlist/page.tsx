'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { FilterSidebar, FilterState } from '@/components/FilterSidebar'
import { ProductCard } from '@/components/ProductCard'
import { useApp } from '@/lib/context'
import { formatPrice } from '@/lib/formatPrice'
import {
  ChevronRight,
  LayoutGrid,
  List,
  Heart,
  ShoppingBag,
} from 'lucide-react'
import styles from './page.module.css'

export default function WishlistPage() {
  const { wishlist, removeFromWishlist, products } = useApp()
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    priceRange: [0, 999999],
    ratings: [],
    searchTerm: '',
    sortBy: 'relevance',
  })
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchInput, setSearchInput] = useState('')

  const wishlistProducts = useMemo(
    () => products.filter((p) => wishlist.includes(p.id)),
    [wishlist, products]
  )

  const filteredProducts = useMemo(() => {
    let result = [...wishlistProducts]

    if (searchInput) {
      const search = searchInput.toLowerCase()
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(search) ||
          p.description.toLowerCase().includes(search) ||
          p.category.toLowerCase().includes(search)
      )
    }

    if (filters.categories.length > 0) {
      result = result.filter((p) =>
        filters.categories.some(
          (cat) =>
            cat === p.category.toLowerCase().replace(/\s+/g, '-') ||
            cat === p.subcategory.toLowerCase().replace(/\s+/g, '-')
        )
      )
    }

    result = result.filter(
      (p) => p.price >= filters.priceRange[0] && p.price <= filters.priceRange[1]
    )

    if (filters.ratings.length > 0) {
      result = result.filter((p) =>
        filters.ratings.some((rating) => p.rating >= rating)
      )
    }

    switch (filters.sortBy) {
      case 'price-low':
        result.sort((a, b) => a.price - b.price)
        break
      case 'price-high':
        result.sort((a, b) => b.price - a.price)
        break
      case 'rating':
        result.sort((a, b) => b.rating - a.rating)
        break
      case 'newest':
        result.sort((a, b) => parseInt(b.id) - parseInt(a.id))
        break
      default:
        break
    }

    return result
  }, [wishlistProducts, filters, searchInput])

  const totalValue = filteredProducts.reduce((sum, p) => sum + p.price, 0)

  const handleClearWishlist = () => {
    wishlist.forEach((id) => removeFromWishlist(id))
  }

  return (
    <div className={`${styles.page} flex flex-col min-h-screen bg-background`}>
      <Header />

      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-accent hover:text-secondary">
              Home
            </Link>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <span className="text-foreground font-semibold">Liked List</span>
          </div>
        </div>
      </div>

      <div className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8">
        {wishlistProducts.length === 0 ? (
          <div className={styles.emptyState}>
            <Heart className={styles.emptyIcon} />
            <h1 className={styles.emptyTitle}>Your liked list is empty</h1>
            <p className={styles.emptyDesc}>
              Save drones you love by tapping the heart icon on any product.
              They&apos;ll appear here for easy access.
            </p>
            <Link href="/shop" className={styles.shopBtn}>
              <ShoppingBag className="w-5 h-5" />
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1">
              <FilterSidebar filters={filters} onFilterChange={setFilters} />
            </div>

            <div className="lg:col-span-3">
              <div className="mb-8 space-y-4">
                <div className={styles.toolbar}>
                  <div>
                    <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                      <Heart className="w-8 h-8 text-primary fill-primary/20" />
                      Liked List
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                      {wishlistProducts.length} saved item
                      {wishlistProducts.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex gap-2 items-center">
                    <button
                      type="button"
                      onClick={handleClearWishlist}
                      className={styles.clearAllBtn}
                    >
                      Clear All
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded-lg transition-colors ${
                        viewMode === 'grid'
                          ? 'bg-accent text-accent-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-border'
                      }`}
                      aria-label="Grid view"
                    >
                      <LayoutGrid className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded-lg transition-colors ${
                        viewMode === 'list'
                          ? 'bg-accent text-accent-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-border'
                      }`}
                      aria-label="List view"
                    >
                      <List className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {filteredProducts.length > 0 && (
                  <div className={styles.summaryBar}>
                    <p className={styles.summaryText}>
                      Showing{' '}
                      <span className={styles.summaryValue}>
                        {filteredProducts.length}
                      </span>{' '}
                      of {wishlistProducts.length} liked items
                    </p>
                    <p className={styles.summaryText}>
                      Total value:{' '}
                      <span className={styles.summaryValue}>
                        {formatPrice(totalValue)}
                      </span>
                    </p>
                  </div>
                )}

                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search liked items..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-border bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {filteredProducts.length} result
                    {filteredProducts.length !== 1 ? 's' : ''}
                  </p>
                  <select
                    value={filters.sortBy}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        sortBy: e.target.value as FilterState['sortBy'],
                      })
                    }
                    className="hds-select hds-select-inline"
                  >
                    <option value="relevance">Relevance</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="rating">Top Rated</option>
                    <option value="newest">Newest</option>
                  </select>
                </div>
              </div>

              {filteredProducts.length > 0 ? (
                <div
                  className={
                    viewMode === 'grid'
                      ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6'
                      : 'space-y-4'
                  }
                >
                  {filteredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-lg text-muted-foreground mb-4">
                    No liked items match your filters.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setFilters({
                        categories: [],
                        priceRange: [0, 999999],
                        ratings: [],
                        searchTerm: '',
                        sortBy: 'relevance',
                      })
                      setSearchInput('')
                    }}
                    className="text-accent hover:text-secondary font-semibold transition-colors"
                  >
                    Clear filters →
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
