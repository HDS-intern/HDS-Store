import { NextResponse } from 'next/server'
import { getUserBySession, getTokenFromRequest, requirePermission } from '@/lib/auth'
import {
  getBadReviewChart,
  getBadReviewEntries,
  getBadReviewProducts,
  getGoodReviewEntries,
  getProductReviewScores,
} from '@/lib/badReviewAnalyses'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    requirePermission(getUserBySession(getTokenFromRequest(request)), 'dashboard')

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId') || undefined

    return NextResponse.json({
      chart: getBadReviewChart(productId),
      products: getBadReviewProducts(),
      entries: getBadReviewEntries(productId),
      goodEntries: getGoodReviewEntries(productId),
      productScores: getProductReviewScores(),
    })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
