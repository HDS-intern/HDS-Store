'use client'

import { Filter, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { CATEGORIES, PRICE_RANGES, RATINGS } from '@/lib/mockData'

interface FilterSidebarProps {
  onFilterChange: (filters: FilterState) => void
  filters: FilterState
}

export interface FilterState {
  categories: string[]
  priceRange: [number, number]
  ratings: number[]
  searchTerm: string
  sortBy: 'relevance' | 'price-low' | 'price-high' | 'rating' | 'newest'
}

export function FilterSidebar({ onFilterChange, filters }: FilterSidebarProps) {
  const [expandedSections, setExpandedSections] = useState({
    category: true,
    price: true,
    rating: true,
  })

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const handleCategoryChange = (category: string) => {
    const updated = filters.categories.includes(category)
      ? filters.categories.filter((c) => c !== category)
      : [...filters.categories, category]
    onFilterChange({ ...filters, categories: updated })
  }

  const handlePriceChange = (range: typeof PRICE_RANGES[0]) => {
    onFilterChange({
      ...filters,
      priceRange: [range.min, range.max],
    })
  }

  const handleRatingChange = (rating: number) => {
    const updated = filters.ratings.includes(rating)
      ? filters.ratings.filter((r) => r !== rating)
      : [...filters.ratings, rating]
    onFilterChange({ ...filters, ratings: updated })
  }

  const handleClearFilters = () => {
    onFilterChange({
      categories: [],
      priceRange: [0, 999999],
      ratings: [],
      searchTerm: '',
      sortBy: 'relevance',
    })
  }

  return (
    <div className="bg-card rounded-lg border border-border p-6 sticky top-20 h-fit">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Filter className="w-5 h-5" />
          Filters
        </h2>
        {(filters.categories.length > 0 ||
          filters.ratings.length > 0 ||
          filters.priceRange[0] !== 0 ||
          filters.priceRange[1] !== 999999) && (
          <button
            onClick={handleClearFilters}
            className="text-xs font-semibold text-accent hover:text-secondary transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Category Filter */}
      <div className="mb-6 pb-6 border-b border-border">
        <button
          onClick={() => toggleSection('category')}
          className="flex items-center justify-between w-full mb-4"
        >
          <span className="font-semibold text-foreground">Category</span>
          <ChevronDown
            className={`w-4 h-4 text-muted-foreground transition-transform ${
              expandedSections.category ? 'rotate-180' : ''
            }`}
          />
        </button>
        {expandedSections.category && (
          <div className="space-y-2">
            {CATEGORIES.map((category) => (
              <label
                key={category.id}
                className="flex items-center gap-3 cursor-pointer hover:text-accent transition-colors"
              >
                <input
                  type="checkbox"
                  checked={filters.categories.includes(category.id)}
                  onChange={() => handleCategoryChange(category.id)}
                  className="w-4 h-4 rounded border-border accent-accent"
                />
                <span className="text-sm text-muted-foreground">
                  {category.name}
                </span>
                <span className="text-xs text-muted-foreground ml-auto">
                  ({category.count})
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Price Filter */}
      <div className="mb-6 pb-6 border-b border-border">
        <button
          onClick={() => toggleSection('price')}
          className="flex items-center justify-between w-full mb-4"
        >
          <span className="font-semibold text-foreground">Price Range</span>
          <ChevronDown
            className={`w-4 h-4 text-muted-foreground transition-transform ${
              expandedSections.price ? 'rotate-180' : ''
            }`}
          />
        </button>
        {expandedSections.price && (
          <div className="space-y-2">
            {PRICE_RANGES.map((range, idx) => (
              <button
                key={idx}
                onClick={() => handlePriceChange(range)}
                className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  filters.priceRange[0] === range.min &&
                  filters.priceRange[1] === range.max
                    ? 'bg-accent text-accent-foreground font-semibold'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Rating Filter */}
      <div>
        <button
          onClick={() => toggleSection('rating')}
          className="flex items-center justify-between w-full mb-4"
        >
          <span className="font-semibold text-foreground">Rating</span>
          <ChevronDown
            className={`w-4 h-4 text-muted-foreground transition-transform ${
              expandedSections.rating ? 'rotate-180' : ''
            }`}
          />
        </button>
        {expandedSections.rating && (
          <div className="space-y-2">
            {RATINGS.map((rating) => (
              <label
                key={rating.stars}
                className="flex items-center gap-3 cursor-pointer hover:text-accent transition-colors"
              >
                <input
                  type="checkbox"
                  checked={filters.ratings.includes(rating.stars)}
                  onChange={() => handleRatingChange(rating.stars)}
                  className="w-4 h-4 rounded border-border accent-accent"
                />
                <span className="text-sm text-muted-foreground">
                  {'★'.repeat(rating.stars)}{' '}
                  <span className="text-xs">& up</span>
                </span>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
