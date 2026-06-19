import { randomUUID } from 'crypto'
import { getDb } from './db'

export function formatAttendanceTime(date = new Date()): string {
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

export function todayDateString(): string {
  return new Date().toISOString().slice(0, 10)
}

export function getStaffRecordIdForUser(userId: string): string | null {
  const db = getDb()
  const row = db
    .prepare(
      `SELECT id FROM staff_records
       WHERE user_id = ? AND work_status = 'live'`
    )
    .get(userId) as { id: string } | undefined
  return row?.id ?? null
}

export function recordStaffLogin(userId: string) {
  const staffId = getStaffRecordIdForUser(userId)
  if (!staffId) return

  const db = getDb()
  const date = todayDateString()
  const loginTime = formatAttendanceTime()

  const existing = db
    .prepare('SELECT id, check_in FROM staff_attendance WHERE staff_id = ? AND date = ?')
    .get(staffId, date) as { id: string; check_in: string | null } | undefined

  if (existing) {
    if (!existing.check_in) {
      db.prepare(
        `UPDATE staff_attendance
         SET status = 'present', check_in = ?
         WHERE staff_id = ? AND date = ?`
      ).run(loginTime, staffId, date)
    }
    return
  }

  db.prepare(
    `INSERT INTO staff_attendance (id, staff_id, date, status, check_in, check_out)
     VALUES (?, ?, ?, 'present', ?, NULL)`
  ).run(randomUUID(), staffId, date, loginTime)
}

export function recordStaffLogout(userId: string) {
  const staffId = getStaffRecordIdForUser(userId)
  if (!staffId) return

  const db = getDb()
  const date = todayDateString()
  const logoutTime = formatAttendanceTime()

  db.prepare(
    `UPDATE staff_attendance
     SET check_out = ?
     WHERE staff_id = ? AND date = ? AND check_in IS NOT NULL`
  ).run(logoutTime, staffId, date)
}

export function ensureDailyAbsences(date: string) {
  const today = todayDateString()
  if (date > today) return

  const db = getDb()
  const liveStaff = db
    .prepare("SELECT id FROM staff_records WHERE work_status = 'live'")
    .all() as { id: string }[]

  const insert = db.prepare(
    `INSERT OR IGNORE INTO staff_attendance (id, staff_id, date, status, check_in, check_out)
     VALUES (?, ?, ?, 'absent', NULL, NULL)`
  )

  for (const staff of liveStaff) {
    const existing = db
      .prepare('SELECT id FROM staff_attendance WHERE staff_id = ? AND date = ?')
      .get(staff.id, date)
    if (!existing) {
      insert.run(randomUUID(), staff.id, date)
    }
  }
}

export function ensureMonthAbsences(month: string) {
  const [yearStr, monthStr] = month.split('-')
  const year = Number(yearStr)
  const mon = Number(monthStr)
  if (!year || !mon) return

  const daysInMonth = new Date(year, mon, 0).getDate()
  const today = todayDateString()

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(mon).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    if (dateStr > today) break
    ensureDailyAbsences(dateStr)
  }
}
