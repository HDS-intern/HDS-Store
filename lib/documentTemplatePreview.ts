import fs from 'fs'
import path from 'path'
import * as XLSX from 'xlsx'
import { dcTemplateCsv, dcTemplateMatrix } from './dcTemplate'
import { invoiceTemplateCsv, invoiceTemplateMatrix } from './invoiceTemplate'

export type DocumentPreviewMeta =
  | { format: 'pdf'; filename: string }
  | { format: 'csv'; filename: string; content: string }
  | { format: 'html'; filename: string; content: string; sheetName?: string }

const TEMPLATE_DIR = path.join(process.cwd(), 'data', 'templates')

const INVOICE_CUSTOM_XLSX = path.join(TEMPLATE_DIR, 'invoice-template.xlsx')
const INVOICE_CUSTOM_CSV = path.join(TEMPLATE_DIR, 'invoice-template.csv')
const INVOICE_PUBLIC_CSV = path.join(process.cwd(), 'public', 'templates', 'invoice-template.csv')
const INVOICE_DEFAULT_XLSX = path.join(process.cwd(), 'Hawking_Defence_Invoice.xlsx')

const DC_CUSTOM_XLSX = path.join(TEMPLATE_DIR, 'dc-template.xlsx')
const DC_CUSTOM_CSV = path.join(TEMPLATE_DIR, 'dc-template.csv')
const DC_PUBLIC_CSV = path.join(process.cwd(), 'public', 'templates', 'dc-template.csv')

function xlsxToHtmlPreview(buffer: Buffer, filename: string): DocumentPreviewMeta {
  const workbook = XLSX.read(buffer, { type: 'buffer' })
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const html = XLSX.utils.sheet_to_html(sheet, { id: 'template-preview-table' })
  return {
    format: 'html',
    filename,
    content: html,
    sheetName,
  }
}

function matrixToHtmlPreview(matrix: string[][], filename: string): DocumentPreviewMeta {
  const sheet = XLSX.utils.aoa_to_sheet(matrix)
  const html = XLSX.utils.sheet_to_html(sheet, { id: 'template-preview-table' })
  return {
    format: 'html',
    filename,
    content: html,
  }
}

export function getInvoiceTemplatePreviewMeta(): DocumentPreviewMeta {
  if (fs.existsSync(INVOICE_CUSTOM_CSV)) {
    return {
      format: 'csv',
      filename: 'hds-invoice-template.csv',
      content: fs.readFileSync(INVOICE_CUSTOM_CSV, 'utf-8'),
    }
  }

  if (fs.existsSync(INVOICE_PUBLIC_CSV)) {
    return {
      format: 'csv',
      filename: 'hds-invoice-template.csv',
      content: fs.readFileSync(INVOICE_PUBLIC_CSV, 'utf-8'),
    }
  }

  const xlsxPath = fs.existsSync(INVOICE_CUSTOM_XLSX)
    ? INVOICE_CUSTOM_XLSX
    : fs.existsSync(INVOICE_DEFAULT_XLSX)
      ? INVOICE_DEFAULT_XLSX
      : null

  if (xlsxPath) {
    return xlsxToHtmlPreview(fs.readFileSync(xlsxPath), path.basename(xlsxPath))
  }

  return {
    format: 'csv',
    filename: 'hds-invoice-template.csv',
    content: invoiceTemplateCsv(),
  }
}

export function getDcTemplatePreviewMeta(): DocumentPreviewMeta {
  if (fs.existsSync(DC_CUSTOM_CSV)) {
    return {
      format: 'csv',
      filename: 'hds-dc-template.csv',
      content: fs.readFileSync(DC_CUSTOM_CSV, 'utf-8'),
    }
  }

  if (fs.existsSync(DC_PUBLIC_CSV)) {
    return {
      format: 'csv',
      filename: 'hds-dc-template.csv',
      content: fs.readFileSync(DC_PUBLIC_CSV, 'utf-8'),
    }
  }

  if (fs.existsSync(DC_CUSTOM_XLSX)) {
    return xlsxToHtmlPreview(fs.readFileSync(DC_CUSTOM_XLSX), 'hds-dc-template.xlsx')
  }

  return matrixToHtmlPreview(dcTemplateMatrix(), 'hds-dc-template.csv')
}
