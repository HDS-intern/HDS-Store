'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { X, FileText, Download, Printer, FileSpreadsheet } from 'lucide-react'
import * as XLSX from 'xlsx'
import { apiFetch } from '@/lib/api'
import { formatPrice } from '@/lib/formatPrice'
import type { AdminReportPayload, DateRangePreset, SalesPeriod } from '@/lib/adminReportTypes'
import styles from './AdminReportModal.module.css'

type ReportSection =
  | 'overview'
  | 'date-filter'
  | 'sales-period'
  | 'order-status'
  | 'product-sales'
  | 'category-sales'
  | 'customer-sales'
  | 'payment-methods'
  | 'coupons'
  | 'tax'
  | 'shipping'
  | 'top-products'
  | 'low-products'
  | 'profit'
  | 'comparison'
  | 'order-details'
  | 'charts'

const SECTIONS: { id: ReportSection; label: string }[] = [
  { id: 'overview', label: 'Dashboard Summary' },
  { id: 'date-filter', label: 'Date Range Filter' },
  { id: 'sales-period', label: 'Sales by Period' },
  { id: 'order-status', label: 'Order Status' },
  { id: 'product-sales', label: 'Product Sales' },
  { id: 'category-sales', label: 'Category Sales' },
  { id: 'customer-sales', label: 'Customer Sales' },
  { id: 'payment-methods', label: 'Payment Methods' },
  { id: 'coupons', label: 'Coupons & Discounts' },
  { id: 'tax', label: 'Tax Report' },
  { id: 'shipping', label: 'Shipping Report' },
  { id: 'top-products', label: 'Top Selling' },
  { id: 'low-products', label: 'Low Selling' },
  { id: 'profit', label: 'Profit Report' },
  { id: 'comparison', label: 'Sales Comparison' },
  { id: 'order-details', label: 'Order Details' },
  { id: 'charts', label: 'Charts & Graphs' },
]

const DATE_PRESETS: { id: DateRangePreset; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: 'last7', label: 'Last 7 Days' },
  { id: 'last30', label: 'Last 30 Days' },
  { id: 'thisMonth', label: 'This Month' },
  { id: 'lastMonth', label: 'Last Month' },
  { id: 'thisYear', label: 'This Year' },
  { id: 'custom', label: 'Custom Range' },
]

const PERIODS: { id: SalesPeriod; label: string }[] = [
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'quarterly', label: 'Quarterly' },
  { id: 'yearly', label: 'Yearly' },
]

const ORDER_STATUSES = [
  'all',
  'Pending',
  'Processing',
  'Shipped',
  'Delivered',
  'Cancelled',
  'Returned',
  'Refunded',
]

type AdminReportModalProps = {
  onClose: () => void
}

function MiniBarChart({ data }: { data: { label: string; revenue: number }[] }) {
  const max = Math.max(...data.map((d) => d.revenue), 1)
  return (
    <div className={styles.miniChart}>
      {data.map((d) => (
        <div key={d.label} className={styles.miniBarCol}>
          <div
            className={styles.miniBar}
            style={{ height: `${Math.max(4, (d.revenue / max) * 100)}%` }}
            title={`${d.label}: ${formatPrice(d.revenue)}`}
          />
          <span className={styles.miniBarLabel}>{d.label}</span>
        </div>
      ))}
    </div>
  )
}

function PieList({ data }: { data: { label: string; value: number }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1
  return (
    <ul className={styles.pieList}>
      {data.map((d) => (
        <li key={d.label}>
          <span>{d.label}</span>
          <span>{formatPrice(d.value)} ({Math.round((d.value / total) * 100)}%)</span>
        </li>
      ))}
    </ul>
  )
}

export function AdminReportModal({ onClose }: AdminReportModalProps) {
  const [section, setSection] = useState<ReportSection>('overview')
  const [preset, setPreset] = useState<DateRangePreset>('last30')
  const [period, setPeriod] = useState<SalesPeriod>('monthly')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [orderStatus, setOrderStatus] = useState('all')
  const [search, setSearch] = useState('')
  const [report, setReport] = useState<AdminReportPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const printRef = useRef<HTMLDivElement>(null)

  const loadReport = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const q = new URLSearchParams({
        preset,
        period,
        orderStatus,
      })
      if (preset === 'custom' && customStart) q.set('start', customStart)
      if (preset === 'custom' && customEnd) q.set('end', customEnd)
      const data = await apiFetch<{ report: AdminReportPayload }>(
        `/api/admin/dashboard/reports?${q.toString()}`
      )
      setReport(data.report)
    } catch (e) {
      setReport(null)
      setError(e instanceof Error ? e.message : 'Failed to load report')
    } finally {
      setLoading(false)
    }
  }, [preset, period, orderStatus, customStart, customEnd])

  useEffect(() => {
    void loadReport()
  }, [loadReport])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const exportCsv = (rows: Record<string, string | number>[], filename: string) => {
    if (!rows.length) return
    const headers = Object.keys(rows[0])
    const csv = [
      headers.join(','),
      ...rows.map((row) => headers.map((h) => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(',')),
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportExcel = () => {
    if (!report) return
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet([
        { Metric: 'Total Sales', Value: report.summary.totalSales },
        { Metric: 'Total Orders', Value: report.summary.totalOrders },
        { Metric: 'Total Revenue', Value: report.summary.totalRevenue },
        { Metric: 'Total Customers', Value: report.summary.totalCustomers },
        { Metric: 'Average Order Value', Value: report.summary.averageOrderValue },
        { Metric: 'Products Sold', Value: report.summary.totalProductsSold },
        { Metric: 'Cancelled', Value: report.summary.cancelledOrders },
        { Metric: 'Returned', Value: report.summary.returnedOrders },
        { Metric: 'Pending', Value: report.summary.pendingOrders },
      ]),
      'Summary'
    )
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(report.productSales), 'Products')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(report.orderDetails), 'Orders')
    XLSX.writeFile(wb, `hds-report-${Date.now()}.xlsx`)
  }

  const handlePdf = () => {
    window.print()
  }

  const q = search.trim().toLowerCase()

  const renderContent = () => {
    if (loading) return <p className={styles.muted}>Generating report...</p>
    if (error) return <p className={styles.error}>{error}</p>
    if (!report) return null

    switch (section) {
      case 'overview':
        return (
          <div className={styles.metricGrid}>
            {[
              ['Total Sales', formatPrice(report.summary.totalSales)],
              ['Total Orders', report.summary.totalOrders],
              ['Total Revenue', formatPrice(report.summary.totalRevenue)],
              ['Total Customers', report.summary.totalCustomers],
              ['Avg Order Value', formatPrice(report.summary.averageOrderValue)],
              ['Products Sold', report.summary.totalProductsSold],
              ['Cancelled Orders', report.summary.cancelledOrders],
              ['Returned Orders', report.summary.returnedOrders],
              ['Pending Orders', report.summary.pendingOrders],
            ].map(([label, value]) => (
              <div key={label} className={styles.metricCard}>
                <p className={styles.metricLabel}>{label}</p>
                <p className={styles.metricValue}>{value}</p>
              </div>
            ))}
          </div>
        )
      case 'date-filter':
        return (
          <div className={styles.filterBlock}>
            <p className={styles.muted}>Active range: <strong>{report.dateRange.label}</strong></p>
            <div className={styles.chipRow}>
              {DATE_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={preset === p.id ? styles.chipActive : styles.chip}
                  onClick={() => setPreset(p.id)}
                >
                  {p.label}
                </button>
              ))}
            </div>
            {preset === 'custom' && (
              <div className={styles.customDates}>
                <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className={styles.input} />
                <span>to</span>
                <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className={styles.input} />
              </div>
            )}
            <div className={styles.chipRow}>
              {PERIODS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={period === p.id ? styles.chipActive : styles.chip}
                  onClick={() => setPeriod(p.id)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        )
      case 'sales-period':
        return (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Period</th>
                <th>Sales</th>
                <th>Orders</th>
                <th>Units</th>
              </tr>
            </thead>
            <tbody>
              {report.salesByPeriod.map((r) => (
                <tr key={r.period}>
                  <td>{r.period}</td>
                  <td>{formatPrice(r.sales)}</td>
                  <td>{r.orders}</td>
                  <td>{r.units}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      case 'order-status':
        return (
          <>
            <div className={styles.chipRow}>
              {ORDER_STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={orderStatus === s ? styles.chipActive : styles.chip}
                  onClick={() => setOrderStatus(s)}
                >
                  {s === 'all' ? 'All' : s}
                </button>
              ))}
            </div>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Count</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {report.orderStatusBreakdown.map((r) => (
                  <tr key={r.status}>
                    <td>{r.status}</td>
                    <td>{r.count}</td>
                    <td>{formatPrice(r.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )
      case 'product-sales':
        return (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Qty Sold</th>
                <th>Revenue</th>
                <th>Stock</th>
              </tr>
            </thead>
            <tbody>
              {report.productSales
                .filter((r) => !q || r.productName.toLowerCase().includes(q) || r.sku.toLowerCase().includes(q))
                .map((r) => (
                  <tr key={`${r.sku}-${r.productName}`}>
                    <td>{r.productName}</td>
                    <td>{r.sku}</td>
                    <td>{r.quantitySold}</td>
                    <td>{formatPrice(r.revenue)}</td>
                    <td>{r.stockRemaining}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        )
      case 'category-sales':
        return (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Category</th>
                <th>Sales</th>
                <th>Orders</th>
              </tr>
            </thead>
            <tbody>
              {report.categorySales.map((r) => (
                <tr key={r.category}>
                  <td>{r.category}</td>
                  <td>{formatPrice(r.sales)}</td>
                  <td>{r.orders}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      case 'customer-sales':
        return (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Orders</th>
                <th>Total Purchase</th>
                <th>Last Purchase</th>
              </tr>
            </thead>
            <tbody>
              {report.customerSales
                .filter((r) => !q || r.customerName.toLowerCase().includes(q))
                .map((r) => (
                  <tr key={r.customerName + r.lastPurchaseDate}>
                    <td>{r.customerName}</td>
                    <td>{r.orders}</td>
                    <td>{formatPrice(r.totalPurchase)}</td>
                    <td>{new Date(r.lastPurchaseDate).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        )
      case 'payment-methods':
        return (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Method</th>
                <th>Sales</th>
                <th>Orders</th>
              </tr>
            </thead>
            <tbody>
              {report.paymentMethods.map((r) => (
                <tr key={r.method}>
                  <td>{r.method}</td>
                  <td>{formatPrice(r.sales)}</td>
                  <td>{r.orders}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      case 'coupons':
        return report.coupons.length ? (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Coupon</th>
                <th>Uses</th>
                <th>Discount</th>
                <th>Sales</th>
              </tr>
            </thead>
            <tbody>
              {report.coupons.map((r) => (
                <tr key={r.coupon}>
                  <td>{r.coupon}</td>
                  <td>{r.uses}</td>
                  <td>{formatPrice(r.discountGiven)}</td>
                  <td>{formatPrice(r.salesGenerated)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className={styles.muted}>No coupon data recorded. Discounts from product pricing are included in the profit report.</p>
        )
      case 'tax':
        return (
          <div className={styles.metricGrid}>
            {[
              ['GST Collected', formatPrice(report.tax.gstCollected)],
              ['CGST', formatPrice(report.tax.cgst)],
              ['SGST', formatPrice(report.tax.sgst)],
              ['IGST', formatPrice(report.tax.igst)],
              ['Taxable Amount', formatPrice(report.tax.taxableAmount)],
            ].map(([label, value]) => (
              <div key={label} className={styles.metricCard}>
                <p className={styles.metricLabel}>{label}</p>
                <p className={styles.metricValue}>{value}</p>
              </div>
            ))}
          </div>
        )
      case 'shipping':
        return (
          <div className={styles.metricGrid}>
            {[
              ['Shipping Charges', formatPrice(report.shipping.shippingCharges)],
              ['Provider', report.shipping.provider],
              ['Delivered Orders', report.shipping.deliveredOrders],
              ['Returned Shipments', report.shipping.returnedShipments],
            ].map(([label, value]) => (
              <div key={label} className={styles.metricCard}>
                <p className={styles.metricLabel}>{label}</p>
                <p className={styles.metricValue}>{value}</p>
              </div>
            ))}
          </div>
        )
      case 'top-products':
        return (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Product</th>
                <th>SKU</th>
                <th>Qty</th>
                <th>Revenue</th>
                <th>Orders</th>
              </tr>
            </thead>
            <tbody>
              {report.topProducts.map((r) => (
                <tr key={r.rank}>
                  <td>{r.rank}</td>
                  <td>{r.productName}</td>
                  <td>{r.sku}</td>
                  <td>{r.quantitySold}</td>
                  <td>{formatPrice(r.revenue)}</td>
                  <td>{r.orders}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      case 'low-products':
        return (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Qty Sold</th>
                <th>Revenue</th>
                <th>Stock</th>
              </tr>
            </thead>
            <tbody>
              {report.lowProducts.map((r) => (
                <tr key={r.sku}>
                  <td>{r.productName}</td>
                  <td>{r.sku}</td>
                  <td>{r.quantitySold}</td>
                  <td>{formatPrice(r.revenue)}</td>
                  <td>{r.stock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      case 'profit':
        return (
          <div className={styles.metricGrid}>
            {[
              ['Revenue', formatPrice(report.profit.revenue)],
              ['Product Cost', formatPrice(report.profit.productCost)],
              ['Shipping Cost', formatPrice(report.profit.shippingCost)],
              ['Discounts', formatPrice(report.profit.discounts)],
              ['Taxes', formatPrice(report.profit.taxes)],
              ['Gross Profit', formatPrice(report.profit.grossProfit)],
              ['Net Profit', formatPrice(report.profit.netProfit)],
              ['Profit Margin', `${report.profit.profitMargin.toFixed(1)}%`],
            ].map(([label, value]) => (
              <div key={label} className={styles.metricCard}>
                <p className={styles.metricLabel}>{label}</p>
                <p className={styles.metricValue}>{value}</p>
              </div>
            ))}
          </div>
        )
      case 'comparison':
        return (
          <div className={styles.metricGrid}>
            <div className={styles.metricCard}>
              <p className={styles.metricLabel}>{report.comparison.label}</p>
              <p className={styles.metricValue}>{formatPrice(report.comparison.currentRevenue)}</p>
              <p className={styles.muted}>vs {formatPrice(report.comparison.previousRevenue)}</p>
              <p className={styles.change}>
                Revenue {report.comparison.revenueChangePct >= 0 ? '+' : ''}
                {report.comparison.revenueChangePct.toFixed(1)}%
              </p>
            </div>
            <div className={styles.metricCard}>
              <p className={styles.metricLabel}>Orders</p>
              <p className={styles.metricValue}>{report.comparison.currentOrders}</p>
              <p className={styles.muted}>vs {report.comparison.previousOrders}</p>
              <p className={styles.change}>
                {report.comparison.ordersChangePct >= 0 ? '+' : ''}
                {report.comparison.ordersChangePct.toFixed(1)}%
              </p>
            </div>
          </div>
        )
      case 'order-details':
        return (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Products</th>
                <th>Qty</th>
                <th>Amount</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {report.orderDetails
                .filter(
                  (r) =>
                    !q ||
                    r.orderId.toLowerCase().includes(q) ||
                    r.customer.toLowerCase().includes(q) ||
                    r.products.toLowerCase().includes(q)
                )
                .map((r) => (
                  <tr key={r.orderId}>
                    <td>{r.orderId}</td>
                    <td>{r.customer}</td>
                    <td>{r.products}</td>
                    <td>{r.quantity}</td>
                    <td>{formatPrice(r.totalAmount)}</td>
                    <td>{r.paymentStatus}</td>
                    <td>{r.orderStatus}</td>
                    <td>{new Date(r.orderDate).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        )
      case 'charts':
        return (
          <div className={styles.chartsGrid}>
            <div className={styles.chartCard}>
              <h4>Line — Sales over time</h4>
              <MiniBarChart data={report.chartSeries.salesOverTime} />
            </div>
            <div className={styles.chartCard}>
              <h4>Bar — Monthly sales</h4>
              <MiniBarChart data={report.chartSeries.monthlyBars} />
            </div>
            <div className={styles.chartCard}>
              <h4>Pie — Category sales</h4>
              <PieList data={report.chartSeries.categoryPie} />
            </div>
            <div className={styles.chartCard}>
              <h4>Donut — Payment methods</h4>
              <PieList data={report.chartSeries.paymentDonut} />
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true" onClick={onClose}>
      <div className={styles.popup} onClick={(e) => e.stopPropagation()}>
        <div className={styles.topBar}>
          <div>
            <h2 className={styles.title}>Generate Report</h2>
            <p className={styles.subtitle}>
              {report?.dateRange.label ?? 'Loading...'} · {report ? new Date(report.generatedAt).toLocaleString('en-IN') : ''}
            </p>
          </div>
          <div className={styles.topActions}>
            <button type="button" className={styles.exportBtn} onClick={() => report && exportCsv(report.orderDetails, 'orders.csv')} disabled={!report}>
              <Download className="w-4 h-4" /> CSV
            </button>
            <button type="button" className={styles.exportBtn} onClick={exportExcel} disabled={!report}>
              <FileSpreadsheet className="w-4 h-4" /> Excel
            </button>
            <button type="button" className={styles.exportBtn} onClick={handlePdf} disabled={!report}>
              <FileText className="w-4 h-4" /> PDF
            </button>
            <button type="button" className={styles.exportBtn} onClick={handlePdf} disabled={!report}>
              <Printer className="w-4 h-4" /> Print
            </button>
            <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className={styles.body}>
          <nav className={styles.nav}>
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                type="button"
                className={section === s.id ? styles.navActive : styles.navBtn}
                onClick={() => setSection(s.id)}
              >
                {s.label}
              </button>
            ))}
          </nav>

          <div className={styles.content} ref={printRef}>
            <div className={styles.searchRow}>
              <input
                className={styles.input}
                placeholder="Search order ID, customer, product..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button type="button" className={styles.refreshBtn} onClick={() => void loadReport()}>
                <FileText className="w-4 h-4" />
                Refresh
              </button>
            </div>
            <h3 className={styles.sectionTitle}>{SECTIONS.find((s) => s.id === section)?.label}</h3>
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  )
}
