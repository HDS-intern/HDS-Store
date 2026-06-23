'use client'

import { useCallback, useEffect, useId, useMemo, useState } from 'react'
import { List, RefreshCw } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import type {
  BadReviewChartMonth,
  BadReviewEntry,
  BadReviewProductSummary,
} from '@/lib/types'
import { CustomerDetailsModal } from './CustomerDetailsModal'
import styles from './BadReviewAnalysesPanel.module.css'

type FilterMode = 'overall' | 'product'

type ReviewAnalysesData = {
  chart: BadReviewChartMonth[]
  products: BadReviewProductSummary[]
  entries: BadReviewEntry[]
}

const CHART_WIDTH = 560
const CHART_HEIGHT = 220
const PAD = { top: 20, right: 24, bottom: 44, left: 44 }

type Point = { x: number; y: number; value: number; index: number }

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function valueToY(value: number, maxValue: number, innerH: number): number {
  const safe = clamp(value, 0, maxValue)
  return PAD.top + innerH - (safe / maxValue) * innerH
}

function monotoneLinePath(points: Point[], maxValue: number, innerH: number): string {
  const count = points.length
  if (count === 0) return ''
  if (count === 1) {
    const y = valueToY(points[0].value, maxValue, innerH)
    return `M ${points[0].x} ${y}`
  }

  const xs = points.map((point) => point.x)
  const values = points.map((point) => point.value)
  const minY = PAD.top
  const maxY = PAD.top + innerH
  const dxs: number[] = []
  const slopes: number[] = []

  for (let index = 0; index < count - 1; index += 1) {
    const dx = xs[index + 1] - xs[index]
    dxs.push(dx)
    slopes.push(dx === 0 ? 0 : (values[index + 1] - values[index]) / dx)
  }

  const tangents = new Array<number>(count)
  tangents[0] = slopes[0]
  tangents[count - 1] = slopes[count - 2]

  for (let index = 1; index < count - 1; index += 1) {
    if (slopes[index - 1] * slopes[index] <= 0) tangents[index] = 0
    else tangents[index] = (slopes[index - 1] + slopes[index]) / 2
  }

  for (let index = 0; index < count - 1; index += 1) {
    if (Math.abs(slopes[index]) < 1e-12) {
      tangents[index] = 0
      tangents[index + 1] = 0
    } else {
      const alpha = tangents[index] / slopes[index]
      const beta = tangents[index + 1] / slopes[index]
      const magnitude = alpha * alpha + beta * beta
      if (magnitude > 9) {
        const scale = 3 / Math.sqrt(magnitude)
        tangents[index] = scale * alpha * slopes[index]
        tangents[index + 1] = scale * beta * slopes[index]
      }
    }
  }

  const startY = valueToY(values[0], maxValue, innerH)
  let path = `M ${xs[0]} ${startY}`

  for (let index = 0; index < count - 1; index += 1) {
    const cp1x = xs[index] + dxs[index] / 3
    const cp2x = xs[index + 1] - dxs[index] / 3
    const low = Math.min(values[index], values[index + 1])
    const high = Math.max(values[index], values[index + 1])
    const v1 = clamp(values[index] + (tangents[index] * dxs[index]) / 3, low, high)
    const v2 = clamp(values[index + 1] - (tangents[index + 1] * dxs[index]) / 3, low, high)
    const cp1y = clamp(valueToY(v1, maxValue, innerH), minY, maxY)
    const cp2y = clamp(valueToY(v2, maxValue, innerH), minY, maxY)
    const endY = valueToY(values[index + 1], maxValue, innerH)
    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${xs[index + 1]} ${endY}`
  }

  return path
}

function monotoneAreaPath(points: Point[], maxValue: number, innerH: number, baseY: number): string {
  if (points.length === 0) return ''
  const line = monotoneLinePath(points, maxValue, innerH)
  const last = points[points.length - 1]
  const first = points[0]
  return `${line} L ${last.x} ${baseY} L ${first.x} ${baseY} Z`
}

function formatContactName(name: string) {
  return name.replace(/\s+customer$/i, '').trim() || name
}

function formatReviewDate(value: string) {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function ratingStars(rating: number) {
  return '★'.repeat(rating) + '☆'.repeat(Math.max(0, 5 - rating))
}

export function BadReviewAnalysesPanel({ refreshKey = 0 }: { refreshKey?: number }) {
  const chartId = useId().replace(/:/g, '')
  const [filterMode, setFilterMode] = useState<FilterMode>('overall')
  const [selectedProductId, setSelectedProductId] = useState('')
  const [showTable, setShowTable] = useState(false)
  const [data, setData] = useState<ReviewAnalysesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [profileUserId, setProfileUserId] = useState<string | null>(null)
  const [profileDisplayName, setProfileDisplayName] = useState<string | undefined>()

  const productId = filterMode === 'product' && selectedProductId ? selectedProductId : undefined

  const loadData = useCallback(
    async (showLoader = false) => {
      if (showLoader) setLoading(true)
      try {
        const query = productId ? `?productId=${encodeURIComponent(productId)}` : ''
        const response = await apiFetch<ReviewAnalysesData>(`/api/admin/review-analyses${query}`)
        setData(response)
      } catch {
        setData({ chart: [], products: [], entries: [] })
      } finally {
        if (showLoader) setLoading(false)
      }
    },
    [productId]
  )

  useEffect(() => {
    void loadData(true)
  }, [loadData, refreshKey])

  useEffect(() => {
    const interval = window.setInterval(() => {
      void loadData(false)
    }, 10000)

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        void loadData(false)
      }
    }

    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onVisible)

    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onVisible)
    }
  }, [loadData])

  useEffect(() => {
    if (filterMode !== 'product') {
      setShowTable(false)
    }
  }, [filterMode])

  useEffect(() => {
    if (!selectedProductId && data?.products.length) {
      setSelectedProductId(data.products[0].productId)
    }
  }, [data?.products, selectedProductId])

  const chart = data?.chart ?? []
  const entries = data?.entries ?? []
  const products = data?.products ?? []

  const plot = useMemo(() => {
    const innerW = CHART_WIDTH - PAD.left - PAD.right
    const innerH = CHART_HEIGHT - PAD.top - PAD.bottom
    const baseY = PAD.top + innerH
    const values = chart.flatMap((row) => [row.badReviews, row.totalReviews])
    const maxValue = Math.max(...values, 1)
    const yTicks = [0, 0.25, 0.5, 0.75, 1].map((tick) => ({
      value: maxValue * tick,
      y: PAD.top + innerH - tick * innerH,
    }))
    const xStep = chart.length > 1 ? innerW / (chart.length - 1) : 0
    const xPositions = chart.map((_, index) =>
      PAD.left + (chart.length > 1 ? index * xStep : innerW / 2)
    )

    const buildSeries = (key: 'badReviews' | 'totalReviews', color: string) => {
      const coords: Point[] = chart.map((row, index) => {
        const value = row[key]
        const x = xPositions[index]
        const y = valueToY(value, maxValue, innerH)
        return { x, y, value, index }
      })
      return {
        key,
        color,
        coords,
        linePath: monotoneLinePath(coords, maxValue, innerH),
        areaPath: monotoneAreaPath(coords, maxValue, innerH, baseY),
      }
    }

    return {
      innerW,
      innerH,
      maxValue,
      yTicks,
      xPositions,
      baseY,
      badSeries: buildSeries('badReviews', '#f87171'),
      totalSeries: buildSeries('totalReviews', '#64748b'),
    }
  }, [chart])

  const activeMonth = activeIndex !== null ? chart[activeIndex] : null
  const crosshairX = activeIndex !== null ? plot.xPositions[activeIndex] : null

  const pickIndexFromX = (clientX: number, svg: SVGSVGElement) => {
    const rect = svg.getBoundingClientRect()
    if (rect.width === 0) return null
    const scaleX = CHART_WIDTH / rect.width
    const x = (clientX - rect.left) * scaleX
    let nearest = 0
    let minDistance = Infinity
    plot.xPositions.forEach((position, index) => {
      const distance = Math.abs(x - position)
      if (distance < minDistance) {
        minDistance = distance
        nearest = index
      }
    })
    return nearest
  }

  const openProfile = (userId: string | null, displayName: string) => {
    if (!userId) return
    setProfileUserId(userId)
    setProfileDisplayName(displayName)
  }

  return (
    <>
      <div className={`${styles.panel} ${styles.reviewPanel}`}>
        <div className={styles.panelHeader}>
          <p className={styles.panelTitle}>Bad Review Analyses</p>
          <button
            type="button"
            className={styles.refreshBtn}
            onClick={() => void loadData(true)}
            aria-label="Refresh review analyses"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? styles.spinning : ''}`} />
          </button>
        </div>

        <div className={styles.toolbar}>
          <div className={styles.toggle} role="tablist" aria-label="Review analysis filter">
            <button
              type="button"
              role="tab"
              aria-selected={filterMode === 'overall'}
              className={filterMode === 'overall' ? styles.toggleActive : styles.toggleBtn}
              onClick={() => setFilterMode('overall')}
            >
              Overall reviews
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={filterMode === 'product'}
              className={filterMode === 'product' ? styles.toggleActive : styles.toggleBtn}
              onClick={() => setFilterMode('product')}
            >
              Particular product
            </button>
          </div>

          {filterMode === 'product' && (
            <div className={styles.productControls}>
              <select
                className="hds-select-dark hds-select-inline"
                value={selectedProductId}
                onChange={(event) => {
                  setSelectedProductId(event.target.value)
                  setShowTable(false)
                }}
              >
                {products.length === 0 ? (
                  <option value="">No products with bad reviews</option>
                ) : (
                  products.map((product) => (
                    <option key={product.productId} value={product.productId}>
                      {product.productName} ({product.badReviewCount} bad)
                    </option>
                  ))
                )}
              </select>
              <button
                type="button"
                className={styles.tableToggleBtn}
                onClick={() => setShowTable((open) => !open)}
                disabled={!selectedProductId}
              >
                <List className="w-4 h-4" />
                {showTable ? 'Hide accounts table' : 'View accounts table'}
              </button>
            </div>
          )}
        </div>

        <div className={styles.legend}>
          <span className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: '#f87171' }} />
            Bad reviews (1–2 stars)
          </span>
          <span className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: '#64748b' }} />
            Total reviews
          </span>
        </div>

        <div className={`${styles.chartBox} ${loading ? styles.chartLoading : ''}`}>
          {activeMonth && activeIndex !== null && (
            <div className={styles.floatingTooltip} role="status">
              <p className={styles.tooltipTitle}>{activeMonth.month}</p>
              <p className={styles.tooltipRow}>
                <span>Bad reviews</span>
                <strong>{activeMonth.badReviews}</strong>
              </p>
              <p className={styles.tooltipRow}>
                <span>Total reviews</span>
                <strong>{activeMonth.totalReviews}</strong>
              </p>
            </div>
          )}

          {chart.length === 0 ? (
            <p className={styles.emptyText}>No review data available yet</p>
          ) : (
            <svg
              viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
              className={styles.svg}
              role="img"
              aria-label="Bad review analyses chart"
              onPointerMove={(event) => {
                const index = pickIndexFromX(event.clientX, event.currentTarget)
                if (index !== null) setActiveIndex(index)
              }}
              onPointerLeave={() => setActiveIndex(null)}
            >
              <defs>
                <clipPath id={`review-plot-clip-${chartId}`}>
                  <rect x={PAD.left} y={PAD.top} width={plot.innerW} height={plot.innerH} />
                </clipPath>
                <linearGradient id={`review-area-total-${chartId}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#64748b" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#64748b" stopOpacity="0.02" />
                </linearGradient>
                <linearGradient id={`review-area-bad-${chartId}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f87171" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#f87171" stopOpacity="0.02" />
                </linearGradient>
              </defs>

              {plot.yTicks.map((tick) => (
                <g key={tick.value}>
                  <line
                    x1={PAD.left}
                    y1={tick.y}
                    x2={CHART_WIDTH - PAD.right}
                    y2={tick.y}
                    className={styles.gridLine}
                  />
                  <text x={PAD.left - 8} y={tick.y + 4} className={styles.axisLabel} textAnchor="end">
                    {Math.round(tick.value)}
                  </text>
                </g>
              ))}

              <line
                x1={PAD.left}
                y1={CHART_HEIGHT - PAD.bottom}
                x2={CHART_WIDTH - PAD.right}
                y2={CHART_HEIGHT - PAD.bottom}
                className={styles.axisLine}
              />
              <line
                x1={PAD.left}
                y1={PAD.top}
                x2={PAD.left}
                y2={CHART_HEIGHT - PAD.bottom}
                className={styles.axisLine}
              />

              {chart.map((row, index) => {
                const x = plot.xPositions[index]
                const [monthName, year] = row.month.split(' ')
                const isActive = activeIndex === index
                return (
                  <text
                    key={row.key}
                    x={x}
                    y={CHART_HEIGHT - 18}
                    className={`${styles.monthLabel} ${isActive ? styles.monthLabelActive : ''}`}
                    textAnchor="middle"
                  >
                    <tspan x={x} dy="0">
                      {monthName}
                    </tspan>
                    <tspan x={x} dy="11">
                      {year}
                    </tspan>
                  </text>
                )
              })}

              <g clipPath={`url(#review-plot-clip-${chartId})`}>
                <path d={plot.totalSeries.areaPath} fill={`url(#review-area-total-${chartId})`} />
                <path
                  d={plot.totalSeries.linePath}
                  fill="none"
                  stroke={plot.totalSeries.color}
                  strokeWidth="2"
                  strokeLinecap="round"
                  className={styles.line}
                />
                <path d={plot.badSeries.areaPath} fill={`url(#review-area-bad-${chartId})`} />
                <path
                  d={plot.badSeries.linePath}
                  fill="none"
                  stroke={plot.badSeries.color}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  className={styles.line}
                />
              </g>

              {crosshairX !== null && activeIndex !== null && (
                <g className={styles.crosshair} pointerEvents="none">
                  <line
                    x1={crosshairX}
                    y1={PAD.top}
                    x2={crosshairX}
                    y2={plot.baseY}
                    className={styles.crosshairLine}
                  />
                  {[plot.badSeries, plot.totalSeries].map((series) => {
                    const point = series.coords[activeIndex]
                    return (
                      <circle
                        key={series.key}
                        cx={point.x}
                        cy={point.y}
                        r="4.5"
                        fill={series.color}
                        stroke="#0f172a"
                        strokeWidth="2"
                      />
                    )
                  })}
                </g>
              )}

              <rect
                x={PAD.left}
                y={PAD.top}
                width={CHART_WIDTH - PAD.left - PAD.right}
                height={CHART_HEIGHT - PAD.top - PAD.bottom}
                fill="transparent"
              />
            </svg>
          )}
        </div>

        {showTable && filterMode === 'product' && (
          <div className={styles.tableSection}>
            <p className={styles.tableHeading}>Accounts with bad reviews</p>
            {entries.length === 0 ? (
              <p className={styles.emptyText}>No bad reviews for this product yet</p>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.reviewTable}>
                  <thead>
                    <tr>
                      <th>Submitted</th>
                      <th>Customer</th>
                      <th>Rating</th>
                      <th>Issue / Review</th>
                      <th>Order</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry) => {
                      const displayName = formatContactName(entry.customerName)
                      return (
                        <tr key={entry.id}>
                          <td>{formatReviewDate(entry.createdAt)}</td>
                          <td>
                            {entry.userId ? (
                              <button
                                type="button"
                                className={styles.customerBtn}
                                onClick={() => openProfile(entry.userId, displayName)}
                              >
                                {displayName}
                              </button>
                            ) : (
                              <span>{displayName}</span>
                            )}
                            {entry.customerEmail ? (
                              <p className={styles.customerMeta}>{entry.customerEmail}</p>
                            ) : null}
                          </td>
                          <td>
                            <span className={styles.ratingBadge}>{ratingStars(entry.rating)}</span>
                            <span className={styles.ratingValue}>{entry.rating}/5</span>
                          </td>
                          <td>
                            <p className={styles.reviewTitle}>{entry.title}</p>
                            <p className={styles.reviewComment}>{entry.comment}</p>
                          </td>
                          <td>{entry.orderId ?? '—'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {profileUserId && (
        <CustomerDetailsModal
          userId={profileUserId}
          displayName={profileDisplayName}
          onClose={() => {
            setProfileUserId(null)
            setProfileDisplayName(undefined)
          }}
        />
      )}
    </>
  )
}
