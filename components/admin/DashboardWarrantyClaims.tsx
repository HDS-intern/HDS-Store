'use client'

import { useMemo } from 'react'
import { RefreshCw } from 'lucide-react'
import type { WarrantyClaim } from '@/lib/types'
import styles from './AdminDashboard.module.css'

type MonthBucket = {
  label: string
  count: number
}

function buildMonthlyBuckets(claims: WarrantyClaim[]): MonthBucket[] {
  const now = new Date()
  const buckets: MonthBucket[] = []

  for (let i = 5; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    buckets.push({
      label: date.toLocaleString('en-IN', { month: 'short' }),
      count: 0,
    })
  }

  claims.forEach((claim) => {
    const created = new Date(claim.createdAt)
    if (Number.isNaN(created.getTime())) return

    const monthIndex =
      (created.getFullYear() - now.getFullYear()) * 12 + (created.getMonth() - now.getMonth())
    if (monthIndex >= -5 && monthIndex <= 0) {
      buckets[monthIndex + 5].count += 1
    }
  })

  return buckets
}

function formatContactName(name: string) {
  return name.replace(/\s+customer$/i, '').trim() || name
}

type DashboardWarrantyClaimsProps = {
  claims: WarrantyClaim[]
  loading: boolean
  onRefresh: () => void
  onClaimClick: (claim: WarrantyClaim) => void
  onViewAll: () => void
}

export function DashboardWarrantyClaims({
  claims,
  loading,
  onRefresh,
  onClaimClick,
  onViewAll,
}: DashboardWarrantyClaimsProps) {
  const monthly = useMemo(() => buildMonthlyBuckets(claims), [claims])
  const maxCount = Math.max(...monthly.map((m) => m.count), 1)
  const totalClaims = claims.length

  return (
    <div className={styles.warrantyPanel}>
      <div className={styles.warrantyHeader}>
        <p className={styles.panelTitle}>Warranty Claims</p>
        <button
          type="button"
          className={styles.refreshBtn}
          onClick={onRefresh}
          aria-label="Refresh warranty claims"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? styles.spinning : ''}`} />
        </button>
      </div>

      <div className={styles.warrantyChartWrap}>
        {loading && claims.length === 0 ? (
          <p className={styles.warrantyChartEmpty}>Loading chart...</p>
        ) : (
          <>
            <div className={styles.warrantyChartMeta}>
              <span className={styles.warrantyChartTotal}>{totalClaims}</span>
              <span className={styles.warrantyChartSub}>Total claims</span>
            </div>
            <div className={styles.warrantyChart} role="img" aria-label="Warranty claims by month">
              {monthly.map((bucket) => (
                <div key={bucket.label} className={styles.warrantyChartCol}>
                  <span className={styles.warrantyChartValue}>
                    {bucket.count > 0 ? bucket.count : ''}
                  </span>
                  <div
                    className={styles.warrantyChartBar}
                    style={{ height: `${Math.max(8, (bucket.count / maxCount) * 100)}%` }}
                  />
                  <span className={styles.warrantyChartLabel}>{bucket.label}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {loading && claims.length === 0 ? (
        <p className={styles.emptyText}>Loading...</p>
      ) : claims.length === 0 ? (
        <button type="button" className={styles.warrantyEmptyBtn} onClick={onViewAll}>
          No warranty claims yet — click for details
        </button>
      ) : (
        <div className={styles.warrantyCompactList}>
          {claims.slice(0, 3).map((claim) => (
            <button
              key={claim.id}
              type="button"
              className={styles.warrantyCompactItem}
              onClick={() => onClaimClick(claim)}
            >
              <p className={styles.claimCustomer}>{formatContactName(claim.customerName)}</p>
              <p className={styles.claimMeta}>{claim.productName}</p>
            </button>
          ))}
          {claims.length > 3 && (
            <button type="button" className={styles.viewAllBtn} onClick={onViewAll}>
              View all {claims.length} claims
            </button>
          )}
        </div>
      )}
    </div>
  )
}
