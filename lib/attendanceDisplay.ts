import type { StaffAttendance } from './types'

type AttendanceTimes = Pick<StaffAttendance, 'status' | 'checkIn' | 'checkOut'>

export function isAttendancePresent(record: AttendanceTimes): boolean {
  return record.status === 'present' && !!record.checkIn
}

export function formatAttendanceTimes(record: AttendanceTimes): string {
  if (record.status === 'leave') return 'Leave'
  if (!isAttendancePresent(record)) return 'Absent'
  if (record.checkOut) return `Login ${record.checkIn} · Logout ${record.checkOut}`
  return `Login ${record.checkIn}`
}

export function formatAttendanceDayMeta(record: AttendanceTimes): string {
  if (record.status === 'leave') return 'leave'
  if (!isAttendancePresent(record)) return 'absent'
  if (record.checkOut) return `Login ${record.checkIn} · Logout ${record.checkOut}`
  return `Login ${record.checkIn}`
}
