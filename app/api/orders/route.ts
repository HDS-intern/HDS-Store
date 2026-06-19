import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { getUserBySession, getTokenFromRequest } from '@/lib/auth'
import { createInvoiceForOrder } from '@/lib/invoices'
import type { Order } from '@/lib/types'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const token = getTokenFromRequest(request)
    const user = getUserBySession(token)
    const body = await request.json()

    const order: Order = body.order
    if (!order?.id || !order.items?.length) {
      return NextResponse.json({ error: 'Invalid order data' }, { status: 400 })
    }

    const db = getDb()
    db.prepare(
      `INSERT INTO orders (id, user_id, items, total, status, payment_status, authorized,
        payment_method, shipping_address, delivery_method, tracking_number, created_at, delivery_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      order.id,
      user?.id || order.userId || 'guest',
      JSON.stringify(order.items),
      order.total,
      order.status || 'pending',
      order.paymentStatus || 'pending',
      order.authorized ? 1 : 0,
      order.paymentMethod || null,
      order.shippingAddress,
      order.deliveryMethod,
      order.trackingNumber || null,
      new Date(order.createdAt).toISOString(),
      order.deliveryDate ? new Date(order.deliveryDate).toISOString() : null
    )

    // Reduce stock
    for (const item of order.items) {
      db.prepare(
        'UPDATE products SET stock = CASE WHEN stock - ? < 0 THEN 0 ELSE stock - ? END WHERE id = ?'
      ).run(item.quantity, item.quantity, item.productId)
    }

    createInvoiceForOrder({
      id: order.id,
      userId: user?.id || order.userId || 'guest',
      total: order.total,
      paymentStatus: order.paymentStatus || 'pending',
      paymentMethod: order.paymentMethod,
      createdAt: order.createdAt,
    })

    return NextResponse.json({ success: true, orderId: order.id })
  } catch {
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const token = getTokenFromRequest(request)
    const user = getUserBySession(token)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = getDb()
    let rows

    if (user.role === 'admin' || user.role === 'staff') {
      rows = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all()
    } else {
      rows = db
        .prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC')
        .all(user.id)
    }

    const orders = (rows as Record<string, unknown>[]).map(parseOrderRow)
    return NextResponse.json(
      { orders },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch {
    return NextResponse.json({ error: 'Failed to load orders' }, { status: 500 })
  }
}

function parseOrderRow(row: Record<string, unknown>) {
  return {
    id: row.id,
    userId: row.user_id,
    items: JSON.parse(row.items as string),
    total: row.total,
    status: row.status,
    paymentStatus: row.payment_status,
    authorized: Boolean(row.authorized),
    paymentMethod: row.payment_method,
    shippingAddress: row.shipping_address,
    deliveryMethod: row.delivery_method,
    trackingNumber: row.tracking_number,
    createdAt: row.created_at,
    deliveryDate: row.delivery_date,
  }
}
