'use client'

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { Filter } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { formatPrice } from '@/lib/formatPrice'
import {
  defaultSalesChartFilter,
  formatFyLabel,
  salesChartFilterToQuery,
  type SalesChartFilter,
  type SalesChartFilterType,
} from '@/lib/salesChartFilter'
import type { SalesChartMonth } from '@/lib/types'
import styles from './SalesLineChart.module.css'

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

type ChartMode = 'amount' | 'products'

type SeriesDef = {
  key: keyof Pick<SalesChartMonth, 'credited' | 'refunds' | 'soldProducts' | 'returnedProducts' | 'warrantyClaimed'>
  label: string
  color: string
}

const AMOUNT_SERIES: SeriesDef[] = [
  { key: 'credited', label: 'Amount credited', color: '#4ade80' },
  { key: 'refunds', label: 'Refunds', color: '#f87171' },
]

const PRODUCT_SERIES: SeriesDef[] = [
  { key: 'soldProducts', label: 'Sold products', color: '#60a5fa' },
  { key: 'returnedProducts', label: 'Returned products', color: '#fbbf24' },
  { key: 'warrantyClaimed', label: 'Warranty claimed', color: '#c4b5fd' },
]

const CHART_WIDTH = 560
const CHART_HEIGHT = 240
const PAD = { top: 20, right: 24, bottom: 44, left: 52 }

type Point = { x: number; y: number; value: number; index: number; month: string }

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function valueToY(value: number, maxValue: number, innerH: number): number {
  const safe = clamp(value, 0, maxValue)
  return PAD.top + innerH - (safe / maxValue) * innerH
}

/** Monotone cubic curve — stays between adjacent data values (no overshoot below 0 or above max). */
function monotoneLinePath(points: Point[], maxValue: number, innerH: number): string {
  const n = points.length
  if (n === 0) return ''
  if (n === 1) {
    const y = valueToY(points[0].value, maxValue, innerH)
    return `M ${points[0].x} ${y}`
  }

  const xs = points.map((p) => p.x)
  const values = points.map((p) => p.value)
  const minY = PAD.top
  const maxY = PAD.top + innerH

  const dxs: number[] = []
  const slopes: number[] = []
  for (let i = 0; i < n - 1; i++) {
    const dx = xs[i + 1] - xs[i]
    dxs.push(dx)
    slopes.push(dx === 0 ? 0 : (values[i + 1] - values[i]) / dx)
  }

  const m = new Array<number>(n)
  m[0] = slopes[0]
  m[n - 1] = slopes[n - 2]
  for (let i = 1; i < n - 1; i++) {
    if (slopes[i - 1] * slopes[i] <= 0) m[i] = 0
    else m[i] = (slopes[i - 1] + slopes[i]) / 2
  }

  for (let i = 0; i < n - 1; i++) {
    if (Math.abs(slopes[i]) < 1e-12) {
      m[i] = 0
      m[i + 1] = 0
    } else {
      const alpha = m[i] / slopes[i]
      const beta = m[i + 1] / slopes[i]
      const s = alpha * alpha + beta * beta
      if (s > 9) {
        const t = 3 / Math.sqrt(s)
        m[i] = t * alpha * slopes[i]
        m[i + 1] = t * beta * slopes[i]
      }
    }
  }

  const y0 = valueToY(values[0], maxValue, innerH)
  let path = `M ${xs[0]} ${y0}`

  for (let i = 0; i < n - 1; i++) {
    const cp1x = xs[i] + dxs[i] / 3
    const cp2x = xs[i + 1] - dxs[i] / 3
    const lo = Math.min(values[i], values[i + 1])
    const hi = Math.max(values[i], values[i + 1])
    const v1 = clamp(values[i] + (m[i] * dxs[i]) / 3, lo, hi)
    const v2 = clamp(values[i + 1] - (m[i + 1] * dxs[i]) / 3, lo, hi)
    const cp1y = clamp(valueToY(v1, maxValue, innerH), minY, maxY)
    const cp2y = clamp(valueToY(v2, maxValue, innerH), minY, maxY)
    const yEnd = valueToY(values[i + 1], maxValue, innerH)
    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${xs[i + 1]} ${yEnd}`
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

function formatAxisValue(value: number, mode: ChartMode): string {
  if (mode === 'products') return String(Math.round(value))
  if (value >= 100000) return `${(value / 100000).toFixed(1)}L`
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
  return String(Math.round(value))
}

function formatTooltipValue(value: number, mode: ChartMode): string {
  if (mode === 'amount') return formatPrice(value)
  return `${Math.round(value)} units`
}

function formatXLabel(row: SalesChartMonth): { line1: string; line2: string } {
  if (/^\d{4}-\d{2}-\d{2}$/.test(row.key)) {
    const [, month, day] = row.key.split('-')
    return {
      line1: `${parseInt(day, 10)} ${MONTH_NAMES[parseInt(month, 10) - 1]}`,
      line2: row.key.slice(0, 4),
    }
  }
  const [name, year] = row.month.split(' ')
  return { line1: name, line2: year ?? '' }
}

type SalesLineChartProps = {
  initialData: SalesChartMonth[]
}

export function SalesLineChart({ initialData }: SalesLineChartProps) {
  const chartId = useId().replace(/:/g, '')
  const filterRef = useRef<HTMLDivElement>(null)
  const [data, setData] = useState<SalesChartMonth[]>(initialData)
  const [chartLoading, setChartLoading] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [appliedFilter, setAppliedFilter] = useState<SalesChartFilter>(defaultSalesChartFilter)
  const [draftFilter, setDraftFilter] = useState<SalesChartFilter>(defaultSalesChartFilter)
  const [mode, setMode] = useState<ChartMode>('amount')
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [focusedSeries, setFocusedSeries] = useState<string | null>(null)

  useEffect(() => {
    setData(initialData)
  }, [initialData])

  useEffect(() => {
    if (!filterOpen) return
    const onPointerDown = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setFilterOpen(false)
        setDraftFilter(appliedFilter)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [filterOpen, appliedFilter])

  const fyYearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear()
    const years: number[] = []
    for (let year = currentYear - 6; year <= currentYear + 1; year++) {
      years.push(year)
    }
    return years
  }, [])

  const loadChartData = useCallback(async (filter: SalesChartFilter) => {
    setChartLoading(true)
    try {
      const response = await apiFetch<{ salesChart: SalesChartMonth[] }>(
        `/api/admin/dashboard/sales-chart?${salesChartFilterToQuery(filter)}`
      )
      setData(response.salesChart)
      setActiveIndex(null)
    } catch {
      // keep previous chart data on failure
    } finally {
      setChartLoading(false)
    }
  }, [])

  const applyFilter = () => {
    setAppliedFilter(draftFilter)
    setFilterOpen(false)
    void loadChartData(draftFilter)
  }

  const resetFilter = () => {
    const next = defaultSalesChartFilter()
    setDraftFilter(next)
    setAppliedFilter(next)
    setFilterOpen(false)
    void loadChartData(next)
  }

  const setFilterType = (type: SalesChartFilterType) => {
    setDraftFilter((prev) => {
      if (type === prev.type) return prev
      if (type === 'date') {
        const now = new Date()
        const end = now.toISOString().slice(0, 10)
        const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
        return { type, start, end }
      }
      if (type === 'month') {
        return defaultSalesChartFilter()
      }
      const year = new Date().getFullYear()
      return { type, start: String(year - 1), end: String(year) }
    })
  }

  const filterSummary = useMemo(() => {
    if (appliedFilter.type === 'date') {
      return `${appliedFilter.start} → ${appliedFilter.end}`
    }
    if (appliedFilter.type === 'month') {
      const [sy, sm] = appliedFilter.start.split('-')
      const [ey, em] = appliedFilter.end.split('-')
      return `${MONTH_NAMES[parseInt(sm, 10) - 1]} ${sy} → ${MONTH_NAMES[parseInt(em, 10) - 1]} ${ey}`
    }
    return `${formatFyLabel(Number(appliedFilter.start))} → ${formatFyLabel(Number(appliedFilter.end))}`
  }, [appliedFilter])

  const series = mode === 'amount' ? AMOUNT_SERIES : PRODUCT_SERIES

  const plot = useMemo(() => {
    const innerW = CHART_WIDTH - PAD.left - PAD.right
    const innerH = CHART_HEIGHT - PAD.top - PAD.bottom
    const baseY = PAD.top + innerH

    const values = data.flatMap((row) => series.map((s) => row[s.key] as number))
    const maxValue = Math.max(...values, 1)

    const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => ({
      value: maxValue * t,
      y: PAD.top + innerH - t * innerH,
    }))

    const xStep = data.length > 1 ? innerW / (data.length - 1) : 0
    const xPositions = data.map((_, index) =>
      PAD.left + (data.length > 1 ? index * xStep : innerW / 2)
    )

    const lines = series.map((s) => {
      const coords: Point[] = data.map((row, index) => {
        const value = row[s.key] as number
        const x = xPositions[index]
        const y = valueToY(value, maxValue, innerH)
        return { x, y, value, index, month: row.month }
      })
      return {
        ...s,
        coords,
        linePath: monotoneLinePath(coords, maxValue, innerH),
        areaPath: monotoneAreaPath(coords, maxValue, innerH, baseY),
      }
    })

    return { innerW, innerH, maxValue, yTicks, xStep, xPositions, baseY, lines }
  }, [data, series])

  const pickIndexFromX = useCallback(
    (clientX: number, svg: SVGSVGElement) => {
      const rect = svg.getBoundingClientRect()
      if (rect.width === 0) return null
      const scaleX = CHART_WIDTH / rect.width
      const x = (clientX - rect.left) * scaleX

      let nearest = 0
      let minDist = Infinity
      plot.xPositions.forEach((px, index) => {
        const dist = Math.abs(x - px)
        if (dist < minDist) {
          minDist = dist
          nearest = index
        }
      })
      return nearest
    },
    [plot.xPositions]
  )

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<SVGSVGElement>) => {
      const index = pickIndexFromX(event.clientX, event.currentTarget)
      if (index !== null) setActiveIndex(index)
    },
    [pickIndexFromX]
  )

  const activeMonth = activeIndex !== null ? data[activeIndex] : null
  const crosshairX = activeIndex !== null ? plot.xPositions[activeIndex] : null

  const seriesOpacity = (key: string) => {
    if (!focusedSeries) return 1
    return focusedSeries === key ? 1 : 0.2
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <div className={styles.filterWrap} ref={filterRef}>
            <button
              type="button"
              className={`${styles.filterBtn} ${filterOpen ? styles.filterBtnActive : ''}`}
              onClick={() => {
                setFilterOpen((open) => {
                  if (!open) setDraftFilter(appliedFilter)
                  return !open
                })
              }}
              aria-expanded={filterOpen}
              aria-haspopup="dialog"
            >
              <Filter className="w-3.5 h-3.5" />
              Filter
            </button>

            {filterOpen && (
              <div className={styles.filterPanel} role="dialog" aria-label="Sales chart filter">
                <p className={styles.filterTitle}>Filter by</p>
                <div className={styles.filterTypeRow}>
                  {(
                    [
                      ['date', 'Date range'],
                      ['month', 'Month range'],
                      ['fy', 'Financial year'],
                    ] as const
                  ).map(([type, label]) => (
                    <button
                      key={type}
                      type="button"
                      className={
                        draftFilter.type === type ? styles.filterTypeActive : styles.filterTypeBtn
                      }
                      onClick={() => setFilterType(type)}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {draftFilter.type === 'date' && (
                  <div className={styles.filterFields}>
                    <label className={styles.filterField}>
                      <span>Start date</span>
                      <input
                        type="date"
                        value={draftFilter.start}
                        max={draftFilter.end}
                        onChange={(e) =>
                          setDraftFilter((prev) =>
                            prev.type === 'date' ? { ...prev, start: e.target.value } : prev
                          )
                        }
                      />
                    </label>
                    <label className={styles.filterField}>
                      <span>End date</span>
                      <input
                        type="date"
                        value={draftFilter.end}
                        min={draftFilter.start}
                        onChange={(e) =>
                          setDraftFilter((prev) =>
                            prev.type === 'date' ? { ...prev, end: e.target.value } : prev
                          )
                        }
                      />
                    </label>
                  </div>
                )}

                {draftFilter.type === 'month' && (
                  <div className={styles.filterFields}>
                    <label className={styles.filterField}>
                      <span>Start month</span>
                      <input
                        type="month"
                        value={draftFilter.start}
                        max={draftFilter.end}
                        onChange={(e) =>
                          setDraftFilter((prev) =>
                            prev.type === 'month' ? { ...prev, start: e.target.value } : prev
                          )
                        }
                      />
                    </label>
                    <label className={styles.filterField}>
                      <span>End month</span>
                      <input
                        type="month"
                        value={draftFilter.end}
                        min={draftFilter.start}
                        onChange={(e) =>
                          setDraftFilter((prev) =>
                            prev.type === 'month' ? { ...prev, end: e.target.value } : prev
                          )
                        }
                      />
                    </label>
                  </div>
                )}

                {draftFilter.type === 'fy' && (
                  <div className={styles.filterFields}>
                    <label className={styles.filterField}>
                      <span>Start financial year</span>
                      <select
                        className="hds-select-dark"
                        value={draftFilter.start}
                        onChange={(e) =>
                          setDraftFilter((prev) => {
                            if (prev.type !== 'fy') return prev
                            const start = e.target.value
                            const end = Number(start) > Number(prev.end) ? start : prev.end
                            return { ...prev, start, end }
                          })
                        }
                      >
                        {fyYearOptions.map((year) => (
                          <option key={`start-${year}`} value={String(year)}>
                            {formatFyLabel(year)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className={styles.filterField}>
                      <span>End financial year</span>
                      <select
                        className="hds-select-dark"
                        value={draftFilter.end}
                        onChange={(e) =>
                          setDraftFilter((prev) => {
                            if (prev.type !== 'fy') return prev
                            const end = e.target.value
                            const start = Number(end) < Number(prev.start) ? end : prev.start
                            return { ...prev, start, end }
                          })
                        }
                      >
                        {fyYearOptions.map((year) => (
                          <option key={`end-${year}`} value={String(year)}>
                            {formatFyLabel(year)}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                )}

                <div className={styles.filterActions}>
                  <button type="button" className={styles.filterResetBtn} onClick={resetFilter}>
                    Reset
                  </button>
                  <button type="button" className={styles.filterApplyBtn} onClick={applyFilter}>
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>
          <span className={styles.filterSummary}>{filterSummary}</span>
        </div>

        <div className={styles.toggle} role="tablist" aria-label="Sales chart view">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'amount'}
            className={mode === 'amount' ? styles.toggleActive : styles.toggleBtn}
            onClick={() => {
              setMode('amount')
              setFocusedSeries(null)
            }}
          >
            Sales amount
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'products'}
            className={mode === 'products' ? styles.toggleActive : styles.toggleBtn}
            onClick={() => {
              setMode('products')
              setFocusedSeries(null)
            }}
          >
            Sales products
          </button>
        </div>
      </div>

      <div className={styles.legend}>
        {series.map((s) => (
          <button
            key={s.key}
            type="button"
            className={`${styles.legendItem} ${focusedSeries === s.key ? styles.legendItemActive : ''}`}
            onMouseEnter={() => setFocusedSeries(s.key)}
            onMouseLeave={() => setFocusedSeries(null)}
            onFocus={() => setFocusedSeries(s.key)}
            onBlur={() => setFocusedSeries(null)}
            onClick={() => setFocusedSeries((prev) => (prev === s.key ? null : s.key))}
          >
            <span className={styles.legendDot} style={{ background: s.color }} />
            {s.label}
          </button>
        ))}
      </div>

      <div className={`${styles.chartBox} ${chartLoading ? styles.chartLoading : ''}`}>
        {activeMonth && activeIndex !== null && (
          <div className={styles.floatingTooltip} role="status">
            <p className={styles.tooltipTitle}>{activeMonth.month}</p>
            <ul className={styles.tooltipList}>
              {series.map((s) => (
                <li key={s.key} className={styles.tooltipRow}>
                  <span className={styles.tooltipLabel}>
                    <span className={styles.legendDot} style={{ background: s.color }} />
                    {s.label}
                  </span>
                  <span className={styles.tooltipAmount}>
                    {formatTooltipValue(activeMonth[s.key] as number, mode)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <svg
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          className={styles.svg}
          role="img"
          aria-label={`Overall sales ${mode === 'amount' ? 'amount' : 'products'} chart`}
          onPointerMove={handlePointerMove}
          onPointerLeave={() => setActiveIndex(null)}
        >
          <defs>
            <clipPath id={`plot-clip-${chartId}`}>
              <rect x={PAD.left} y={PAD.top} width={plot.innerW} height={plot.innerH} />
            </clipPath>
            {plot.lines.map((line) => (
              <linearGradient
                key={`grad-${line.key}-${chartId}`}
                id={`area-${line.key}-${chartId}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={line.color} stopOpacity="0.35" />
                <stop offset="100%" stopColor={line.color} stopOpacity="0.02" />
              </linearGradient>
            ))}
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
                {formatAxisValue(tick.value, mode)}
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

          {data.map((row, index) => {
            const x = plot.xPositions[index]
            const { line1, line2 } = formatXLabel(row)
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
                  {line1}
                </tspan>
                {line2 ? (
                  <tspan x={x} dy="11">
                    {line2}
                  </tspan>
                ) : null}
              </text>
            )
          })}

          {plot.lines.map((line) => (
            <g
              key={`${mode}-${line.key}`}
              className={styles.seriesGroup}
              style={{ opacity: seriesOpacity(line.key) }}
              clipPath={`url(#plot-clip-${chartId})`}
            >
              <path d={line.areaPath} fill={`url(#area-${line.key}-${chartId})`} className={styles.area} />
              <path
                d={line.linePath}
                fill="none"
                stroke={line.color}
                strokeWidth={focusedSeries === line.key ? 3.25 : 2.5}
                strokeLinecap="round"
                className={styles.line}
              />
            </g>
          ))}

          {crosshairX !== null && (
            <g className={styles.crosshair} pointerEvents="none">
              <line
                x1={crosshairX}
                y1={PAD.top}
                x2={crosshairX}
                y2={plot.baseY}
                className={styles.crosshairLine}
              />
              {plot.lines.map((line) => {
                const point = line.coords[activeIndex!]
                return (
                  <g key={`dot-${line.key}`}>
                    <circle cx={point.x} cy={point.y} r={8} fill={line.color} className={styles.pointGlow} />
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r={4.5}
                      fill={line.color}
                      stroke="#0f172a"
                      strokeWidth="2"
                      className={styles.pointDot}
                    />
                  </g>
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
            className={styles.interactionLayer}
          />
        </svg>
      </div>
    </div>
  )
}
