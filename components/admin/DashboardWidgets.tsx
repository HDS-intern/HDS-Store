'use client'

import Image from 'next/image'
import { formatPrice } from '@/lib/formatPrice'
import type { DashboardStats } from '@/lib/types'
import { AdminSlideUp } from './AdminSlideUp'
import styles from './DashboardWidgets.module.css'

function TrendBadge({ value }: { value: number }) {
  const up = value >= 0
  return (
    <span className={up ? styles.trendUp : styles.trendDown}>
      {up ? '↑' : '↓'} {Math.abs(value).toFixed(1)}%
    </span>
  )
}

type KpiCardProps = {
  label: string
  value: string
  change?: number
  icon: React.ReactNode
  onClick?: () => void
}

export function DashboardKpiCard({
  label,
  value,
  change,
  icon,
  onClick,
}: KpiCardProps) {
  return (
    <button type="button" className={styles.kpiCard} onClick={onClick}>
      <div className={styles.kpiTop}>
        <div className={styles.kpiIcon}>{icon}</div>
        {change !== undefined && <TrendBadge value={change} />}
      </div>
      <p className={styles.kpiValue}>{value}</p>
      <p className={styles.kpiLabel}>{label}</p>
    </button>
  )
}

export function DashboardKpiGrid({
  stats,
  onKpiClick,
  animationBaseDelay = 0,
  entranceSession = 0,
}: {
  stats: DashboardStats
  onKpiClick?: (label: string) => void
  animationBaseDelay?: number
  entranceSession?: number
}) {
  const items = [
    { label: 'Total Revenue', value: formatPrice(stats.totalRevenue), change: stats.revenueChangePct, icon: <span className={styles.iconGreen}>₹</span> },
    { label: 'Total Orders', value: String(stats.totalOrders), change: stats.ordersChangePct, icon: <span className={styles.iconBlue}>#</span> },
    { label: 'Total Customers', value: String(stats.totalCustomers), change: stats.customersChangePct, icon: <span className={styles.iconPurple}>@</span> },
    { label: 'Average Order Value', value: formatPrice(stats.averageOrderValue), icon: <span className={styles.iconBlue}>Ø</span> },
    { label: 'Net Profit', value: formatPrice(stats.netProfit), change: stats.revenueChangePct, icon: <span className={styles.iconGreen}>+</span> },
  ]
  return (
    <div className={styles.kpiGrid}>
      {items.map((item, index) => (
        <AdminSlideUp
          key={item.label}
          delayMs={animationBaseDelay + index * 55}
          entranceSession={entranceSession}
        >
          <DashboardKpiCard
            {...item}
            onClick={() => onKpiClick?.(item.label)}
          />
        </AdminSlideUp>
      ))}
    </div>
  )
}

const CHANNEL_COLORS: Record<string, string> = {
  UPI: '#3b82f6',
  NEFT: '#22c55e',
  'Card Transfer': '#f59e0b',
  COD: '#a855f7',
}

export function DashboardDonutChart({
  channels,
  onChannelClick,
}: {
  channels: DashboardStats['paymentChannels']
  onChannelClick?: (channel: DashboardStats['paymentChannels'][number]) => void
}) {
  const total = channels.reduce((s, c) => s + c.value, 0) || 1
  let offset = 0
  const segments = channels.map((ch) => {
    const pct = total > 0 ? (ch.value / total) * 100 : 0
    const color = CHANNEL_COLORS[ch.label] ?? '#64748b'
    const seg = { ...ch, pct, color, offset }
    offset += pct
    return seg
  })

  const gradient =
    segments.some((s) => s.pct > 0)
      ? segments.map((s) => `${s.color} ${s.offset}% ${s.offset + s.pct}%`).join(', ')
      : '#334155'

  return (
    <div className={styles.donutWrap}>
      <button
        type="button"
        className={styles.donutBtn}
        onClick={() => onChannelClick?.(channels[0])}
        aria-label="View payment channel details"
      >
        <div className={styles.donut} style={{ background: `conic-gradient(${gradient})` }}>
          <div className={styles.donutHole}>
            <span className={styles.donutTotal}>{formatPrice(total)}</span>
            <span className={styles.donutSub}>Total sales</span>
          </div>
        </div>
      </button>
      <ul className={styles.donutLegend}>
        {segments.map((s) => (
          <li key={s.label}>
            <button type="button" className={styles.clickableRow} onClick={() => onChannelClick?.(s)}>
              <span className={styles.legendDot} style={{ background: s.color }} />
              <span>{s.label}</span>
              <strong>{s.pct.toFixed(1)}%</strong>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function DashboardTopProducts({
  products,
  onProductClick,
}: {
  products: DashboardStats['topProducts']
  onProductClick?: (product: DashboardStats['topProducts'][number]) => void
}) {
  if (!products.length) return <p className={styles.empty}>No sales data yet</p>
  return (
    <div className={styles.productScroll}>
      <ul className={styles.productList}>
        {products.map((p, i) => (
          <li key={p.id}>
            <button type="button" className={styles.productRow} onClick={() => onProductClick?.(p)}>
              <span className={styles.productRank}>{i + 1}</span>
              <Image src={p.image} alt="" width={36} height={36} className={styles.productImg} unoptimized />
              <div className={styles.productInfo}>
                <p className={styles.productName}>{p.name}</p>
                <p className={styles.productMeta}>{p.sold} sold</p>
              </div>
              <span className={styles.productRevenue}>{formatPrice(p.revenue)}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function DashboardCategoryBars({
  categories,
  onCategoryClick,
}: {
  categories: DashboardStats['categorySales']
  onCategoryClick?: (category: DashboardStats['categorySales'][number]) => void
}) {
  const max = Math.max(...categories.map((c) => c.sales), 1)
  if (!categories.length) return <p className={styles.empty}>No category data</p>
  return (
    <div className={styles.categoryScroll}>
      {categories.map((c) => (
        <button
          key={c.category}
          type="button"
          className={styles.categoryRow}
          onClick={() => onCategoryClick?.(c)}
        >
          <span className={styles.categoryLabel}>{c.category}</span>
          <div className={styles.categoryTrack}>
            <div className={styles.categoryFill} style={{ width: `${(c.sales / max) * 100}%` }} />
          </div>
          <span className={styles.categoryValue}>{formatPrice(c.sales)}</span>
        </button>
      ))}
    </div>
  )
}

export function DashboardCustomerTrend({
  trend,
  onDayClick,
}: {
  trend: DashboardStats['customerTrend']
  onDayClick?: (day: DashboardStats['customerTrend'][number]) => void
}) {
  const max = Math.max(...trend.flatMap((d) => [d.newCustomers, d.returning]), 1)
  return (
    <div className={styles.trendChart}>
      {trend.map((d) => (
        <button key={d.day} type="button" className={styles.trendCol} onClick={() => onDayClick?.(d)}>
          <div className={styles.trendBars}>
            <div
              className={styles.trendBarNew}
              style={{ height: `${Math.max(4, (d.newCustomers / max) * 100)}%` }}
            />
            <div
              className={styles.trendBarReturn}
              style={{ height: `${Math.max(4, (d.returning / max) * 100)}%` }}
            />
          </div>
          <span className={styles.trendLabel}>{d.day}</span>
        </button>
      ))}
      <div className={styles.trendLegend}>
        <span><i className={styles.dotNew} /> New</span>
        <span><i className={styles.dotReturn} /> Returning</span>
      </div>
    </div>
  )
}

export function DashboardRecentOrders({
  orders,
  onOrderClick,
}: {
  orders: DashboardStats['recentOrders']
  onOrderClick?: (order: DashboardStats['recentOrders'][number]) => void
}) {
  if (!orders.length) return <p className={styles.empty}>No orders yet</p>
  const statusClass = (status: string) => {
    const s = status.toLowerCase()
    if (s === 'delivered') return styles.statusDelivered
    if (s === 'shipped') return styles.statusShipped
    if (s === 'cancelled') return styles.statusCancelled
    return styles.statusProcessing
  }
  return (
    <div className={styles.ordersTableWrap}>
      <table className={styles.ordersTable}>
        <thead>
          <tr>
            <th>Order</th>
            <th>Customer</th>
            <th>Amount</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className={styles.clickableTr} onClick={() => onOrderClick?.(o)}>
              <td>#{o.id.slice(0, 8)}</td>
              <td>{o.customer}</td>
              <td>{formatPrice(o.amount)}</td>
              <td>
                <span className={statusClass(o.status)}>{o.status}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
