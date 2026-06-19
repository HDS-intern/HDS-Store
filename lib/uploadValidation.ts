export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024

export const ALLOWED_UPLOAD_EXTENSIONS = new Set([
  '.pdf',
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.doc',
  '.docx',
  '.txt',
])

export function fileExtension(name: string): string {
  return name.includes('.') ? `.${name.split('.').pop()?.toLowerCase()}` : ''
}

export function validateUploadFile(file: File): string | null {
  if (file.size > MAX_UPLOAD_BYTES) {
    return 'Document must be 8 MB or smaller'
  }
  const ext = fileExtension(file.name)
  if (!ALLOWED_UPLOAD_EXTENSIONS.has(ext)) {
    return 'Allowed formats: PDF, JPG, PNG, WEBP, DOC, DOCX, TXT'
  }
  return null
}
