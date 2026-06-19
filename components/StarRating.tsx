'use client'

import { Star } from 'lucide-react'

type StarRatingProps = {
  rating: number
  size?: 'sm' | 'md' | 'lg'
  interactive?: boolean
  onChange?: (rating: number) => void
}

export function StarRating({
  rating,
  size = 'md',
  interactive = false,
  onChange,
}: StarRatingProps) {
  const sizeClass =
    size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-7 h-7' : 'w-5 h-5'

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= Math.round(rating)
        const StarEl = (
          <Star
            className={`${sizeClass} transition-colors ${
              filled ? 'fill-accent text-accent' : 'text-muted-foreground'
            } ${interactive ? 'cursor-pointer hover:scale-110' : ''}`}
          />
        )

        if (interactive && onChange) {
          return (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              className="p-0.5"
              aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
            >
              {StarEl}
            </button>
          )
        }

        return <span key={star}>{StarEl}</span>
      })}
    </div>
  )
}
