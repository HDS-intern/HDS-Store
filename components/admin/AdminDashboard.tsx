'use client'

import { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import { apiFetch, getStoredToken } from '@/lib/api'
import { formatAttendanceTimes, isAttendancePresent } from '@/lib/attendanceDisplay'
import { formatPrice } from '@/lib/formatPrice'
import type {
  BadReviewChartMonth,
  DashboardStats,
  ProductReviewScore,
  StaffAttendance,
  WarrantyClaim,
} from '@/lib/types'
import { BarChart3, ExternalLink, FileText, RefreshCw } from 'lucide-react'
import { SalesLineChart } from './SalesLineChart'
import { BadReviewAnalysesPanel } from './BadReviewAnalysesPanel'
import { DashboardWarrantyClaims } from './DashboardWarrantyClaims'
import { AdminReportModal } from './AdminReportModal'
import { DashboardDetailModal, DetailRow } from './DashboardDetailModal'
import {
  DashboardKpiGrid,
  DashboardDonutChart,
  DashboardTopProducts,
  DashboardCategoryBars,
  DashboardCustomerTrend,
  DashboardRecentOrders,
} from './DashboardWidgets'
import styles from './AdminDashboard.module.css'
import { AdminSlideUp } from './AdminSlideUp'
import { wasAdminEntranceStarted } from '@/lib/adminEntrance'

type DetailState =
  | { kind: 'kpi'; label: string }
  | { kind: 'payment'; channel: DashboardStats['paymentChannels'][number] }
  | { kind: 'category'; category: DashboardStats['categorySales'][number] }
  | { kind: 'product'; product: DashboardStats['topProducts'][number] }
  | { kind: 'order'; order: DashboardStats['recentOrders'][number] }
  | { kind: 'customer-day'; day: DashboardStats['customerTrend'][number] }
  | { kind: 'attendance'; record: StaffAttendance }
  | { kind: 'warranty'; claim: WarrantyClaim }
  | { kind: 'warranty-all' }
  | { kind: 'review'; product: ProductReviewScore }
  | { kind: 'review-month'; month: BadReviewChartMonth; mode: string }
  | { kind: 'revenue' }
  | null

function formatClaimDate(value: string) {
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

function formatContactName(name: string) {
  return name.replace(/\s+customer$/i, '').trim() || name
}

export function AdminDashboard({
  refreshKey = 0,
  entranceSession = 0,
  onReadyChange,
}: {
  refreshKey?: number
  entranceSession?: number
  onReadyChange?: (ready: boolean) => void
}) {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [statsError, setStatsError] = useState('')
  const [claims, setClaims] = useState<WarrantyClaim[]>([])
  const [claimsLoading, setClaimsLoading] = useState(true)
  const [reportOpen, setReportOpen] = useState(false)
  const [detail, setDetail] = useState<DetailState>(null)

  useEffect(() => {
    setStatsLoading(true)
    setStatsError('')
    apiFetch<DashboardStats>('/api/admin/dashboard')
      .then(setStats)
      .catch((e) => {
        setStats(null)
        setStatsError(e instanceof Error ? e.message : 'Failed to load dashboard')
      })
      .finally(() => setStatsLoading(false))
  }, [refreshKey])

  const loadClaims = useCallback(async (showLoader = false) => {
    if (showLoader) setClaimsLoading(true)
    try {
      const data = await apiFetch<{ claims: WarrantyClaim[] }>('/api/admin/warranty-claims')
      setClaims(Array.isArray(data.claims) ? data.claims : [])
    } catch {
      setClaims([])
    } finally {
      if (showLoader) setClaimsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadClaims(true)
  }, [loadClaims, refreshKey])

  useLayoutEffect(() => {
    onReadyChange?.(!statsLoading && stats != null)
  }, [statsLoading, stats, onReadyChange])

  const openDocument = async (claimId: string, download = false) => {
    const token = getStoredToken()
    const suffix = download ? '?download=1' : ''
    const res = await fetch(`/api/admin/warranty-claims/${claimId}/document${suffix}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    if (!res.ok) {
      window.alert('Unable to open document')
      return
    }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    if (download) {
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = claims.find((claim) => claim.id === claimId)?.documentName ?? 'document'
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(url)
      return
    }
    window.open(url, '_blank', 'noopener,noreferrer')
    window.setTimeout(() => URL.revokeObjectURL(url), 60000)
  }

  const renderDetailModal = () => {
    if (!detail || !stats) return null

    if (detail.kind === 'kpi') {
      const map: Record<string, { value: string; extra: string }> = {
        'Total Revenue': { value: formatPrice(stats.totalRevenue), extra: `${stats.revenueChangePct.toFixed(1)}% vs last month` },
        'Total Orders': { value: String(stats.totalOrders), extra: `${stats.ordersChangePct.toFixed(1)}% vs last month` },
        'Total Customers': { value: String(stats.totalCustomers), extra: `${stats.customersChangePct.toFixed(1)}% vs last month` },
        'Average Order Value': { value: formatPrice(stats.averageOrderValue), extra: 'Per paid order' },
        'Net Profit': { value: formatPrice(stats.netProfit), extra: 'Estimated at 35% margin' },
      }
      const row = map[detail.label]
      return (
        <DashboardDetailModal title={detail.label} subtitle="KPI breakdown" onClose={() => setDetail(null)}>
          <DetailRow label="Current value" value={row?.value ?? '—'} />
          <DetailRow label="Insight" value={row?.extra ?? '—'} />
          <DetailRow label="Pending orders" value={stats.pendingOrders} />
          <DetailRow label="Pending payments" value={stats.pendingPayments} />
        </DashboardDetailModal>
      )
    }

    if (detail.kind === 'payment') {
      const total = stats.paymentChannels.reduce((s, c) => s + c.value, 0) || 1
      return (
        <DashboardDetailModal title={detail.channel.label} subtitle="Payment channel details" onClose={() => setDetail(null)}>
          <DetailRow label="Total sales" value={formatPrice(detail.channel.value)} />
          <DetailRow label="Orders" value={detail.channel.orders} />
          <DetailRow label="Share of revenue" value={`${((detail.channel.value / total) * 100).toFixed(1)}%`} />
          <DetailRow label="Avg. per order" value={formatPrice(detail.channel.orders ? detail.channel.value / detail.channel.orders : 0)} />
        </DashboardDetailModal>
      )
    }

    if (detail.kind === 'category') {
      return (
        <DashboardDetailModal title={detail.category.category} subtitle="Category sales details" onClose={() => setDetail(null)}>
          <DetailRow label="Total sales" value={formatPrice(detail.category.sales)} />
          <DetailRow label="Orders" value={detail.category.orders} />
          <DetailRow label="Products in category" value={detail.category.productCount} />
        </DashboardDetailModal>
      )
    }

    if (detail.kind === 'product') {
      return (
        <DashboardDetailModal title={detail.product.name} subtitle="Product performance" onClose={() => setDetail(null)}>
          <DetailRow label="Units sold" value={detail.product.sold} />
          <DetailRow label="Revenue" value={formatPrice(detail.product.revenue)} />
          <DetailRow label="Avg. unit price" value={formatPrice(detail.product.sold ? detail.product.revenue / detail.product.sold : 0)} />
        </DashboardDetailModal>
      )
    }

    if (detail.kind === 'order') {
      return (
        <DashboardDetailModal title={`Order #${detail.order.id.slice(0, 8)}`} subtitle="Order details" onClose={() => setDetail(null)}>
          <DetailRow label="Customer" value={detail.order.customer} />
          <DetailRow label="Amount" value={formatPrice(detail.order.amount)} />
          <DetailRow label="Status" value={detail.order.status} />
          <DetailRow label="Date" value={new Date(detail.order.date).toLocaleString('en-IN')} />
        </DashboardDetailModal>
      )
    }

    if (detail.kind === 'customer-day') {
      return (
        <DashboardDetailModal title={detail.day.day} subtitle="Customer activity" onClose={() => setDetail(null)}>
          <DetailRow label="New customers" value={detail.day.newCustomers} />
          <DetailRow label="Returning customers" value={detail.day.returning} />
          <DetailRow label="Total activity" value={detail.day.newCustomers + detail.day.returning} />
        </DashboardDetailModal>
      )
    }

    if (detail.kind === 'attendance') {
      return (
        <DashboardDetailModal title={detail.record.employeeName} subtitle="Staff attendance" onClose={() => setDetail(null)}>
          <DetailRow label="Status" value={detail.record.status} />
          <DetailRow label="Check-in / out" value={formatAttendanceTimes(detail.record)} />
          <DetailRow label="Date" value={detail.record.date} />
        </DashboardDetailModal>
      )
    }

    if (detail.kind === 'warranty') {
      const claim = detail.claim
      return (
        <DashboardDetailModal title="Warranty Claim" subtitle={claim.productName} onClose={() => setDetail(null)}>
          <DetailRow label="Customer" value={formatContactName(claim.customerName)} />
          <DetailRow label="Email" value={claim.customerEmail} />
          <DetailRow label="Order" value={claim.orderId} />
          <DetailRow label="Submitted" value={formatClaimDate(claim.createdAt)} />
          <DetailRow label="Notes" value={claim.notes || '—'} />
          <div className={styles.detailActions}>
            <button type="button" className={styles.docBtn} onClick={() => void openDocument(claim.id, false)}>
              <ExternalLink className="w-3.5 h-3.5" /> View document
            </button>
          </div>
        </DashboardDetailModal>
      )
    }

    if (detail.kind === 'warranty-all') {
      return (
        <DashboardDetailModal title="Warranty Claims" subtitle={`${claims.length} claim(s)`} onClose={() => setDetail(null)}>
          {claims.length === 0 ? (
            <p className={styles.emptyText}>No warranty claims submitted yet</p>
          ) : (
            <div className={styles.detailList}>
              {claims.map((claim) => (
                <button
                  key={claim.id}
                  type="button"
                  className={styles.detailListItem}
                  onClick={() => setDetail({ kind: 'warranty', claim })}
                >
                  <strong>{claim.productName}</strong>
                  <span>{formatContactName(claim.customerName)} · {formatClaimDate(claim.createdAt)}</span>
                </button>
              ))}
            </div>
          )}
        </DashboardDetailModal>
      )
    }

    if (detail.kind === 'review-month') {
      return (
        <DashboardDetailModal title={detail.month.month} subtitle={`${detail.mode} reviews`} onClose={() => setDetail(null)}>
          <DetailRow label="Good reviews" value={detail.month.goodReviews} />
          <DetailRow label="Bad reviews" value={detail.month.badReviews} />
          <DetailRow label="Total reviews" value={detail.month.totalReviews} />
        </DashboardDetailModal>
      )
    }

    if (detail.kind === 'review') {
      return (
        <DashboardDetailModal title={detail.product.productName} subtitle="Review analysis" onClose={() => setDetail(null)}>
          <DetailRow label="Average score" value={`${detail.product.averageScore} / 5`} />
          <DetailRow label="Good reviews" value={detail.product.goodReviews} />
          <DetailRow label="Bad reviews" value={detail.product.badReviews} />
          <DetailRow label="Total reviews" value={detail.product.totalReviews} />
        </DashboardDetailModal>
      )
    }

    if (detail.kind === 'revenue') {
      const totalCredited = stats.salesChart.reduce((s, m) => s + m.credited, 0)
      const totalRefunds = stats.salesChart.reduce((s, m) => s + m.refunds, 0)
      return (
        <DashboardDetailModal title="Revenue Overview" subtitle="Sales chart summary" onClose={() => setDetail(null)}>
          <DetailRow label="Total credited" value={formatPrice(totalCredited)} />
          <DetailRow label="Total refunds" value={formatPrice(totalRefunds)} />
          <DetailRow label="Net (chart period)" value={formatPrice(totalCredited - totalRefunds)} />
          <DetailRow label="Months tracked" value={stats.salesChart.length} />
        </DashboardDetailModal>
      )
    }

    return null
  }

  if (statsLoading) {
    return <p className={styles.emptyText}>Loading dashboard...</p>
  }

  if (!stats) {
    return (
      <div>
        <p className={styles.emptyText}>{statsError || 'Unable to load dashboard data.'}</p>
        <button type="button" className={styles.refreshBtn} onClick={() => window.location.reload()}>
          <RefreshCw className="w-4 h-4 inline mr-1" /> Retry
        </button>
      </div>
    )
  }

  const kpiBase = 80
  const row1Base = 260
  const row2Base = 420
  const row3Base = 580

  const awaitingEntrance = entranceSession === 0 && !wasAdminEntranceStarted()

  return (
    <div className={[styles.dashboardRoot, awaitingEntrance ? styles.awaitingEntrance : ''].filter(Boolean).join(' ')}>
      <div className={styles.dashboardHeader}>
        <AdminSlideUp entranceSession={entranceSession} delayMs={0}>
          <div>
            <h1 className={styles.pageHeading}>Operations Dashboard</h1>
            <p className={styles.pageSubheading}>Overview of your store performance</p>
          </div>
        </AdminSlideUp>
        <AdminSlideUp entranceSession={entranceSession} delayMs={70}>
          <button type="button" className={styles.reportBtn} onClick={() => setReportOpen(true)}>
            <BarChart3 className="w-4 h-4" /> Generate Report
          </button>
        </AdminSlideUp>
      </div>

      <DashboardKpiGrid
        stats={stats}
        onKpiClick={(label) => setDetail({ kind: 'kpi', label })}
        animationBaseDelay={kpiBase}
        entranceSession={entranceSession}
      />

      <div className={styles.chartsRow}>
        <AdminSlideUp entranceSession={entranceSession} delayMs={row1Base} className={styles.chartPanelWrap}>
          <div className={`${styles.panel} ${styles.chartPanel}`}>
            <div className={styles.panelTitleRow}>
              <p className={styles.panelTitle}>Revenue Overview</p>
              <button type="button" className={styles.detailsLink} onClick={() => setDetail({ kind: 'revenue' })}>
                Details
              </button>
            </div>
            <SalesLineChart initialData={stats.salesChart} compact />
          </div>
        </AdminSlideUp>
        <AdminSlideUp entranceSession={entranceSession} delayMs={row1Base + 60} className={styles.chartPanelWrap}>
          <div className={`${styles.panel} ${styles.sidePanel}`}>
            <p className={styles.panelTitle}>Sales by Channel</p>
            <DashboardDonutChart
              channels={stats.paymentChannels}
              onChannelClick={(ch) => setDetail({ kind: 'payment', channel: ch })}
            />
          </div>
        </AdminSlideUp>
        <AdminSlideUp entranceSession={entranceSession} delayMs={row1Base + 120} className={styles.chartPanelWrap}>
          <div className={`${styles.panel} ${styles.sidePanel}`}>
            <p className={styles.panelTitle}>Top Selling Products</p>
            <DashboardTopProducts
              products={stats.topProducts}
              onProductClick={(p) => setDetail({ kind: 'product', product: p })}
            />
          </div>
        </AdminSlideUp>
      </div>

      <div className={styles.chartsRow}>
        <AdminSlideUp entranceSession={entranceSession} delayMs={row2Base} className={styles.chartPanelWrap}>
          <div className={`${styles.panel} ${styles.chartPanel}`}>
            <p className={styles.panelTitle}>Sales by Category</p>
            <DashboardCategoryBars
              categories={stats.categorySales}
              onCategoryClick={(c) => setDetail({ kind: 'category', category: c })}
            />
          </div>
        </AdminSlideUp>
        <AdminSlideUp entranceSession={entranceSession} delayMs={row2Base + 60} className={styles.chartPanelWrap}>
          <div className={`${styles.panel} ${styles.chartPanel}`}>
            <p className={styles.panelTitle}>New vs Returning Customers</p>
            <DashboardCustomerTrend
              trend={stats.customerTrend}
              onDayClick={(d) => setDetail({ kind: 'customer-day', day: d })}
            />
          </div>
        </AdminSlideUp>
        <AdminSlideUp entranceSession={entranceSession} delayMs={row2Base + 120} className={styles.chartPanelWrap}>
          <div className={`${styles.panel} ${styles.sidePanel}`}>
            <p className={styles.panelTitle}>Recent Orders</p>
            <DashboardRecentOrders
              orders={stats.recentOrders}
              onOrderClick={(o) => setDetail({ kind: 'order', order: o })}
            />
          </div>
        </AdminSlideUp>
      </div>

      <div className={styles.chartsRow}>
        <AdminSlideUp entranceSession={entranceSession} delayMs={row3Base} className={styles.chartPanelWrap}>
          <div className={`${styles.panel} ${styles.chartPanel}`}>
            <BadReviewAnalysesPanel
              embedded
              refreshKey={refreshKey}
              onProductClick={(p) => setDetail({ kind: 'review', product: p })}
              onMonthClick={(month, mode) => setDetail({ kind: 'review-month', month, mode })}
            />
          </div>
        </AdminSlideUp>
        <AdminSlideUp entranceSession={entranceSession} delayMs={row3Base + 60} className={styles.chartPanelWrap}>
          <div className={`${styles.panel} ${styles.sidePanel}`}>
            <p className={styles.panelTitle}>Today&apos;s Staff Attendance</p>
            {stats.attendanceToday.length === 0 ? (
              <p className={styles.emptyText}>No attendance marked today</p>
            ) : (
              <div className={styles.attendanceList}>
                {stats.attendanceToday.map((att, index) => (
                  <AdminSlideUp key={att.id} entranceSession={entranceSession} delayMs={row3Base + 100 + index * 45} className={styles.attSlide}>
                    <button
                      type="button"
                      className={styles.attRowBtn}
                      onClick={() => setDetail({ kind: 'attendance', record: att })}
                    >
                      <div>
                        <p className={styles.attName}>{att.employeeName}</p>
                        <p className={styles.attMeta}>{formatAttendanceTimes(att)}</p>
                      </div>
                      <span className={isAttendancePresent(att) ? styles.badgePresent : styles.badgeAbsent}>
                        {isAttendancePresent(att) ? 'present' : att.status === 'leave' ? 'leave' : 'absent'}
                      </span>
                    </button>
                  </AdminSlideUp>
                ))}
              </div>
            )}
            <AdminSlideUp entranceSession={entranceSession} delayMs={row3Base + 160}>
              <div className={styles.pendingMeta}>
                Pending orders: <strong>{stats.pendingOrders}</strong> · Pending payments:{' '}
                <strong>{stats.pendingPayments}</strong>
              </div>
            </AdminSlideUp>
          </div>
        </AdminSlideUp>
        <AdminSlideUp entranceSession={entranceSession} delayMs={row3Base + 120} className={styles.chartPanelWrap}>
          <div className={`${styles.panel} ${styles.sidePanel}`}>
            <DashboardWarrantyClaims
              claims={claims}
              loading={claimsLoading}
              onRefresh={() => void loadClaims(true)}
              onClaimClick={(claim) => setDetail({ kind: 'warranty', claim })}
              onViewAll={() => setDetail({ kind: 'warranty-all' })}
            />
          </div>
        </AdminSlideUp>
      </div>

      {renderDetailModal()}
      {reportOpen && <AdminReportModal onClose={() => setReportOpen(false)} />}
    </div>
  )
}
