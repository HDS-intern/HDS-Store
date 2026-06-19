export function invoiceIdFromOrderId(orderId: string): string {
  return orderId.startsWith('ORD-') ? `INV-${orderId.slice(4)}` : `INV-${orderId}`
}
