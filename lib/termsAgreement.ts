import fs from 'fs'
import path from 'path'

const TEMPLATE_DIR = path.join(process.cwd(), 'data', 'templates')
const PUBLIC_DIR = path.join(process.cwd(), 'public', 'templates')
const BASE_NAME = 'terms-agreement'

export const TERMS_AGREEMENT_EXTENSIONS = ['.pdf', '.xlsx', '.csv'] as const
export type TermsAgreementExtension = (typeof TERMS_AGREEMENT_EXTENSIONS)[number]

export type TermsAgreementFile = {
  path: string
  ext: TermsAgreementExtension
  filename: string
}

export function termsAgreementContentType(ext: string): string {
  if (ext === '.pdf') return 'application/pdf'
  if (ext === '.csv') return 'text/csv'
  return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
}

export function resolveTermsAgreementFile(): TermsAgreementFile | null {
  for (const ext of TERMS_AGREEMENT_EXTENSIONS) {
    const custom = path.join(TEMPLATE_DIR, `${BASE_NAME}${ext}`)
    if (fs.existsSync(custom)) {
      return { path: custom, ext, filename: `hds-terms-and-agreement${ext}` }
    }
  }

  const publicCsv = path.join(PUBLIC_DIR, `${BASE_NAME}.csv`)
  if (fs.existsSync(publicCsv)) {
    return { path: publicCsv, ext: '.csv', filename: 'hds-terms-and-agreement.csv' }
  }

  return null
}

export function saveTermsAgreementFile(buffer: Buffer, originalName: string): TermsAgreementExtension {
  const ext = path.extname(originalName).toLowerCase() as TermsAgreementExtension
  if (!TERMS_AGREEMENT_EXTENSIONS.includes(ext)) {
    throw new Error('Only .pdf, .xlsx, and .csv files are allowed')
  }

  fs.mkdirSync(TEMPLATE_DIR, { recursive: true })

  for (const allowed of TERMS_AGREEMENT_EXTENSIONS) {
    const existing = path.join(TEMPLATE_DIR, `${BASE_NAME}${allowed}`)
    if (fs.existsSync(existing)) fs.unlinkSync(existing)
  }

  fs.writeFileSync(path.join(TEMPLATE_DIR, `${BASE_NAME}${ext}`), buffer)
  return ext
}

export function defaultTermsAgreementCsv(): string {
  return [
    'HDS Private Limited — Terms and Agreement',
    '',
    'Section,Details',
    'Company,"HDS Private Limited, No.45 JN Road, Kamarajapuram, Thiruvallur, TN - 602001"',
    'Contact,info@hds-india.com | +91-99401-99407',
    'Orders,All purchases are subject to order confirmation and stock availability.',
    'Payments,Accepted methods include UPI net banking card transfer and cash on delivery where offered.',
    'Shipping,Delivery timelines are estimates and may vary by region and product availability.',
    'Returns,Returns must be requested within the policy window described on the shipping and warranty pages.',
    'Warranty,Product warranty terms are listed on each product page and the warranty support page.',
    'Liability,HDS Private Limited is not liable for indirect or consequential damages beyond applicable law.',
    '',
    'Upload a custom terms document from Admin → Edit Template → Terms and Agreement.',
  ].join('\n')
}
