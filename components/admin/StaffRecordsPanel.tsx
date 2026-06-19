'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { apiFetch } from '@/lib/api'
import { isAttendancePresent } from '@/lib/attendanceDisplay'
import { validateStaffPhotoFile, validateStaffPhotoDataUrl } from '@/lib/staffPhoto'
import type { StaffAttendance, StaffRecord } from '@/lib/types'
import { Lock, Plus } from 'lucide-react'
import { StaffAttendanceCalendarModal } from './StaffAttendanceCalendarModal'
import { StaffProfileModal } from './StaffProfileModal'
import styles from './StaffRecordsPanel.module.css'

const emptyForm = (): Partial<StaffRecord> => ({
  employeeName: '',
  aadhaarNumber: '',
  address: '',
  contactNumber: '',
  alternateContactNumber: '',
  alternateContactPerson: '',
  bankAccountNumber: '',
  bankName: '',
  bankIfsc: '',
  panCard: '',
  passportPhoto: '',
  joiningDate: '',
  workStatus: 'live',
  resignedDate: '',
  resignationLetter: '',
  bloodGroup: '',
  medicalHistory: '',
})

type Props = {
  onMessage: (msg: string) => void
  onError: (msg: string) => void
  onStaffCreated?: () => void
}

export function StaffRecordsPanel({ onMessage, onError, onStaffCreated }: Props) {
  const [staff, setStaff] = useState<StaffRecord[]>([])
  const [attendanceToday, setAttendanceToday] = useState<StaffAttendance[]>([])
  const [form, setForm] = useState<Partial<StaffRecord> | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [calendarStaff, setCalendarStaff] = useState<{ id: string; name: string } | null>(null)
  const [profileStaff, setProfileStaff] = useState<StaffRecord | null>(null)

  const load = useCallback(async () => {
    try {
      const [staffData, attendanceData] = await Promise.all([
        apiFetch<{ staff: StaffRecord[] }>('/api/admin/staff-records'),
        apiFetch<{ attendance: StaffAttendance[] }>('/api/admin/attendance'),
      ])
      setStaff(staffData.staff)
      setAttendanceToday(attendanceData.attendance)
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Failed to load staff records')
    }
  }, [onError])

  const attendanceMap = useMemo(() => {
    const map = new Map<string, StaffAttendance>()
    for (const row of attendanceToday) {
      map.set(row.staffId, row)
    }
    return map
  }, [attendanceToday])

  const getAvailability = (staffId: string, workStatus: StaffRecord['workStatus']) => {
    if (workStatus !== 'live') return { label: '—', className: styles.availabilityNa, clickable: false }
    const record = attendanceMap.get(staffId)
    if (!record || record.status === 'leave') {
      return { label: 'absent', className: styles.availabilityAbsent, clickable: true }
    }
    if (!isAttendancePresent(record)) {
      return { label: 'absent', className: styles.availabilityAbsent, clickable: true }
    }
    return { label: 'present', className: styles.availabilityPresent, clickable: true }
  }

  useEffect(() => {
    load()
  }, [load])

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validationError = validateStaffPhotoFile(file)
    if (validationError) {
      onError(validationError)
      e.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      const dataError = validateStaffPhotoDataUrl(dataUrl)
      if (dataError) {
        onError(dataError)
        return
      }
      setForm((prev) => ({ ...prev, passportPhoto: dataUrl }))
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const save = async () => {
    if (!form?.employeeName?.trim()) {
      onError('Employee name is required')
      return
    }

    const photoError = validateStaffPhotoDataUrl(form.passportPhoto)
    if (photoError) {
      onError(photoError)
      return
    }

    try {
      if (isNew) {
        await apiFetch('/api/admin/staff-records', {
          method: 'POST',
          body: JSON.stringify(form),
        })
        onMessage('Staff record created')
        setForm(null)
        setIsNew(false)
        onStaffCreated?.()
      } else {
        await apiFetch('/api/admin/staff-records', {
          method: 'PUT',
          body: JSON.stringify(form),
        })
        onMessage('Staff record updated')
        setForm(null)
        setIsNew(false)
        await load()
      }
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Save failed')
    }
  }

  const remove = async (id: string) => {
    if (!confirm('Delete this staff record permanently?')) return
    try {
      await apiFetch('/api/admin/staff-records', {
        method: 'DELETE',
        body: JSON.stringify({ id }),
      })
      onMessage('Staff record deleted')
      await load()
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Delete failed')
    }
  }

  const field = (key: keyof StaffRecord, label: string, type = 'text') => (
    <div>
      <label className={styles.label}>{label}</label>
      <input
        type={type}
        className={styles.input}
        value={(form?.[key] as string) || ''}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
      />
    </div>
  )

  return (
    <div>
      <h1 className={styles.pageHeading}>Staff Records (HR)</h1>
      <p className={styles.pageDesc}>
        Confidential employee data — visible to admin login only. Stored securely in database.
      </p>
      <div className={styles.confidential}>
        <Lock className="w-4 h-4" />
        Admin-only confidential data
      </div>

      <div className="flex justify-end mb-4">
        <button
          type="button"
          className={styles.btnPrimary}
          onClick={() => {
            setIsNew(true)
            setForm(emptyForm())
          }}
        >
          <Plus className="w-4 h-4 inline mr-1" />
          Add Staff Record
        </button>
      </div>

      {form && (
        <div className={styles.formPanel}>
          <h3 className={styles.formTitle}>{isNew ? 'New Staff Record' : 'Edit Staff Record'}</h3>

          <div className={styles.formSection}>
            <p className={styles.sectionLabel}>Personal Information</p>
            <div className={styles.formGrid}>
              {field('employeeName', 'Employee Name *')}
              {field('aadhaarNumber', 'Aadhaar Number')}
              {field('bloodGroup', 'Blood Group')}
              {field('joiningDate', 'Joining Date', 'date')}
              <div className="sm:col-span-2">
                {field('address', 'Address')}
              </div>
              <div>
                <label className={styles.label}>Profile Photo</label>
                <input
                  type="file"
                  accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                  onChange={handlePhoto}
                  className={styles.input}
                />
                <p className={styles.fieldHint}>PNG or JPG only. Maximum size 2.5 MB.</p>
                {form.passportPhoto && (
                  <img
                    src={form.passportPhoto}
                    alt="Staff profile"
                    className={`${styles.photoPreview} mt-2`}
                  />
                )}
              </div>
            </div>
          </div>

          <div className={styles.formSection}>
            <p className={styles.sectionLabel}>Contact Details</p>
            <div className={styles.formGrid}>
              {field('contactNumber', 'Contact Number')}
              {field('alternateContactNumber', 'Alternate Contact Number')}
              <div className="sm:col-span-2">
                {field('alternateContactPerson', 'Alternate Contact Person')}
              </div>
            </div>
          </div>

          <div className={styles.formSection}>
            <p className={styles.sectionLabel}>Bank & Identity</p>
            <div className={styles.formGrid}>
              {field('bankAccountNumber', 'Bank Account Number')}
              {field('bankName', 'Bank Name')}
              {field('bankIfsc', 'IFSC Code')}
              {field('panCard', 'PAN Card')}
            </div>
          </div>

          <div className={styles.formSection}>
            <p className={styles.sectionLabel}>Employment Status</p>
            <div className={styles.formGrid}>
              <div>
                <label className={styles.label}>Work Status</label>
                <select
                  className={styles.select}
                  value={form.workStatus || 'live'}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      workStatus: e.target.value as 'live' | 'resigned',
                    })
                  }
                >
                  <option value="live">Live (Active)</option>
                  <option value="resigned">Resigned</option>
                </select>
              </div>
              {form.workStatus === 'resigned' && (
                <>
                  {field('resignedDate', 'Resignation Date', 'date')}
                  <div className="sm:col-span-2">
                    <label className={styles.label}>Resignation Letter</label>
                    <textarea
                      className={styles.textarea}
                      value={form.resignationLetter || ''}
                      onChange={(e) =>
                        setForm({ ...form, resignationLetter: e.target.value })
                      }
                      placeholder="Resignation letter details or reference..."
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          <div className={styles.formSection}>
            <p className={styles.sectionLabel}>Medical History</p>
            <div className={styles.formGrid}>
              <div className="sm:col-span-2">
                <label className={styles.label}>Medical History</label>
                <textarea
                  className={styles.textarea}
                  value={form.medicalHistory || ''}
                  onChange={(e) => setForm({ ...form, medicalHistory: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className={styles.btnRow}>
            <button type="button" className={styles.btnPrimary} onClick={save}>
              Save Record
            </button>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={() => {
                setForm(null)
                setIsNew(false)
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Contact</th>
              <th>Joining</th>
              <th>Status</th>
              <th>Blood</th>
              <th>Availability</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((s) => {
              const availability = getAvailability(s.id, s.workStatus)
              return (
              <tr key={s.id}>
                <td>
                  <button
                    type="button"
                    className={styles.nameBtn}
                    onClick={() => setProfileStaff(s)}
                    title="View staff profile"
                  >
                    {s.employeeName}
                  </button>
                </td>
                <td>{s.contactNumber}</td>
                <td>{s.joiningDate || '—'}</td>
                <td>
                  <span className={s.workStatus === 'live' ? styles.badgeLive : styles.badgeResigned}>
                    {s.workStatus}
                  </span>
                </td>
                <td>{s.bloodGroup || '—'}</td>
                <td>
                  {availability.clickable ? (
                    <button
                      type="button"
                      className={`${styles.availabilityBtn} ${availability.className}`}
                      onClick={() => setCalendarStaff({ id: s.id, name: s.employeeName })}
                      title="View attendance history"
                    >
                      {availability.label}
                    </button>
                  ) : (
                    <span className={availability.className}>{availability.label}</span>
                  )}
                </td>
                <td>
                  <button
                    type="button"
                    className={styles.editBtn}
                    onClick={() => {
                      setIsNew(false)
                      setForm({ ...s })
                    }}
                  >
                    Edit
                  </button>
                  <button type="button" className={`${styles.btnDanger} ml-2`} onClick={() => remove(s.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            )})}
            {staff.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  No staff records yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {profileStaff && (
        <StaffProfileModal staff={profileStaff} onClose={() => setProfileStaff(null)} />
      )}

      {calendarStaff && (
        <StaffAttendanceCalendarModal
          staffId={calendarStaff.id}
          employeeName={calendarStaff.name}
          onClose={() => setCalendarStaff(null)}
        />
      )}
    </div>
  )
}
