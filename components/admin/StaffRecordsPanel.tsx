'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { apiFetch } from '@/lib/api'
import { isAttendancePresent } from '@/lib/attendanceDisplay'
import { validateStaffPhotoFile, validateStaffPhotoDataUrl } from '@/lib/staffPhoto'
import type { StaffAttendance, StaffRecord } from '@/lib/types'
import { ImagePlus, Lock, Plus, X } from 'lucide-react'
import { StaffAttendanceCalendarModal } from './StaffAttendanceCalendarModal'
import { StaffProfileModal } from './StaffProfileModal'
import { AnimatedFormSelect } from './AnimatedFormSelect'
import styles from './StaffRecordsPanel.module.css'

const WORK_STATUS_OPTIONS = [
  { value: 'live', label: 'Live (Active)', hint: 'Currently employed', tone: 'live' as const },
  { value: 'resigned', label: 'Resigned', hint: 'Employment ended', tone: 'resigned' as const },
]

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
  const photoInputRef = useRef<HTMLInputElement>(null)

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

  const closeForm = useCallback(() => {
    setForm(null)
    setIsNew(false)
  }, [])

  useEffect(() => {
    if (!form) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeForm()
    }

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [form, closeForm])

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
        <div
          className={`${styles.backdrop} ${styles.backdropEnter}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="staff-form-title"
          onClick={closeForm}
        >
          <div
            className={`${styles.popup} ${styles.popupEnter}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h2 id="staff-form-title" className={styles.modalTitle}>
                {isNew ? 'New Staff Record' : 'Edit Staff Record'}
              </h2>
              <button type="button" className={styles.closeBtn} onClick={closeForm} aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className={styles.formBody}>
              <div className={styles.formSection}>
                <p className={styles.sectionLabel}>Personal Information</p>
                <div className={styles.personalInfoRow}>
                  <div className={styles.photoUploadSection}>
                    <label className={styles.label}>Profile Photo</label>
                    <button
                      type="button"
                      className={`${styles.photoUploadZone} ${form.passportPhoto ? styles.photoUploadZoneFilled : ''}`}
                      onClick={() => photoInputRef.current?.click()}
                      aria-label="Upload profile photo"
                    >
                      {form.passportPhoto ? (
                        <>
                          <img
                            src={form.passportPhoto}
                            alt="Staff profile preview"
                            className={styles.photoUploadPreview}
                          />
                          <span className={styles.photoUploadOverlay}>
                            <ImagePlus className="w-4 h-4" />
                            Change
                          </span>
                        </>
                      ) : (
                        <span className={styles.photoUploadPlaceholder}>
                          <ImagePlus className="w-5 h-5" />
                          <span className={styles.photoUploadTitle}>Upload</span>
                        </span>
                      )}
                    </button>
                    <p className={styles.photoUploadCaption}>Passport size · PNG or JPG · Max 2.5 MB</p>
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                      onChange={handlePhoto}
                      className={styles.hiddenFileInput}
                      tabIndex={-1}
                    />
                  </div>

                  <div className={styles.personalInfoFields}>
                    <div className={styles.formGrid}>
                      {field('employeeName', 'Employee Name *')}
                      {field('aadhaarNumber', 'Aadhaar Number')}
                      {field('bloodGroup', 'Blood Group')}
                      {field('joiningDate', 'Joining Date', 'date')}
                      <div className={styles.fullWidthField}>
                        {field('address', 'Address')}
                      </div>
                    </div>
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
                <label className={styles.label} htmlFor="work-status-select">
                  Work Status
                </label>
                <AnimatedFormSelect
                  id="work-status-select"
                  value={form.workStatus || 'live'}
                  options={WORK_STATUS_OPTIONS}
                  onChange={(workStatus) =>
                    setForm({
                      ...form,
                      workStatus: workStatus as 'live' | 'resigned',
                    })
                  }
                />
              </div>
              {form.workStatus === 'resigned' && (
                <div className={styles.revealFields}>
                  {field('resignedDate', 'Resignation Date', 'date')}
                  <div className={styles.fullWidthField}>
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
                </div>
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
            <button type="button" className={styles.btnSecondary} onClick={closeForm}>
              Cancel
            </button>
          </div>
            </div>
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
