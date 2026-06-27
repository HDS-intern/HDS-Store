import type { Product } from './types'
import { getMinStockAlert } from './productPricing'

export type LowStockProduct = {
  id: string
  name: string
  stock: number
  minStockAlert: number
}

export type AdminLowStockNotification = {
  id: string
  products: LowStockProduct[]
  title: string
  message: string
}

export function isLowStockProduct(product: {
  stock?: number
  specs?: Record<string, string>
}): boolean {
  const minStockAlert = getMinStockAlert(product)
  if (minStockAlert <= 0) return false
  const stock = product.stock ?? 0
  return stock <= minStockAlert
}

export function getLowStockProducts(products: Product[]): LowStockProduct[] {
  return products
    .filter(isLowStockProduct)
    .map((product) => ({
      id: product.id,
      name: product.name,
      stock: product.stock ?? 0,
      minStockAlert: getMinStockAlert(product),
    }))
}

export function buildLowStockNotification(items: LowStockProduct[]): AdminLowStockNotification | null {
  if (items.length === 0) return null

  const now = Date.now()

  if (items.length === 1) {
    const item = items[0]
    return {
      id: `low-stock-${item.id}-${now}`,
      products: items,
      title: 'Minimum Stock Alert',
      message: `${item.name} is at or below the minimum stock limit (${item.stock} in stock, alert at ${item.minStockAlert}).`,
    }
  }

  return {
    id: `low-stock-batch-${now}`,
    products: items,
    title: 'Minimum Stock Alert',
    message: `${items.length} products are at or below their minimum stock limits.`,
  }
}

export function detectLowStockNotifications(
  previous: Set<string>,
  products: Product[],
  emitNotifications: boolean
): { notifications: AdminLowStockNotification[]; next: Set<string> } {
  const current = getLowStockProducts(products)
  const next = new Set(current.map((item) => item.id))
  const notifications: AdminLowStockNotification[] = []

  if (emitNotifications) {
    const newlyLow = current.filter((item) => !previous.has(item.id))
    const notification = buildLowStockNotification(newlyLow)
    if (notification) notifications.push(notification)
  }

  return { notifications, next }
}
