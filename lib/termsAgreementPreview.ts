import fs from 'fs'
import * as XLSX from 'xlsx'
import { defaultTermsAgreementCsv, resolveTermsAgreementFile } from './termsAgreement'

export type TermsPreviewMeta =
  | { format: 'pdf'; filename: string }
  | { format: 'csv'; filename: string; content: string }
  | { format: 'html'; filename: string; content: string; sheetName?: string }

export function getTermsAgreementPreviewMeta(): TermsPreviewMeta {
  const resolved = resolveTermsAgreementFile()

  if (!resolved) {
    return {
      format: 'csv',
      filename: 'hds-terms-and-agreement.csv',
      content: defaultTermsAgreementCsv(),
    }
  }

  if (resolved.ext === '.pdf') {
    return {
      format: 'pdf',
      filename: resolved.filename,
    }
  }

  if (resolved.ext === '.csv') {
    return {
      format: 'csv',
      filename: resolved.filename,
      content: fs.readFileSync(resolved.path, 'utf-8'),
    }
  }

  const buffer = fs.readFileSync(resolved.path)
  const workbook = XLSX.read(buffer, { type: 'buffer' })
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const html = XLSX.utils.sheet_to_html(sheet, { id: 'terms-agreement-table' })

  return {
    format: 'html',
    filename: resolved.filename,
    content: html,
    sheetName,
  }
}

export function getTermsAgreementStreamResponse() {
  const resolved = resolveTermsAgreementFile()

  if (resolved?.ext === '.pdf') {
    const buffer = fs.readFileSync(resolved.path)
    return {
      body: buffer,
      contentType: 'application/pdf',
      disposition: `inline; filename="${resolved.filename}"`,
    }
  }

  const csv = resolved?.ext === '.csv'
    ? fs.readFileSync(resolved.path, 'utf-8')
    : defaultTermsAgreementCsv()

  return {
    body: csv,
    contentType: 'text/plain; charset=utf-8',
    disposition: 'inline',
  }
}
