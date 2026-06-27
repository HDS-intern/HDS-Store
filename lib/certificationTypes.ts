import { getDb } from './db'

export type CertificationTypeRecord = {
  id: string
  type: string
  logoUrl: string
  createdAt: string
}

const SETTING_KEY = 'certification_types'

export function getCertificationTypes(): CertificationTypeRecord[] {
  const db = getDb()
  const row = db.prepare('SELECT data FROM site_settings WHERE key = ?').get(SETTING_KEY) as
    | { data: string }
    | undefined

  if (!row) return []

  try {
    const parsed = JSON.parse(row.data) as CertificationTypeRecord[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveCertificationTypes(types: CertificationTypeRecord[]): void {
  const db = getDb()
  const now = new Date().toISOString()
  db.prepare(
    `INSERT INTO site_settings (key, data, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`
  ).run(SETTING_KEY, JSON.stringify(types), now)
}

export function addCertificationType(input: { type: string; logoUrl: string }): CertificationTypeRecord {
  const types = getCertificationTypes()
  const typeName = input.type.trim()
  if (types.some((item) => item.type.toLowerCase() === typeName.toLowerCase())) {
    throw new Error('Certification type already exists')
  }
  const entry: CertificationTypeRecord = {
    id: `ctype-${Date.now()}`,
    type: typeName,
    logoUrl: input.logoUrl.trim(),
    createdAt: new Date().toISOString(),
  }
  saveCertificationTypes([entry, ...types])
  return entry
}

export function updateCertificationType(
  id: string,
  input: { type: string; logoUrl: string }
): CertificationTypeRecord | null {
  const types = getCertificationTypes()
  const index = types.findIndex((item) => item.id === id)
  if (index === -1) return null

  const typeName = input.type.trim()
  const duplicate = types.some(
    (item) => item.id !== id && item.type.toLowerCase() === typeName.toLowerCase()
  )
  if (duplicate) {
    throw new Error('Certification type already exists')
  }

  const updated: CertificationTypeRecord = {
    ...types[index],
    type: typeName,
    logoUrl: input.logoUrl.trim(),
  }
  types[index] = updated
  saveCertificationTypes(types)
  return updated
}

export function deleteCertificationType(id: string): boolean {
  const types = getCertificationTypes()
  const next = types.filter((item) => item.id !== id)
  if (next.length === types.length) return false
  saveCertificationTypes(next)
  return true
}
