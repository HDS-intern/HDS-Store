export const MAX_STAFF_PHOTO_BYTES = 2.5 * 1024 * 1024

export function validateStaffPhotoFile(file: File): string | null {
  const ext = file.name.split('.').pop()?.toLowerCase()
  const allowedExt = ext === 'png' || ext === 'jpg' || ext === 'jpeg'
  const allowedType = file.type === 'image/png' || file.type === 'image/jpeg'

  if (!allowedType && !allowedExt) {
    return 'Only PNG and JPG images are allowed.'
  }

  if (file.size > MAX_STAFF_PHOTO_BYTES) {
    return 'Profile photo must be under 2.5 MB.'
  }

  return null
}

export function validateStaffPhotoDataUrl(dataUrl?: string | null): string | null {
  if (!dataUrl) return null

  if (!dataUrl.startsWith('data:image/png') && !dataUrl.startsWith('data:image/jpeg')) {
    return 'Only PNG and JPG images are allowed.'
  }

  const base64 = dataUrl.split(',')[1]
  if (!base64) return 'Invalid image data.'

  const bytes = Math.ceil((base64.length * 3) / 4)
  if (bytes > MAX_STAFF_PHOTO_BYTES) {
    return 'Profile photo must be under 2.5 MB.'
  }

  return null
}
