type IdRow = {
  modelId: string
  manufacturingId: string
}

export function applySequentialAutoIds<T extends IdRow>(rows: T[]): T[] {
  return rows.map((row, index) => ({
    ...row,
    modelId: `HDS-SKU-${String(index + 1).padStart(3, '0')}`,
    manufacturingId: `MFG-${String(index + 1).padStart(3, '0')}`,
  }))
}
