'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, User, X } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { formatAttendanceDayMeta, formatAttendanceTimes, isAttendancePresent } from '@/lib/attendanceDisplay'
import type { StaffAttendance, StaffRecord } from '@/lib/types'
import styles from './StaffProfileModal.module.css'

type StaffProfileModalProps = {
  staff: StaffRecord
  onClose: () => void
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function formatDate(value?: string) {
  if (!value) return '—'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className={styles.detailItem}>
      <span className={styles.detailLabel}>{label}</span>
      <span className={styles.detailValue}>{value?.trim() ? value : '—'}</span>
    </div>
  )
}

export function StaffProfileModal({ staff, onClose }: StaffProfileModalProps) {
  const [viewDate, setViewDate] = useState(() => new Date())
  const [records, setRecords] = useState<StaffAttendance[]>([])
  const [loadingAttendance, setLoadingAttendance] = useState(true)

  const loadMonth = useCallback(async () => {
    setLoadingAttendance(true)
    try {
      const data = await apiFetch<{ attendance: StaffAttendance[] }>(
        `/api/admin/attendance?staffId=${encodeURIComponent(staff.id)}&month=${monthKey(viewDate)}`
      )
      setRecords(data.attendance)
    } catch {
      setRecords([])
    } finally {
      setLoadingAttendance(false)
    }
  }, [staff.id, viewDate])

  useEffect(() => {
    loadMonth()
  }, [loadMonth])

  const recordMap = useMemo(() => {
    const map = new Map<string, StaffAttendance>()
    for (const row of records) {
      map.set(row.date, row)
    }
    return map
  }, [records])

  const calendarCells = useMemo(() => {
    const year = viewDate.getFullYear()
    const month = viewDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const startOffset = firstDay.getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    const cells: { date: string | null; day: number | null }[] = []
    for (let i = 0; i < startOffset; i++) {
      cells.push({ date: null, day: null })
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      cells.push({ date, day })
    }
    return cells
  }, [viewDate])

  const summary = useMemo(() => {
    let present = 0
    let absent = 0
    let leave = 0
    for (const row of records) {
      if (isAttendancePresent(row)) present++
      else if (row.status === 'leave') leave++
      else absent++
    }
    return { present, absent, leave }
  }, [records])

  const endDateLabel =
    staff.workStatus === 'resigned'
      ? formatDate(staff.resignedDate)
      : 'Present (Active)'

  return (
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="staff-profile-title"
      onClick={onClose}
    >
      <div className={styles.popup} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 id="staff-profile-title" className={styles.title}>
            Staff Profile
          </h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className={styles.hero}>
          <div className={styles.photoWrap}>
            {staff.passportPhoto ? (
              <img src={staff.passportPhoto} alt={staff.employeeName} className={styles.photo} />
            ) : (
              <div className={styles.photoPlaceholder}>
                <User className="w-10 h-10" />
              </div>
            )}
          </div>
          <div className={styles.heroInfo}>
            <h3 className={styles.employeeName}>{staff.employeeName}</h3>
            <span
              className={
                staff.workStatus === 'live' ? styles.badgeLive : styles.badgeResigned
              }
            >
              {staff.workStatus}
            </span>
            <p className={styles.employmentDates}>
              {formatDate(staff.joiningDate)} — {endDateLabel}
            </p>
          </div>
        </div>

        <div className={styles.body}>
          <section className={styles.section}>
            <h4 className={styles.sectionTitle}>Basic Information</h4>
            <div className={styles.detailGrid}>
              <Detail label="Contact Number" value={staff.contactNumber} />
              <Detail label="Alternate Contact" value={staff.alternateContactNumber} />
              <Detail label="Alternate Person" value={staff.alternateContactPerson} />
              <Detail label="Blood Group" value={staff.bloodGroup} />
              <Detail label="Address" value={staff.address} />
              <Detail label="Medical History" value={staff.medicalHistory} />
            </div>
          </section>

          <section className={styles.section}>
            <h4 className={styles.sectionTitle}>Identity & Employment</h4>
            <div className={styles.detailGrid}>
              <Detail label="Aadhaar Number" value={staff.aadhaarNumber} />
              <Detail label="PAN Card" value={staff.panCard} />
              <Detail label="Joining Date" value={formatDate(staff.joiningDate)} />
              <Detail label="End Date" value={endDateLabel} />
              {staff.workStatus === 'resigned' && (
                <Detail label="Resignation Letter" value={staff.resignationLetter} />
              )}
            </div>
          </section>

          <section className={styles.section}>
            <h4 className={styles.sectionTitle}>Bank Details</h4>
            <div className={styles.detailGrid}>
              <Detail label="Bank Name" value={staff.bankName} />
              <Detail label="Account Number" value={staff.bankAccountNumber} />
              <Detail label="IFSC Code" value={staff.bankIfsc} />
            </div>
          </section>

          <section className={styles.section}>
            <h4 className={styles.sectionTitle}>Attendance History</h4>

            <div className={styles.monthNav}>
              <button
                type="button"
                className={styles.navBtn}
                onClick={() =>
                  setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))
                }
                aria-label="Previous month"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className={styles.monthLabel}>{monthLabel(viewDate)}</span>
              <button
                type="button"
                className={styles.navBtn}
                onClick={() =>
                  setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))
                }
                aria-label="Next month"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className={styles.legend}>
              <span className={styles.legendPresent}>Present</span>
              <span className={styles.legendAbsent}>Absent</span>
              <span className={styles.legendLeave}>Leave</span>
              <span className={styles.legendNone}>No record</span>
            </div>

            {loadingAttendance ? (
              <p className={styles.loading}>Loading attendance...</p>
            ) : (
              <>
                <div className={styles.weekdays}>
                  {WEEKDAYS.map((day) => (
                    <span key={day}>{day}</span>
                  ))}
                </div>
                <div className={styles.calendar}>
                  {calendarCells.map((cell, idx) => {
                    if (!cell.date || cell.day == null) {
                      return <div key={`empty-${idx}`} className={styles.dayEmpty} />
                    }

                    const record = recordMap.get(cell.date)
                    const statusClass = record
                      ? isAttendancePresent(record)
                        ? styles.dayPresent
                        : record.status === 'leave'
                          ? styles.dayLeave
                          : styles.dayAbsent
                      : styles.dayNone

                    return (
                      <div key={cell.date} className={`${styles.dayCell} ${statusClass}`}>
                        <span className={styles.dayNumber}>{cell.day}</span>
                        {record && (
                          <span className={styles.dayMeta}>{formatAttendanceDayMeta(record)}</span>
                        )}
                      </div>
                    )
                  })}
                </div>

                <div className={styles.summary}>
                  <span>Present: {summary.present}</span>
                  <span>Absent: {summary.absent}</span>
                  <span>Leave: {summary.leave}</span>
                </div>

                {records.length > 0 && (
                  <div className={styles.historyList}>
                    <p className={styles.historyTitle}>Records this month</p>
                    <ul className={styles.historyItems}>
                      {[...records]
                        .sort((a, b) => b.date.localeCompare(a.date))
                        .map((row) => (
                          <li key={row.id} className={styles.historyRow}>
                            <span>{formatDate(row.date)}</span>
                            <span className={styles.historyStatus}>
                              {isAttendancePresent(row) ? 'present' : row.status}
                            </span>
                            <span className={styles.historyTimes}>{formatAttendanceTimes(row)}</span>
                          </li>
                        ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
