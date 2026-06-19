'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { formatAttendanceDayMeta, isAttendancePresent } from '@/lib/attendanceDisplay'
import type { StaffAttendance } from '@/lib/types'
import styles from './StaffAttendanceCalendarModal.module.css'

type StaffAttendanceCalendarModalProps = {
  staffId: string
  employeeName: string
  onClose: () => void
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export function StaffAttendanceCalendarModal({
  staffId,
  employeeName,
  onClose,
}: StaffAttendanceCalendarModalProps) {
  const [viewDate, setViewDate] = useState(() => new Date())
  const [records, setRecords] = useState<StaffAttendance[]>([])
  const [loading, setLoading] = useState(true)

  const loadMonth = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiFetch<{ attendance: StaffAttendance[] }>(
        `/api/admin/attendance?staffId=${encodeURIComponent(staffId)}&month=${monthKey(viewDate)}`
      )
      setRecords(data.attendance)
    } catch {
      setRecords([])
    } finally {
      setLoading(false)
    }
  }, [staffId, viewDate])

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

  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true" aria-labelledby="attendance-title" onClick={onClose}>
      <div className={styles.popup} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div>
            <h2 id="attendance-title" className={styles.title}>
              Attendance History
            </h2>
            <p className={styles.subtitle}>{employeeName}</p>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className={styles.monthNav}>
          <button
            type="button"
            className={styles.navBtn}
            onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
            aria-label="Previous month"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className={styles.monthLabel}>{monthLabel(viewDate)}</span>
          <button
            type="button"
            className={styles.navBtn}
            onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
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

        {loading ? (
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
          </>
        )}
      </div>
    </div>
  )
}
