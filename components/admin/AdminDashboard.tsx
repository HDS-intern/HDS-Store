'use client'

import { useCallback, useEffect, useState } from 'react'
import { apiFetch, getStoredToken } from '@/lib/api'
import { formatAttendanceTimes, isAttendancePresent } from '@/lib/attendanceDisplay'
import { formatPrice } from '@/lib/formatPrice'
import type { DashboardStats, WarrantyClaim } from '@/lib/types'
import { ExternalLink, FileText, RefreshCw, TrendingUp, Users, Package, ShoppingBag } from 'lucide-react'
import { SalesLineChart } from './SalesLineChart'
import styles from './AdminDashboard.module.css'

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
}: {
  refreshKey?: number
}) {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [claims, setClaims] = useState<WarrantyClaim[]>([])
  const [claimsLoading, setClaimsLoading] = useState(true)

  useEffect(() => {
    apiFetch<DashboardStats>('/api/admin/dashboard')
      .then(setStats)
      .catch(() => setStats(null))
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

  useEffect(() => {
    const interval = window.setInterval(() => {
      void loadClaims(false)
    }, 10000)

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        void loadClaims(false)
      }
    }

    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onVisible)

    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onVisible)
    }
  }, [loadClaims])

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

  if (!stats) {
    return <p className={styles.emptyText}>Loading dashboard...</p>
  }

  return (
    <div>
      <h1 className={styles.pageHeading}>Operations Dashboard</h1>

      <div className={styles.statGrid}>
        <div className={styles.statCard}>
          <TrendingUp className="w-5 h-5 text-blue-400 mb-2" />
          <p className={styles.statValue}>{formatPrice(stats.totalRevenue)}</p>
          <p className={styles.statLabel}>Total Revenue (paid)</p>
        </div>
        <div className={styles.statCard}>
          <ShoppingBag className="w-5 h-5 text-blue-400 mb-2" />
          <p className={styles.statValue}>{stats.totalOrders}</p>
          <p className={styles.statLabel}>Active Orders</p>
        </div>
        <div className={styles.statCard}>
          <Package className="w-5 h-5 text-blue-400 mb-2" />
          <p className={styles.statValue}>{stats.totalProducts}</p>
          <p className={styles.statLabel}>Products in Stock</p>
        </div>
        <div className={styles.statCard}>
          <Users className="w-5 h-5 text-blue-400 mb-2" />
          <p className={styles.statValue}>
            {stats.presentToday}/{stats.liveStaff}
          </p>
          <p className={styles.statLabel}>Staff Present Today</p>
        </div>
      </div>

      <div className={styles.dashboardGrid}>
        <div className={styles.panel}>
          <p className={styles.panelTitle}>Overall Sales</p>
          <SalesLineChart data={stats.salesChart} />
        </div>

        <div className={styles.panel}>
          <p className={styles.panelTitle}>Today&apos;s Staff Attendance</p>
          {stats.attendanceToday.length === 0 ? (
            <p className={styles.emptyText}>No attendance marked today</p>
          ) : (
            stats.attendanceToday.map((att) => (
              <div key={att.id} className={styles.attRow}>
                <div>
                  <p className={styles.attName}>{att.employeeName}</p>
                  <p className={styles.attMeta}>{formatAttendanceTimes(att)}</p>
                </div>
                <span
                  className={
                    isAttendancePresent(att) ? styles.badgePresent : styles.badgeAbsent
                  }
                >
                  {isAttendancePresent(att) ? 'present' : att.status === 'leave' ? 'leave' : 'absent'}
                </span>
              </div>
            ))
          )}
          <div className="mt-4 pt-4 border-t border-slate-700 text-sm text-slate-400">
            Pending orders: <strong className="text-slate-200">{stats.pendingOrders}</strong>
            {' · '}
            Pending payments: <strong className="text-slate-200">{stats.pendingPayments}</strong>
          </div>
        </div>
      </div>

      <div className={`${styles.panel} ${styles.warrantyPanel}`}>
        <div className={styles.warrantyHeader}>
          <p className={styles.panelTitle}>Warranty Claims</p>
          <button
            type="button"
            className={styles.refreshBtn}
            onClick={() => void loadClaims(true)}
            aria-label="Refresh warranty claims"
          >
            <RefreshCw className={`w-4 h-4 ${claimsLoading ? styles.spinning : ''}`} />
          </button>
        </div>

        {claimsLoading && claims.length === 0 ? (
          <p className={styles.emptyText}>Loading warranty claims...</p>
        ) : claims.length === 0 ? (
          <p className={styles.emptyText}>No warranty claims submitted yet</p>
        ) : (
          <div className={styles.warrantyTableWrap}>
            <table className={styles.warrantyTable}>
              <thead>
                <tr>
                  <th>Submitted</th>
                  <th>Customer</th>
                  <th>Order</th>
                  <th>Product</th>
                  <th>Issue / Notes</th>
                  <th>Document</th>
                </tr>
              </thead>
              <tbody>
                {claims.map((claim) => (
                  <tr key={claim.id}>
                    <td>{formatClaimDate(claim.createdAt)}</td>
                    <td>
                      <p className={styles.claimCustomer}>{formatContactName(claim.customerName)}</p>
                      <p className={styles.claimMeta}>{claim.customerEmail}</p>
                    </td>
                    <td>{claim.orderId}</td>
                    <td>{claim.productName}</td>
                    <td>
                      <p className={styles.claimNotes}>{claim.notes}</p>
                    </td>
                    <td>
                      <div className={styles.docActions}>
                        <button
                          type="button"
                          className={styles.docBtn}
                          onClick={() => void openDocument(claim.id, false)}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          View
                        </button>
                        <button
                          type="button"
                          className={styles.docBtnOutline}
                          onClick={() => void openDocument(claim.id, true)}
                        >
                          <FileText className="w-3.5 h-3.5" />
                          {claim.documentName}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
