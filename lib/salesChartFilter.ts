export type SalesChartFilterType = 'date' | 'month' | 'fy'

export type SalesChartFilter = {
  type: SalesChartFilterType
  start: string
  end: string
}

export function defaultSalesChartFilter(): SalesChartFilter {
  const now = new Date()
  const end = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1)
  const start = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`
  return { type: 'month', start, end }
}

export function parseSalesChartFilter(searchParams: URLSearchParams): SalesChartFilter | null {
  const type = searchParams.get('chartType')
  const start = searchParams.get('chartStart')?.trim()
  const end = searchParams.get('chartEnd')?.trim()
  if (!type || !start || !end) return null

  if (type === 'month') {
    if (!/^\d{4}-\d{2}$/.test(start) || !/^\d{4}-\d{2}$/.test(end)) return null
    if (start > end) return null
    return { type: 'month', start, end }
  }

  if (type === 'date') {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end)) return null
    if (start > end) return null
    return { type: 'date', start, end }
  }

  if (type === 'fy') {
    if (!/^\d{4}$/.test(start) || !/^\d{4}$/.test(end)) return null
    if (Number(start) > Number(end)) return null
    return { type: 'fy', start, end }
  }

  return null
}

export function salesChartFilterToQuery(filter: SalesChartFilter): string {
  const params = new URLSearchParams({
    chartType: filter.type,
    chartStart: filter.start,
    chartEnd: filter.end,
  })
  return params.toString()
}

export function formatFyLabel(startYear: number): string {
  const endYear = (startYear + 1) % 100
  return `FY ${startYear}-${String(endYear).padStart(2, '0')}`
}
