export function getDiscountPercent(product: {
  price: number
  originalPrice?: number
}): number {
  if (!product.originalPrice || product.originalPrice <= product.price) return 0
  return Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
}

export function originalPriceFromDiscount(
  price: number,
  discountPercent: number
): number | undefined {
  if (discountPercent <= 0 || discountPercent >= 100 || price <= 0) return undefined
  return Math.round(price / (1 - discountPercent / 100))
}

export function discountedPriceFromMaxAndPercent(
  maxPrice: number,
  discountPercent: number
): number {
  if (maxPrice <= 0) return 0
  if (discountPercent <= 0) return maxPrice
  if (discountPercent >= 100) return 0
  return Math.round(maxPrice * (1 - discountPercent / 100))
}

export function discountPercentFromMaxAndSale(maxPrice: number, salePrice: number): number {
  if (maxPrice <= 0 || salePrice >= maxPrice) return 0
  return Math.round(((maxPrice - salePrice) / maxPrice) * 100)
}

export function getMaxPrice(product: { price: number; originalPrice?: number }): number {
  if (product.originalPrice && product.originalPrice > product.price) {
    return product.originalPrice
  }
  return product.price
}

export function getMinStockAlert(product: { specs?: Record<string, string> }): number {
  const raw = product.specs?.['Min Stock Qty']
  if (raw == null || raw === '' || raw === '—') return 0
  const parsed = parseInt(String(raw), 10)
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0
}

export type PricingField = 'max' | 'discount' | 'sale'

export function syncPricingFields(
  source: PricingField,
  maxStr: string,
  discountStr: string,
  saleStr: string
): { max: string; discount: string; sale: string } {
  const parse = (value: string): number | null => {
    if (value === '') return null
    const parsed = parseInt(value, 10)
    return Number.isFinite(parsed) ? Math.max(0, parsed) : null
  }

  let max = parse(maxStr)
  let discount = parse(discountStr)
  let sale = parse(saleStr)

  if (source === 'max') {
    if (max != null) {
      if (discount != null && discount > 0) {
        sale = discountedPriceFromMaxAndPercent(max, Math.min(99, discount))
      } else if (sale != null && max > 0) {
        discount = discountPercentFromMaxAndSale(max, sale)
      } else {
        sale = max
        discount = 0
      }
    }
  } else if (source === 'discount') {
    if (discount != null) {
      discount = Math.min(99, discount)
      if (max != null && max > 0) {
        sale = discountedPriceFromMaxAndPercent(max, discount)
      } else if (sale != null && sale > 0 && discount > 0 && discount < 100) {
        max = originalPriceFromDiscount(sale, discount) ?? max
      } else if (discount === 0 && max != null) {
        sale = max
      }
    }
  } else if (source === 'sale') {
    if (sale != null) {
      if (max != null && max > 0) {
        if (sale > max) sale = max
        discount = discountPercentFromMaxAndSale(max, sale)
      } else if (discount != null && discount > 0 && discount < 100) {
        max = originalPriceFromDiscount(sale, discount) ?? max
      }
    }
  }

  return {
    max: max != null ? String(max) : maxStr,
    discount: discount != null ? String(discount) : discountStr,
    sale: sale != null ? String(sale) : saleStr,
  }
}
