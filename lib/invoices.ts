import { getDb } from './db'
import { invoiceIdFromOrderId } from './invoiceIds'
import type { CartItem } from './types'

export type InvoiceRecord = {
  id: string
  orderId: string
  userId: string
  customerName?: string
  total: number
  paymentStatus: string
  paymentMethod?: string
  createdAt: string
}

export type InvoiceLineItem = {
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  lineTotal: number
}

export type InvoiceDetail = InvoiceRecord & {
  customerEmail?: string
  customerPhone?: string
  shippingAddress?: string
  orderStatus?: string
  items: InvoiceLineItem[]
}

function mapInvoiceItems(rawItems: CartItem[]) {
  const db = getDb()
  const getProduct = db.prepare('SELECT data FROM products WHERE id = ?')

  return rawItems.map((item) => {
    let productName = item.product?.name
    let unitPrice = item.product?.price ?? 0

    if (!productName) {
      const row = getProduct.get(item.productId) as { data: string } | undefined
      if (row) {
        const product = JSON.parse(row.data) as { name?: string; price?: number }
        productName = product.name
        unitPrice = product.price ?? 0
      }
    }

    return {
      productId: item.productId,
      productName: productName || item.productId,
      quantity: item.quantity,
      unitPrice,
      lineTotal: unitPrice * item.quantity,
    }
  })
}

function mapInvoiceRow(row: {
  id: string
  order_id: string
  user_id: string
  customer_name: string | null
  total: number
  payment_status: string
  payment_method: string | null
  created_at: string
  items: string
  shipping_address: string
  order_status: string
  email: string | null
  phone: string | null
  user_name: string | null
}): InvoiceDetail {
  const items = mapInvoiceItems(JSON.parse(row.items) as CartItem[])

  return {
    id: row.id,
    orderId: row.order_id,
    userId: row.user_id,
    customerName: row.customer_name || row.user_name || undefined,
    total: row.total,
    paymentStatus: row.payment_status,
    paymentMethod: row.payment_method ?? undefined,
    createdAt: row.created_at,
    customerEmail: row.email ?? undefined,
    customerPhone: row.phone ?? undefined,
    shippingAddress: row.shipping_address,
    orderStatus: row.order_status,
    items,
  }
}

export function createInvoiceForOrder(order: {
  id: string
  userId: string
  total: number
  paymentStatus?: string
  paymentMethod?: string
  createdAt: string | Date
  customerName?: string
}) {
  const db = getDb()
  const createdAt =
    order.createdAt instanceof Date
      ? order.createdAt.toISOString()
      : new Date(order.createdAt).toISOString()

  const user = db.prepare('SELECT name FROM users WHERE id = ?').get(order.userId) as
    | { name: string }
    | undefined

  db.prepare(
    `INSERT OR IGNORE INTO invoices (id, order_id, user_id, customer_name, total, payment_status, payment_method, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    invoiceIdFromOrderId(order.id),
    order.id,
    order.userId,
    order.customerName || user?.name || null,
    order.total,
    order.paymentStatus || 'pending',
    order.paymentMethod || null,
    createdAt
  )
}

export function syncInvoicePaymentStatus(orderId: string, paymentStatus: string) {
  const db = getDb()
  db.prepare('UPDATE invoices SET payment_status = ? WHERE order_id = ?').run(
    paymentStatus,
    orderId
  )
}

export function getInvoiceById(invoiceId: string): InvoiceDetail | null {
  const db = getDb()
  const row = db
    .prepare(
      `SELECT i.id, i.order_id, i.user_id, i.customer_name, i.total, i.payment_status, i.payment_method, i.created_at,
              o.items, o.shipping_address, o.status AS order_status,
              u.email, u.phone, u.name AS user_name
       FROM invoices i
       JOIN orders o ON o.id = i.order_id
       LEFT JOIN users u ON u.id = i.user_id
       WHERE i.id = ?`
    )
    .get(invoiceId) as
    | {
        id: string
        order_id: string
        user_id: string
        customer_name: string | null
        total: number
        payment_status: string
        payment_method: string | null
        created_at: string
        items: string
        shipping_address: string
        order_status: string
        email: string | null
        phone: string | null
        user_name: string | null
      }
    | undefined

  return row ? mapInvoiceRow(row) : null
}

export function getInvoiceByOrderId(orderId: string): InvoiceDetail | null {
  const db = getDb()
  const invoice = db.prepare('SELECT id FROM invoices WHERE order_id = ?').get(orderId) as
    | { id: string }
    | undefined
  return invoice ? getInvoiceById(invoice.id) : null
}

export function getAllInvoices(): InvoiceRecord[] {
  const db = getDb()
  const rows = db
    .prepare(
      `SELECT i.id, i.order_id, i.user_id, i.customer_name, i.total, i.payment_status, i.payment_method, i.created_at,
              u.name AS user_name
       FROM invoices i
       LEFT JOIN users u ON u.id = i.user_id
       ORDER BY i.created_at DESC`
    )
    .all() as {
    id: string
    order_id: string
    user_id: string
    customer_name: string | null
    total: number
    payment_status: string
    payment_method: string | null
    created_at: string
    user_name: string | null
  }[]

  return rows.map((row) => ({
    id: row.id,
    orderId: row.order_id,
    userId: row.user_id,
    customerName: row.customer_name || row.user_name || undefined,
    total: row.total,
    paymentStatus: row.payment_status,
    paymentMethod: row.payment_method ?? undefined,
    createdAt: row.created_at,
  }))
}

export { invoiceIdFromOrderId }
