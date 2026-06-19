import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { getDb } from '@/lib/db'
import { getUserBySession, getTokenFromRequest, requirePermission } from '@/lib/auth'
import { validateStaffPhotoDataUrl } from '@/lib/staffPhoto'
import type { StaffRecord } from '@/lib/types'

export const runtime = 'nodejs'

function rowToStaff(row: Record<string, unknown>): StaffRecord {
  return {
    id: row.id as string,
    userId: (row.user_id as string) || undefined,
    employeeName: row.employee_name as string,
    aadhaarNumber: (row.aadhaar_number as string) || '',
    address: (row.address as string) || '',
    contactNumber: (row.contact_number as string) || '',
    alternateContactNumber: (row.alternate_contact_number as string) || '',
    alternateContactPerson: (row.alternate_contact_person as string) || '',
    bankAccountNumber: (row.bank_account_number as string) || '',
    bankName: (row.bank_name as string) || '',
    bankIfsc: (row.bank_ifsc as string) || '',
    panCard: (row.pan_card as string) || '',
    passportPhoto: (row.passport_photo as string) || '',
    joiningDate: (row.joining_date as string) || '',
    workStatus: (row.work_status as 'live' | 'resigned') || 'live',
    resignedDate: (row.resigned_date as string) || undefined,
    resignationLetter: (row.resignation_letter as string) || undefined,
    bloodGroup: (row.blood_group as string) || '',
    medicalHistory: (row.medical_history as string) || '',
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

export async function GET(request: Request) {
  try {
    requirePermission(getUserBySession(getTokenFromRequest(request)), 'staff_records')
    const db = getDb()
    const rows = db.prepare('SELECT * FROM staff_records ORDER BY created_at DESC').all()
    return NextResponse.json({ staff: rows.map((r) => rowToStaff(r as Record<string, unknown>)) })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed'
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 500 })
  }
}

export async function POST(request: Request) {
  try {
    requirePermission(getUserBySession(getTokenFromRequest(request)), 'staff_records')
    const body = await request.json()
    const photoError = validateStaffPhotoDataUrl(body.passportPhoto)
    if (photoError) {
      return NextResponse.json({ error: photoError }, { status: 400 })
    }

    const id = randomUUID()
    const now = new Date().toISOString()

    const db = getDb()
    db.prepare(
      `INSERT INTO staff_records (
        id, user_id, employee_name, aadhaar_number, address, contact_number,
        alternate_contact_number, alternate_contact_person, bank_account_number, bank_name,
        bank_ifsc, pan_card, passport_photo, joining_date, work_status, resigned_date,
        resignation_letter, blood_group, medical_history, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      body.userId || null,
      body.employeeName,
      body.aadhaarNumber || '',
      body.address || '',
      body.contactNumber || '',
      body.alternateContactNumber || '',
      body.alternateContactPerson || '',
      body.bankAccountNumber || '',
      body.bankName || '',
      body.bankIfsc || '',
      body.panCard || '',
      body.passportPhoto || '',
      body.joiningDate || '',
      body.workStatus || 'live',
      body.resignedDate || null,
      body.resignationLetter || null,
      body.bloodGroup || '',
      body.medicalHistory || '',
      now,
      now
    )

    const row = db.prepare('SELECT * FROM staff_records WHERE id = ?').get(id)
    return NextResponse.json({ staff: rowToStaff(row as Record<string, unknown>) })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed'
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 500 })
  }
}

export async function PUT(request: Request) {
  try {
    requirePermission(getUserBySession(getTokenFromRequest(request)), 'staff_records')
    const body = await request.json()
    if (!body.id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    const photoError = validateStaffPhotoDataUrl(body.passportPhoto)
    if (photoError) {
      return NextResponse.json({ error: photoError }, { status: 400 })
    }

    const now = new Date().toISOString()
    const db = getDb()
    db.prepare(
      `UPDATE staff_records SET
        user_id = ?, employee_name = ?, aadhaar_number = ?, address = ?, contact_number = ?,
        alternate_contact_number = ?, alternate_contact_person = ?, bank_account_number = ?,
        bank_name = ?, bank_ifsc = ?, pan_card = ?, passport_photo = ?, joining_date = ?,
        work_status = ?, resigned_date = ?, resignation_letter = ?, blood_group = ?,
        medical_history = ?, updated_at = ?
      WHERE id = ?`
    ).run(
      body.userId || null,
      body.employeeName,
      body.aadhaarNumber || '',
      body.address || '',
      body.contactNumber || '',
      body.alternateContactNumber || '',
      body.alternateContactPerson || '',
      body.bankAccountNumber || '',
      body.bankName || '',
      body.bankIfsc || '',
      body.panCard || '',
      body.passportPhoto || '',
      body.joiningDate || '',
      body.workStatus || 'live',
      body.resignedDate || null,
      body.resignationLetter || null,
      body.bloodGroup || '',
      body.medicalHistory || '',
      now,
      body.id
    )

    const row = db.prepare('SELECT * FROM staff_records WHERE id = ?').get(body.id)
    return NextResponse.json({ staff: rowToStaff(row as Record<string, unknown>) })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed'
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    requirePermission(getUserBySession(getTokenFromRequest(request)), 'staff_records')
    const { id } = await request.json()
    const db = getDb()
    db.prepare('DELETE FROM staff_records WHERE id = ?').run(id)
    return NextResponse.json({ success: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed'
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 500 })
  }
}
