export const MAX_PRODUCT_GALLERY_BYTES = 2 * 1024 * 1024

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const ALLOWED_EXT = new Set(['jpg', 'jpeg', 'png', 'webp'])

export function validateProductGalleryFile(file: File): string | null {
  const ext = file.name.split('.').pop()?.toLowerCase()
  const typeOk = ALLOWED_TYPES.has(file.type)
  const extOk = ext ? ALLOWED_EXT.has(ext) : false

  if (!typeOk && !extOk) {
    return `${file.name}: only JPG, JPEG, PNG, and WEBP are allowed.`
  }

  if (file.size > MAX_PRODUCT_GALLERY_BYTES) {
    return `${file.name}: file must be 2 MB or smaller.`
  }

  return null
}

export function validateProductGalleryFiles(files: File[]): string | null {
  for (const file of files) {
    const error = validateProductGalleryFile(file)
    if (error) return error
  }
  return null
}
