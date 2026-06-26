import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import * as XLSX from 'xlsx'
import { BULK_TEMPLATE_SAMPLE } from '@/lib/bulkOrder'

export const runtime = 'nodejs'

const TEMPLATE_DIR = path.join(process.cwd(), 'data', 'templates')
const CUSTOM_TEMPLATE = path.join(TEMPLATE_DIR, 'bulk-order-template.xlsx')

function buildWorkbook() {
  const rows = [['SKU ID', 'Qty'], ...BULK_TEMPLATE_SAMPLE.map((r) => [r.modelNumber, r.qty])]
  const sheet = XLSX.utils.aoa_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, 'Bulk Order')
  return workbook
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const format = searchParams.get('format') || 'xlsx'

  if (format === 'csv') {
    const csvPath = path.join(process.cwd(), 'public', 'templates', 'bulk-order-template.csv')
    const csv = fs.readFileSync(csvPath, 'utf-8')
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="hds-bulk-order-template.csv"',
      },
    })
  }

  if (fs.existsSync(CUSTOM_TEMPLATE)) {
    const buffer = fs.readFileSync(CUSTOM_TEMPLATE)
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="hds-bulk-order-template.xlsx"',
      },
    })
  }

  const buffer = XLSX.write(buildWorkbook(), { type: 'buffer', bookType: 'xlsx' })
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="hds-bulk-order-template.xlsx"',
    },
  })
}
