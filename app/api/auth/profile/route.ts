import { NextResponse } from 'next/server'
import { getUserBySession, getTokenFromRequest } from '@/lib/auth'
import { getDb, dbUserToUser, type DbUser } from '@/lib/db'
import { validateStaffPhotoDataUrl } from '@/lib/staffPhoto'
import type { SavedAddress } from '@/lib/types'

export const runtime = 'nodejs'

function normalizeAddresses(raw: unknown): SavedAddress[] {
  if (!Array.isArray(raw)) return []

  return raw
    .map((item, index) => {
      if (!item || typeof item !== 'object') return null
      const row = item as Partial<SavedAddress>
      const street = String(row.street ?? '').trim()
      const city = String(row.city ?? '').trim()
      const state = String(row.state ?? '').trim()
      const zipCode = String(row.zipCode ?? '').trim()
      const label = String(row.label ?? '').trim() || `Address ${index + 1}`

      if (!street && !city && !state && !zipCode) return null

      return {
        id: String(row.id ?? `addr-${Date.now()}-${index}`),
        label,
        street,
        city,
        state,
        zipCode,
      }
    })
    .filter((item): item is SavedAddress => item !== null)
}

export async function PATCH(request: Request) {
  try {
    const sessionUser = getUserBySession(getTokenFromRequest(request))
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (sessionUser.role !== 'customer') {
      return NextResponse.json({ error: 'Only customer accounts can update profile here' }, { status: 403 })
    }

    const body = await request.json()
    const name = String(body.name ?? '').trim()
    const email = String(body.email ?? '').trim()
    const phone = String(body.phone ?? '').trim()
    const addresses = normalizeAddresses(body.addresses)
    const profilePhoto =
      body.profilePhoto === null || body.profilePhoto === ''
        ? null
        : typeof body.profilePhoto === 'string'
          ? body.profilePhoto
          : undefined

    if (!name) {
      return NextResponse.json({ error: 'Full name is required' }, { status: 400 })
    }
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const db = getDb()
    const existingEmail = db
      .prepare('SELECT id FROM users WHERE email = ? AND id != ?')
      .get(email, sessionUser.id) as { id: string } | undefined

    if (existingEmail) {
      return NextResponse.json({ error: 'Email is already in use' }, { status: 409 })
    }

    if (profilePhoto !== undefined) {
      const photoError = validateStaffPhotoDataUrl(profilePhoto)
      if (photoError) {
        return NextResponse.json({ error: photoError }, { status: 400 })
      }
    }

    if (profilePhoto !== undefined) {
      db.prepare(
        'UPDATE users SET name = ?, email = ?, phone = ?, addresses = ?, profile_photo = ? WHERE id = ?'
      ).run(
        name,
        email,
        phone || null,
        addresses.length > 0 ? JSON.stringify(addresses) : null,
        profilePhoto,
        sessionUser.id
      )
    } else {
      db.prepare('UPDATE users SET name = ?, email = ?, phone = ?, addresses = ? WHERE id = ?').run(
        name,
        email,
        phone || null,
        addresses.length > 0 ? JSON.stringify(addresses) : null,
        sessionUser.id
      )
    }

    const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(sessionUser.id) as DbUser
    return NextResponse.json({ user: dbUserToUser(updated) })
  } catch {
    return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 })
  }
}
