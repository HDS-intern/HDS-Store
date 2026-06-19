export type OrderSnapshot = {
  id: string
  status: string
  paymentStatus: string
  authorized: boolean
  total: number
}

export type AdminOrderNotificationType =
  | 'new_order'
  | 'order_cancelled'
  | 'payment_credited'
  | 'bulk_order_confirmed'

export type AdminOrderNotification = {
  id: string
  type: AdminOrderNotificationType
  orderId: string
  title: string
  message: string
  total: number
}

export function toOrderSnapshot(order: {
  id: string
  status: string
  paymentStatus: string
  authorized: boolean
  total: number
}): OrderSnapshot {
  return {
    id: order.id,
    status: order.status,
    paymentStatus: order.paymentStatus,
    authorized: order.authorized,
    total: order.total,
  }
}

export function detectOrderNotifications(
  previous: Map<string, OrderSnapshot>,
  orders: {
    id: string
    status: string
    paymentStatus: string
    authorized: boolean
    total: number
  }[]
): AdminOrderNotification[] {
  const notifications: AdminOrderNotification[] = []
  const now = Date.now()

  for (const order of orders) {
    const prev = previous.get(order.id)

    if (!prev) {
      notifications.push({
        id: `new-${order.id}-${now}`,
        type: 'new_order',
        orderId: order.id,
        title: 'New Order Received',
        message: `A new order has been placed and is awaiting processing.`,
        total: order.total,
      })
      continue
    }

    if (prev.status !== 'cancelled' && order.status === 'cancelled') {
      notifications.push({
        id: `cancel-${order.id}-${now}`,
        type: 'order_cancelled',
        orderId: order.id,
        title: 'Order Cancelled',
        message: `Order ${order.id} has been cancelled. Revenue has been updated.`,
        total: order.total,
      })
    }

    if (prev.paymentStatus !== 'paid' && order.paymentStatus === 'paid') {
      notifications.push({
        id: `paid-${order.id}-${now}`,
        type: 'payment_credited',
        orderId: order.id,
        title: 'Payment Credited',
        message: `Payment for order ${order.id} has been marked as paid.`,
        total: order.total,
      })
    } else if (!prev.authorized && order.authorized) {
      notifications.push({
        id: `auth-${order.id}-${now}`,
        type: 'payment_credited',
        orderId: order.id,
        title: 'Payment Authorized',
        message: `Payment for order ${order.id} has been authorized.`,
        total: order.total,
      })
    }
  }

  return notifications
}
