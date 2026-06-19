import { randomBytes } from 'crypto'
import { getDb, getProductById } from './db'
import type { ProductReview } from './types'

type DbReviewRow = {
  id: string
  product_id: string
  user_id: string
  order_id: string | null
  rating: number
  title: string
  comment: string
  verified: number
  created_at: string
  author_name?: string
}

function rowToReview(row: DbReviewRow, authorName: string): ProductReview {
  return {
    id: row.id,
    author: authorName,
    userId: row.user_id,
    orderId: row.order_id ?? undefined,
    rating: row.rating,
    date: row.created_at,
    title: row.title,
    comment: row.comment,
    verified: Boolean(row.verified),
  }
}

export function hasUserPurchasedProduct(
  userId: string,
  productId: string
): { purchased: boolean; orderId?: string } {
  const db = getDb()
  const orders = db
    .prepare('SELECT id, items FROM orders WHERE user_id = ?')
    .all(userId) as { id: string; items: string }[]

  for (const order of orders) {
    const items = JSON.parse(order.items) as { productId: string }[]
    if (items.some((item) => item.productId === productId)) {
      return { purchased: true, orderId: order.id }
    }
  }
  return { purchased: false }
}

export function getReviewsForProduct(productId: string): ProductReview[] {
  const db = getDb()
  const rows = db
    .prepare(
      `SELECT r.*, u.name as author_name
       FROM reviews r
       JOIN users u ON u.id = r.user_id
       WHERE r.product_id = ?
       ORDER BY r.created_at DESC`
    )
    .all(productId) as DbReviewRow[]

  return rows.map((row) => rowToReview(row, row.author_name || 'Customer'))
}

export function getUserReviewForProduct(
  userId: string,
  productId: string
): ProductReview | null {
  const db = getDb()
  const row = db
    .prepare(
      `SELECT r.*, u.name as author_name
       FROM reviews r
       JOIN users u ON u.id = r.user_id
       WHERE r.product_id = ? AND r.user_id = ?`
    )
    .get(productId, userId) as DbReviewRow | undefined

  return row ? rowToReview(row, row.author_name || 'Customer') : null
}

export function getMergedReviewsForProduct(productId: string): ProductReview[] {
  const product = getProductById(productId)
  const dbReviews = getReviewsForProduct(productId)
  const dbIds = new Set(dbReviews.map((r) => r.id))
  const legacyReviews = (product?.reviewList ?? []).filter((r) => !dbIds.has(r.id))
  return [...dbReviews, ...legacyReviews]
}

export function submitReview(params: {
  productId: string
  userId: string
  orderId?: string
  rating: number
  title: string
  comment: string
}): ProductReview {
  const db = getDb()

  const existing = getUserReviewForProduct(params.userId, params.productId)
  if (existing) {
    throw new Error('You have already reviewed this product')
  }

  const { purchased, orderId } = hasUserPurchasedProduct(params.userId, params.productId)
  if (!purchased) {
    throw new Error('Only customers who purchased this product can leave a review')
  }

  const user = db.prepare('SELECT name FROM users WHERE id = ?').get(params.userId) as
    | { name: string }
    | undefined
  if (!user) throw new Error('User not found')

  const id = `rev-${randomBytes(8).toString('hex')}`
  const now = new Date().toISOString()

  db.prepare(
    `INSERT INTO reviews (id, product_id, user_id, order_id, rating, title, comment, verified, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    params.productId,
    params.userId,
    params.orderId || orderId || null,
    params.rating,
    params.title.trim(),
    params.comment.trim(),
    1,
    now
  )

  updateProductReviewAggregates(params.productId)

  return {
    id,
    author: user.name,
    userId: params.userId,
    orderId: params.orderId || orderId,
    rating: params.rating,
    date: now,
    title: params.title.trim(),
    comment: params.comment.trim(),
    verified: true,
  }
}

export function updateProductReviewAggregates(productId: string): void {
  const db = getDb()
  const product = getProductById(productId)
  if (!product) return

  const allReviews = getMergedReviewsForProduct(productId)
  const avgRating =
    allReviews.length > 0
      ? Math.round(
          (allReviews.reduce((sum, review) => sum + review.rating, 0) / allReviews.length) * 10
        ) / 10
      : 0

  const updated = {
    ...product,
    rating: avgRating,
    reviews: allReviews.length,
    reviewList: allReviews,
  }

  db.prepare('UPDATE products SET data = ?, updated_at = ? WHERE id = ?').run(
    JSON.stringify(updated),
    new Date().toISOString(),
    productId
  )
}
