import { getDb } from './db'

export type SiteCertification = {
  id: string
  type: string
  logoUrl: string
  imageUrl: string
  productId: string
  productName: string
  createdAt: string
}

const SETTING_KEY = 'site_certifications'

export function getCertifications(): SiteCertification[] {
  const db = getDb()
  const row = db.prepare('SELECT data FROM site_settings WHERE key = ?').get(SETTING_KEY) as
    | { data: string }
    | undefined

  if (!row) return []

  try {
    const parsed = JSON.parse(row.data) as SiteCertification[]
    if (!Array.isArray(parsed)) return []
    return parsed.map((cert) => ({
      ...cert,
      productId: cert.productId ?? '',
      productName: cert.productName ?? '',
    }))
  } catch {
    return []
  }
}

export function saveCertifications(certifications: SiteCertification[]): void {
  const db = getDb()
  const now = new Date().toISOString()
  db.prepare(
    `INSERT INTO site_settings (key, data, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`
  ).run(SETTING_KEY, JSON.stringify(certifications), now)
}

export function addCertification(
  input: Omit<SiteCertification, 'id' | 'createdAt'>
): SiteCertification {
  const certifications = getCertifications()
  const entry: SiteCertification = {
    id: `cert-${Date.now()}`,
    type: input.type.trim(),
    logoUrl: input.logoUrl,
    imageUrl: input.imageUrl,
    productId: input.productId.trim(),
    productName: input.productName.trim(),
    createdAt: new Date().toISOString(),
  }
  saveCertifications([entry, ...certifications])
  return entry
}

export function deleteCertification(id: string): boolean {
  const certifications = getCertifications()
  const next = certifications.filter((c) => c.id !== id)
  if (next.length === certifications.length) return false
  saveCertifications(next)
  return true
}
