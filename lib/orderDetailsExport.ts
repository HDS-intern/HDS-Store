import { formatPrice } from '@/lib/formatPrice'
import type { CartItem, Order } from '@/lib/types'

export type OrderDetailExport = Order & {
  createdAt: string | Date
  customerName?: string
  customerUsername?: string
}

function formatOrderDate(value: string | Date) {
  const parsed = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(parsed.getTime())) return String(value)
  return parsed.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatPaymentMethod(method?: string) {
  if (!method) return '—'
  const base = method.split('|')[0].split('-')[0]
  const labels: Record<string, string> = {
    upi: 'UPI Payment',
    cod: 'Cash on Delivery',
    netbanking: 'Net Banking',
    card_transfer: 'Card / Bank Transfer',
    bulk_sheet: 'Bulk Order Sheet',
  }
  return labels[base] ?? base.replace(/_/g, ' ')
}

function lineItemLabel(item: CartItem) {
  return item.product?.name ?? item.productId
}

function lineUnitPrice(item: CartItem) {
  if (item.product?.price != null) return item.product.price
  return 0
}

function lineTotal(item: CartItem) {
  return lineUnitPrice(item) * item.quantity
}

export function formatOrderDetailsText(order: OrderDetailExport) {
  const customer =
    order.customerName || order.customerUsername || order.userId

  const lines = [
    'HAWKING DEFENCE — ORDER DETAILS',
    '================================',
    '',
    `Order ID:        ${order.id}`,
    `Placed:          ${formatOrderDate(order.createdAt)}`,
    `Customer:        ${customer}`,
    `User ID:         ${order.userId}`,
    '',
    'ORDER STATUS',
    '------------',
    `Status:          ${order.status}`,
    `Payment Status:  ${order.paymentStatus}`,
    `Payment Method:  ${formatPaymentMethod(order.paymentMethod)}`,
    `Authorized:      ${order.authorized ? 'Yes' : 'No'}`,
    '',
    'FULFILLMENT',
    '-----------',
    `Delivery Method: ${order.deliveryMethod || '—'}`,
    `Shipping:        ${order.shippingAddress || '—'}`,
    `Tracking #:      ${order.trackingNumber || '—'}`,
    order.deliveryDate
      ? `Delivery Date:   ${formatOrderDate(order.deliveryDate)}`
      : 'Delivery Date:   —',
    '',
    'LINE ITEMS',
    '----------',
  ]

  if (order.items.length === 0) {
    lines.push('No items recorded.')
  } else {
    order.items.forEach((item, index) => {
      lines.push(
        `${index + 1}. ${lineItemLabel(item)}`,
        `   Product ID:  ${item.productId}`,
        `   Quantity:    ${item.quantity}`,
        `   Unit Price:  ${formatPrice(lineUnitPrice(item))}`,
        `   Line Total:  ${formatPrice(lineTotal(item))}`,
        ''
      )
    })
  }

  lines.push('TOTAL', '-----', `Order Total:     ${formatPrice(order.total)}`, '')
  lines.push(`Generated:       ${new Date().toLocaleString('en-IN')}`)

  return lines.join('\n')
}

export function downloadOrderDetails(order: OrderDetailExport) {
  const content = formatOrderDetailsText(order)
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${order.id}-order-details.txt`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
