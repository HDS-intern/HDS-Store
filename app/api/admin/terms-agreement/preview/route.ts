import { NextResponse } from 'next/server'
import fs from 'fs'
import * as XLSX from 'xlsx'
import { getUserBySession, getTokenFromRequest, requireRole } from '@/lib/auth'
import {
  defaultTermsAgreementCsv,
  resolveTermsAgreementFile,
} from '@/lib/termsAgreement'

export const runtime = 'nodejs'

function assertAdmin(request: Request) {
  requireRole(getUserBySession(getTokenFromRequest(request)), ['admin'])
}

export async function GET(request: Request) {
  try {
    assertAdmin(request)
    const { searchParams } = new URL(request.url)
    const stream = searchParams.get('stream') === '1'

    const resolved = resolveTermsAgreementFile()

    if (stream) {
      if (resolved?.ext === '.pdf') {
        const buffer = fs.readFileSync(resolved.path)
        return new NextResponse(buffer, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename="${resolved.filename}"`,
          },
        })
      }

      const csv = resolved?.ext === '.csv'
        ? fs.readFileSync(resolved.path, 'utf-8')
        : defaultTermsAgreementCsv()

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': 'inline',
        },
      })
    }

    if (!resolved) {
      return NextResponse.json({
        format: 'csv',
        filename: 'hds-terms-and-agreement.csv',
        content: defaultTermsAgreementCsv(),
      })
    }

    if (resolved.ext === '.pdf') {
      return NextResponse.json({
        format: 'pdf',
        filename: resolved.filename,
      })
    }

    if (resolved.ext === '.csv') {
      return NextResponse.json({
        format: 'csv',
        filename: resolved.filename,
        content: fs.readFileSync(resolved.path, 'utf-8'),
      })
    }

    const buffer = fs.readFileSync(resolved.path)
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    const html = XLSX.utils.sheet_to_html(sheet, { id: 'terms-agreement-table' })

    return NextResponse.json({
      format: 'html',
      filename: resolved.filename,
      content: html,
      sheetName,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed'
    const status = msg === 'Unauthorized' ? 401 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}
