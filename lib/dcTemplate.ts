export type DcTemplateRow = {
  dcId: string
  orderId: string
  customerName: string
  deliveryAddress: string
  itemCount: number
  deliveryDate: string
  status: string
}

export const DC_TEMPLATE_HEADERS = [
  'DC Number',
  'Order ID',
  'Customer Name',
  'Delivery Address',
  'Items (Qty)',
  'Delivery Date',
  'Status',
] as const

export const DC_TEMPLATE_SAMPLE: DcTemplateRow[] = [
  {
    dcId: 'DC-1781776655103',
    orderId: 'ORD-1781776655103',
    customerName: 'Test Customer',
    deliveryAddress: '133 Main Street, New York, NY 10001',
    itemCount: 2,
    deliveryDate: '2026-06-18',
    status: 'pending',
  },
  {
    dcId: 'DC-1781776207293',
    orderId: 'ORD-1781776207293',
    customerName: 'Test Customer',
    deliveryAddress: '45 Park Avenue, Mumbai, MH 400001',
    itemCount: 1,
    deliveryDate: '2026-06-17',
    status: 'delivered',
  },
]

export function dcTemplateMatrix(): string[][] {
  return [
    [...DC_TEMPLATE_HEADERS],
    ...DC_TEMPLATE_SAMPLE.map((row) => [
      row.dcId,
      row.orderId,
      row.customerName,
      row.deliveryAddress,
      String(row.itemCount),
      row.deliveryDate,
      row.status,
    ]),
  ]
}

export function dcTemplateCsv(): string {
  return dcTemplateMatrix()
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')
}
