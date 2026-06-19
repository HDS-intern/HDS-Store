import type { Database } from 'better-sqlite3'

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export type SalesChartMonth = {
  key: string
  month: string
  credited: number
  refunds: number
  soldProducts: number
  returnedProducts: number
  warrantyClaimed: number
}

type OrderRow = {
  items: string
  total: number
  status: string
  payment_status: string
  created_at: string
  returned_qty: number | null
  warranty_claim_qty: number | null
}

function monthLabel(ym: string): string {
  const [year, month] = ym.split('-')
  return `${MONTH_NAMES[parseInt(month, 10) - 1]} ${year}`
}

function itemQuantity(itemsJson: string): number {
  try {
    const items = JSON.parse(itemsJson) as { quantity?: number }[]
    if (!Array.isArray(items)) return 0
    return items.reduce((sum, item) => sum + (item.quantity ?? 0), 0)
  } catch {
    return 0
  }
}

function emptyMonth(ym: string): SalesChartMonth {
  return {
    key: ym,
    month: monthLabel(ym),
    credited: 0,
    refunds: 0,
    soldProducts: 0,
    returnedProducts: 0,
    warrantyClaimed: 0,
  }
}

function lastMonths(count: number): string[] {
  const keys: string[] = []
  const now = new Date()
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return keys
}

export function buildSalesChartData(db: Database.Database, monthCount = 6): SalesChartMonth[] {
  const monthKeys = lastMonths(monthCount)
  const fromDate = `${monthKeys[0]}-01`

  const rows = db
    .prepare(
      `SELECT items, total, status, payment_status, created_at, returned_qty, warranty_claim_qty
       FROM orders
       WHERE created_at >= ?`
    )
    .all(fromDate) as OrderRow[]

  const warrantyByMonth = db
    .prepare(
      `SELECT strftime('%Y-%m', created_at) as ym, COUNT(*) as c
       FROM contact_messages
       WHERE LOWER(subject) LIKE '%warranty%'
         AND created_at >= ?
       GROUP BY ym`
    )
    .all(fromDate) as { ym: string; c: number }[]

  const warrantyMap = new Map(warrantyByMonth.map((r) => [r.ym, r.c]))

  const map = new Map(monthKeys.map((key) => [key, emptyMonth(key)]))

  for (const row of rows) {
    const ym = row.created_at.slice(0, 7)
    const bucket = map.get(ym)
    if (!bucket) continue

    const qty = itemQuantity(row.items)
    const returnedQty = row.returned_qty && row.returned_qty > 0 ? row.returned_qty : qty

    if (row.payment_status === 'paid' && row.status !== 'cancelled') {
      bucket.credited += row.total
      bucket.soldProducts += qty
    }

    if (row.payment_status === 'refunded') {
      bucket.refunds += row.total
    }

    if (row.status === 'cancelled' && (row.payment_status === 'refunded' || row.payment_status === 'failed')) {
      bucket.returnedProducts += returnedQty
    }

    bucket.warrantyClaimed += row.warranty_claim_qty ?? 0
  }

  for (const [ym, count] of warrantyMap) {
    const bucket = map.get(ym)
    if (bucket) bucket.warrantyClaimed += count
  }

  return monthKeys.map((key) => map.get(key)!)
}
