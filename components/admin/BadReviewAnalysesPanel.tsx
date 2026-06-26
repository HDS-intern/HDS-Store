'use client'

import { useCallback, useEffect, useId, useMemo, useState } from 'react'
import { ChevronDown, RefreshCw } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import type {
  BadReviewChartMonth,
  BadReviewEntry,
  ProductReviewScore,
} from '@/lib/types'
import { CustomerDetailsModal } from './CustomerDetailsModal'
import styles from './BadReviewAnalysesPanel.module.css'

type ReviewFilter = 'overall' | 'good' | 'bad'

type ReviewAnalysesData = {
  chart: BadReviewChartMonth[]
  productScores: ProductReviewScore[]
  entries: BadReviewEntry[]
  goodEntries: BadReviewEntry[]
}

const CHART_WIDTH = 480
const CHART_HEIGHT = 160
const PAD = { top: 14, right: 16, bottom: 40, left: 36 }

type Point = { x: number; y: number; value: number; index: number }

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function valueToY(value: number, maxValue: number, innerH: number, padTop: number): number {
  const safe = clamp(value, 0, maxValue)
  return padTop + innerH - (safe / maxValue) * innerH
}

function monotoneLinePath(points: Point[], maxValue: number, innerH: number, padTop: number): string {
  const count = points.length
  if (count === 0) return ''
  if (count === 1) {
    const y = valueToY(points[0].value, maxValue, innerH, padTop)
    return `M ${points[0].x} ${y}`
  }
  const xs = points.map((p) => p.x)
  const values = points.map((p) => p.value)
  const startY = valueToY(values[0], maxValue, innerH, padTop)
  let path = `M ${xs[0]} ${startY}`
  for (let i = 0; i < count - 1; i += 1) {
    const midX = (xs[i] + xs[i + 1]) / 2
    const y1 = valueToY(values[i], maxValue, innerH, padTop)
    const y2 = valueToY(values[i + 1], maxValue, innerH, padTop)
    path += ` C ${midX} ${y1}, ${midX} ${y2}, ${xs[i + 1]} ${y2}`
  }
  return path
}

function monotoneAreaPath(
  points: Point[],
  maxValue: number,
  innerH: number,
  baseY: number,
  padTop: number
): string {
  if (points.length === 0) return ''
  const line = monotoneLinePath(points, maxValue, innerH, padTop)
  const last = points[points.length - 1]
  const first = points[0]
  return `${line} L ${last.x} ${baseY} L ${first.x} ${baseY} Z`
}

function truncateLabel(name: string, max = 10): string {
  return name.length > max ? `${name.slice(0, max)}…` : name
}

export function BadReviewAnalysesPanel({
  refreshKey = 0,
  embedded = false,
  onProductClick,
  onMonthClick,
}: {
  refreshKey?: number
  embedded?: boolean
  onProductClick?: (product: ProductReviewScore) => void
  onMonthClick?: (month: BadReviewChartMonth, mode: ReviewFilter) => void
}) {
  const chartId = useId().replace(/:/g, '')
  const [filter, setFilter] = useState<ReviewFilter>('overall')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [data, setData] = useState<ReviewAnalysesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [activeBar, setActiveBar] = useState<number | null>(null)
  const [profileUserId, setProfileUserId] = useState<string | null>(null)
  const [profileDisplayName, setProfileDisplayName] = useState<string | undefined>()

  const loadData = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true)
    try {
      const response = await apiFetch<ReviewAnalysesData>('/api/admin/review-analyses')
      setData(response)
    } catch {
      setData({ chart: [], productScores: [], entries: [], goodEntries: [] })
    } finally {
      if (showLoader) setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadData(true)
  }, [loadData, refreshKey])

  useEffect(() => {
    const interval = window.setInterval(() => void loadData(false), 10000)
    return () => window.clearInterval(interval)
  }, [loadData])

  useEffect(() => {
    if (!dropdownOpen) return
    const close = () => setDropdownOpen(false)
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [dropdownOpen])

  const chart = data?.chart ?? []
  const productScores = data?.productScores ?? []

  const filterLabel =
    filter === 'overall' ? 'Overall' : filter === 'good' ? 'Good Review' : 'Bad Review'

  const timeSeriesKey = filter === 'good' ? 'goodReviews' : 'badReviews'
  const timeSeriesColor = filter === 'good' ? '#4ade80' : '#f87171'
  const timeSeriesLabel = filter === 'good' ? 'Good reviews (4–5 stars)' : 'Bad reviews (1–2 stars)'

  const timePlot = useMemo(() => {
    const innerW = CHART_WIDTH - PAD.left - PAD.right
    const innerH = CHART_HEIGHT - PAD.top - PAD.bottom
    const baseY = PAD.top + innerH
    const values = chart.map((row) => row[timeSeriesKey])
    const maxValue = Math.max(...values, 1)
    const xStep = chart.length > 1 ? innerW / (chart.length - 1) : 0
    const xPositions = chart.map((_, i) => PAD.left + (chart.length > 1 ? i * xStep : innerW / 2))
    const coords: Point[] = chart.map((row, index) => ({
      x: xPositions[index],
      y: valueToY(row[timeSeriesKey], maxValue, innerH, PAD.top),
      value: row[timeSeriesKey],
      index,
    }))
    return {
      innerW,
      innerH,
      maxValue,
      xPositions,
      baseY,
      coords,
      linePath: monotoneLinePath(coords, maxValue, innerH, PAD.top),
      areaPath: monotoneAreaPath(coords, maxValue, innerH, baseY, PAD.top),
    }
  }, [chart, timeSeriesKey])

  const barPlot = useMemo(() => {
    const items = productScores.slice(0, 6)
    const innerW = CHART_WIDTH - PAD.left - PAD.right
    const innerH = CHART_HEIGHT - PAD.top - PAD.bottom
    const maxValue = Math.max(...items.flatMap((p) => [p.goodReviews, p.badReviews]), 1)
    const groupW = items.length > 0 ? innerW / items.length : innerW
    const barW = Math.min(14, groupW * 0.22)
    const groups = items.map((product, index) => {
      const cx = PAD.left + groupW * index + groupW / 2
      const goodH = (product.goodReviews / maxValue) * innerH
      const badH = (product.badReviews / maxValue) * innerH
      const baseY = PAD.top + innerH
      return {
        product,
        cx,
        good: {
          x: cx - barW - 2,
          y: baseY - goodH,
          h: goodH,
          value: product.goodReviews,
        },
        bad: {
          x: cx + 2,
          y: baseY - badH,
          h: badH,
          value: product.badReviews,
        },
      }
    })
    return { items, maxValue, innerH, groups, baseY: PAD.top + innerH }
  }, [productScores])

  const activeMonth = activeIndex !== null ? chart[activeIndex] : null

  return (
    <>
      <div className={embedded ? styles.embedded : styles.panel}>
        <div className={styles.panelHeader}>
          <p className={styles.panelTitle}>Review Analysis</p>
          <div className={styles.headerActions}>
            <div className={styles.dropdownWrap}>
              <button
                type="button"
                className={styles.dropdownBtn}
                onClick={(e) => {
                  e.stopPropagation()
                  setDropdownOpen((o) => !o)
                }}
                aria-expanded={dropdownOpen}
              >
                {filterLabel}
                <ChevronDown className={`w-4 h-4 ${dropdownOpen ? styles.chevronOpen : ''}`} />
              </button>
              {dropdownOpen && (
                <div className={styles.dropdownMenu} onClick={(e) => e.stopPropagation()}>
                  {(
                    [
                      ['overall', 'Overall'],
                      ['good', 'Good Review'],
                      ['bad', 'Bad Review'],
                    ] as const
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      className={filter === id ? styles.dropdownActive : styles.dropdownItem}
                      onClick={() => {
                        setFilter(id)
                        setDropdownOpen(false)
                        setActiveIndex(null)
                        setActiveBar(null)
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              type="button"
              className={styles.refreshBtn}
              onClick={() => void loadData(true)}
              aria-label="Refresh review analysis"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? styles.spinning : ''}`} />
            </button>
          </div>
        </div>

        {filter !== 'overall' && (
          <div className={styles.legend}>
            <span className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: timeSeriesColor }} />
              {timeSeriesLabel}
            </span>
          </div>
        )}

        {filter === 'overall' && (
          <div className={styles.legend}>
            <span className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: '#4ade80' }} />
              Good reviews
            </span>
            <span className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: '#f87171' }} />
              Bad reviews
            </span>
          </div>
        )}

        <div className={`${styles.chartBox} ${loading ? styles.chartLoading : ''}`}>
          {filter !== 'overall' && activeMonth && activeIndex !== null && (
            <div className={styles.floatingTooltip} role="status">
              <p className={styles.tooltipTitle}>{activeMonth.month}</p>
              <p className={styles.tooltipRow}>
                <span>{filter === 'good' ? 'Good reviews' : 'Bad reviews'}</span>
                <strong>{activeMonth[timeSeriesKey]}</strong>
              </p>
            </div>
          )}

          {filter === 'overall' && activeBar !== null && barPlot.groups[activeBar] && (
            <div className={styles.floatingTooltip} role="status">
              <p className={styles.tooltipTitle}>{barPlot.groups[activeBar].product.productName}</p>
              <p className={styles.tooltipRow}>
                <span>Score</span>
                <strong>{barPlot.groups[activeBar].product.averageScore}/5</strong>
              </p>
              <p className={styles.tooltipRow}>
                <span>Good / Bad</span>
                <strong>
                  {barPlot.groups[activeBar].product.goodReviews} /{' '}
                  {barPlot.groups[activeBar].product.badReviews}
                </strong>
              </p>
            </div>
          )}

          {filter !== 'overall' && chart.length === 0 ? (
            <p className={styles.emptyText}>No review data available yet</p>
          ) : filter === 'overall' && productScores.length === 0 ? (
            <p className={styles.emptyText}>No review data available yet</p>
          ) : filter === 'overall' ? (
            <svg
              viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
              className={styles.svg}
              role="img"
              aria-label="Product review analysis chart"
            >
              {[0, 0.25, 0.5, 0.75, 1].map((t) => {
                const y = PAD.top + barPlot.innerH - t * barPlot.innerH
                const val = Math.round(barPlot.maxValue * t)
                return (
                  <g key={t}>
                    <line
                      x1={PAD.left}
                      y1={y}
                      x2={CHART_WIDTH - PAD.right}
                      y2={y}
                      className={styles.gridLine}
                    />
                    <text x={PAD.left - 6} y={y + 3} className={styles.axisLabel} textAnchor="end">
                      {val}
                    </text>
                  </g>
                )
              })}
              <line
                x1={PAD.left}
                y1={barPlot.baseY}
                x2={CHART_WIDTH - PAD.right}
                y2={barPlot.baseY}
                className={styles.axisLine}
              />
              {barPlot.groups.map((group, index) => (
                <g
                  key={group.product.productId}
                  onMouseEnter={() => setActiveBar(index)}
                  onMouseLeave={() => setActiveBar(null)}
                  onClick={() => onProductClick?.(group.product)}
                  style={{ cursor: onProductClick ? 'pointer' : undefined }}
                >
                  <rect
                    x={group.good.x}
                    y={group.good.y}
                    width={14}
                    height={Math.max(group.good.h, 2)}
                    rx={2}
                    fill="#4ade80"
                    className={styles.barRect}
                  />
                  <rect
                    x={group.bad.x}
                    y={group.bad.y}
                    width={14}
                    height={Math.max(group.bad.h, 2)}
                    rx={2}
                    fill="#f87171"
                    className={styles.barRect}
                  />
                  <text
                    x={group.cx}
                    y={CHART_HEIGHT - 22}
                    className={styles.productLabel}
                    textAnchor="middle"
                  >
                    {truncateLabel(group.product.productName)}
                  </text>
                  <text
                    x={group.cx}
                    y={CHART_HEIGHT - 8}
                    className={styles.scoreLabel}
                    textAnchor="middle"
                  >
                    ★ {group.product.averageScore}
                  </text>
                </g>
              ))}
            </svg>
          ) : (
            <svg
              viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
              className={styles.svg}
              role="img"
              aria-label="Review trend chart"
              onPointerMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect()
                const x = ((e.clientX - rect.left) / rect.width) * CHART_WIDTH
                let nearest = 0
                let minDist = Infinity
                timePlot.xPositions.forEach((px, i) => {
                  const d = Math.abs(x - px)
                  if (d < minDist) {
                    minDist = d
                    nearest = i
                  }
                })
                setActiveIndex(nearest)
              }}
              onPointerLeave={() => setActiveIndex(null)}
              onClick={() => {
                if (activeIndex !== null && chart[activeIndex]) {
                  onMonthClick?.(chart[activeIndex], filter)
                }
              }}
              style={{ cursor: onMonthClick ? 'pointer' : undefined }}
            >
              <defs>
                <linearGradient id={`review-area-${chartId}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={timeSeriesColor} stopOpacity="0.35" />
                  <stop offset="100%" stopColor={timeSeriesColor} stopOpacity="0.02" />
                </linearGradient>
              </defs>
              {[0, 0.25, 0.5, 0.75, 1].map((t) => {
                const y = PAD.top + timePlot.innerH - t * timePlot.innerH
                return (
                  <line
                    key={t}
                    x1={PAD.left}
                    y1={y}
                    x2={CHART_WIDTH - PAD.right}
                    y2={y}
                    className={styles.gridLine}
                  />
                )
              })}
              <path d={timePlot.areaPath} fill={`url(#review-area-${chartId})`} />
              <path
                d={timePlot.linePath}
                fill="none"
                stroke={timeSeriesColor}
                strokeWidth="2.5"
                strokeLinecap="round"
                className={styles.line}
              />
              {chart.map((row, index) => {
                const x = timePlot.xPositions[index]
                const [monthName, year] = row.month.split(' ')
                return (
                  <text
                    key={row.key}
                    x={x}
                    y={CHART_HEIGHT - 14}
                    className={`${styles.monthLabel} ${activeIndex === index ? styles.monthLabelActive : ''}`}
                    textAnchor="middle"
                  >
                    <tspan x={x} dy="0">
                      {monthName}
                    </tspan>
                    <tspan x={x} dy="10">
                      {year}
                    </tspan>
                  </text>
                )
              })}
            </svg>
          )}
        </div>
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

// Alias for clearer naming
export const ReviewAnalysisPanel = BadReviewAnalysesPanel
